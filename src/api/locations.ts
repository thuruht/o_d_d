import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { C, Env, Location, LocationProperties } from '../types';
import { authMiddleware } from '../utils/auth';
import { verifyToken } from '../utils/auth';

export const locationsRouter = new Hono<{ Bindings: Env }>();

locationsRouter.get('/', async (c: C) => {
    const { q, type, amenities } = c.req.query();
    const authHeader = c.req.header('Authorization');
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = await verifyToken(token, c.env.JWT_SECRET);
        if (payload) {
            userId = payload.userId;
        }
    }

    try {
        const params: (string | number)[] = [];
        let whereClauses: string[] = ["l.status = 'approved'"];

        if (q) {
            whereClauses.push(`(l.name LIKE ? OR l.description LIKE ?)`);
            params.push(`%${q}%`, `%${q}%`);
        }
        if (type) {
            const types = type.split(',');
            whereClauses.push(`l.type IN (${'?,'.repeat(types.length).slice(0, -1)})`);
            params.push(...types);
        }
        if (amenities) {
            const amenityList = amenities.split(',');
            for (const amenity of amenityList) {
                const [key, value] = amenity.split(':');
                if (value === 'true') {
                    whereClauses.push(`json_extract(l.properties, '$.${key}') = 1`);
                } else if (value) {
                    whereClauses.push(`json_extract(l.properties, '$.${key}') = ?`);
                    params.push(value);
                } else {
                    whereClauses.push(`(json_extract(l.properties, '$.${key}') IS NOT NULL AND json_extract(l.properties, '$.${key}') != 'none' AND json_extract(l.properties, '$.${key}') != 0)`);
                }
            }
        }
        
        const whereString = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
        
        let queryParamsForBind = [...params];
        let userIdSubQuery = "0 as is_favorite";
        let favoriteJoinClause = "";

        if (userId) {
            userIdSubQuery = "CASE WHEN f.user_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite";
            favoriteJoinClause = "LEFT JOIN user_favorites f ON l.id = f.location_id AND f.user_id = ?";
            queryParamsForBind = [userId, ...params];
        }
        
        const query = `
            SELECT
                l.*,
                u.username as creator_username,
                AVG(v.value) as average_rating,
                COUNT(DISTINCT v.id) as total_votes,
                ${userIdSubQuery}
            FROM locations l
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN votes v ON l.id = v.location_id
            ${favoriteJoinClause}
            ${whereString}
            GROUP BY l.id
        `;

        const stmt = c.env.DB.prepare(query).bind(...queryParamsForBind);
        const { results } = await stmt.all<Location>();
        
        results.forEach(loc => {
            if (loc.properties) {
                try {
                    loc.properties = JSON.parse(loc.properties as unknown as string);
                } catch (e) {
                    loc.properties = {};
                }
            }
        });

        return c.json(results);
    } catch (e: any) {
        console.error("Failed to fetch locations", e);
        return c.json({ error: "Database query failed", message: e.message }, 500);
    }
});


locationsRouter.get('/:id', async (c: C) => {
    const { id } = c.req.param();
    try {
        const locationStmt = c.env.DB.prepare(`
            SELECT
                l.*,
                u.username as creator_username,
                AVG(v.value) as average_rating,
                COUNT(DISTINCT v.id) as total_votes
            FROM locations l
            LEFT JOIN users u ON l.created_by = u.id
            LEFT JOIN votes v ON l.id = v.location_id
            WHERE l.id = ?
            GROUP BY l.id
        `);
        const location = await locationStmt.bind(id).first<Location>();

        if (!location) {
            return c.json({ error: "Location not found" }, 404);
        }
         if (location.properties) {
            try {
                location.properties = JSON.parse(location.properties as unknown as string);
            } catch (e) {
                location.properties = {};
            }
        }

        const mediaStmt = c.env.DB.prepare(`
            SELECT m.id, m.r2_key, m.type, m.created_at, u.username as uploader_username
            FROM media m
            JOIN users u ON m.user_id = u.id
            WHERE m.location_id = ? AND m.status = 'approved'
            ORDER BY m.created_at DESC
        `);
        const { results: mediaResults } = await mediaStmt.bind(id).all<any>();
        location.media = mediaResults.map(m => ({
            ...m,
            url: `${c.env.R2_PUBLIC_URL}/${m.r2_key}`
        }));

        const votesStmt = c.env.DB.prepare(`
            SELECT v.*, u.username as voter_username
            FROM votes v
            JOIN users u ON v.user_id = u.id
            WHERE v.location_id = ?
            ORDER BY v.created_at DESC
        `);
        const { results: votesResults } = await votesStmt.bind(id).all<any>();
        location.votes = votesResults;

        return c.json(location);
    } catch (e: any) {
        console.error(`Failed to fetch location ${id}`, e);
        return c.json({ error: "Database query failed" }, 500);
    }
});

locationsRouter.post('/', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { name, latitude, longitude, type, description, properties } = await c.req.json<Omit<Location, 'id' | 'created_by' | 'created_at' | 'status'>>();

    if (!name || !latitude || !longitude || !type) {
        return c.json({ error: 'Missing required fields: name, latitude, longitude, type' }, 400);
    }
    
    const submissionData = { name, latitude, longitude, type, description, properties };
    const submissionId = uuidv4();
    try {
        await c.env.DB.prepare(
            `INSERT INTO submissions (id, user_id, submission_type, data, status) VALUES (?, ?, 'new', ?, 'pending')`
        ).bind(submissionId, user.userId, JSON.stringify(submissionData)).run();

        return c.json({ message: 'Location submitted for review.', submissionId }, 202);
    } catch (e: any) {
        console.error("Failed to create submission", e);
        return c.json({ error: "Failed to create submission" }, 500);
    }
});

locationsRouter.put('/:id', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { id } = c.req.param();
    const locationUpdateData = await c.req.json<Partial<Location>>();
    
    const location = await c.env.DB.prepare("SELECT id, created_by FROM locations WHERE id = ?").bind(id).first<{id: string, created_by: string}>();
    if (!location) {
        return c.json({ error: "Location not found" }, 404);
    }

    if (user.role === 'user' && location.created_by !== user.userId) {
        return c.json({ error: "Forbidden: You can only propose edits to your own locations." }, 403);
    }

    const submissionId = uuidv4();
    try {
        await c.env.DB.prepare(
            `INSERT INTO submissions (id, user_id, location_id, submission_type, data, status) VALUES (?, ?, ?, 'edit', ?, 'pending')`
        ).bind(submissionId, user.userId, id, JSON.stringify(locationUpdateData)).run();
        
        return c.json({ message: 'Edit submitted for review.', submissionId }, 202);
    } catch (e: any) {
        console.error("Failed to create edit submission", e);
        return c.json({ error: "Failed to create edit submission" }, 500);
    }
});


locationsRouter.delete('/:id', authMiddleware('moderator'), async (c: C) => {
    const { id } = c.req.param();
    try {
        const result = await c.env.DB.prepare("DELETE FROM locations WHERE id = ?").bind(id).run();
        
        if (result.changes === 0) {
            return c.json({ error: "Location not found" }, 404);
        }

        return c.json({ message: 'Location deleted successfully' });
    } catch (e: any) {
        console.error(`Failed to delete location ${id}`, e);
        return c.json({ error: "Failed to delete location" }, 500);
    }
});