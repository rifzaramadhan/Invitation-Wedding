import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';

import authRouter from './routes/auth.js';
import weddingsRouter from './routes/weddings.js';
import guestsRouter from './routes/guests.js';
import eventsRouter from './routes/events.js';
import wishesRouter from './routes/wishes.js';
import publicRouter from './routes/public.js';
import uploadsRouter from './routes/uploads.js';
import mediaRouter from './routes/media.js';
import { startMediaCleanupScheduler } from './jobs/media-cleanup.js';

const app = new Hono();

const corsOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

// Middleware
app.use('*', logger());
app.use('*', cors({
    origin: corsOrigins,
    credentials: true,
}));

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API Routes
app.route('/api/auth', authRouter);
app.route('/api/weddings', weddingsRouter);
// Mount uploads before guests/events to prevent their wildcard auth middleware
// from intercepting public file access requests
app.route('/api/uploads', uploadsRouter);
app.route('/api/media', mediaRouter);
app.route('/api', guestsRouter);
app.route('/api', eventsRouter);
app.route('/api', wishesRouter);
app.route('/api/public', publicRouter);

// 404 handler
app.notFound((c) => c.json({ error: 'Not found' }, 404));

// Error handler
app.onError((err, c) => {
    console.error('Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    const isDev = process.env.NODE_ENV !== 'production';
    return c.json(
        {
            error: isDev ? message : 'Internal server error',
        },
        500
    );
});

const port = parseInt(process.env.PORT || '3000');

console.log(`🚀 Server starting on port ${port}`);
console.log(`📅 Timezone: ${process.env.TZ || 'UTC'}`);

serve({
    fetch: app.fetch,
    port,
});

startMediaCleanupScheduler();
