import {
  users,
  events,
  type User,
  type UpsertUser,
  type Event,
  type InsertEvent,
  type UpdateEvent,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser & { id?: string }): Promise<User>;
  
  // Event operations
  getUserEvents(userId: string): Promise<Event[]>;
  getEventById(id: string, userId: string): Promise<Event | undefined>;
  createEvent(event: InsertEvent & { userId: string }): Promise<Event>;
  updateEvent(id: string, userId: string, event: UpdateEvent): Promise<Event | undefined>;
  deleteEvent(id: string, userId: string): Promise<boolean>;
  getEventStats(userId: string): Promise<{
    monthlyEvents: number;
    publishedEvents: number;
    pendingEvents: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  // (IMPORTANT) these user operations are mandatory for Replit Auth.

  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser & { id?: string }): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
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

  async getEventById(id: string, userId: string): Promise<Event | undefined> {
    const [event] = await db
      .select()
      .from(events)
      .where(and(eq(events.id, id), eq(events.userId, userId)));
    return event;
  }

  async createEvent(eventData: InsertEvent & { userId: string }): Promise<Event> {
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
    return result.rowCount > 0;
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
}

export const storage = new DatabaseStorage();
