import { Hono } from 'hono';
import { C, Env } from '../types';
import { authMiddleware } from '../utils/auth';

export const favoritesRouter = new Hono<{ Bindings: Env }>();

favoritesRouter.get('/', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    try {
        const { results } = await c.env.DB.prepare(
            `SELECT l.* FROM locations l
             JOIN user_favorites uf ON l.id = uf.location_id
             WHERE uf.user_id = ?`
        ).bind(user.userId).all();
        return c.json(results);
    } catch (e) {
        console.error("Failed to fetch favorites:", e);
        return c.json({ error: "Database query failed" }, 500);
    }
});

favoritesRouter.post('/:locationId', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { locationId } = c.req.param();
    try {
        await c.env.DB.prepare(
            `INSERT INTO user_favorites (user_id, location_id) VALUES (?, ?)`
        ).bind(user.userId, locationId).run();
        return c.json({ message: 'Location added to favorites' }, 201);
    } catch (e: any) {
        if (e.message.includes('UNIQUE constraint failed')) {
            return c.json({ message: 'Location is already in favorites' }, 200);
        }
        console.error("Failed to add favorite:", e);
        return c.json({ error: 'Failed to add favorite' }, 500);
    }
});

favoritesRouter.delete('/:locationId', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { locationId } = c.req.param();
    try {
        const { changes } = await c.env.DB.prepare(
            `DELETE FROM user_favorites WHERE user_id = ? AND location_id = ?`
        ).bind(user.userId, locationId).run();

        if (changes === 0) {
            return c.json({ error: 'Favorite not found' }, 404);
        }
        return c.json({ message: 'Location removed from favorites' });
    } catch (e) {
        console.error("Failed to remove favorite:", e);
        return c.json({ error: 'Failed to remove favorite' }, 500);
    }
});