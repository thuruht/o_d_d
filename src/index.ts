// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Env } from './types';

import { usersRouter } from './api/users';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for all routes
app.use('/api/*', cors());

// API routes
const apiRouter = new Hono();
apiRouter.route('/users', usersRouter);
// Add other routers

// Mount API under /api prefix
app.route('/api', apiRouter);

// Serve static assets from the /public folder
app.get('*', serveStatic({ root: './' }));

// Handle 404 for assets not found by falling back to index.html for SPAs
app.get('*', serveStatic({ path: './index.html' }));

// Add this middleware to your Hono app
app.use('*', async (c, next) => {
  // Set CSP header
  c.header('Content-Security-Policy', 
    "default-src 'self'; " +
    "script-src 'self' https://cdnjs.cloudflare.com; " +
    "style-src 'self' https://fonts.bunny.net 'unsafe-inline'; " +
    "img-src 'self' https://odd-img.distorted.work https://www.gravatar.com data:; " + 
    "font-src 'self' https://fonts.bunny.net; " +
    "connect-src 'self' https://nominatim.openstreetmap.org; " +
    "frame-src 'none'; " +
    "object-src 'none';"
  );
  
  // Set other security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  
  await next();
});

export default app;
