import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, AuthVariables } from '../utils/auth';
import { Env } from '../types';
import { uuidv4 } from '../utils/uuid';

const reportSubmissionSchema = z.object({
    location_id: z.string().uuid().optional().nullable(),
    media_id: z.string().uuid().optional().nullable(),
    vote_id: z.string().uuid().optional().nullable(),
    reason: z.string().min(10).max(500),
    notes: z.string().max(1000).optional().nullable(),
}).refine(data => data.location_id || data.media_id || data.vote_id, {
    message: "Either location_id, media_id, or vote_id must be provided.",
    path: ["location_id"],
});

const reports = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

reports.use('*', authMiddleware);

reports.post(
    '/', 
    zValidator('json', reportSubmissionSchema),
    async (c) => {
        const user = c.get('currentUser');
        const { location_id, media_id, vote_id, reason, notes } = c.req.valid('json');

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        const reportId = uuidv4();

        try {
            await c.env.DB.prepare(
                `INSERT INTO reports (id, location_id, media_id, vote_id, reported_by, reason, notes, status) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
            ).bind(
                reportId,
                location_id || null,
                media_id || null,
                vote_id || null,
                user.id,
                reason,
                notes || null,
                'open' // Changed from 'pending' to 'open'
            ).run();

            return c.json({ message: 'Report submitted successfully', reportId }, 201);
        } catch (error) {
            console.error('Error submitting report:', error);
            return c.json({ error: 'Failed to submit report' }, 500);
        }
    }
);

export default reports;