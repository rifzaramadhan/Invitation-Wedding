import { Context, Next } from 'hono';
import { verifyToken, JWTPayload } from '../utils/jwt.js';

declare module 'hono' {
    interface ContextVariableMap {
        user: JWTPayload;
    }
}

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token);

    if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
    }

    c.set('user', payload);
    await next();
}
