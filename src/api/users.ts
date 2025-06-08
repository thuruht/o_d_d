usersRouter.post('/me/avatar-upload-url', authMiddleware(), async (c: C) => {
    const user = c.get('user');
    const { contentType } = await c.req.json<{ contentType: string }>();

    if (!contentType) {
        return c.json({ error: 'contentType is required' }, 400);
    }

    const fileExtension = contentType.split('/')[1] || 'png';
    const objectKey = `avatars/${user.userId}/avatar.${fileExtension}?v=${Date.now()}`;
    const { MEDIA_BUCKET } = env(c);

    try {
        const signedUrl = await MEDIA_BUCKET.createSignedUrl('putObject', {
            key: objectKey,
            contentType: contentType,
        }, {
            expiresIn: 300
        });
        const avatar_url = `${c.env.R2_PUBLIC_URL}/${objectKey}`;

        return c.json({ signedUrl, avatar_url });
    } catch (error) {
        console.error('Error generating avatar upload URL:', error);
        return c.json({ error: 'Could not generate upload URL' }, 500);
    }
});

