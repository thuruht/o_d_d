import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { C, Env, Submission, User, Location, Report } from '../types';
import { authMiddleware } from '../utils/auth';

export const adminRouter = new Hono<{ Bindings: Env }>();

adminRouter.get('/users', authMiddleware('admin'), async (c: C) => {
    const { results } = await c.env.DB.prepare("SELECT id, username, email, role, created_at, suspended FROM users").all<User>();
    return c.json(results);
});

adminRouter.put('/users/:id', authMiddleware('admin'), async (c: C) => {
    const { id } = c.req.param();
    const { role, suspended } = await c.req.json<{ role?: 'user' | 'moderator' | 'admin', suspended?: boolean }>();

    if (role === undefined && suspended === undefined) {
        return c.json({ error: 'Either role or suspended status must be provided' }, 400);
    }

    let query = "UPDATE users SET ";
    const params: (string|number)[] = [];
    if (role) {
        query += "role = ? ";
        params.push(role);
    }
    if (suspended !== undefined) {
        query += (params.length > 0 ? ", " : "") + "suspended = ? ";
        params.push(suspended ? 1 : 0);
    }
    query += "WHERE id = ?";
    params.push(id);

    const { success } = await c.env.DB.prepare(query).bind(...params).run();
    return success ? c.json({ message: 'User updated' }) : c.json({ error: 'Failed to update user' }, 500);
});

adminRouter.get('/submissions', authMiddleware('moderator'), async (c: C) => {
     const { results } = await c.env.DB.prepare(`
        SELECT s.*, u.username as submitter_username FROM submissions s
        JOIN users u ON s.user_id = u.id WHERE s.status = 'pending'
     `).all<Submission>();
     return c.json(results);
});

adminRouter.post('/submissions/:id/approve', authMiddleware('moderator'), async (c: C) => {
    const { id } = c.req.param();
    const admin = c.get('user');
    
    const submission = await c.env.DB.prepare("SELECT * FROM submissions WHERE id = ? AND status = 'pending'").bind(id).first<Submission>();
    if (!submission) {
        return c.json({ error: 'Submission not found or already processed' }, 404);
    }
    
    const data: Partial<Location> = JSON.parse(submission.data);

    if (submission.submission_type === 'new') {
        const locationId = uuidv4();
        await c.env.DB.batch([
            c.env.DB.prepare(`INSERT INTO locations (id, name, description, latitude, longitude, type, properties, created_by, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved')`)
                .bind(locationId, data.name, data.description, data.latitude, data.longitude, data.type, JSON.stringify(data.properties || {}), submission.user_id),
            c.env.DB.prepare("UPDATE submissions SET status = 'approved', admin_notes = ? WHERE id = ?")
                .bind(`Approved by ${admin.userId}`, id)
        ]);
        return c.json({ message: 'New location approved', locationId });
    } else {
        if (!submission.location_id) return c.json({ error: 'Invalid edit submission' }, 400);
        
        let updateQuery = 'UPDATE locations SET ';
        const updateParams: (string | number | object)[] = [];
        const validFields: (keyof Location)[] = ['name', 'description', 'type', 'properties'];
        
        for (const field of validFields) {
            if (data[field] !== undefined) {
                updateQuery += `${field} = ?, `;
                const value = field === 'properties' ? JSON.stringify(data[field]) : data[field];
                updateParams.push(value as string | number);
            }
        }
        
        if (updateParams.length === 0) {
            return c.json({ error: "No valid fields to update" }, 400);
        }

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateParams.push(submission.location_id);

        await c.env.DB.batch([
            c.env.DB.prepare(updateQuery).bind(...updateParams),
            c.env.DB.prepare("UPDATE submissions SET status = 'approved', admin_notes = ? WHERE id = ?")
                .bind(`Approved by ${admin.userId}`, id)
        ]);
        return c.json({ message: 'Location edit approved' });
    }
});

adminRouter.post('/submissions/:id/reject', authMiddleware('moderator'), async (c: C) => {
    const { id } = c.req.param();
    const { reason } = await c.req.json<{reason: string}>();
    const admin = c.get('user');
    
    const result = await c.env.DB.prepare("UPDATE submissions SET status = 'rejected', admin_notes = ? WHERE id = ? AND status = 'pending'")
        .bind(`Rejected by ${admin.userId}: ${reason}`, id).run();

    if (result.changes === 0) return c.json({ error: 'Submission not found or already processed'}, 404);
    return c.json({ message: 'Submission rejected' });
});

adminRouter.get('/reports', authMiddleware('moderator'), async (c:C) => {
    const { results } = await c.env.DB.prepare(`
        SELECT r.*, u.username as reporter_username FROM reports r
        JOIN users u ON r.reporter_id = u.id
        WHERE r.status = 'open'
    `).all<Report>();
    return c.json(results);
});

adminRouter.post('/reports/:id/resolve', authMiddleware('moderator'), async (c: C) => {
    const { id } = c.req.param();
    const { action } = await c.req.json<{action: 'resolved' | 'dismissed'}>();
    const admin = c.get('user');

    if (!['resolved', 'dismissed'].includes(action)) {
        return c.json({ error: 'Invalid action'}, 400);
    }
    
    const result = await c.env.DB.prepare("UPDATE reports SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ? AND status = 'open'")
        .bind(action, admin.userId, new Date().toISOString(), id).run();

    if (result.changes === 0) return c.json({ error: 'Report not found or already processed'}, 404);
    return c.json({ message: `Report has been ${action}`});
});