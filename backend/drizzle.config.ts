/// <reference types="node" />
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
    schema: './src/db/schema.ts',
    out: './src/db/migrations',
    dialect: 'postgresql',
    dbCredentials: {
        url: process.env.DATABASE_URL || 'postgresql://wedding:wedding_secret_2024@localhost:5432/wedding_invitation',
    },
});
