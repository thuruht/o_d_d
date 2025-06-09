import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../utils/auth';
import { Env } from '../types';

export const mediaRouter = new Hono<{ Bindings: Env }>();

mediaRouter.post(
  '/upload-url',
  requireAuth,
  zValidator('json', z.object({
    filename: z.string(),
    contentType: z.string(),
    locationId: z.string(),
  })),
  async (c) => {
    const user = c.get('user');
    const { filename, contentType, locationId } = c.req.valid('json');
    const key = `locations/${locationId}/${user.id}/${nanoid()}-${filename}`;

    try {
      // --- FIX: Uses the correct R2 method 'createPresignedUrl' with the proper object structure. ---
      const signedUrl = await c.env.MEDIA_BUCKET.createPresignedUrl({
        key,
        method: 'PUT',
        options: {
          expires: 3600, // URL expires in 1 hour
          metadata: {
            contentType,
            userId: user.id,
            locationId,
          },
        },
      });

      return c.json({ signedUrl, key });

    } catch (e: any) {
      console.error('Failed to create upload URL:', e);
      return c.json({ error: 'Failed to create upload URL', details: e.message }, 500);
    }
  }
);