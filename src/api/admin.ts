import { Hono } from 'hono';
import { authMiddleware, AuthVariables } from '../utils/auth';
import { Env, Submission, User, Location, Report } from '../types';
import { v4 as uuidv4 } from 'uuid';

const admin = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

admin.use('*', authMiddleware);

// Middleware to check admin/moderator role
admin.use('*', async (c, next) => {
    const user = c.get('currentUser');
    if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
        return c.json({ error: 'Insufficient permissions' }, 403);
    }
    await next();
});

admin.get('/users', async (c) => {
    try {
        const users = await c.env.DB.prepare(
            'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
        ).all<User>();
        
        return c.json(users.results);
    } catch (error) {
        console.error('Error fetching users:', error);
        return c.json({ error: 'Failed to fetch users' }, 500);
    }
});

admin.put('/users/:id', async (c) => {
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

admin.post('/submissions/:id/approve', async (c) => {
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
                .bind(locationId, data.name, data.description, data.latitude, data.longitude, data.type, JSON.stringify(data.properties || {}), submission.user_id),
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

admin.post('/submissions/:id/reject', async (c) => {
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

admin.post('/reports/:id/resolve', async (c) => {
    const { id } = c.req.param();
    const { action } = await c.req.json<{action: 'resolved' | 'dismissed'}>();
    const adminUser = c.get('user');

    if (!['resolved', 'dismissed'].includes(action)) {
        return c.json({ error: 'Invalid action'}, 400);
    }
    
    const result = await c.env.DB.prepare("UPDATE reports SET status = ?, resolved_by = ?, resolved_at = ? WHERE id = ? AND status = 'open'")
        .bind(action, adminUser.id, new Date().toISOString(), id).run();

    if (result.changes === 0) return c.json({ error: 'Report not found or already processed'}, 404);
    return c.json({ message: `Report has been ${action}`});
});

export default admin;