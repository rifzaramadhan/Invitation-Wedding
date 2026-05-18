import { Hono } from 'hono';
import { z } from 'zod';
import { db } from '../db/index.js';
import { weddings, events, guests, wishes, weddingGallery } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { authMiddleware } from '../middleware/auth.js';
import { commitMedia } from '../services/media-service.js';

const weddingsRouter = new Hono();

// Apply auth middleware to all routes
weddingsRouter.use('*', authMiddleware);

// Validation schemas
// Custom validator that accepts both full URLs and relative paths (for R2 proxy URLs)
const urlOrPath = z.string().refine(
    (val) => !val || val.startsWith('/api/') || val.startsWith('http://') || val.startsWith('https://'),
    { message: 'Must be a valid URL or relative path' }
);

const weddingSchema = z.object({
    slug: z.string().min(3).regex(/^[a-z0-9-]+$/),
    groomName: z.string().min(2),
    brideName: z.string().min(2),
    groomFullName: z.string().optional(),
    brideFullName: z.string().optional(),
    groomPhoto: urlOrPath.optional().or(z.literal('')),
    bridePhoto: urlOrPath.optional().or(z.literal('')),
    groomParents: z.string().optional(),
    brideParents: z.string().optional(),
    story: z.string().optional(),
    weddingDate: z.string(),
    musicUrl: urlOrPath.optional().or(z.literal('')),
    coverImage: urlOrPath.optional().or(z.literal('')),
    giftSettings: z.object({
        bankAccounts: z.array(z.object({
            bankName: z.string(),
            accountNumber: z.string(),
            accountName: z.string(),
        })),
        eWallets: z.array(z.object({
            name: z.string(),
            number: z.string(),
            accountName: z.string(),
        })).optional(),
    }).optional(),
    isActive: z.boolean().optional(),
    theme: z.enum(['elegant', 'rustic', 'minimalist', 'royal']).optional(),
});

// List user's weddings
weddingsRouter.get('/', async (c) => {
    const { userId } = c.get('user');

    const userWeddings = await db.query.weddings.findMany({
        where: eq(weddings.userId, userId),
        orderBy: (weddings, { desc }) => [desc(weddings.createdAt)],
    });

    return c.json({ weddings: userWeddings });
});

// Get wedding by ID with all related data
weddingsRouter.get('/:id', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.id, id), eq(weddings.userId, userId)),
        with: {
            events: { orderBy: (events, { asc }) => [asc(events.order)] },
            guests: { orderBy: (guests, { desc }) => [desc(guests.createdAt)] },
            gallery: { orderBy: (gallery, { asc }) => [asc(gallery.order)] },
        },
    });

    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    return c.json({ wedding });
});

// Create wedding
weddingsRouter.post('/', async (c) => {
    try {
        const { userId } = c.get('user');
        const body = await c.req.json();
        const data = weddingSchema.parse(body);

        // Check slug uniqueness
        const existing = await db.query.weddings.findFirst({
            where: eq(weddings.slug, data.slug),
        });

        if (existing) {
            return c.json({ error: 'Slug already taken' }, 400);
        }

        const [wedding] = await db.insert(weddings).values({
            ...data,
            userId,
        }).returning();

        return c.json({ wedding }, 201);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Create wedding error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Update wedding
weddingsRouter.put('/:id', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();
        const body = await c.req.json();
        const data = weddingSchema.partial().parse(body);

        // Check ownership
        const existing = await db.query.weddings.findFirst({
            where: and(eq(weddings.id, id), eq(weddings.userId, userId)),
        });

        if (!existing) {
            return c.json({ error: 'Wedding not found' }, 404);
        }

        // Check slug uniqueness if changed
        if (data.slug && data.slug !== existing.slug) {
            const slugExists = await db.query.weddings.findFirst({
                where: eq(weddings.slug, data.slug),
            });
            if (slugExists) {
                return c.json({ error: 'Slug already taken' }, 400);
            }
        }

        const [updated] = await db.update(weddings)
            .set(data)
            .where(eq(weddings.id, id))
            .returning();

        return c.json({ wedding: updated });
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Update wedding error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Delete wedding
weddingsRouter.delete('/:id', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const existing = await db.query.weddings.findFirst({
        where: and(eq(weddings.id, id), eq(weddings.userId, userId)),
    });

    if (!existing) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    await db.delete(weddings).where(eq(weddings.id, id));

    return c.json({ message: 'Wedding deleted' });
});

// Get wedding stats
weddingsRouter.get('/:id/stats', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const wedding = await db.query.weddings.findFirst({
        where: and(eq(weddings.id, id), eq(weddings.userId, userId)),
    });

    if (!wedding) {
        return c.json({ error: 'Wedding not found' }, 404);
    }

    const guestList = await db.query.guests.findMany({
        where: eq(guests.weddingId, id),
    });

    const wishesList = await db.query.wishes.findMany({
        where: eq(wishes.weddingId, id),
    });

    const stats = {
        totalGuests: guestList.length,
        totalWishes: wishesList.length,
        approvedWishes: wishesList.filter(w => w.isApproved).length,
        attending: wishesList.filter(w => w.isAttending === true).length,
        notAttending: wishesList.filter(w => w.isAttending === false).length,
        totalAttendees: wishesList.reduce((sum, w) => sum + (w.attendeeCount || 0), 0),
    };

    return c.json({ stats });
});

// Add photo to gallery
weddingsRouter.post('/:id/gallery', async (c) => {
    try {
        const { userId } = c.get('user');
        const { id } = c.req.param();
        const body = await c.req.json();
        const schema = z.object({
            url: urlOrPath.optional(),
            mediaId: z.string().uuid().optional(),
            alt: z.string().optional(),
            order: z.number().optional(),
        }).refine((data) => data.url || data.mediaId, {
            message: 'Either url or mediaId is required',
        });
        const data = schema.parse(body);

        const wedding = await db.query.weddings.findFirst({
            where: and(eq(weddings.id, id), eq(weddings.userId, userId)),
        });

        if (!wedding) {
            return c.json({ error: 'Wedding not found' }, 404);
        }

        let photoUrl = data.url;
        if (data.mediaId) {
            const committed = await commitMedia(userId, {
                mediaId: data.mediaId,
                entityType: 'gallery',
                entityId: id,
            });
            photoUrl = committed.publicUrl;
        }

        const [photo] = await db.insert(weddingGallery).values({
            weddingId: id,
            url: photoUrl!,
            alt: data.alt,
            order: data.order,
        }).returning();

        return c.json({ photo }, 201);
    } catch (err) {
        if (err instanceof z.ZodError) {
            return c.json({ error: 'Validation error', details: err.errors }, 400);
        }
        console.error('Add gallery photo error:', err);
        return c.json({ error: 'Internal server error' }, 500);
    }
});

// Delete photo from gallery
weddingsRouter.delete('/gallery/:id', async (c) => {
    const { userId } = c.get('user');
    const { id } = c.req.param();

    const photo = await db.query.weddingGallery.findFirst({
        where: eq(weddingGallery.id, id),
        with: { wedding: true },
    });

    if (!photo || !photo.wedding || photo.wedding.userId !== userId) {
        return c.json({ error: 'Photo not found' }, 404);
    }

    await db.delete(weddingGallery).where(eq(weddingGallery.id, id));

    return c.json({ message: 'Photo deleted' });
});

export default weddingsRouter;
