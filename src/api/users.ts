import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { eq } from 'drizzle-orm';
import { users } from '../db/schema';
import { requireAuth } from '../utils/auth';
import { Env, UserProfile } from '../types';
import { logError } from '../utils/logging';

export const usersRouter = new Hono<{ Bindings: Env }>();

// GET /api/users/:id
usersRouter.get('/:id', async (c) => {
    const { id } = c.req.param();
    try {
        const user = await c.env.DB.select({
            id: users.id,
            username: users.username,
            avatar_url: users.avatar_url,
            bio: users.bio,
            website: users.website,
            role: users.role,
        }).from(users).where(eq(users.id, id)).get();

        if (!user) {
            return c.json({ error: 'User not found' }, 404);
        }
        return c.json(user);
    } catch (error) {
        console.error('Failed to fetch user:', error);
        return c.json({ error: 'Failed to fetch user' }, 500);
    }
});


// GET /api/users/me
usersRouter.get('/me', requireAuth, (c) => {
    const user = c.get('user');
    return c.json(user);
});


// PUT /api/users/me
usersRouter.put(
    '/me',
    requireAuth,
    zValidator('json', UserProfile.pick({ bio: true, website: true, contact: true, avatar_url: true }).partial()),
    async (c) => {
        const user = c.get('user');
        const profileData = c.req.valid('json');
        try {
            const updatedUser = await c.env.DB.update(users)
                .set({ ...profileData, updated_at: new Date() })
                .where(eq(users.id, user.id))
                .returning()
                .get();

            return c.json(updatedUser);
        } catch (e: any) {
            logError('Users', 'Failed to update user profile', e);
            return c.json({ error: 'Failed to update profile' }, 500);
        }
    }
);


// POST /api/users/me/avatar-upload-url
usersRouter.post(
    '/me/avatar-upload-url',
    requireAuth,
    zValidator('json', z.object({
      contentType: z.string(),
    })),
    async (c) => {
      const user = c.get('user');
      const { contentType } = c.req.valid('json');
      const key = `avatars/${user.id}/${nanoid()}.jpg`;
  
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
  
        // This requires you to set `R2_PUBLIC_URL` in your wrangler.jsonc / .dev.vars
        const avatar_url = `${c.env.R2_PUBLIC_URL}/${key}`;
  
        return c.json({ signedUrl, avatar_url });
      } catch (e: any) {
        logError('Users', 'Failed to generate avatar upload URL', e);
        return c.json({ error: 'Failed to generate upload URL' }, 500);
    }
    }
);