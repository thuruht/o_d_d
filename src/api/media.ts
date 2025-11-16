import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware } from '../utils/auth';
import { C, Env } from '../types';
import { nanoid } from 'nanoid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '../utils/s3';

// Schema for the upload URL request
const uploadUrlSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().startsWith('image/').or(z.string().startsWith('video/')),
    locationId: z.string(),
});

const media = new Hono<{ Bindings: Env }>();

media.use('*', authMiddleware());

// POST /api/media/upload-url - Get a presigned URL for media upload
media.post('/upload-url', zValidator('json', uploadUrlSchema), async (c: C) => {
    const user = c.get('currentUser');
    const { filename, contentType, locationId } = c.req.valid('json');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const s3 = getS3Client(c.env);
        const mediaId = crypto.randomUUID();
        const key = `locations/${locationId}/${user.id}/${mediaId}-${nanoid()}`;
        
        const command = new PutObjectCommand({
            Bucket: c.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour

        // Create a pending media record in the database
        await c.env.DB.prepare(
            'INSERT INTO media (id, user_id, location_id, file_key, original_filename, content_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
        ).bind(mediaId, user.id, locationId, key, filename, contentType, 'pending').run();

        return c.json({ signedUrl, mediaId });
    } catch (error) {
        console.error('Error generating presigned URL for media:', error);
        return c.json({ error: 'Failed to generate presigned URL' }, 500);
    }
});

export default media;