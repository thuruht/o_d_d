import { Hono } from 'hono';
import { C, Env, Submission } from '../types';
import { authMiddleware } from '../utils/auth';

export const submissionsRouter = new Hono<{ Bindings: Env }>();

submissionsRouter.get('/', authMiddleware('moderator'), async (c: C) => {
    try {
        const stmt = c.env.DB.prepare(`
            SELECT s.*, u.username as submitter_username
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE s.status = 'pending'
            ORDER BY s.created_at ASC
        `);
        const { results } = await stmt.all<Submission>();
        return c.json(results);
    } catch (e: any) {
        console.error('Failed to fetch submissions:', e);
        return c.json({ error: 'Database query failed' }, 500);
    }
});

submissionsRouter.get('/:id', authMiddleware('moderator'), async (c: C) => {
    const { id } = c.req.param();
    try {
        const stmt = c.env.DB.prepare(`
            SELECT s.*, u.username as submitter_username
            FROM submissions s
            JOIN users u ON s.user_id = u.id
            WHERE s.id = ?
        `);
        const submission = await stmt.bind(id).first<Submission>();
        if (!submission) {
            return c.json({ error: 'Submission not found' }, 404);
        }
        return c.json(submission);
    } catch (e: any) {
        console.error(`Failed to fetch submission ${id}:`, e);
        return c.json({ error: 'Database query failed' }, 500);
    }
});