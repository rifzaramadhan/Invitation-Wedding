import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { events, weddings } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';

const eventsRouter = new Hono();

eventsRouter.use('*', authMiddleware);

// Validation schema
const eventSchema = z.object({
    title: z.string().min(2),
    location: z.string().min(2),
    locationUrl: z.string().url().optional(),
    address: z.string().optional(),
    startTime: z.string(),
    endTime: z.string().optional(),
    description: z.string().optional(),
    order: z.number().optional(),
});

// Helper to check wedding ownership
async function checkWeddingOwnership(weddingId: string, userId: string) {
    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.id, weddingId), eq(weddings.userId, userId)),
    });
    return wedding;
}

// List events for a wedding
eventsRouter.get('/weddings/:weddingId/events', async (c) => {
    const { userId } = c.get('user');
    const { weddingId } = c.req.param();

    const wedding = await checkWeddingOwnership(weddingId, userId);
    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    const eventList = await db.query.events.findMany({
        where: eq(events.weddingId, weddingId),
        orderBy: (events, { asc }) => [asc(events.order)],
    });

    return c.json({ events: eventList });
});

// Create event
eventsRouter.post('/weddings/:weddingId/events', async (c) => {
    try {
        const { userId } = c.get('user');
        const { weddingId } = c.req.param();
        const body = await c.req.json();
        const data = eventSchema.parse(body);

        const wedding = await checkWeddingOwnership(weddingId, userId);
        if (!wedding) {
            return c.json({ error: 'Wedding not found' }, 404);
        }

        const [event] = await db.insert(events).values({
            ...data,
            weddingId,
            startTime: new Date(data.startTime),
            endTime: data.endTime ? new Date(data.endTime) : null,
        }).returning();

        return c.json({ event }, 201);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Create event error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Update event
eventsRouter.put('/events/:id', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();
        const body = await c.req.json();
        const data = eventSchema.partial().parse(body);

        // Get event and check ownership
        const event = await db.query.events.findFirst({
            where: eq(events.id, id),
            with: { wedding: true },
        });

        if (!event || event.wedding.userId !== userId) {
            return c.json({ error: 'Event not found' }, 404);
        }

        const updateData: Record<string, unknown> = { ...data };
        if (data.startTime) updateData.startTime = new Date(data.startTime);
        if (data.endTime) updateData.endTime = new Date(data.endTime);

        const [updated] = await db.update(events)
            .set(updateData)
            .where(eq(events.id, id))
            .returning();

        return c.json({ event: updated });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Update event error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Delete event
eventsRouter.delete('/events/:id', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const event = await db.query.events.findFirst({
        where: eq(events.id, id),
        with: { wedding: true },
    });

    if (!event || event.wedding.userId !== userId) {
        return c.json({ error: 'Event not found' }, 404);
    }

    await db.delete(events).where(eq(events.id, id));

    return c.json({ message: 'Event deleted' });
});

export default eventsRouter;
