import { Hono } from 'hono';
import { Env } from '../types';

const profiles = new Hono<{ Bindings: Env }>();

// GET /api/profiles/:username - Get a user's public profile and contributions
profiles.get('/:username', async (c) => {
    const username = c.req.param('username');

    try {
        // First, get the user's public profile data
        const user = await c.env.DB.prepare(
            'SELECT id, username, created_at, avatar_url, bio, website FROM users WHERE username = ?'
        ).bind(username).first();

        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }

        // Then, get the user's public contributions (approved locations)
        const locations = await c.env.DB.prepare(
            'SELECT id, name, type, latitude, longitude, created_at FROM locations WHERE created_by = ? AND approved = 1 ORDER BY created_at DESC'
        ).bind(user.id).all();

        return c.json({
            user,
            locations: locations.results,
        });
    } catch (error) {
        console.error('Error fetching profile:', error);
        return c.json({ error: 'Failed to fetch profile' }, 500);
    }
});

export default profiles;