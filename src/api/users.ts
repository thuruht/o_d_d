import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { C, Env, User } from '../types';
import { authMiddleware } from '../utils/auth';

export const usersRouter = new Hono<{ Bindings: Env }>();

usersRouter.get('/:id', async (c: C) => {
    const { id } = c.req.param();
    const user = await c.env.DB.prepare(
        `SELECT id, username, bio, website, avatar_url, created_at FROM users WHERE id = ? OR username = ?`
    ).bind(id, id).first<Omit<User, 'email' | 'role' | 'password_hash'>>();

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }
    return c.json(user);
});

usersRouter.put('/me', authMiddleware(), async (c: C) => {
    const userPayload = c.get('user');
    const { bio, website, contact, avatar_url } = await c.req.json<{
        bio?: string;
        website?: string;
        contact?: string;
        avatar_url?: string;
    }>();

    const fieldsToUpdate: Record<string, string | undefined> = {
        bio, website, contact, avatar_url
    };
    
    const updateClauses = Object.keys(fieldsToUpdate)
        .filter(key => fieldsToUpdate[key] !== undefined)
        .map(key => `${key} = ?`);

    if (updateClauses.length === 0) {
        return c.json({ error: 'No fields to update provided' }, 400);
    }

    const updateValues = Object.values(fieldsToUpdate).filter(value => value !== undefined);

    const query = `UPDATE users SET ${updateClauses.join(', ')} WHERE id = ?`;
    updateValues.push(userPayload.userId);

    try {
        await c.env.DB.prepare(query).bind(...updateValues).run();
        return c.json({ message: 'Profile updated successfully' });
    } catch (e: any) {
        console.error('Failed to update profile:', e);
        return c.json({ error: 'Failed to update profile' }, 500);
    }
});

usersRouter.post('/me/avatar-upload-url', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { contentType } = await c.req.json<{ contentType: string }>();

    if (!contentType) {
        return c.json({ error: 'contentType is required' }, 400);
    }

    const fileExtension = contentType.split('/')[1] || 'png';
    const objectKey = `avatars/${user.userId}/avatar.${fileExtension}?v=${Date.now()}`;

    const s3 = new S3Client({
        region: 'auto',
        endpoint: c.env.R2_ENDPOINT,
        credentials: {
            accessKeyId: c.env.R2_ACCESS_KEY_ID,
            secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
        },
    });

    const command = new PutObjectCommand({
        Bucket: c.env.R2_BUCKET_NAME,
        Key: objectKey,
        ContentType: contentType,
    });

    try {
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
        const avatar_url = `${c.env.R2_PUBLIC_URL}/${objectKey}`;

        return c.json({ signedUrl, avatar_url });
    } catch (error) {
        console.error('Error generating avatar upload URL:', error);
        return c.json({ error: 'Could not generate upload URL' }, 500);
    }
});