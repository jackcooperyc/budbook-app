import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { Product, Session, TerpeneProfile } from '@/types/budbook';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name').notNull(),
  username: text('username').notNull().unique(),
  role: text('role').notNull().default('user'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const products = pgTable('products', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  strainName: text('strain_name').notNull(),
  brand: text('brand').notNull(),
  type: text('type').notNull(),
  category: text('category').notNull(),
  thcPercentage: doublePrecision('thc_percentage').notNull(),
  cbdPercentage: doublePrecision('cbd_percentage').notNull(),
  terpeneProfile: jsonb('terpene_profile').$type<TerpeneProfile[]>().notNull().default([]),
  labReportId: text('lab_report_id').notNull(),
  dispensaryId: text('dispensary_id').notNull().default(''),
  productKey: text('product_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryItems = pgTable('inventory_items', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  productId: text('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  quantity: doublePrecision('quantity').notNull(),
  unit: text('unit').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  purchaseDate: date('purchase_date').notNull(),
  notes: text('notes').notNull().default(''),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  date: timestamp('date', { withTimezone: true }).notNull(),
  productId: text('product_id').notNull(),
  consumptionMethod: text('consumption_method').notNull(),
  dosage: text('dosage').notNull(),
  pairingNotes: text('pairing_notes').notNull().default(''),
  rating: smallint('rating').notNull(),
  moodBefore: smallint('mood_before').notNull(),
  moodAfter: smallint('mood_after').notNull(),
  painBefore: smallint('pain_before').notNull(),
  painAfter: smallint('pain_after').notNull(),
  anxietyBefore: smallint('anxiety_before').notNull(),
  anxietyAfter: smallint('anxiety_after').notNull(),
  effectsFelt: jsonb('effects_felt').$type<string[]>().notNull().default([]),
  activities: jsonb('activities').$type<string[]>().notNull().default([]),
  sessionNotes: text('session_notes').notNull().default(''),
  sessionName: text('session_name').notNull().default(''),
});

export const posts = pgTable('posts', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  author: text('author').notNull(),
  authorSeed: text('author_seed').notNull(),
  body: text('body').notNull(),
  strain: text('strain'),
  circle: text('circle'),
  likes: integer('likes').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const caaCatalogEntries = pgTable('caa_catalog_entries', {
  productKey: text('product_key').primaryKey(),
  labReportId: text('lab_report_id').notNull().unique(),
  strainName: text('strain_name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  type: text('type').notNull(),
  thcPercentage: doublePrecision('thc_percentage').notNull(),
  cbdPercentage: doublePrecision('cbd_percentage').notNull(),
  terpeneProfile: jsonb('terpene_profile').$type<TerpeneProfile[]>().notNull().default([]),
  complianceStatus: text('compliance_status').notNull().default('confirmed'),
  registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
});

export type DbProduct = typeof products.$inferSelect;
export type DbInventoryItem = typeof inventoryItems.$inferSelect;
export type DbSession = typeof sessions.$inferSelect;
export type DbPost = typeof posts.$inferSelect;
export type DbCaaCatalogEntry = typeof caaCatalogEntries.$inferSelect;
export type DbUser = typeof users.$inferSelect;
