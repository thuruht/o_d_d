// src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { serveStatic } from 'hono/cloudflare-workers';
import { Bindings } from './types';

import api from './api';

const app = new Hono<{ Bindings: Bindings }>();

// Enable CORS for all routes
app.use('/api/*', cors());

// API routes
app.route('/api', api);

// Serve static assets from the /public folder
app.get('*', serveStatic({ root: './' }));

// Handle 404 for assets not found by falling back to index.html for SPAs
app.get('*', serveStatic({ path: './index.html' }));

export default app;
