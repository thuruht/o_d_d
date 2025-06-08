// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Env } from './types';

// Import all the API routers
import { adminRouter } from './api/admin';
import { authRouter } from './api/auth';
import { favoritesRouter } from './api/favorites';
import { locationsRouter } from './api/locations';
import { mediaRouter } from './api/media';
import { reportsRouter } from './api/reports';
import { submissionsRouter } from './api/submissions';
import { usersRouter } from './api/users';
import { votingRouter } from './api/voting';

const app = new Hono<{ Bindings: Env }>();

// --- Security Headers Middleware ---
// Apply this first to ensure all responses get these headers.
app.use('*', async (c, next) => {
  // Set security headers
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('X-Frame-Options', 'DENY');
  c.header('X-XSS-Protection', '1; mode=block');
  c.header('Referrer-Policy', 'no-referrer');

  // NOTE: A strict Content-Security-Policy is essential but can be complex.
  // The policy below is a good start, but you may need to adjust it.
  // For example, Leaflet's default tile provider requires openstreetmap.org.
  c.header('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://unpkg.com https://cdnjs.cloudflare.com; " +
    "style-src 'self' https://unpkg.com https://fonts.bunny.net 'unsafe-inline'; " +
    "img-src 'self' https://*.tile.openstreetmap.org https://server.arcgisonline.com https://odd-img.distorted.work https://www.gravatar.com data:; " +
    "font-src 'self' https://fonts.bunny.net; " +
    "connect-src 'self' https://nominatim.openstreetmap.org; " +
    "frame-src 'none'; " +
    "object-src 'none';"
  );
  await next();
});

// --- API Setup ---
const api = new Hono();

// Enable CORS for all API routes
api.use('/*', cors());

// Mount all API routers
api.route('/admin', adminRouter);
api.route('/auth', authRouter);
api.route('/favorites', favoritesRouter);
api.route('/locations', locationsRouter);
api.route('/media', mediaRouter);
api.route('/reports', reportsRouter);
api.route('/submissions', submissionsRouter);
api.route('/users', usersRouter);
api.route('/votes', votingRouter);

// Mount the master API router under the /api prefix
app.route('/api', api);

// --- Static Asset Serving for SPA ---
// This should come after API routes.
// Serve static assets from the /public folder
app.get('*', serveStatic({ root: './public' }));
// Handle 404s by falling back to the SPA's entry point
app.get('*', serveStatic({ path: './public/index.html' }));

export default app;