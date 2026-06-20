import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  jsonb,
  timestamp,
  date,
  uuid,
} from 'drizzle-orm/pg-core';

export const requestStatusEnum = pgEnum('request_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  clerkId: text('clerk_id').notNull().unique(),
  email: text('email').notNull(),
  name: text('name'),
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan').notNull().default('free'),
  credits: integer('credits').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contentRequests = pgTable('content_requests', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  industry: text('industry'),
  selectedTopics: jsonb('selected_topics'),
  status: requestStatusEnum('status').notNull().default('pending'),
  csvFilename: text('csv_filename'),
  csvBase64: text('csv_base64'),
  csvContent: text('csv_content'),
  generatedPosts: jsonb('generated_posts'),
  researchData: jsonb('research_data'),
  brandTone: text('brand_tone'),
  callToAction: text('call_to_action'),
  postingDate: date('posting_date'),
  platformSettings: jsonb('platform_settings'),
  progressStage: text('progress_stage'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type ContentRequest = typeof contentRequests.$inferSelect;
export type NewContentRequest = typeof contentRequests.$inferInsert;
