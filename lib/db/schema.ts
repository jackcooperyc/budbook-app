import {
  boolean,
  date,
  doublePrecision,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
} from 'drizzle-orm/pg-core';
import type { Product, Session, TerpeneProfile } from '@/types/budbook';
import type { NormalizedCoaResult } from '@lib/coa/types';
import type { LearnArticle } from '@/types/learn';
import type { RetailMenuItem, RetailStore } from '@/types/rda';

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

export const friendships = pgTable('friendships', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  friendUserId: text('friend_user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  status: text('status').notNull().default('accepted'),
  sessionsShared: integer('sessions_shared').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const circles = pgTable('circles', {
  id: text('id').primaryKey(),
  ownerId: text('owner_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  isPrivate: boolean('is_private').notNull().default(false),
  recentActivity: text('recent_activity').notNull().default(''),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const circleMembers = pgTable(
  'circle_members',
  {
    circleId: text('circle_id')
      .notNull()
      .references(() => circles.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.circleId, table.userId] })],
);

export const rdaStores = pgTable('rda_stores', {
  storeKey: text('store_key').primaryKey(),
  data: jsonb('data').$type<RetailStore>().notNull(),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }).notNull().defaultNow(),
});

export const rdaMenuItems = pgTable('rda_menu_items', {
  menuItemKey: text('menu_item_key').primaryKey(),
  storeKey: text('store_key')
    .notNull()
    .references(() => rdaStores.storeKey, { onDelete: 'cascade' }),
  data: jsonb('data').$type<RetailMenuItem>().notNull(),
});

export const learnArticles = pgTable('learn_articles', {
  slug: text('slug').primaryKey(),
  data: jsonb('data').$type<LearnArticle>().notNull(),
  publishedAt: timestamp('published_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const scanJobs = pgTable('scan_jobs', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  inputKind: text('input_kind').notNull(),
  sourceUrl: text('source_url').notNull(),
  status: text('status').notNull().default('queued'),
  provider: text('provider'),
  attemptCount: integer('attempt_count').notNull().default(0),
  errorCode: text('error_code'),
  errorMessage: text('error_message'),
  metadata: jsonb('metadata').$type<Record<string, unknown>>().notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});

export const coaReports = pgTable('coa_reports', {
  id: text('id').primaryKey(),
  scanJobId: text('scan_job_id')
    .notNull()
    .references(() => scanJobs.id, { onDelete: 'cascade' }),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  provider: text('provider').notNull(),
  parserVersion: text('parser_version').notNull(),
  sourceUrl: text('source_url').notNull(),
  contentHash: text('content_hash'),
  rawMetadata: jsonb('raw_metadata').$type<Record<string, unknown>>().notNull().default({}),
  normalizedPayload: jsonb('normalized_payload').$type<NormalizedCoaResult>().notNull(),
  confidencePayload: jsonb('confidence_payload').$type<Record<string, unknown>>().notNull().default({}),
  extractedAt: timestamp('extracted_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const coaReportStashLinks = pgTable(
  'coa_report_stash_links',
  {
    coaReportId: text('coa_report_id')
      .notNull()
      .references(() => coaReports.id, { onDelete: 'cascade' }),
    productId: text('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [primaryKey({ columns: [table.coaReportId, table.productId] })],
);

export type DbRdaStore = typeof rdaStores.$inferSelect;
export type DbRdaMenuItem = typeof rdaMenuItems.$inferSelect;
export type DbLearnArticle = typeof learnArticles.$inferSelect;

export type DbProduct = typeof products.$inferSelect;
export type DbInventoryItem = typeof inventoryItems.$inferSelect;
export type DbSession = typeof sessions.$inferSelect;
export type DbPost = typeof posts.$inferSelect;
export type DbCaaCatalogEntry = typeof caaCatalogEntries.$inferSelect;
export type DbUser = typeof users.$inferSelect;
export type DbScanJob = typeof scanJobs.$inferSelect;
export type DbCoaReport = typeof coaReports.$inferSelect;
export type DbCoaReportStashLink = typeof coaReportStashLinks.$inferSelect;
