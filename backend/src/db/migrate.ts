import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    console.log('Running migrations...');

    // In production, migrations are at ./migrations relative to this file
    // In development (tsx), they're at ./migrations relative to this file
    const migrationsFolder = path.join(__dirname, 'migrations');

    console.log('Migrations folder:', migrationsFolder);
    await migrate(db, { migrationsFolder });
    console.log('Migrations completed!');
    await pool.end();
}

main().catch((err) => {
    console.error('Migration failed:', err);
    process.exit(1);
});

