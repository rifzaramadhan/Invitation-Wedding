import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import { getDatabaseUrl } from './database-url.js';

const { Pool } = pg;

const pool = new Pool({
    connectionString: getDatabaseUrl(),
});

export const db = drizzle(pool, { schema });
export { pool };
