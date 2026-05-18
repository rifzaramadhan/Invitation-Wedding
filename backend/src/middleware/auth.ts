import { Context, Next } from 'hono';
import { verifyToken, JWTPayload } from '../utils/jwt.js';

declare module 'hono' {
    interface ContextVariableMap {
        user: JWTPayload;
    }
}

function resolveUserId(payload: JWTPayload & { id?: string }): string | null {
    return payload.userId ?? payload.id ?? null;
}

export async function authMiddleware(c: Context, next: Next) {
    const authHeader = c.req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.substring(7);
    const payload = verifyToken(token) as (JWTPayload & { id?: string }) | null;

    if (!payload) {
        return c.json({ error: 'Invalid token' }, 401);
    }

    const userId = resolveUserId(payload);
    if (!userId) {
        return c.json({ error: 'Invalid token payload' }, 401);
    }

    c.set('user', { userId, email: payload.email });
    await next();
}
