import { Hono } from 'hono';
import { z } from 'zod';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth.js';
import {
    ALLOWED_AUDIO_TYPES,
    ALLOWED_IMAGE_TYPES,
    getMaxFileSize,
    validateContentType,
    getLocalFilePath,
    getContentTypeFromKey,
} from '../utils/local-storage.js';
import {
    commitMedia,
    commitMediaBatch,
    deleteTemporaryMedia,
    getMediaById,
    uploadTemporaryMedia,
} from '../services/media-service.js';

const mediaRouter = new Hono();

mediaRouter.use('*', authMiddleware);

/**
 * POST /api/media/temp
 * Upload a file to temporary storage
 */
mediaRouter.post('/temp', async (c) => {
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
        const contentType = file.type || 'application/octet-stream';

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
            return c.json(
                { error: `File too large. Maximum size is ${maxSize / (1024 * 1024)}MB.` },
                400
            );
        }

        const arrayBuffer = await file.arrayBuffer();
        const result = await uploadTemporaryMedia(
            userId,
            type,
            file.name,
            contentType,
            file.size,
            arrayBuffer
        );

        return c.json({
            id: result.id,
            originalFilename: result.originalFilename,
            generatedFilename: result.generatedFilename,
            mimeType: result.mimeType,
            fileSize: result.fileSize,
            previewUrl: result.previewUrl,
            status: result.status,
            type: result.type,
        }, 201);
    } catch (err) {
        console.error('Temporary media upload error:', err);
        return c.json({ error: 'Failed to upload file' }, 500);
    }
});

/**
 * POST /api/media/commit-batch
 * Commit multiple temporary files in one request
 */
mediaRouter.post('/commit-batch', async (c) => {
    try {
        const { userId } = c.get('user');
        const body = await c.req.json();
        const schema = z.object({
            items: z.array(z.object({
                mediaId: z.string().uuid(),
                entityType: z.enum(['wedding', 'gallery']).optional(),
                entityId: z.string().uuid().optional(),
                entityField: z.string().optional(),
            })).min(1),
        });
        const data = schema.parse(body);

        const media = await commitMediaBatch(userId, data.items);
        return c.json({ media });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Media batch commit error:', err);
        return c.json({ error: 'Failed to commit media batch' }, 500);
    }
});

/**
 * POST /api/media/:id/commit
 * Move a temporary file to permanent storage and associate with an entity
 */
mediaRouter.post('/:id/commit', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();
        const body = await c.req.json();
        const schema = z.object({
            entityType: z.enum(['wedding', 'gallery']).optional(),
            entityId: z.string().uuid().optional(),
            entityField: z.string().optional(),
        });
        const data = schema.parse(body);

        const result = await commitMedia(userId, {
            mediaId: id,
            entityType: data.entityType,
            entityId: data.entityId,
            entityField: data.entityField,
        });

        return c.json({ media: result });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        if (err instanceof Error && err.message === 'Media not found') {
            return c.json({ error: 'Media not found' }, 404);
        }
        console.error('Media commit error:', err);
        return c.json({ error: 'Failed to commit media' }, 500);
    }
});

/**
 * GET /api/media/:id/preview
 * Serve a media file for authenticated preview (temp or permanent)
 */
mediaRouter.get('/:id/preview', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();

        const record = await getMediaById(userId, id);
        if (!record) {
            return c.json({ error: 'Media not found' }, 404);
        }

        const filePath = getLocalFilePath(record.storageKey);
        if (!fs.existsSync(filePath)) {
            return c.json({ error: 'File not found' }, 404);
        }

        const stat = fs.statSync(filePath);
        const contentType = record.mimeType || getContentTypeFromKey(record.storageKey);

        c.header('Content-Type', contentType);
        c.header('Content-Length', stat.size.toString());
        c.header('Cache-Control', record.status === 'temporary'
            ? 'private, max-age=3600'
            : 'public, max-age=31536000');

        const stream = fs.createReadStream(filePath);
        return c.body(stream as any);
    } catch (err) {
        console.error('Media preview error:', err);
        return c.json({ error: 'Failed to load preview' }, 500);
    }
});

/**
 * GET /api/media/:id
 * Get media metadata
 */
mediaRouter.get('/:id', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const record = await getMediaById(userId, id);
    if (!record) {
        return c.json({ error: 'Media not found' }, 404);
    }

    return c.json({
        media: {
            id: record.id,
            originalFilename: record.originalFilename,
            generatedFilename: record.generatedFilename,
            mimeType: record.mimeType,
            fileSize: record.fileSize,
            type: record.type,
            status: record.status,
            previewUrl: record.publicUrl,
            entityType: record.entityType,
            entityId: record.entityId,
            entityField: record.entityField,
            createdAt: record.createdAt,
            committedAt: record.committedAt,
        },
    });
});

/**
 * DELETE /api/media/:id
 * Cancel/delete a temporary upload
 */
mediaRouter.delete('/:id', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();

        await deleteTemporaryMedia(userId, id);
        return c.json({ message: 'Media deleted successfully' });
    } catch (err) {
        if (err instanceof Error && err.message === 'Media not found') {
            return c.json({ error: 'Media not found' }, 404);
        }
        console.error('Media delete error:', err);
        return c.json({ error: 'Failed to delete media' }, 500);
    }
});

export default mediaRouter;
