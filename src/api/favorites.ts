import { Hono } from 'hono';
import { authMiddleware } from '../utils/auth';
import { C, Env } from '../types';

const favorites = new Hono<{ Bindings: Env }>();

favorites.use('*', authMiddleware());

favorites.get('/', async (c: C) => {
    const user = c.get('user');
    
    try {
        const userFavorites = await c.env.DB.prepare(`
            SELECT l.*, u.username as creator_username, u.avatar_url as creator_avatar_url,
                   true as is_favorite
            FROM user_favorites uf
            JOIN locations l ON uf.location_id = l.id
            LEFT JOIN users u ON l.created_by = u.id
            WHERE uf.user_id = ?
        `).bind(user.id).all();
        
        return c.json(userFavorites.results);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        return c.json({ error: 'Failed to fetch favorites' }, 500);
    }
});

favorites.post('/:locationId', async (c: C) => {
    const user = c.get('user');
    const locationId = c.req.param('locationId');
    
    try {
        await c.env.DB.prepare(
            'INSERT OR IGNORE INTO user_favorites (user_id, location_id) VALUES (?, ?)'
        ).bind(user.id, locationId).run();
        
        return c.json({ message: 'Added to favorites' }, 201);
    } catch (error) {
        console.error('Error adding favorite:', error);
        return c.json({ error: 'Failed to add favorite' }, 500);
    }
});

favorites.delete('/:locationId', async (c: C) => {
    const user = c.get('user');
    const locationId = c.req.param('locationId');
    
    try {
        await c.env.DB.prepare(
            'DELETE FROM user_favorites WHERE user_id = ? AND location_id = ?'
        ).bind(user.id, locationId).run();
        
        return c.json({ message: 'Removed from favorites' });
    } catch (error) {
        console.error('Error removing favorite:', error);
        return c.json({ error: 'Failed to remove favorite' }, 500);
    }
});

export default favorites;