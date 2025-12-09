import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// R2 Configuration - read lazily to ensure dotenv has loaded
function getConfig() {
    return {
        accountId: process.env.R2_ACCOUNT_ID || '',
        accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
        bucketName: process.env.R2_BUCKET_NAME || 'wedding-uploads',
        publicUrl: process.env.R2_PUBLIC_URL || '',
    };
}

// Validate configuration
export function isR2Configured(): boolean {
    const config = getConfig();
    const isConfigured = !!(config.accountId && config.accessKeyId && config.secretAccessKey && config.bucketName);

    if (!isConfigured) {
        console.log('R2 Configuration check failed:');
        console.log('  R2_ACCOUNT_ID:', config.accountId ? '✓ set' : '✗ missing');
        console.log('  R2_ACCESS_KEY_ID:', config.accessKeyId ? '✓ set' : '✗ missing');
        console.log('  R2_SECRET_ACCESS_KEY:', config.secretAccessKey ? '✓ set' : '✗ missing');
        console.log('  R2_BUCKET_NAME:', config.bucketName ? '✓ set' : '✗ missing');
    }

    return isConfigured;
}

// Create S3 client for R2 - lazily initialized
let _r2Client: S3Client | null = null;

function getR2Client(): S3Client {
    if (!_r2Client) {
        const config = getConfig();
        _r2Client = new S3Client({
            region: 'auto',
            endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
            credentials: {
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.secretAccessKey,
            },
        });
    }
    return _r2Client;
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
 * Generate a presigned URL for uploading a file to R2
 */
export async function getPresignedUploadUrl(
    key: string,
    contentType: string
): Promise<string> {
    const config = getConfig();
    const command = new PutObjectCommand({
        Bucket: config.bucketName,
        Key: key,
        ContentType: contentType,
        // Note: Don't set ContentLength - it causes signature mismatch if actual file size differs
    });

    // URL expires in 15 minutes
    const url = await getSignedUrl(getR2Client(), command, { expiresIn: 900 });
    return url;
}

/**
 * Generate a presigned URL for downloading a file from R2
 */
export async function getPresignedDownloadUrl(key: string): Promise<string> {
    const config = getConfig();
    const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    // URL expires in 1 hour
    const url = await getSignedUrl(getR2Client(), command, { expiresIn: 3600 });
    return url;
}

/**
 * Get the public URL for a file (for use in proxy endpoint)
 */
export function getFilePublicUrl(key: string): string {
    const config = getConfig();
    // If a public URL is configured (custom domain), use it
    if (config.publicUrl) {
        return `${config.publicUrl}/${key}`;
    }
    // Otherwise, use our proxy endpoint with the key as path segments
    return `/api/uploads/file/${key}`;
}

/**
 * Get an object from R2 (for streaming via proxy)
 */
export async function getObject(key: string) {
    const config = getConfig();
    const command = new GetObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    return getR2Client().send(command);
}

/**
 * Delete an object from R2
 */
export async function deleteObject(key: string): Promise<void> {
    const config = getConfig();
    const command = new DeleteObjectCommand({
        Bucket: config.bucketName,
        Key: key,
    });

    await getR2Client().send(command);
}

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
