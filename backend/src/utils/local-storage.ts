import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

// Get upload directory from env or default to /app/uploads
export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Ensure base upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Allowed content types
export const ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
];

export const ALLOWED_AUDIO_TYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
];

// Max file sizes in bytes
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_AUDIO_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Validate content type for upload
 */
export function validateContentType(
    contentType: string,
    type: 'image' | 'audio'
): boolean {
    if (type === 'image') {
        return ALLOWED_IMAGE_TYPES.includes(contentType);
    }
    return ALLOWED_AUDIO_TYPES.includes(contentType);
}

/**
 * Get max file size based on type
 */
export function getMaxFileSize(type: 'image' | 'audio'): number {
    return type === 'image' ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
}

/**
 * Save an uploaded file to local storage
 */
export async function saveFileLocal(
    userId: string,
    type: 'image' | 'audio',
    filename: string,
    fileBuffer: ArrayBuffer
): Promise<{ key: string; publicUrl: string }> {
    const uuid = randomUUID();
    const sanitizedFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `weddings/${userId}/${type}/${uuid}-${sanitizedFilename}`;
    
    const absolutePath = path.join(UPLOAD_DIR, key);
    const directory = path.dirname(absolutePath);
    
    // Ensure directory exists
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
    
    // Write file
    fs.writeFileSync(absolutePath, Buffer.from(fileBuffer));
    
    return {
        key,
        publicUrl: `/api/uploads/file/${key}`,
    };
}

/**
 * Get a local file absolute path
 */
export function getLocalFilePath(key: string): string {
    return path.join(UPLOAD_DIR, key);
}

/**
 * Delete a local file
 */
export async function deleteLocalFile(key: string): Promise<void> {
    const absolutePath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
}
