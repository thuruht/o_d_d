import { Hono } from 'hono';
import { authMiddleware } from '../utils/auth';
import { C, Env } from '../types';

const submissions = new Hono<{ Bindings: Env }>();

submissions.use('*', authMiddleware());

submissions.get('/', async (c: C) => {
    const user = c.get('currentUser');
    
    try {
        const userSubmissions = await c.env.DB.prepare(`
            SELECT * FROM submissions 
            WHERE submitted_by = ? 
            ORDER BY created_at DESC
        `).bind(user.id).all();
        
        return c.json(userSubmissions.results);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return c.json({ error: 'Failed to fetch submissions' }, 500);
    }
});

export default submissions;