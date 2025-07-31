import { onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import express from "express";
import cors from "cors";
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "./schema";
import { events } from "./schema";
import { eq, gte } from "drizzle-orm";

// Initialize Firebase Admin
admin.initializeApp();

// Database setup
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle({ client: pool, schema });

// Express app
const app = express();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Firebase Auth middleware
const authenticateUser = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ message: 'Unauthorized' });
  }
};

// Routes

// Get user info
app.get('/auth/user', authenticateUser, async (req: any, res) => {
  try {
    res.json({
      uid: req.user.uid,
      email: req.user.email,
      displayName: req.user.name,
      photoURL: req.user.picture,
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Failed to fetch user' });
  }
});

// Get events
app.get('/events', authenticateUser, async (req: any, res) => {
  try {
    const allEvents = await db.select().from(events).where(eq(events.userId, req.user.uid));
    res.json(allEvents);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Get public events (published ones)
app.get('/events/public', async (req, res) => {
  try {
    const publicEvents = await db
      .select()
      .from(events)
      .where(eq(events.status, 'published'));
    res.json(publicEvents);
  } catch (error) {
    console.error('Error fetching public events:', error);
    res.status(500).json({ message: 'Failed to fetch events' });
  }
});

// Create event
app.post('/events', authenticateUser, async (req: any, res) => {
  try {
    const { title, description, date, venue } = req.body;
    
    if (!title || !date || !venue) {
      return res.status(400).json({ message: 'Title, date, and venue are required' });
    }

    const [newEvent] = await db
      .insert(events)
      .values({
        title,
        description,
        date: new Date(date),
        venue,
        userId: req.user.uid,
        status: 'draft',
      })
      .returning();

    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ message: 'Failed to create event' });
  }
});

// Update event
app.patch('/events/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const [updatedEvent] = await db
      .update(events)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(events.id, id))
      .returning();

    if (!updatedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ message: 'Failed to update event' });
  }
});

// Delete event
app.delete('/events/:id', authenticateUser, async (req: any, res) => {
  try {
    const { id } = req.params;

    const [deletedEvent] = await db
      .delete(events)
      .where(eq(events.id, id))
      .returning();

    if (!deletedEvent) {
      return res.status(404).json({ message: 'Event not found' });
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ message: 'Failed to delete event' });
  }
});

// Get event statistics
app.get('/events/stats', authenticateUser, async (req: any, res) => {
  try {
    const allEvents = await db.select().from(events).where(eq(events.userId, req.user.uid));
    
    const stats = {
      total: allEvents.length,
      published: allEvents.filter(e => e.status === 'published').length,
      draft: allEvents.filter(e => e.status === 'draft').length,
      upcoming: allEvents.filter(e => new Date(e.date) > new Date()).length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch statistics' });
  }
});

// Export the Express app as Firebase Function
export const api = onRequest(app);