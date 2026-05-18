import { pgTable, uuid, text, timestamp, boolean, integer, jsonb, date } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table - admin accounts
export const users = pgTable('users', {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Weddings table - multi-tenant wedding data
export const weddings = pgTable('weddings', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    slug: text('slug').notNull().unique(),
    groomName: text('groom_name').notNull(),
    brideName: text('bride_name').notNull(),
    groomFullName: text('groom_full_name'),
    brideFullName: text('bride_full_name'),
    groomPhoto: text('groom_photo'),
    bridePhoto: text('bride_photo'),
    groomParents: text('groom_parents'),
    brideParents: text('bride_parents'),
    story: text('story'),
    weddingDate: date('wedding_date').notNull(),
    musicUrl: text('music_url'),
    coverImage: text('cover_image'),
    giftSettings: jsonb('gift_settings').$type<{
        bankAccounts: Array<{
            bankName: string;
            accountNumber: string;
            accountName: string;
        }>;
        eWallets?: Array<{
            name: string;
            number: string;
            accountName: string;
        }>;
    }>(),
    isActive: boolean('is_active').default(true).notNull(),
    theme: text('theme').default('elegant').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Events table - wedding agenda (akad, resepsi, etc.)
export const events = pgTable('events', {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    location: text('location').notNull(),
    locationUrl: text('location_url'),
    address: text('address'),
    startTime: timestamp('start_time', { withTimezone: true }).notNull(),
    endTime: timestamp('end_time', { withTimezone: true }),
    description: text('description'),
    order: integer('order').default(0).notNull(),
});

// Guests table - invited guests with personalized links
export const guests = pgTable('guests', {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    maxAttendees: integer('max_attendees').default(2),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Wishes table - guest wishes and RSVP
export const wishes = pgTable('wishes', {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
    guestId: uuid('guest_id').references(() => guests.id, { onDelete: 'set null' }),
    name: text('name').notNull(),
    message: text('message').notNull(),
    isAttending: boolean('is_attending'),
    attendeeCount: integer('attendee_count').default(0),
    isApproved: boolean('is_approved').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
    weddings: many(weddings),
    mediaFiles: many(mediaFiles),
}));



export const eventsRelations = relations(events, ({ one }) => ({
    wedding: one(weddings, {
        fields: [events.weddingId],
        references: [weddings.id],
    }),
}));

export const guestsRelations = relations(guests, ({ one, many }) => ({
    wedding: one(weddings, {
        fields: [guests.weddingId],
        references: [weddings.id],
    }),
    wishes: many(wishes),
}));

export const wishesRelations = relations(wishes, ({ one }) => ({
    wedding: one(weddings, {
        fields: [wishes.weddingId],
        references: [weddings.id],
    }),
    guest: one(guests, {
        fields: [wishes.guestId],
        references: [guests.id],
    }),
}));

// Media files - temporary and permanent uploads (images & audio)
export const mediaFiles = pgTable('media_files', {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    originalFilename: text('original_filename').notNull(),
    generatedFilename: text('generated_filename').notNull(),
    storageKey: text('storage_key').notNull(),
    mimeType: text('mime_type').notNull(),
    fileSize: integer('file_size').notNull(),
    type: text('type').notNull(), // 'image' | 'audio'
    status: text('status').notNull().default('temporary'), // 'temporary' | 'permanent'
    entityType: text('entity_type'), // 'wedding' | 'gallery'
    entityId: uuid('entity_id'),
    entityField: text('entity_field'), // e.g. groomPhoto, coverImage, musicUrl
    publicUrl: text('public_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    committedAt: timestamp('committed_at', { withTimezone: true }),
});

export const mediaFilesRelations = relations(mediaFiles, ({ one }) => ({
    user: one(users, {
        fields: [mediaFiles.userId],
        references: [users.id],
    }),
}));

// Gallery table - additional photos for the wedding
export const weddingGallery = pgTable('wedding_gallery', {
    id: uuid('id').primaryKey().defaultRandom(),
    weddingId: uuid('wedding_id').notNull().references(() => weddings.id, { onDelete: 'cascade' }),
    url: text('url').notNull(),
    alt: text('alt'),
    order: integer('order').default(0).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const weddingGalleryRelations = relations(weddingGallery, ({ one }) => ({
    wedding: one(weddings, {
        fields: [weddingGallery.weddingId],
        references: [weddings.id],
    }),
}));

// Update wedding relations to include gallery
export const weddingsRelations = relations(weddings, ({ one, many }) => ({
    user: one(users, {
        fields: [weddings.userId],
        references: [users.id],
    }),
    events: many(events),
    guests: many(guests),
    wishes: many(wishes),
    gallery: many(weddingGallery),
}));
