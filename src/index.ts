// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
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
    "img-src 'self' https://*.tile.openstreetmap.org https://server.arcgisonline.com https://odd-img.distorted.work https://www.gravatar.com https://*.waymarkedtrails.org data:; " + // Added waymarkedtrails
    "font-src 'self' https://fonts.bunny.net; " +
    "connect-src 'self' https://nominatim.openstreetmap.org; " +
    "frame-src 'none'; " +
    "object-src 'none';"
  );
  await next();
});

// --- API Setup ---
const api = new Hono();

// More restrictive CORS configuration
api.use('/*', cors({
  origin: ['https://your-app-domain.com', 'https://another-allowed-domain.com'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
  maxAge: 86400, // 24 hours
  credentials: true //  to support cookies/auth
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


export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // For API requests, use the Hono app
    if (url.pathname.startsWith('/api/')) {
      return app.fetch(request, env, ctx);
    }
    
    // For static assets, use Cloudflare's built-in handler
    try {
      return await env.ASSETS.fetch(request);
    } catch (e) {
      // If static asset not found, send index.html for SPA routing
      return await env.ASSETS.fetch(new Request(new URL('/index.html', request.url)));
    }
  }
}