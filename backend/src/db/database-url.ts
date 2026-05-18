import 'dotenv/config';

function encodeCredential(value: string): string {
    return encodeURIComponent(value);
}

export function getDatabaseUrl(): string {
    if (process.env.DATABASE_URL) {
        return process.env.DATABASE_URL;
    }

    const host = process.env.POSTGRES_HOST;
    const user = process.env.POSTGRES_USER;
    const password = process.env.POSTGRES_PASSWORD;
    const database = process.env.POSTGRES_DB;
    const port = process.env.POSTGRES_PORT || '5432';

    if (!host || !user || !password || !database) {
        throw new Error(
            'Database configuration missing. Set DATABASE_URL or POSTGRES_HOST, POSTGRES_USER, POSTGRES_PASSWORD, and POSTGRES_DB.',
        );
    }

    return `postgresql://${encodeCredential(user)}:${encodeCredential(password)}@${host}:${port}/${database}`;
}
