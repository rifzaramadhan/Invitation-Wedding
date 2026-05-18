import { cleanupExpiredTemporaryMedia } from '../services/media-service.js';

const CLEANUP_INTERVAL_MS = 60 * 60 * 1000; // every hour
const INITIAL_DELAY_MS = 30 * 1000; // 30 seconds after startup

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

export async function runMediaCleanup(): Promise<void> {
    try {
        const result = await cleanupExpiredTemporaryMedia();
        if (result.deletedRecords > 0) {
            console.log(
                `[media-cleanup] Removed ${result.deletedRecords} expired temporary record(s), ${result.deletedFiles} file(s)`
            );
        }
    } catch (err) {
        console.error('[media-cleanup] Failed to run cleanup:', err);
    }
}

export function startMediaCleanupScheduler(): void {
    if (cleanupTimer) {
        return;
    }

    setTimeout(() => {
        void runMediaCleanup();
        cleanupTimer = setInterval(() => {
            void runMediaCleanup();
        }, CLEANUP_INTERVAL_MS);
    }, INITIAL_DELAY_MS);

    console.log('[media-cleanup] Scheduler started (runs hourly, deletes temp files older than 24h)');
}

export function stopMediaCleanupScheduler(): void {
    if (cleanupTimer) {
        clearInterval(cleanupTimer);
        cleanupTimer = null;
    }
}
