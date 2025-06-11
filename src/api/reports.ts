import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, AuthVariables } from '../utils/auth';
import { Env } from '../types';
import { uuidv4 } from '../utils/uuid'; // This path should now resolve correctly

// Define Zod schema for report submission
const reportSubmissionSchema = z.object({
    location_id: z.string().uuid().optional().nullable(), // Optional if reporting general issue or media/vote
    media_id: z.string().uuid().optional().nullable(),
    vote_id: z.string().uuid().optional().nullable(),
    reason: z.string().min(10).max(500), // Example: reason must be between 10 and 500 chars
    notes: z.string().max(1000).optional().nullable(),
}).refine(data => data.location_id || data.media_id || data.vote_id, {
    message: "Either location_id, media_id, or vote_id must be provided.",
    path: ["location_id"], // Path to associate the error with one of the fields
});


const reports = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

reports.use('*', authMiddleware);

reports.post(
    '/', 
    zValidator('json', reportSubmissionSchema), // Validate the request body
    async (c) => {
        const user = c.get('currentUser');
        const { location_id, media_id, vote_id, reason, notes } = c.req.valid('json'); // Use validated data

        if (!user) {
            return c.json({ error: 'Unauthorized' }, 401);
        }

        // Ensure at least one ID is provided (already handled by Zod refine, but good for clarity)
        // This check is redundant due to Zod's .refine, but doesn't harm.
        if (!location_id && !media_id && !vote_id) {
            return c.json({ error: 'A location, media, or vote ID must be provided for the report.' }, 400);
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
                'open' // Status set to 'open'
            ).run();

            return c.json({ message: 'Report submitted successfully', reportId }, 201);
        } catch (error) {
            console.error('Error submitting report:', error);
            // Consider using your logError utility here
            return c.json({ error: 'Failed to submit report' }, 500);
        }
    }
);

// ... other report routes ...

export default reports;