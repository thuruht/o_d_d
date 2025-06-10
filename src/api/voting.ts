import { Hono } from 'hono';
import { C, Env } from '../types';
import { authMiddleware } from '../utils/auth';
import { logError } from '../utils/logging';

export const votingRouter = new Hono<{ Bindings: Env }>();

// POST /votes/:locationId - Add or update a vote
votingRouter.post('/:locationId', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const locationId = c.req.param('locationId');
    const { value, comment } = await c.req.json<{ value: number, comment?: string }>();
    
    if (value < 1 || value > 5) {
        return c.json({ error: 'Vote value must be between 1 and 5' }, 400);
    }
    
    try {
        const location = await c.env.DB.prepare("SELECT id, created_by FROM locations WHERE id = ?")
            .bind(locationId).first<{id: string, created_by: string}>();
            
        if (!location) {
            return c.json({ error: 'Location not found' }, 404);
        }
        
        if (location.created_by === user.id) {
            return c.json({ error: 'You cannot vote on your own location' }, 403);
        }
        
        const existingVote = await c.env.DB.prepare("SELECT id FROM votes WHERE user_id = ? AND location_id = ?")
            .bind(user.id, locationId).first<{ id: string }>();
            
        if (existingVote) {
            await c.env.DB.prepare("UPDATE votes SET value = ?, comment = ? WHERE id = ?")
                .bind(value, comment || null, existingVote.id).run();
        } else {
            const voteId = crypto.randomUUID();
            await c.env.DB.prepare("INSERT INTO votes (id, user_id, location_id, value, comment) VALUES (?, ?, ?, ?, ?)")
                .bind(voteId, user.id, locationId, value, comment || null).run();
        }
        
        return c.json({ message: 'Vote submitted successfully' }, 201);
    } catch (e: any) {
        logError('Voting', 'Failed to submit vote', e);
        return c.json({ error: 'Database operation failed' }, 500);
    }
});

// DELETE /votes/:locationId - Remove a vote
votingRouter.delete('/:locationId', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const locationId = c.req.param('locationId');
    
    try {
        const result = await c.env.DB.prepare("DELETE FROM votes WHERE user_id = ? AND location_id = ?")
            .bind(user.id, locationId).run();
            
        if (result.changes === 0) {
            return c.json({ error: 'Vote not found or you do not have permission to delete it' }, 404);
        }
        
        return c.json({ message: 'Vote deleted successfully' });
    } catch (e: any) {
        logError('Voting', 'Failed to delete vote', e);
        return c.json({ error: 'Database operation failed' }, 500);
    }
});