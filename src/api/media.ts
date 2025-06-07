import { Hono } from 'hono';
import { v4 as uuidv4 } from 'uuid';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { C, Env } from '../types';
import { authMiddleware } from '../utils/auth';

export const mediaRouter = new Hono<{ Bindings: Env }>();

mediaRouter.post('/upload-url', authMiddleware(), async (c: C) => {
  const { filename, contentType, locationId } = await c.req.json();
  const user = c.get('user');

  if (!filename || !contentType || !locationId) {
    return c.json({ error: 'Filename, contentType, and locationId are required' }, 400);
  }

  const location = await c.env.DB.prepare("SELECT id FROM locations WHERE id = ?").bind(locationId).first();
  if (!location) {
      return c.json({ error: "Location not found" }, 404);
  }

  const objectKey = `destinations/${locationId}/${user.userId}/${uuidv4()}-${filename}`;
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
    Metadata: {
      userId: user.userId,
      locationId: locationId
    }
  });

  try {
    const signedUrl = await getSignedUrl(s3, command, { expiresIn: 600 });
    
    const mediaId = uuidv4();
    const mediaType = contentType.startsWith('image/') ? 'image' : 'video';
    
    await c.env.DB.prepare(
      `INSERT INTO media (id, location_id, user_id, r2_key, type, status) VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(mediaId, locationId, user.userId, objectKey, mediaType, 'pending').run();

    return c.json({ signedUrl, objectKey, mediaId });
  } catch (error) {
    console.error('Error generating upload URL:', error);
    return c.json({ error: 'Could not generate upload URL' }, 500);
  }
});