import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../utils/auth';
import { C, Env } from '../types';

const locationSchema = z.object({
    name: z.string().min(1).max(255),
    description: z.string().max(1000).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    type: z.enum(['campsite', 'viewpoint', 'water_source', 'trail_head', 'shelter', 'other']),
    properties: z.record(z.any()).optional(),
});

const locations = new Hono<{ Bindings: Env }>();

locations.get('/', authMiddleware(), async (c: C) => {
    const { bbox, type, search } = c.req.query();
    const user = c.get('user');
    
    let query = `
        SELECT l.*, u.username as creator_username, u.avatar_url as creator_avatar_url,
               CASE 
                   WHEN uf.user_id IS NOT NULL THEN true 
                   ELSE false 
               END as is_favorite
        FROM locations l
        LEFT JOIN users u ON l.created_by = u.id
        LEFT JOIN user_favorites uf ON l.id = uf.location_id AND uf.user_id = ?
        WHERE l.status = 'approved'
    `;
    
    const params: any[] = [user ? user.id : null];
    
    if (bbox) {
        const [minLon, minLat, maxLon, maxLat] = bbox.split(',').map(Number);
        query += ' AND l.latitude BETWEEN ? AND ? AND l.longitude BETWEEN ? AND ?';
        params.push(minLat, maxLat, minLon, maxLon);
    }
    
    if (type) {
        query += ' AND l.type = ?';
        params.push(type);
    }
    
    if (search) {
        query += ' AND (l.name LIKE ? OR l.description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
    }
    
    try {
        const result = await c.env.DB.prepare(query).bind(...params).all();
        return c.json(result.results);
    } catch (error) {
        console.error('Error fetching locations:', error);
        return c.json({ error: 'Failed to fetch locations' }, 500);
    }
});

locations.get('/:id', async (c) => {
    const id = c.req.param('id');
    
    try {
        const location = await c.env.DB.prepare(`
            SELECT l.*, u.username as creator_username, u.avatar_url as creator_avatar_url
            FROM locations l
            LEFT JOIN users u ON l.created_by = u.id
            WHERE l.id = ? AND l.status = 'approved'
        `).bind(id).first();
        
        if (!location) {
            return c.json({ error: 'Location not found' }, 404);
        }
        
        return c.json(location);
    } catch (error) {
        console.error('Error fetching location:', error);
        return c.json({ error: 'Failed to fetch location' }, 500);
    }
});

locations.post('/', authMiddleware(), zValidator('json', locationSchema), async (c: C) => {
    const user = c.get('user');
    const locationData = c.req.valid('json');
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        const locationId = crypto.randomUUID();
        
        await c.env.DB.prepare(`
            INSERT INTO locations (id, name, description, latitude, longitude, type, properties, created_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')
        `).bind(
            locationId,
            locationData.name,
            locationData.description || null,
            locationData.latitude,
            locationData.longitude,
            locationData.type,
            JSON.stringify(locationData.properties || {}),
            user.id
        ).run();
        
        return c.json({ message: 'Location submitted for review', locationId }, 201);
    } catch (error) {
        console.error('Error creating location:', error);
        return c.json({ error: 'Failed to create location' }, 500);
    }
});

export default locations; // Add default export