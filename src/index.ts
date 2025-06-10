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

  // Content Security Policy - updated to allow all map tile providers
  c.header('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' https://unpkg.com https://cdnjs.cloudflare.com; " +
    "style-src 'self' https://unpkg.com https://fonts.bunny.net 'unsafe-inline'; " +
    // Updated img-src to include various map tile providers and OpenStreetMap domains
    "img-src 'self' https://*.openstreetmap.org https://*.openstreetmap.de https://*.tile.opentopomap.org https://server.arcgisonline.com https://odd-img.distorted.work https://www.gravatar.com https://*.waymarkedtrails.org https://*.tiles.openrailwaymap.org https://*.tile.openstreetmap.org https://opencampingmap.openstreetmap.de https://brewmap.openstreetmap.de https://babykarte.openstreetmap.de data:; " +
    "font-src 'self' https://fonts.bunny.net; " +
    "connect-src 'self' https://nominatim.openstreetmap.org https://829921384c97e0dbbb34430e307d6b52.r2.cloudflarestorage.com https://overpass-api.de; " +
    "frame-src 'none'; " +
    "object-src 'none';"
  );
  await next();
});

// --- API Setup ---
const api = new Hono();

// More flexible CORS configuration - use env variables in production
api.use('/*', cors({
  origin: ['*'], // In production, change to specific domains
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  maxAge: 86400, // 24 hours
  credentials: true // to support cookies/auth
}));

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
// Serve all static files from the root, using the asset manifest
function getAssetManifest(env) {
  try {
    return env.__STATIC_CONTENT_MANIFEST 
      ? JSON.parse(env.__STATIC_CONTENT_MANIFEST) 
      : {};
  } catch (e) {
    console.error("Error parsing __STATIC_CONTENT_MANIFEST", e);
    return {};
  }
}

app.get('/*', serveStatic({ 
  root: './', 
  manifest: getAssetManifest(c.env) // Use the helper function 
}));



// Catch-all route for SPA
app.get('*', async (c) => {
  // With Sites integration, we only need to handle the SPA fallback
  return c.env.ASSETS.fetch(new Request(new URL('/index.html', c.req.url)));
});// Export the app for Cloudflare Workers
export default app;