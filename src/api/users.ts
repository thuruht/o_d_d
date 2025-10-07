import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { authMiddleware, AuthVariables } from '../utils/auth';
import { Env } from '../types';
import { nanoid } from 'nanoid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '../utils/s3';

// Schema for profile updates
const updateProfileSchema = z.object({
    bio: z.string().max(1000).optional(),
    website: z.string().url().optional().or(z.literal('')),
    contact: z.string().max(255).optional(),
    avatar_url: z.string().url().optional(),
});

// Schema for avatar upload request
const avatarUploadSchema = z.object({
    contentType: z.string().startsWith('image/'),
});

const users = new Hono<{ Bindings: Env, Variables: AuthVariables }>();

users.use('*', authMiddleware);

// GET /api/users/me - Get current user's profile
users.get('/me', async (c) => {
    const user = c.get('currentUser');
    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }
    return c.json(user);
});

// PUT /api/users/me - Update current user's profile
users.put('/me', zValidator('json', updateProfileSchema), async (c) => {
    const user = c.get('currentUser');
    const profileData = c.req.valid('json');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        await c.env.DB.prepare(
            'UPDATE users SET bio = ?, website = ?, contact = ?, avatar_url = ? WHERE id = ?'
        ).bind(
            profileData.bio,
            profileData.website,
            profileData.contact,
            profileData.avatar_url,
            user.id
        ).run();

        return c.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        return c.json({ error: 'Failed to update profile' }, 500);
    }
});

// POST /api/users/me/avatar-upload-url - Get a presigned URL for avatar upload
users.post('/me/avatar-upload-url', zValidator('json', avatarUploadSchema), async (c) => {
    const user = c.get('currentUser');
    const { contentType } = c.req.valid('json');

    if (!user) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    try {
        const s3 = getS3Client(c.env);
        const key = `avatars/${user.id}/${nanoid()}.${contentType.split('/')[1]}`;
        
        const command = new PutObjectCommand({
            Bucket: c.env.R2_BUCKET_NAME,
            Key: key,
            ContentType: contentType,
        });

        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 3600 }); // URL expires in 1 hour
        const avatar_url = `${c.env.R2_PUBLIC_URL}/${key}`;

        return c.json({
            signedUrl,
            avatar_url,
        });
    } catch (error) {
        console.error('Error generating presigned URL:', error);
        return c.json({ error: 'Failed to generate presigned URL' }, 500);
    }
});

// GET /api/users/by-id/:id - Get a user's public profile by ID
users.get('/by-id/:id', async (c) => {
    const userId = c.req.param('id');
    try {
        const user = await c.env.DB.prepare(
            'SELECT id, username, role, created_at, avatar_url, bio, website FROM users WHERE id = ?'
        ).bind(userId).first();
        
        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        
        // Return only public-safe data
        return c.json({
            id: user.id,
            username: user.username,
            avatar_url: user.avatar_url,
            created_at: user.created_at,
            bio: user.bio,
            website: user.website,
        });
    } catch (error) {
        console.error('Error fetching user by ID:', error);
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
});

export default users;