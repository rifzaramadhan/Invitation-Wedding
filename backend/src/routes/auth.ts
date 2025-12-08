import { Hono } from 'hono';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';

const auth = new Hono();

// Validation schemas
const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    name: z.string().min(2),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Register
auth.post('/register', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password, name } = registerSchema.parse(body);

        // Check if email exists
        const existing = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (existing) {
            return c.json({ error: 'Email already registered' }, 400);
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const [user] = await db.insert(users).values({
            email,
            passwordHash,
            name,
        }).returning({ id: users.id, email: users.email, name: users.name });

        const token = generateToken({ userId: user.id, email: user.email });

        return c.json({ user, token });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Register error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Login
auth.post('/login', async (c) => {
    try {
        const body = await c.req.json();
        const { email, password } = loginSchema.parse(body);

        const user = await db.query.users.findFirst({
            where: eq(users.email, email),
        });

        if (!user) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        const validPassword = await bcrypt.compare(password, user.passwordHash);

        if (!validPassword) {
            return c.json({ error: 'Invalid credentials' }, 401);
        }

        const token = generateToken({ userId: user.id, email: user.email });

        return c.json({
            user: { id: user.id, email: user.email, name: user.name },
            token,
        });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Login error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Get current user
auth.get('/me', authMiddleware, async (c) => {
    const { userId } = c.get('user');

    const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, email: true, name: true, createdAt: true },
    });

    if (!user) {
        return c.json({ error: 'User not found' }, 404);
    }

    return c.json({ user });
});

export default auth;
