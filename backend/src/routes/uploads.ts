import { Hono } from 'hono';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import { verifyToken } from '../utils/jwt.js';
import {
    validateContentType,
    getMaxFileSize,
    ALLOWED_IMAGE_TYPES,
    ALLOWED_AUDIO_TYPES,
    saveFileLocal,
    getLocalFilePath,
    deleteLocalFile,
    isValidStorageKey,
    extractUserIdFromKey,
    getContentTypeFromKey,
} from '../utils/local-storage.js';

const uploadsRouter = new Hono();

/**
 * POST /api/uploads/
 * Direct upload to permanent storage (legacy endpoint)
 */
uploadsRouter.post('/', authMiddleware, async (c) => {
    try {
        const { userId } = c.get('user');

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

        if (!validateContentType(contentType, type)) {
            const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_AUDIO_TYPES;
            return c.json(
                {
                    error: `Invalid content type. Allowed types for ${type}: ${allowedTypes.join(', ')}`,
                },
                400
            );
        }

        const maxSize = getMaxFileSize(type);
        if (file.size > maxSize) {
            return c.json({ error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` }, 400);
        }

        const arrayBuffer = await file.arrayBuffer();
        const { key, publicUrl } = await saveFileLocal(userId, type, file.name, arrayBuffer);

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

function extractFileKeyFromPath(pathname: string): string {
    const prefixes = ['/api/uploads/file/', '/uploads/file/', '/file/'];
    for (const prefix of prefixes) {
        const index = pathname.indexOf(prefix);
        if (index !== -1) {
            return decodeURIComponent(pathname.slice(index + prefix.length));
        }
    }
    return decodeURIComponent(pathname.replace(/^\/api\/uploads\/file\//, ''));
}

/**
 * GET /api/uploads/file/*
 * Serve files from local storage (public permanent, auth-protected temporary)
 */
uploadsRouter.get('/file/*', async (c) => {
    try {
        const pathname = new URL(c.req.url).pathname;
        const key = extractFileKeyFromPath(pathname);

        if (!isValidStorageKey(key)) {
            return c.json({ error: 'Invalid file key' }, 400);
        }

        if (key.startsWith('tmp/')) {
            const authHeader = c.req.header('Authorization');
            if (!authHeader?.startsWith('Bearer ')) {
                return c.json({ error: 'Unauthorized' }, 401);
            }

            const token = authHeader.substring(7);
            const payload = verifyToken(token) as ({ userId?: string; id?: string } | null);
            if (!payload) {
                return c.json({ error: 'Invalid token' }, 401);
            }

            const requestUserId = payload.userId ?? payload.id;
            const fileOwnerId = extractUserIdFromKey(key);
            if (!requestUserId || !fileOwnerId || fileOwnerId !== requestUserId) {
                return c.json({ error: 'Forbidden' }, 403);
            }
        }

        const filePath = getLocalFilePath(key);

        if (!fs.existsSync(filePath)) {
            return c.json({ error: 'File not found' }, 404);
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const contentType = getContentTypeFromKey(key);

        c.header('Content-Type', contentType);
        c.header('Content-Length', fileSize.toString());
        c.header('Cache-Control', key.startsWith('tmp/')
            ? 'private, max-age=3600'
            : 'public, max-age=31536000');
        c.header('Accept-Ranges', 'bytes');

        const rangeHeader = c.req.header('Range');
        if (rangeHeader) {
            const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
            if (match) {
                const start = parseInt(match[1], 10);
                const end = match[2] ? parseInt(match[2], 10) : fileSize - 1;

                c.status(206);
                c.header('Content-Range', `bytes ${start}-${end}/${fileSize}`);
                c.header('Content-Length', (end - start + 1).toString());

                const stream = fs.createReadStream(filePath, { start, end });
                return c.body(stream as any);
            }
        }

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
        const pathname = new URL(c.req.url).pathname;
        const key = extractFileKeyFromPath(pathname);

        if (!isValidStorageKey(key)) {
            return c.json({ error: 'Invalid file key' }, 400);
        }

        const fileOwnerId = extractUserIdFromKey(key);
        if (!fileOwnerId || fileOwnerId !== userId) {
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
