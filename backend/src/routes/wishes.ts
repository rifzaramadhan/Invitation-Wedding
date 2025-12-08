import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { wishes, weddings, guests } from '../db/schema.js';
import { eq, and, desc } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const wishesRouter = new Hono();

// Validation schema for public wish submission
const wishSchema = z.object({
    name: z.string().min(2),
    message: z.string().min(5),
    isAttending: z.boolean().optional(),
    attendeeCount: z.number().min(0).max(10).optional(),
    guestSlug: z.string().optional(),
});

// Helper to check wedding ownership
async function checkWeddingOwnership(weddingId: string, userId: string) {
    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.id, weddingId), eq(weddings.userId, userId)),
    });
    return wedding;
}

// ============ ADMIN ROUTES ============

// List all wishes for a wedding (admin)
wishesRouter.get('/weddings/:weddingId/wishes', authMiddleware, async (c) => {
    const { userId } = c.get('user');
    const { weddingId } = c.req.param();

    const wedding = await checkWeddingOwnership(weddingId, userId);
    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    const wishesList = await db.query.wishes.findMany({
        where: eq(wishes.weddingId, weddingId),
        orderBy: [desc(wishes.createdAt)],
        with: { guest: true },
    });

    return c.json({ wishes: wishesList });
});

// Approve/unapprove wish
wishesRouter.put('/wishes/:id/approve', authMiddleware, async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();
    const body = await c.req.json();

    const wish = await db.query.wishes.findFirst({
        where: eq(wishes.id, id),
        with: { wedding: true },
    });

    if (!wish || wish.wedding.userId !== userId) {
        return c.json({ error: 'Wish not found' }, 404);
    }

    const [updated] = await db.update(wishes)
        .set({ isApproved: body.isApproved ?? true })
        .where(eq(wishes.id, id))
        .returning();

    return c.json({ wish: updated });
});

// Delete wish
wishesRouter.delete('/wishes/:id', authMiddleware, async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const wish = await db.query.wishes.findFirst({
        where: eq(wishes.id, id),
        with: { wedding: true },
    });

    if (!wish || wish.wedding.userId !== userId) {
        return c.json({ error: 'Wish not found' }, 404);
    }

    await db.delete(wishes).where(eq(wishes.id, id));

    return c.json({ message: 'Wish deleted' });
});

// ============ PUBLIC ROUTES ============

// Get approved wishes for a wedding (public)
wishesRouter.get('/public/:slug/wishes', async (c) => {
    const { slug } = c.req.param();

    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.slug, slug), eq(weddings.isActive, true)),
    });

    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    const wishesList = await db.query.wishes.findMany({
        where: and(eq(wishes.weddingId, wedding.id), eq(wishes.isApproved, true)),
        orderBy: [desc(wishes.createdAt)],
        columns: {
            id: true,
            name: true,
            message: true,
            isAttending: true,
            createdAt: true,
        },
    });

    return c.json({ wishes: wishesList });
});

// Submit a wish (public)
wishesRouter.post('/public/:slug/wishes', async (c) => {
    try {
        const { slug } = c.req.param();
        const body = await c.req.json();
        const data = wishSchema.parse(body);

        const wedding = await db.query.weddings.findFirst({
            where: and(eq(weddings.slug, slug), eq(weddings.isActive, true)),
        });

        if (!wedding) {
            return c.json({ error: 'Wedding not found' }, 404);
        }

        // Find guest if guestSlug provided
        let guestId: string | null = null;
        if (data.guestSlug) {
            const guest = await db.query.guests.findFirst({
                where: and(eq(guests.weddingId, wedding.id), eq(guests.slug, data.guestSlug)),
            });
            if (guest) {
                guestId = guest.id;
            }
        }

        const [wish] = await db.insert(wishes).values({
            weddingId: wedding.id,
            guestId,
            name: data.name,
            message: data.message,
            isAttending: data.isAttending,
            attendeeCount: data.attendeeCount ?? 0,
            isApproved: false, // Requires moderation
        }).returning();

        return c.json({ wish, message: 'Wish submitted successfully' }, 201);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Submit wish error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default wishesRouter;
