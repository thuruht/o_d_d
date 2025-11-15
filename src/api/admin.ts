import { Hono } from 'hono';
import { authMiddleware } from '../utils/auth';
import { C, Env, User, Location, Submission } from '../types';
import { uuidv4 } from '../utils/uuid';

const admin = new Hono<{ Bindings: Env }>();

admin.use('*', authMiddleware('admin'));

admin.get('/users', async (c) => {
    try {
        const users = await c.env.DB.prepare(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        ).all();
        
        return c.json(users.results);
    } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

admin.put('/users/:id', async (c) => {
    const userId = c.req.param('id');
    const { role } = await c.req.json<{ role: string }>();
    
    if (!['user', 'moderator', 'admin'].includes(role)) {
        return c.json({ error: 'Invalid role' }, 400);
    }
    
    try {
        const result = await c.env.DB.prepare(
            'UPDATE users SET role = ? WHERE id = ?'
        ).bind(role, userId).run();
        
        const success = result.changes > 0;
        return success ? c.json({ message: 'User updated' }) : c.json({ error: 'Failed to update user' }, 500);
    } catch (error) {
        console.error('Error updating user:', error);
        return c.json({ error: 'Failed to update user' }, 500);
    }
});

admin.get('/submissions', async (c) => {
    try {
        const submissions = await c.env.DB.prepare(`
            SELECT s.*, u.username as submitter_username 
            FROM submissions s 
            JOIN users u ON s.submitted_by = u.id 
            WHERE s.status = 'pending'
            ORDER BY s.created_at DESC
        `).all();
        
        return c.json(submissions.results);
    } catch (error) {
        console.error('Error fetching submissions:', error);
        return c.json({ error: 'Failed to fetch submissions' }, 500);
    }
});

admin.post('/submissions/:id/approve', async (c: C) => {
    const { id } = c.req.param();
    const adminUser = c.get('user');
    
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
                .bind(locationId, data.name, data.description, data.latitude, data.longitude, data.type, JSON.stringify(data.properties || {}), submission.submitted_by),
            c.env.DB.prepare("UPDATE submissions SET status = 'approved', admin_notes = ? WHERE id = ?")
                .bind(`Approved by ${adminUser.id}`, id)
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
                .bind(`Approved by ${adminUser.id}`, id)
        ]);
        return c.json({ message: 'Location edit approved' });
    }
});

admin.post('/submissions/:id/reject', async (c: C) => {
    const { id } = c.req.param();
    const { reason } = await c.req.json<{reason: string}>();
    const adminUser = c.get('user');
    
    const result = await c.env.DB.prepare("UPDATE submissions SET status = 'rejected', admin_notes = ? WHERE id = ? AND status = 'pending'")
        .bind(`Rejected by ${adminUser.id}: ${reason}`, id).run();

    if (result.changes === 0) return c.json({ error: 'Submission not found or already processed'}, 404);
    return c.json({ message: 'Submission rejected' });
});

admin.get('/reports', async (c) => {
    try {
        const reports = await c.env.DB.prepare(`
            SELECT r.*, u.username as reporter_username 
            FROM reports r 
            JOIN users u ON r.reported_by = u.id 
            WHERE r.status = 'open'
            ORDER BY r.created_at DESC
        `).all();
        
        return c.json(reports.results);
    } catch (error) {
        console.error('Error fetching reports:', error);
        return c.json({ error: 'Failed to fetch reports' }, 500);
    }
});

admin.post('/reports/:id/resolve', async (c: C) => {
    const { id } = c.req.param();
    const { action } = await c.req.json<{action: string}>();
    const adminUser = c.get('user');
    
    const result = await c.env.DB.prepare("UPDATE reports SET status = 'resolved', admin_notes = ? WHERE id = ? AND status = 'open'")
        .bind(`Resolved by ${adminUser.id}: ${action}`, id).run();

    if (result.changes === 0) return c.json({ error: 'Report not found or already processed'}, 404);
    return c.json({ message: 'Report resolved' });
});

export default admin;