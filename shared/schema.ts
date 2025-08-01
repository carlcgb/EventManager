import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  boolean,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  password: varchar("password").notNull(), // Hashed password
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Events table
export const events = pgTable("events", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  venue: text("venue").notNull(),
  addToCalendar: boolean("add_to_calendar").default(false),
  publishToWebsite: boolean("publish_to_website").default(false),
  sendNotification: boolean("send_notification").default(false),
  status: varchar("status", { enum: ["draft", "pending", "published"] }).default("draft"),
  calendarEventId: varchar("calendar_event_id"), // For Google Calendar integration
  microsoftEventId: varchar("microsoft_event_id"), // For Outlook/Microsoft integration
  appleEventId: varchar("apple_event_id"), // For Apple Calendar integration
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Calendar integrations table
export const calendarIntegrations = pgTable("calendar_integrations", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  provider: varchar("provider", { enum: ["google", "microsoft", "apple"] }).notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  calendarId: varchar("calendar_id"), // Specific calendar ID for the provider
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Social sharing and badges system
export const badges = pgTable("badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  icon: varchar("icon", { length: 50 }).notNull(), // Font Awesome icon class
  color: varchar("color", { length: 50 }).default("gray"),
  requirement: jsonb("requirement").notNull(), // JSON with badge requirements
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userBadges = pgTable("user_badges", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  badgeId: uuid("badge_id").references(() => badges.id).notNull(),
  earnedAt: timestamp("earned_at").defaultNow(),
  progress: jsonb("progress"), // JSON with progress data for multi-step badges
});

export const eventShares = pgTable("event_shares", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  eventId: uuid("event_id").references(() => events.id).notNull(),
  userId: varchar("user_id").references(() => users.id).notNull(),
  platform: varchar("platform", { enum: ["facebook", "twitter", "linkedin", "instagram", "whatsapp", "email"] }).notNull(),
  sharedAt: timestamp("shared_at").defaultNow(),
});

export const userStats = pgTable("user_stats", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull().unique(),
  eventsCreated: text("events_created").default("0"),
  eventsPublished: text("events_published").default("0"),
  eventsShared: text("events_shared").default("0"),
  calendarIntegrations: text("calendar_integrations").default("0"),
  totalShares: text("total_shares").default("0"),
  streakDays: text("streak_days").default("0"),
  lastActivityDate: timestamp("last_activity_date"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Schema types
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const loginUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const registerUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
}).extend({
  password: z.string().optional(), // Make password optional for Google OAuth
  confirmPassword: z.string().optional(),
}).refine((data) => {
  // Only validate password confirmation if password is provided
  if (data.password && data.confirmPassword) {
    return data.password === data.confirmPassword;
  }
  return true;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
});

export const insertCalendarIntegrationSchema = createInsertSchema(calendarIntegrations).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertEventSchema = createInsertSchema(events).omit({
  id: true,
  userId: true,
  calendarEventId: true,
  microsoftEventId: true,
  appleEventId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  date: z.string().transform((str) => new Date(str)),
});

export const updateEventSchema = insertEventSchema.partial();

// Additional schema types for social features
export const insertBadgeSchema = createInsertSchema(badges).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertEventShareSchema = createInsertSchema(eventShares).omit({
  id: true,
  sharedAt: true,
});

export const insertUserStatsSchema = createInsertSchema(userStats).omit({
  id: true,
  updatedAt: true,
});

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Badge = typeof badges.$inferSelect;
export type UserBadge = typeof userBadges.$inferSelect;
export type EventShare = typeof eventShares.$inferSelect;
export type UserStats = typeof userStats.$inferSelect;
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;
