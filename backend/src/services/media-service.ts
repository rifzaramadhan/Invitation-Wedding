import { and, eq, lt } from 'drizzle-orm';
import { db } from '../db/index.js';
import { mediaFiles } from '../db/schema.js';
import {
    TEMP_FILE_MAX_AGE_MS,
    deleteLocalFile,
    moveFileToPermanent,
    saveTemporaryFile,
} from '../utils/local-storage.js';

export type MediaType = 'image' | 'audio';
export type MediaStatus = 'temporary' | 'permanent';
export type MediaEntityType = 'wedding' | 'gallery';

export interface MediaUploadResult {
    id: string;
    originalFilename: string;
    generatedFilename: string;
    mimeType: string;
    fileSize: number;
    previewUrl: string;
    status: MediaStatus;
    type: MediaType;
}

export interface CommitMediaInput {
    mediaId: string;
    entityType?: MediaEntityType;
    entityId?: string;
    entityField?: string;
}

export interface CommittedMediaResult {
    id: string;
    publicUrl: string;
    storageKey: string;
    entityType?: string | null;
    entityId?: string | null;
    entityField?: string | null;
}

export async function uploadTemporaryMedia(
    userId: string,
    type: MediaType,
    filename: string,
    mimeType: string,
    fileSize: number,
    fileBuffer: ArrayBuffer
): Promise<MediaUploadResult> {
    const { key, generatedFilename, publicUrl } = await saveTemporaryFile(
        userId,
        type,
        filename,
        fileBuffer
    );

    const [record] = await db.insert(mediaFiles).values({
        userId,
        originalFilename: filename,
        generatedFilename,
        storageKey: key,
        mimeType,
        fileSize,
        type,
        status: 'temporary',
        publicUrl,
    }).returning();

    if (!record) {
        await deleteLocalFile(key);
        throw new Error('Failed to create media record');
    }

    return {
        id: record.id,
        originalFilename: record.originalFilename,
        generatedFilename: record.generatedFilename,
        mimeType: record.mimeType,
        fileSize: record.fileSize,
        previewUrl: publicUrl,
        status: 'temporary',
        type: record.type as MediaType,
    };
}

export async function commitMedia(
    userId: string,
    input: CommitMediaInput
): Promise<CommittedMediaResult> {
    const record = await db.query.mediaFiles.findFirst({
        where: and(
            eq(mediaFiles.id, input.mediaId),
            eq(mediaFiles.userId, userId)
        ),
    });

    if (!record) {
        throw new Error('Media not found');
    }

    if (record.status === 'permanent') {
        return {
            id: record.id,
            publicUrl: record.publicUrl!,
            storageKey: record.storageKey,
            entityType: record.entityType,
            entityId: record.entityId,
            entityField: record.entityField,
        };
    }

    const { key, publicUrl } = await moveFileToPermanent(
        record.storageKey,
        userId,
        record.type as MediaType
    );

    const [updated] = await db.update(mediaFiles)
        .set({
            status: 'permanent',
            storageKey: key,
            publicUrl,
            entityType: input.entityType ?? record.entityType,
            entityId: input.entityId ?? record.entityId,
            entityField: input.entityField ?? record.entityField,
            committedAt: new Date(),
        })
        .where(eq(mediaFiles.id, record.id))
        .returning();

    if (!updated) {
        throw new Error('Failed to update media record');
    }

    return {
        id: updated.id,
        publicUrl: updated.publicUrl!,
        storageKey: updated.storageKey,
        entityType: updated.entityType,
        entityId: updated.entityId,
        entityField: updated.entityField,
    };
}

export async function commitMediaBatch(
    userId: string,
    items: CommitMediaInput[]
): Promise<CommittedMediaResult[]> {
    const results: CommittedMediaResult[] = [];

    for (const item of items) {
        results.push(await commitMedia(userId, item));
    }

    return results;
}

export async function deleteTemporaryMedia(
    userId: string,
    mediaId: string
): Promise<void> {
    const record = await db.query.mediaFiles.findFirst({
        where: and(
            eq(mediaFiles.id, mediaId),
            eq(mediaFiles.userId, userId)
        ),
    });

    if (!record) {
        throw new Error('Media not found');
    }

    if (record.status === 'temporary') {
        await deleteLocalFile(record.storageKey);
    }

    await db.delete(mediaFiles).where(eq(mediaFiles.id, mediaId));
}

export async function getMediaById(userId: string, mediaId: string) {
    return db.query.mediaFiles.findFirst({
        where: and(
            eq(mediaFiles.id, mediaId),
            eq(mediaFiles.userId, userId)
        ),
    });
}

export async function cleanupExpiredTemporaryMedia(): Promise<{
    deletedRecords: number;
    deletedFiles: number;
}> {
    const cutoff = new Date(Date.now() - TEMP_FILE_MAX_AGE_MS);

    const expiredRecords = await db.query.mediaFiles.findMany({
        where: and(
            eq(mediaFiles.status, 'temporary'),
            lt(mediaFiles.createdAt, cutoff)
        ),
    });

    let deletedFiles = 0;

    for (const record of expiredRecords) {
        try {
            await deleteLocalFile(record.storageKey);
            deletedFiles += 1;
        } catch (err) {
            console.error(`Failed to delete temp file ${record.storageKey}:`, err);
        }
    }

    if (expiredRecords.length > 0) {
        await db.delete(mediaFiles).where(
            and(
                eq(mediaFiles.status, 'temporary'),
                lt(mediaFiles.createdAt, cutoff)
            )
        );
    }

    return {
        deletedRecords: expiredRecords.length,
        deletedFiles,
    };
}
