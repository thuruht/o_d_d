import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { C, Env } from '../types';
import { authMiddleware } from '../utils/auth';

export const reportsRouter = new Hono<{ Bindings: Env }>();

reportsRouter.post('/', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { location_id, media_id, vote_id, reason, notes } = await c.req.json<{
        location_id?: string,
        media_id?: string,
        vote_id?: string,
        reason: string,
        notes?: string
    }>();

    if (!reason) {
        return c.json({ error: 'A reason for the report is required' }, 400);
    }
    if (!location_id && !media_id && !vote_id) {
        return c.json({ error: 'A report must be linked to a location, media, or vote' }, 400);
    }

    try {
        const reportId = uuidv4();
        await c.env.DB.prepare(
            `INSERT INTO reports (id, reporter_id, location_id, media_id, vote_id, reason, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).bind(reportId, user.userId, location_id || null, media_id || null, vote_id || null, reason, notes || null).run();

        return c.json({ message: 'Report submitted successfully. Our moderators will review it shortly.', reportId }, 201);
    } catch (e: any) {
        console.error('Failed to create report:', e);
        return c.json({ error: 'Failed to submit report' }, 500);
    }
});