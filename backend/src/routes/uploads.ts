import { Hono } from 'hono';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import { authMiddleware } from '../middleware/auth.js';
import {
    isR2Configured,
    getPresignedUploadUrl,
    getFilePublicUrl,
    getObject,
    deleteObject,
    validateContentType,
    getMaxFileSize,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_AUDIO_TYPES,
} from '../utils/r2.js';

const uploadsRouter = new Hono();

// Validation schema for presigned URL request
const presignedUrlSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1),
    type: z.enum(['image', 'audio']),
});

/**
 * POST /api/uploads/presigned-url
 * Generate a presigned URL for uploading a file directly to R2
 */
uploadsRouter.post('/presigned-url', authMiddleware, async (c) => {
    try {
        // Check if R2 is configured
        if (!isR2Configured()) {
            return c.json(
                { error: 'File uploads are not configured. Please contact support.' },
                503
            );
        }

        const { userId } = c.get('user');
        const body = await c.req.json();
        const data = presignedUrlSchema.parse(body);

        // Validate content type
        if (!validateContentType(data.contentType, data.type)) {
            const allowedTypes = data.type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
            return c.json(
                {
                    error: `Invalid content type. Allowed types for ${data.type}: ${allowedTypes.join(', ')}`,
                },
                400
            );
        }

        // Generate a unique key for the file
        const uuid = randomUUID();
        const sanitizedFilename = data.filename.replace(/[^a-zA-Z0-9.-]/g, '_');
        const key = `weddings/${userId}/${data.type}/${uuid}-${sanitizedFilename}`;

        // Get max file size for this type (for client-side validation info)
        const maxSize = getMaxFileSize(data.type);

        // Generate presigned upload URL
        const uploadUrl = await getPresignedUploadUrl(key, data.contentType);

        // Get the public URL for this file (will be proxied through our server)
        const publicUrl = getFilePublicUrl(key);

        return c.json({
            uploadUrl,
            key,
            publicUrl,
            maxSize,
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Presigned URL generation error:', err);
        return c.json({ error: 'Failed to generate upload URL' }, 500);
    }
});

/**
 * GET /api/uploads/file/*
 * Proxy endpoint for serving files from R2
 * This allows us to serve files without exposing R2 credentials
 */
uploadsRouter.get('/file/*', async (c) => {
    try {
        // Get the full path after /file/
        const key = c.req.path.replace('/api/uploads/file/', '');

        // Security: validate key format
        if (!key.startsWith('weddings/')) {
            return c.json({ error: 'Invalid file key' }, 400);
        }

        if (!isR2Configured()) {
            return c.json({ error: 'File storage not configured' }, 503);
        }

        const response = await getObject(key);

        if (!response.Body) {
            return c.json({ error: 'File not found' }, 404);
        }

        // Get content type from response
        const contentType = response.ContentType || 'application/octet-stream';
        const contentLength = response.ContentLength;

        // Set response headers
        c.header('Content-Type', contentType);
        if (contentLength) {
            c.header('Content-Length', contentLength.toString());
        }
        c.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        c.header('Accept-Ranges', 'bytes');

        // Handle range requests for audio streaming
        const rangeHeader = c.req.header('Range');
        if (rangeHeader && contentLength) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = match[2] ? parseInt(match[2], 10) : contentLength - 1;

                c.status(206);
                c.header('Content-Range', `bytes ${start}-${end}/${contentLength}`);
                c.header('Content-Length', (end - start + 1).toString());
            }
        }

        // Transform the stream to a web ReadableStream
        const bodyStream = response.Body.transformToWebStream();
        return new Response(bodyStream, {
            status: c.res.status,
            headers: c.res.headers,
        });
    } catch (err: unknown) {
        console.error('File proxy error:', err);
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        if (errorMessage.includes('NoSuchKey') || errorMessage.includes('not found')) {
            return c.json({ error: 'File not found' }, 404);
        }
        return c.json({ error: 'Failed to retrieve file' }, 500);
    }
});

/**
 * DELETE /api/uploads/file/*
 * Delete a file from R2 (only the owner can delete)
 */
uploadsRouter.delete('/file/*', authMiddleware, async (c) => {
    try {
        const { userId } = c.get('user');
        // Get the full path after /file/
        const key = c.req.path.replace('/api/uploads/file/', '');

        // Security: validate key format and ownership
        if (!key.startsWith('weddings/')) {
            return c.json({ error: 'Invalid file key' }, 400);
        }

        // Check if user owns this file
        const expectedPrefix = `weddings/${userId}/`;
        if (!key.startsWith(expectedPrefix)) {
            return c.json({ error: 'Unauthorized to delete this file' }, 403);
        }

        if (!isR2Configured()) {
            return c.json({ error: 'File storage not configured' }, 503);
        }

        await deleteObject(key);

        return c.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('File deletion error:', err);
        return c.json({ error: 'Failed to delete file' }, 500);
    }
});

export default uploadsRouter;
