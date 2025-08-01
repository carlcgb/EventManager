import {
  users,
  events,
  calendarIntegrations,
  badges,
  userBadges,
  eventShares,
  userStats,
  type User,
  type UpsertUser,
  type LoginUser,
  type RegisterUser,
  type Event,
  type InsertEvent,
  type UpdateEvent,
  type CalendarIntegration,
  type InsertCalendarIntegration,
  type Badge,
  type UserBadge,
  type EventShare,
  type UserStats,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, count } from "drizzle-orm";
import bcrypt from "bcryptjs";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: RegisterUser): Promise<User>;
  authenticateUser(credentials: LoginUser): Promise<User | null>;
  
  // Event operations
  getUserEvents(userId: string): Promise<Event[]>;
  getPublishedEvents(): Promise<Event[]>;
  getEvent(id: string, userId: string): Promise<Event | undefined>;
  getEventById(id: string, userId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent & { userId: string; calendarEventId?: string }): Promise<Event>;
  updateEvent(id: string, userId: string, event: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: string, userId: string): Promise<boolean>;
  getEventStats(userId: string): Promise<{
    monthlyEvents: number;
    publishedEvents: number;
    pendingEvents: number;
  }>;

  // Calendar integration operations
  getUserCalendarIntegrations(userId: string): Promise<CalendarIntegration[]>;
  getCalendarIntegration(id: string, userId: string): Promise<CalendarIntegration | undefined>;
  createCalendarIntegration(integration: InsertCalendarIntegration & { userId: string }): Promise<CalendarIntegration>;
  updateCalendarIntegration(id: string, userId: string, updates: Partial<InsertCalendarIntegration>): Promise<CalendarIntegration | undefined>;
  deleteCalendarIntegration(id: string, userId: string): Promise<boolean>;
  getActiveCalendarIntegration(userId: string, provider: string): Promise<CalendarIntegration | undefined>;

  // Social features operations
  getUserBadges(userId: string): Promise<UserBadge[]>;
  getAllBadges(): Promise<Badge[]>;
  getUserStats(userId: string): Promise<UserStats>;
  createEventShare(share: { eventId: string; userId: string; platform: string }): Promise<EventShare>;
  updateUserStats(userId: string): Promise<void>;
  checkAndAwardBadges(userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: RegisterUser): Promise<User> {
    // Hash the password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const [user] = await db
      .insert(users)
      .values({
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
      })
      .returning();
    return user;
  }

  async authenticateUser(credentials: LoginUser): Promise<User | null> {
    const user = await this.getUserByEmail(credentials.email);
    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  // Event operations
  async getUserEvents(userId: string): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.userId, userId))
      .orderBy(desc(events.createdAt));
  }

  async getPublishedEvents(): Promise<Event[]> {
    return await db
      .select()
      .from(events)
      .where(eq(events.status, "published"))
      .orderBy(desc(events.createdAt));
  }

  async getEvent(id: string, userId: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    return event;
  }

  async getEventById(id: string, userId: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    return event;
  }

  async createEvent(eventData: InsertEvent & { userId: string; calendarEventId?: string }): Promise<Event> {
    const [event] = await db
      .insert(events)
      .values({
        ...eventData,
        status: eventData.publishToWebsite ? "published" : "draft",
      })
      .returning();
    return event;
  }

  async updateEvent(id: string, userId: string, eventData: UpdateEvent): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set({
        ...eventData,
        updatedAt: new Date(),
      })
      .where(and(eq(events.id, id), eq(events.userId, userId)))
      .returning();
    return event;
  }

  async deleteEvent(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    return (result.rowCount ?? 0) > 0;
  }

  async getEventStats(userId: string): Promise<{
    monthlyEvents: number;
    publishedEvents: number;
    pendingEvents: number;
  }> {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const userEvents = await db
      .select()
      .from(events)
      .where(eq(events.userId, userId));

    const monthlyEvents = userEvents.filter(event => 
      event.date >= startOfMonth && event.date <= endOfMonth
    ).length;

    const publishedEvents = userEvents.filter(event => 
      event.status === "published"
    ).length;

    const pendingEvents = userEvents.filter(event => 
      event.status === "pending"
    ).length;

    return {
      monthlyEvents,
      publishedEvents,
      pendingEvents,
    };
  }

  // Calendar integration operations
  async getUserCalendarIntegrations(userId: string): Promise<CalendarIntegration[]> {
    return await db
      .select()
      .from(calendarIntegrations)
      .where(eq(calendarIntegrations.userId, userId))
      .orderBy(desc(calendarIntegrations.createdAt));
  }

  async getCalendarIntegration(id: string, userId: string): Promise<CalendarIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(calendarIntegrations)
      .where(and(
        eq(calendarIntegrations.id, id),
        eq(calendarIntegrations.userId, userId)
      ));
    return integration;
  }

  async createCalendarIntegration(integration: InsertCalendarIntegration & { userId: string }): Promise<CalendarIntegration> {
    const [newIntegration] = await db
      .insert(calendarIntegrations)
      .values(integration)
      .returning();
    return newIntegration;
  }

  async updateCalendarIntegration(
    id: string, 
    userId: string, 
    updates: Partial<InsertCalendarIntegration>
  ): Promise<CalendarIntegration | undefined> {
    const [updatedIntegration] = await db
      .update(calendarIntegrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(and(
        eq(calendarIntegrations.id, id),
        eq(calendarIntegrations.userId, userId)
      ))
      .returning();
    return updatedIntegration;
  }

  async deleteCalendarIntegration(id: string, userId: string): Promise<boolean> {
    const result = await db
      .delete(calendarIntegrations)
      .where(and(
        eq(calendarIntegrations.id, id),
        eq(calendarIntegrations.userId, userId)
      ));
    return (result.rowCount ?? 0) > 0;
  }

  async getActiveCalendarIntegration(userId: string, provider: string): Promise<CalendarIntegration | undefined> {
    const [integration] = await db
      .select()
      .from(calendarIntegrations)
      .where(and(
        eq(calendarIntegrations.userId, userId),
        eq(calendarIntegrations.provider, provider as any),
        eq(calendarIntegrations.isActive, true)
      ));
    return integration;
  }

  // Social features operations
  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return await db
      .select()
      .from(userBadges)
      .where(eq(userBadges.userId, userId));
  }

  async getAllBadges(): Promise<Badge[]> {
    return await db.select().from(badges);
  }

  async getUserStats(userId: string): Promise<UserStats> {
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));
    
    if (!stats) {
      // Create initial stats if they don't exist
      const newStats = {
        userId,
        eventsCreated: "0",
        eventsPublished: "0",
        eventsShared: "0",
        calendarIntegrations: "0",
        totalShares: "0",
        streakDays: "0"
      };
      
      const [createdStats] = await db
        .insert(userStats)
        .values(newStats)
        .returning();
      
      return createdStats;
    }
    
    return stats;
  }

  async createEventShare(share: { eventId: string; userId: string; platform: string }): Promise<EventShare> {
    const [newShare] = await db
      .insert(eventShares)
      .values({
        eventId: share.eventId,
        userId: share.userId,
        platform: share.platform as any
      })
      .returning();
    return newShare;
  }

  async updateUserStats(userId: string): Promise<void> {
    // Get current counts
    const eventsCreated = await db
      .select({ count: count(events.id) })
      .from(events)
      .where(eq(events.userId, userId));

    const eventsShared = await db
      .select({ count: count(eventShares.id) })
      .from(eventShares)
      .where(eq(eventShares.userId, userId));

    const badgesEarned = await db
      .select({ count: count(userBadges.id) })
      .from(userBadges)
      .where(eq(userBadges.userId, userId));

    // Update or insert stats
    const existingStats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, userId));

    if (existingStats.length > 0) {
      await db
        .update(userStats)
        .set({
          eventsCreated: eventsCreated[0].count.toString(),
          eventsShared: eventsShared[0].count.toString(),
          totalShares: eventsShared[0].count.toString(),
          updatedAt: new Date()
        })
        .where(eq(userStats.userId, userId));
    } else {
      await db
        .insert(userStats)
        .values({
          userId,
          eventsCreated: eventsCreated[0].count.toString(),
          eventsShared: eventsShared[0].count.toString(),
          totalShares: eventsShared[0].count.toString()
        });
    }
  }

  async checkAndAwardBadges(userId: string): Promise<void> {
    const stats = await this.getUserStats(userId);
    const currentBadges = await this.getUserBadges(userId);
    const currentBadgeIds = currentBadges.map(b => b.badgeId);

    const eventsCreated = parseInt(stats.eventsCreated || "0");
    const eventsShared = parseInt(stats.eventsShared || "0");

    // Define badge conditions
    const badgeConditions = [
      { id: 'first-event', condition: eventsCreated >= 1 },
      { id: 'event-master', condition: eventsCreated >= 10 },
      { id: 'social-butterfly', condition: eventsShared >= 5 }
    ];

    // Award new badges
    for (const { id, condition } of badgeConditions) {
      if (condition && !currentBadgeIds.includes(id)) {
        await db
          .insert(userBadges)
          .values({
            userId,
            badgeId: id
          });
      }
    }
  }
}

export const storage = new DatabaseStorage();
