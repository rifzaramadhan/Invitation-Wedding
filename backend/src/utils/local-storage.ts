import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
export const TMP_DIR = path.join(UPLOAD_DIR, 'tmp');

const VALID_KEY_PREFIXES = ['tmp/', 'weddings/'] as const;

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

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
export const MAX_AUDIO_SIZE = 20 * 1024 * 1024;

export const TEMP_FILE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

function ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

ensureDir(UPLOAD_DIR);
ensureDir(TMP_DIR);
ensureDir(path.join(TMP_DIR, 'images'));
ensureDir(path.join(TMP_DIR, 'audio'));

export function sanitizeFilename(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
}

export function validateContentType(
    contentType: string,
    type: 'image' | 'audio'
): boolean {
    if (type === 'image') {
        return ALLOWED_IMAGE_TYPES.includes(contentType);
    }
    return ALLOWED_AUDIO_TYPES.includes(contentType);
}

export function getMaxFileSize(type: 'image' | 'audio'): number {
    return type === 'image' ? MAX_IMAGE_SIZE : MAX_AUDIO_SIZE;
}

export function buildPublicUrl(key: string): string {
    return `/api/uploads/file/${key}`;
}

export function isValidStorageKey(key: string): boolean {
    if (!key || key.includes('..')) {
        return false;
    }
    return VALID_KEY_PREFIXES.some((prefix) => key.startsWith(prefix));
}

export function extractUserIdFromKey(key: string): string | null {
    const tmpMatch = key.match(/^tmp\/(?:images|audio)\/([^/]+)\//);
    if (tmpMatch) {
        return tmpMatch[1];
    }

    const permanentMatch = key.match(/^weddings\/([^/]+)\//);
    if (permanentMatch) {
        return permanentMatch[1];
    }

    return null;
}

export function generateStorageNames(filename: string): {
    uuid: string;
    sanitizedFilename: string;
    generatedFilename: string;
} {
    const uuid = randomUUID();
    const sanitizedFilename = sanitizeFilename(filename);
    const generatedFilename = `${uuid}-${sanitizedFilename}`;

    return { uuid, sanitizedFilename, generatedFilename };
}

export async function saveTemporaryFile(
    userId: string,
    type: 'image' | 'audio',
    filename: string,
    fileBuffer: ArrayBuffer
): Promise<{ key: string; generatedFilename: string; publicUrl: string }> {
    const { generatedFilename } = generateStorageNames(filename);
    const key = `tmp/${type}/${userId}/${generatedFilename}`;
    const absolutePath = path.join(UPLOAD_DIR, key);

    ensureDir(path.dirname(absolutePath));
    fs.writeFileSync(absolutePath, Buffer.from(fileBuffer));

    return {
        key,
        generatedFilename,
        publicUrl: buildPublicUrl(key),
    };
}

export async function saveFileLocal(
    userId: string,
    type: 'image' | 'audio',
    filename: string,
    fileBuffer: ArrayBuffer
): Promise<{ key: string; publicUrl: string; generatedFilename: string }> {
    const { generatedFilename } = generateStorageNames(filename);
    const key = `weddings/${userId}/${type}/${generatedFilename}`;
    const absolutePath = path.join(UPLOAD_DIR, key);

    ensureDir(path.dirname(absolutePath));
    fs.writeFileSync(absolutePath, Buffer.from(fileBuffer));

    return {
        key,
        generatedFilename,
        publicUrl: buildPublicUrl(key),
    };
}

export async function moveFileToPermanent(
    tempKey: string,
    userId: string,
    type: 'image' | 'audio'
): Promise<{ key: string; publicUrl: string }> {
    if (!tempKey.startsWith(`tmp/${type}/${userId}/`)) {
        throw new Error('Invalid temporary file key');
    }

    const filename = path.basename(tempKey);
    const permanentKey = `weddings/${userId}/${type}/${filename}`;
    const tempPath = path.join(UPLOAD_DIR, tempKey);
    const permanentPath = path.join(UPLOAD_DIR, permanentKey);

    if (!fs.existsSync(tempPath)) {
        throw new Error('Temporary file not found');
    }

    ensureDir(path.dirname(permanentPath));
    fs.renameSync(tempPath, permanentPath);

    return {
        key: permanentKey,
        publicUrl: buildPublicUrl(permanentKey),
    };
}

export function getLocalFilePath(key: string): string {
    return path.join(UPLOAD_DIR, key);
}

export async function deleteLocalFile(key: string): Promise<void> {
    const absolutePath = path.join(UPLOAD_DIR, key);
    if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
    }
}

export function getContentTypeFromKey(key: string): string {
    if (key.endsWith('.jpg') || key.endsWith('.jpeg')) return 'image/jpeg';
    if (key.endsWith('.png')) return 'image/png';
    if (key.endsWith('.webp')) return 'image/webp';
    if (key.endsWith('.gif')) return 'image/gif';
    if (key.endsWith('.mp3')) return 'audio/mpeg';
    if (key.endsWith('.wav')) return 'audio/wav';
    if (key.endsWith('.ogg')) return 'audio/ogg';
    if (key.endsWith('.aac')) return 'audio/aac';
    if (key.endsWith('.m4a')) return 'audio/m4a';
    return 'application/octet-stream';
}
