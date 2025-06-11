import { Hono } from 'hono';
import { C, Env } from '../types';
import { authMiddleware } from '../utils/auth';
import { logError } from '../utils/logging';

const favoritesRouter = new Hono<{ Bindings: Env }>();

favoritesRouter.get('/', authMiddleware(), async (c: C) => {
    const user = c.get('user');

    try {
        const favorites = await c.env.DB.prepare(`
            SELECT f.location_id, l.name, l.description, l.latitude, l.longitude, l.type,
                   l.properties, l.created_at, f.created_at as favorited_at
            FROM favorites f
            JOIN locations l ON f.location_id = l.id
            WHERE f.user_id = ?
            ORDER BY f.created_at DESC
        `).bind(user.id).all();

        return c.json(favorites.results);
    } catch (e: any) {
        logError('Favorites', 'Failed to fetch favorites', e);
        return c.json({ error: 'Failed to fetch favorites' }, 500);
    }
});

favoritesRouter.post('/:id', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const locationId = c.req.param('id');

    try {
        await c.env.DB.prepare(
            'INSERT INTO favorites (user_id, location_id) VALUES (?, ?)'
        ).bind(user.id, locationId).run();
        
        return c.json({ message: 'Location added to favorites' });
    } catch (e: any) {
        logError('Favorites', `Failed to add location ${locationId} to favorites`, e);
        return c.json({ error: 'Failed to add to favorites' }, 500);
    }
});

favoritesRouter.delete('/:id', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const locationId = c.req.param('id');

    try {
        const result = await c.env.DB.prepare(
            'DELETE FROM favorites WHERE user_id = ? AND location_id = ?'
        ).bind(user.id, locationId).run();
        
        if (result.changes === 0) {
            return c.json({ error: 'Location not found in favorites' }, 404);
        }
        
        return c.json({ message: 'Location removed from favorites' });
    } catch (e: any) {
        logError('Favorites', `Failed to remove location ${locationId} from favorites`, e);
        return c.json({ error: 'Failed to remove from favorites' }, 500);
    }
});

export default favoritesRouter;