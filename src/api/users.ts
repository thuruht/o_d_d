import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, AuthVariables } from '../utils/auth';
import { Env } from '../types';
import { nanoid } from 'nanoid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { s3Client } from '../utils/s3';

const avatarUploadSchema = z.object({
    filename: z.string().min(1).max(255),
});

const users = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

users.use('*', authMiddleware);

users.get('/:id', async (c) => {
    const userId = c.req.param('id');
    
    try {
        const user = await c.env.DB.prepare(
            'SELECT id, username, role, created_at, avatar_url FROM users WHERE id = ?'
        ).bind(userId).first();
        
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        
        return c.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
});

// Direct avatar upload
users.post('/avatar-upload-direct', async (c) => {
    const user = c.get('currentUser');
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        const formData = await c.req.formData();
        const file = formData.get('avatar') as File;
        
        if (!file) {
            return c.json({ error: 'No avatar file provided' }, 400);
        }

        // Validate file type
        if (!file.type.startsWith('image/')) {
            return c.json({ error: 'File must be an image' }, 400);
        }

        // Generate unique key for the avatar
        const key = `avatars/${user.id}/${nanoid()}.jpg`;
        
        // Upload directly to R2
        await c.env.MEDIA_BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            },
            customMetadata: {
                'uploaded-by': user.id,
                'type': 'avatar',
                'original-filename': file.name
            }
        });
        
        // Construct the public URL for the avatar
        // You'll need to add R2_PUBLIC_URL to your environment variables
        const avatarUrl = `${c.env.R2_PUBLIC_URL}/${key}`;
        
        // Update user's avatar URL in database
        await c.env.DB.prepare(
            'UPDATE users SET avatar_url = ? WHERE id = ?'
        ).bind(avatarUrl, user.id).run();
        
        return c.json({ 
            message: 'Avatar updated successfully', 
            avatarUrl,
            key
        });
    } catch (error) {
        console.error('Error uploading avatar:', error);
        return c.json({ error: 'Failed to upload avatar' }, 500);
    }
});

// Get avatar upload key (alternative approach)
users.post('/avatar-upload-key', zValidator('json', avatarUploadSchema), async (c) => {
    const user = c.get('currentUser');
    const { filename } = c.req.valid('json');
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        // Generate unique key for the avatar
        const key = `avatars/${user.id}/${nanoid()}.jpg`;
        
        return c.json({ 
            key,
            message: 'Use this key for direct upload to R2'
        });
    } catch (error) {
        console.error('Error generating avatar key:', error);
        return c.json({ error: 'Failed to generate upload key' }, 500);
    }
});

// Confirm avatar upload (for frontend to call after successful direct upload)
users.post('/avatar-confirm', async (c) => {
    const user = c.get('currentUser');
    const { key } = await c.req.json();
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        // Construct the public URL for the avatar
        const avatarUrl = `${c.env.R2_PUBLIC_URL}/${key}`;
        
        // Update user's avatar URL in database
        await c.env.DB.prepare(
            'UPDATE users SET avatar_url = ? WHERE id = ?'
        ).bind(avatarUrl, user.id).run();
        
        return c.json({ 
            message: 'Avatar updated successfully', 
            avatarUrl 
        });
    } catch (error) {
        console.error('Error confirming avatar upload:', error);
        return c.json({ error: 'Failed to update avatar' }, 500);
    }
});

// Presigned URL for avatar upload
users.get('/avatar-presign-url', async (c) => {
    const user = c.get('currentUser');
    
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    
    try {
        // Generate unique key for the avatar
        const key = `avatars/${user.id}/${nanoid()}.jpg`;
        
        // Create a presigned URL for the avatar upload
        const signedUrl = await getSignedUrl(
            s3Client,
            new PutObjectCommand({
                Bucket: process.env.AWS_BUCKET_NAME,
                Key: key,
                ContentType: 'image/jpeg',
            }),
            { method: 'PUT' }  // Add this parameter
        );
        
        return c.json({ 
            signedUrl,
            key,
            message: 'Use this URL to upload the avatar'
        });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return c.json({ error: 'Failed to generate presigned URL' }, 500);
    }
});

export default users;