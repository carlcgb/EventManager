import {
  pgTable,
  varchar,
  timestamp,
  text,
} from "drizzle-orm/pg-core";

export const events = pgTable("events", {
  id: varchar("id").primaryKey().default("gen_random_uuid()"),
  title: varchar("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  venue: varchar("venue").notNull(),
  status: varchar("status").notNull().default("draft"), // 'draft', 'published'
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;