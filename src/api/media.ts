import { Hono } from 'hono';
import { nanoid } from 'nanoid';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { requireAuth } from '../utils/auth';
import { Env } from '../types';
import { logError } from '../utils/logging';

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
          expires: 600, // 10 minutes
          metadata: {
            contentType,
            userId: user.id,
          },
        },
      });

      return c.json({ signedUrl, key });

    } catch (e: any) {
      logError('Media', 'Failed to generate presigned URL', e);
      return c.json({ error: 'Failed to generate upload URL' }, 500);
    }
  }
);