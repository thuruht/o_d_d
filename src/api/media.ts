// Corrected src/api/media.ts
import { Hono } from 'hono';
import { env } from 'hono/adapter';
import { verifyAuth } from '../utils/auth';
import { Bindings } from '../types'; // Using the centralized, correctly named types file

const media = new Hono<{ Bindings: Bindings }>();

media.post('/upload-url', verifyAuth, async (c) => {
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
        
        // IMPROVEMENT: Returns the `key` so the frontend can store it in the DB.
        return c.json({ uploadUrl: signedUrl, key: key });

    } catch (e: any) {
        // IMPROVEMENT: Added robust error handling.
        console.error('Failed to create upload URL:', e);
        return c.json({ error: 'Failed to create upload URL', details: e.message }, 500);
    }
});

export default media;
