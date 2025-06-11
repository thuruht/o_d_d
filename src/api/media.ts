import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, AuthVariables } from '../utils/auth';
import { Env } from '../types';
import { nanoid } from 'nanoid';

const uploadUrlSchema = z.object({
    filename: z.string().min(1).max(255),
    locationId: z.string().uuid(),
});

const media = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

media.use('*', authMiddleware);

// Direct upload endpoint
media.post('/upload', zValidator('json', uploadUrlSchema), async (c) => {
    const user = c.get('currentUser');
    const { filename, locationId } = c.req.valid('json');
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        // Generate unique key for the media file
        const key = `locations/${locationId}/${user.id}/${nanoid()}-${filename}`;
        
        // Return the key for frontend to use with direct upload
        const mediaId = crypto.randomUUID();
        
        // Store pending media record
        await c.env.DB.prepare(
            'INSERT INTO media (id, location_id, user_id, file_key, original_filename, status) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(mediaId, locationId, user.id, key, filename, 'pending').run();
        
        return c.json({ 
            mediaId,
            key,
            message: 'Media record created, proceed with direct upload'
        });
    } catch (error) {
        console.error('Error creating media record:', error);
        return c.json({ error: 'Failed to create media record' }, 500);
    }
});

// Handle direct file upload
media.post('/upload-direct', async (c) => {
    const user = c.get('currentUser');
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        const formData = await c.req.formData();
        const file = formData.get('file') as File;
        const locationId = formData.get('locationId') as string;
        const caption = formData.get('caption') as string;
        
        if (!file) {
            return c.json({ error: 'No file provided' }, 400);
        }

        const mediaId = crypto.randomUUID();
        const key = `locations/${locationId}/${user.id}/${nanoid()}-${file.name}`;
        
        // Upload directly to R2
        await c.env.MEDIA_BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                'uploaded-by': user.id,
                'location-id': locationId,
                'original-filename': file.name
            }
        });
        
        // Store record in database
        await c.env.DB.prepare(
            'INSERT INTO media (id, location_id, user_id, file_key, original_filename, caption, content_type, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(mediaId, locationId, user.id, key, file.name, caption || null, file.type, 'pending').run();

        return c.json({
            mediaId,
            message: 'Media uploaded successfully and submitted for review',
            filename: file.name
        });
    } catch (error) {
        console.error('Error uploading media:', error);
        return c.json({ error: 'Failed to upload media' }, 500);
    }
});

// Confirm upload completion (for frontend to call after successful upload)
media.post('/confirm-upload', async (c) => {
    const user = c.get('currentUser');
    const { mediaId, caption } = await c.req.json();
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        // Update media record with caption and mark as uploaded
        const result = await c.env.DB.prepare(
            'UPDATE media SET caption = ?, status = ? WHERE id = ? AND user_id = ?'
        ).bind(caption || null, 'pending', mediaId, user.id).run();
        
        if (result.changes === 0) {
            return c.json({ error: 'Media not found or unauthorized' }, 404);
        }
        
        return c.json({ message: 'Media submitted for review' });
    } catch (error) {
        console.error('Error confirming upload:', error);
        return c.json({ error: 'Failed to confirm upload' }, 500);
    }
});

export default media;