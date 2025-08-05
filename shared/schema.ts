import { sql } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  date,
  varchar,
  text,
  boolean,
  uuid,
  integer,
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
  venueName: text("venue_name").notNull(), // Name of the bar/venue
  description: text("description"), // Keep for backward compatibility, but now used for venue name
  date: date("date").notNull(),
  venue: text("venue").notNull(), // Full address
  city: text("city").notNull(), // City extracted from address
  ticketsUrl: text("tickets_url"),
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



// Table to store saved Facebook pages for venues
export const savedVenues = pgTable("saved_venues", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id).notNull(),
  venueName: text("venue_name").notNull(),
  venueAddress: text("venue_address"),
  facebookId: text("facebook_id"),
  facebookUrl: text("facebook_url"),
  profilePictureUrl: text("profile_picture_url"),
  websiteUrl: text("website_url"),
  googleMapsUrl: text("google_maps_url"),
  useCount: integer("use_count").default(1),
  lastUsed: timestamp("last_used").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().$onUpdate(() => new Date()),
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
  venueName: z.string().min(1, "Le nom du lieu est requis"),
  city: z.string().min(1, "La ville est requise"),
});

export const updateEventSchema = insertEventSchema.partial();



export const insertSavedVenueSchema = createInsertSchema(savedVenues).omit({
  id: true,
  userId: true,
  useCount: true,
  lastUsed: true,
  createdAt: true,
  updatedAt: true,
});

export type SavedVenue = typeof savedVenues.$inferSelect;
export type InsertSavedVenue = z.infer<typeof insertSavedVenueSchema>;

export type UpsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type RegisterUser = z.infer<typeof registerUserSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type CalendarIntegration = typeof calendarIntegrations.$inferSelect;
export type UpdateEvent = z.infer<typeof updateEventSchema>;
export type InsertCalendarIntegration = z.infer<typeof insertCalendarIntegrationSchema>;
