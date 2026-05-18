import { Hono } from 'hono';
import { z } from 'zod';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import {
    validateContentType,
    getMaxFileSize,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_AUDIO_TYPES,
    saveFileLocal,
    getLocalFilePath,
    deleteLocalFile
} from '../utils/local-storage.js';

const uploadsRouter = new Hono();

/**
 * POST /api/uploads/
 * Upload a file directly to local storage
 */
uploadsRouter.post('/', authMiddleware, async (c) => {
    try {
        const { userId } = c.get('user');
        
        // Parse multipart/form-data
        const body = await c.req.parseBody();
        const file = body['file'];
        const typeStr = body['type'] as string;
        
        if (!file || !(file instanceof File)) {
            return c.json({ error: 'File is required' }, 400);
        }
        
        if (typeStr !== 'image' && typeStr !== 'audio') {
            return c.json({ error: 'Invalid type, must be image or audio' }, 400);
        }
        
        const type = typeStr as 'image' | 'audio';
        const contentType = file.type;
        const filename = file.name;

        // Validate content type
        if (!validateContentType(contentType, type)) {
            const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
            return c.json(
                {
                    error: `Invalid content type. Allowed types for ${type}: ${allowedTypes.join(', ')}`,
                },
                400
            );
        }

        // Validate file size
        const maxSize = getMaxFileSize(type);
        if (file.size > maxSize) {
            return c.json({ error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` }, 400);
        }

        // Read file buffer and save locally
        const arrayBuffer = await file.arrayBuffer();
        const { key, publicUrl } = await saveFileLocal(userId, type, filename, arrayBuffer);

        return c.json({
            key,
            publicUrl,
            maxSize,
        });
    } catch (err) {
        console.error('File upload error:', err);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
});

/**
 * GET /api/uploads/file/*
 * Fallback endpoint for serving files from local storage (for development)
 * In production, Nginx should serve this directory directly for performance.
 */
uploadsRouter.get('/file/*', async (c) => {
    try {
        // Get the full path after /file/
        const key = c.req.path.replace('/api/uploads/file/', '');

        // Security: validate key format (prevent directory traversal)
        if (!key.startsWith('weddings/') || key.includes('..')) {
            return c.json({ error: 'Invalid file key' }, 400);
        }

        const filePath = getLocalFilePath(key);

        if (!fs.existsSync(filePath)) {
            return c.json({ error: 'File not found' }, 404);
        }
        
        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        
        // Very basic content type mapping
        let contentType = 'application/octet-stream';
        if (key.endsWith('.jpg') || key.endsWith('.jpeg')) contentType = 'image/jpeg';
        else if (key.endsWith('.png')) contentType = 'image/png';
        else if (key.endsWith('.webp')) contentType = 'image/webp';
        else if (key.endsWith('.gif')) contentType = 'image/gif';
        else if (key.endsWith('.mp3')) contentType = 'audio/mpeg';
        else if (key.endsWith('.wav')) contentType = 'audio/wav';
        
        c.header('Content-Type', contentType);
        c.header('Content-Length', fileSize.toString());
        c.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
        c.header('Accept-Ranges', 'bytes');

        // Handle range requests for audio streaming
        const rangeHeader = c.req.header('Range');
        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

                c.status(206);
                c.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
                c.header('Content-Length', (end - start + 1).toString());
                
                // Hono supports Web Streams natively, but passing a Node readable stream directly
                // works well in Node.js environments.
                const stream = fs.createReadStream(filePath, { start, end });
                // We convert Node stream to web stream or let Hono handle it depending on the adapter.
                // In hono/node-server it handles Node streams if returned. But to be safe, return readable stream.
                // For simplicity, since it's a fallback, let's just use Node stream and Hono's stream helper if needed.
                // We can use Response directly or just c.body()
                
                // Actually, passing fs stream to c.body works in Hono node-server.
                return c.body(stream as any);
            }
        }

        // Return full file
        const stream = fs.createReadStream(filePath);
        return c.body(stream as any);
    } catch (err: unknown) {
        console.error('File serve error:', err);
        return c.json({ error: 'Failed to retrieve file' }, 500);
    }
});

/**
 * DELETE /api/uploads/file/*
 * Delete a file from local storage (only the owner can delete)
 */
uploadsRouter.delete('/file/*', authMiddleware, async (c) => {
    try {
        const { userId } = c.get('user');
        const key = c.req.path.replace('/api/uploads/file/', '');

        // Security: validate key format and ownership, prevent directory traversal
        if (!key.startsWith('weddings/') || key.includes('..')) {
            return c.json({ error: 'Invalid file key' }, 400);
        }

        // Check if user owns this file
        const expectedPrefix = `weddings/${userId}/`;
        if (!key.startsWith(expectedPrefix)) {
            return c.json({ error: 'Unauthorized to delete this file' }, 403);
        }

        await deleteLocalFile(key);

        return c.json({ message: 'File deleted successfully' });
    } catch (err) {
        console.error('File deletion error:', err);
        return c.json({ error: 'Failed to delete file' }, 500);
    }
});

export default uploadsRouter;
