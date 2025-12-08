import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { guests, weddings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const guestsRouter = new Hono();

guestsRouter.use('*', authMiddleware);

// Validation schema
const guestSchema = z.object({
    name: z.string().min(2),
    slug: z.string().min(2).regex(/^[a-z0-9-]+$/),
    maxAttendees: z.number().min(1).max(10).optional(),
});

// Helper to check wedding ownership
async function checkWeddingOwnership(weddingId: string, userId: string) {
    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.id, weddingId), eq(weddings.userId, userId)),
    });
    return wedding;
}

// List guests for a wedding
guestsRouter.get('/weddings/:weddingId/guests', async (c) => {
    const { userId } = c.get('user');
    const { weddingId } = c.req.param();

    const wedding = await checkWeddingOwnership(weddingId, userId);
    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    const guestList = await db.query.guests.findMany({
        where: eq(guests.weddingId, weddingId),
        orderBy: (guests, { desc }) => [desc(guests.createdAt)],
    });

    return c.json({ guests: guestList });
});

// Create guest
guestsRouter.post('/weddings/:weddingId/guests', async (c) => {
    try {
        const { userId } = c.get('user');
        const { weddingId } = c.req.param();
        const body = await c.req.json();
        const data = guestSchema.parse(body);

        const wedding = await checkWeddingOwnership(weddingId, userId);
        if (!wedding) {
            return c.json({ error: 'Wedding not found' }, 404);
        }

        // Check slug uniqueness within wedding
        const existing = await db.query.guests.findFirst({
            where: and(eq(guests.weddingId, weddingId), eq(guests.slug, data.slug)),
        });

        if (existing) {
            return c.json({ error: 'Guest slug already exists' }, 400);
        }

        const [guest] = await db.insert(guests).values({
            ...data,
            weddingId,
        }).returning();

        return c.json({ guest }, 201);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Create guest error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Bulk create guests
guestsRouter.post('/weddings/:weddingId/guests/bulk', async (c) => {
    try {
        const { userId } = c.get('user');
        const { weddingId } = c.req.param();
        const body = await c.req.json();

        const bulkSchema = z.array(guestSchema);
        const guestsData = bulkSchema.parse(body.guests);

        const wedding = await checkWeddingOwnership(weddingId, userId);
        if (!wedding) {
            return c.json({ error: 'Wedding not found' }, 404);
        }

        const created = await db.insert(guests).values(
            guestsData.map(g => ({ ...g, weddingId }))
        ).returning();

        return c.json({ guests: created }, 201);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Bulk create guests error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Update guest
guestsRouter.put('/guests/:id', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();
        const body = await c.req.json();
        const data = guestSchema.partial().parse(body);

        // Get guest and check ownership
        const guest = await db.query.guests.findFirst({
            where: eq(guests.id, id),
            with: { wedding: true },
        });

        if (!guest || guest.wedding.userId !== userId) {
            return c.json({ error: 'Guest not found' }, 404);
        }

        const [updated] = await db.update(guests)
            .set(data)
            .where(eq(guests.id, id))
            .returning();

        return c.json({ guest: updated });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Update guest error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Delete guest
guestsRouter.delete('/guests/:id', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const guest = await db.query.guests.findFirst({
        where: eq(guests.id, id),
        with: { wedding: true },
    });

    if (!guest || guest.wedding.userId !== userId) {
        return c.json({ error: 'Guest not found' }, 404);
    }

    await db.delete(guests).where(eq(guests.id, id));

    return c.json({ message: 'Guest deleted' });
});

export default guestsRouter;
