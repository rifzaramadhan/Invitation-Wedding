import { Hono } from 'hono';
import { db } from '../db/index.js';
import { weddings, guests } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';

const publicRouter = new Hono();

// Get public wedding data by slug
publicRouter.get('/:slug', async (c) => {
    const { slug } = c.req.param();

    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.slug, slug), eq(weddings.isActive, true)),
        columns: {
            id: true,
            slug: true,
            groomName: true,
            brideName: true,
            groomFullName: true,
            brideFullName: true,
            groomPhoto: true,
            bridePhoto: true,
            groomParents: true,
            brideParents: true,
            story: true,
            weddingDate: true,
            musicUrl: true,
            coverImage: true,
            giftSettings: true,
            theme: true,
        },
        with: {
            events: {
                orderBy: (events, { asc }) => [asc(events.order)],
                columns: {
                    id: true,
                    title: true,
                    location: true,
                    locationUrl: true,
                    address: true,
                    startTime: true,
                    endTime: true,
                    description: true,
                },
            },
        },
    });

    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    return c.json({ wedding });
});

// Get public wedding data with guest context
publicRouter.get('/:slug/guest/:guestSlug', async (c) => {
    const { slug, guestSlug } = c.req.param();

    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.slug, slug), eq(weddings.isActive, true)),
        columns: {
            id: true,
            slug: true,
            groomName: true,
            brideName: true,
            groomFullName: true,
            brideFullName: true,
            groomPhoto: true,
            bridePhoto: true,
            groomParents: true,
            brideParents: true,
            story: true,
            weddingDate: true,
            musicUrl: true,
            coverImage: true,
            giftSettings: true,
            theme: true,
        },
        with: {
            events: {
                orderBy: (events, { asc }) => [asc(events.order)],
                columns: {
                    id: true,
                    title: true,
                    location: true,
                    locationUrl: true,
                    address: true,
                    startTime: true,
                    endTime: true,
                    description: true,
                },
            },
        },
    });

    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    // Find guest
    const guest = await db.query.guests.findFirst({
        where: and(eq(guests.weddingId, wedding.id), eq(guests.slug, guestSlug)),
        columns: {
            id: true,
            name: true,
            slug: true,
            maxAttendees: true,
        },
    });

    return c.json({ wedding, guest: guest || null });
});

export default publicRouter;
