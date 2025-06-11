import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Env } from './types';

// Import all routers as default exports
import authRouter from './api/auth';
import locationsRouter from './api/locations';
import mediaRouter from './api/media';
import usersRouter from './api/users';
import adminRouter from './api/admin';
import reportsRouter from './api/reports';
import submissionsRouter from './api/submissions';
import votingRouter from './api/voting';
import favoritesRouter from './api/favorites';

const app = new Hono<{ Bindings: Env }>();

// Security Headers Middleware
app.use('*', async (c, next) => {
    c.header('X-Content-Type-Options', 'nosniff');
    c.header('X-Frame-Options', 'DENY');
    c.header('X-XSS-Protection', '1; mode=block');
    c.header('Referrer-Policy', 'no-referrer');

    // Content Security Policy
    c.header('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' https://unpkg.com https://cdnjs.cloudflare.com; " +
        "style-src 'self' https://unpkg.com https://fonts.bunny.net 'unsafe-inline'; " +
        "img-src 'self' https://*.openstreetmap.org https://*.openstreetmap.de https://*.tile.opentopomap.org https://server.arcgisonline.com https://odd-img.distorted.work https://www.gravatar.com https://*.waymarkedtrails.org https://*.tiles.openrailwaymap.org https://*.tile.openstreetmap.org https://opencampingmap.openstreetmap.de https://brewmap.openstreetmap.de https://babykarte.openstreetmap.de data:; " +
        "font-src 'self' https://fonts.bunny.net; " +
        "connect-src 'self' https://nominatim.openstreetmap.org https://829921384c97e0dbbb34430e307d6b52.r2.cloudflarestorage.com https://overpass-api.de; " +
        "frame-src 'none'; " +
        "object-src 'none';"
    );
    
    await next();
});

// CORS Configuration
app.use('*', cors({
    origin: (origin) => {
        // TODO: IMPORTANT - For production, restrict this to your actual frontend domain(s)!
        // Example for production:
        // const allowedOrigins = ['https://yourdomain.com', 'https://www.yourdomain.com'];
        // if (allowedOrigins.includes(origin)) {
        //     return origin;
        // }
        // return undefined;
        return origin; // Current permissive setting for development
    },
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Custom-Auth'],
    credentials: true,
    maxAge: 86400,
}));

// API Routes
app.route('/api/auth', authRouter);
app.route('/api/locations', locationsRouter);
app.route('/api/media', mediaRouter);
app.route('/api/users', usersRouter);
app.route('/api/admin', adminRouter);
app.route('/api/reports', reportsRouter);
app.route('/api/submissions', submissionsRouter);
app.route('/api/votes', votingRouter);
app.route('/api/favorites', favoritesRouter);

// Static file serving using Workers Assets binding
app.use('/*', serveStatic({ 
    root: './',
}));

// SPA fallback - serve index.html for all non-API routes
app.get('*', serveStatic({ 
    path: './index.html',
}));

export default app;