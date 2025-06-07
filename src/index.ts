import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Env } from './types';
import { apiRouter } from './api';

export const app = new Hono<{ Bindings: Env }>();

app.use('*', logger());
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

app.route('/api', apiRouter);

app.get('*', async (c, next) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api/')) {
    await next();
    return;
  }
  return c.env.ASSETS.fetch(c.req);
});

app.notFound(async (c) => {
  const url = new URL(c.req.url);
  if (url.pathname.startsWith('/api/')) {
    return c.json({ error: 'Not Found' }, 404);
  }
  
  try {
    const assetRequest = new Request(new URL(c.req.url).origin);
    const spaPage = await c.env.ASSETS.fetch(assetRequest);
    return new Response(spaPage.body, {
      headers: spaPage.headers,
      status: 200
    });
  } catch (e) {
     return c.text('Not Found', 404);
  }
});

app.onError((err, c) => {
  console.error(`Hono Error:`, err);
  if ('getResponse' in err) {
    return err.getResponse();
  }
  return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

export default app;