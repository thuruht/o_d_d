// Corrected src/api/media.ts
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { authMiddleware } from '../utils/auth';
import { Env } from '../types';

export const mediaRouter = new Hono<{ Bindings: Env }>();

mediaRouter.post('/upload-url', authMiddleware(), async (c) => {
    try {
        // FIX: Uses the correct binding name `MEDIA_BUCKET` from your config.
        const { MEDIA_BUCKET } = env(c);
        const user = c.get('user');
        const { filename, contentType } = await c.req.json();

        if (!filename || !contentType) {
            return c.json({ error: 'Filename and contentType are required' }, 400);
        }

        const key = `uploads/${user.id}/${Date.now()}-${filename}`;

        // Uses the modern `createSignedUrl` method.
        const signedUrl = await MEDIA_BUCKET.createSignedUrl('putObject', {
            key: key,
            contentType: contentType,
        }, {
            expiresIn: 3600 // URL expires in 1 hour
        });
        
        // More standard naming:
        return c.json({ signedUrl: signedUrl, key: key });

    } catch (e: any) {
        // IMPROVEMENT: Added robust error handling.
        console.error('Failed to create upload URL:', e);
        return c.json({ error: 'Failed to create upload URL', details: e.message }, 500);
    }
});
