import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertEventSchema, updateEventSchema, insertCalendarIntegrationSchema } from "@shared/schema";
import { google } from "googleapis";
import { CalendarIntegrationService } from "./calendarService";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({ message: "Échec de la récupération de l'utilisateur" });
    }
  });

  // Event routes
  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserEvents(userId);
      res.json(events);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      res.status(500).json({ message: "Échec de la récupération des événements" });
    }
  });

  app.get("/api/events/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getEventStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({ message: "Échec de la récupération des statistiques" });
    }
  });

  app.get("/api/events/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getEventStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      res.status(500).json({ message: "Échec de la récupération des statistiques" });
    }
  });

  app.post("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventData = insertEventSchema.parse(req.body);
      
      let calendarEventId = null;

      // Add to Google Calendar if requested
      if (eventData.addToCalendar) {
        try {
          calendarEventId = await addToGoogleCalendar(eventData);
        } catch (calendarError) {
          console.error("Erreur lors de l'ajout au calendrier:", calendarError);
          // Continue without calendar integration
        }
      }

      const event = await storage.createEvent({
        ...eventData,
        userId,
        calendarEventId,
      });

      res.json({
        event,
        message: eventData.addToCalendar 
          ? "Événement créé et ajouté au calendrier avec succès"
          : "Événement créé avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'événement:", error);
      res.status(400).json({ message: "Échec de la création de l'événement" });
    }
  });

  app.put("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;
      const eventData = updateEventSchema.parse(req.body);

      const event = await storage.updateEvent(eventId, userId, eventData);
      
      if (!event) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }

      res.json({
        event,
        message: "Événement mis à jour avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'événement:", error);
      res.status(400).json({ message: "Échec de la mise à jour de l'événement" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const eventId = req.params.id;

      const deleted = await storage.deleteEvent(eventId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }

      res.json({ message: "Événement supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      res.status(400).json({ message: "Échec de la suppression de l'événement" });
    }
  });

  // Initialize calendar service
  const calendarService = new CalendarIntegrationService();

  // Calendar integration routes
  app.get("/api/calendar-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getUserCalendarIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Erreur récupération intégrations calendrier:", error);
      res.status(500).json({ message: "Erreur récupération intégrations calendrier" });
    }
  });

  app.post("/api/calendar-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationData = insertCalendarIntegrationSchema.parse(req.body);
      
      const integration = await storage.createCalendarIntegration({
        ...integrationData,
        userId
      });

      res.json({
        integration,
        message: "Intégration calendrier créée avec succès"
      });
    } catch (error) {
      console.error("Erreur création intégration calendrier:", error);
      res.status(400).json({ message: "Erreur création intégration calendrier" });
    }
  });

  app.put("/api/calendar-integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationId = req.params.id;
      const updates = req.body;

      const integration = await storage.updateCalendarIntegration(integrationId, userId, updates);
      
      if (!integration) {
        return res.status(404).json({ message: "Intégration non trouvée" });
      }

      res.json({
        integration,
        message: "Intégration mise à jour avec succès"
      });
    } catch (error) {
      console.error("Erreur mise à jour intégration:", error);
      res.status(400).json({ message: "Erreur mise à jour intégration" });
    }
  });

  app.delete("/api/calendar-integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationId = req.params.id;

      const deleted = await storage.deleteCalendarIntegration(integrationId, userId);
      
      if (!deleted) {
        return res.status(404).json({ message: "Intégration non trouvée" });
      }

      res.json({ message: "Intégration supprimée avec succès" });
    } catch (error) {
      console.error("Erreur suppression intégration:", error);
      res.status(500).json({ message: "Erreur suppression intégration" });
    }
  });

  // Export calendar route (Apple Calendar compatible)
  app.get("/api/calendar-export", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const events = await storage.getUserEvents(userId);
      
      const icalContent = calendarService.generateFullCalendarExport(events);
      
      res.setHeader('Content-Type', 'text/calendar');
      res.setHeader('Content-Disposition', 'attachment; filename="sam-hebert-events.ics"');
      res.send(icalContent);
    } catch (error) {
      console.error("Erreur export calendrier:", error);
      res.status(500).json({ message: "Erreur export calendrier" });
    }
  });

  // Microsoft Calendar OAuth routes
  app.get("/api/calendar/microsoft/auth", isAuthenticated, (req: any, res) => {
    const scopes = ['https://graph.microsoft.com/calendars.readwrite'];
    const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
      `client_id=${process.env.MICROSOFT_CLIENT_ID}&` +
      `response_type=code&` +
      `redirect_uri=${encodeURIComponent(process.env.MICROSOFT_REDIRECT_URI || '')}&` +
      `scope=${encodeURIComponent(scopes.join(' '))}&` +
      `state=${req.user.claims.sub}`;
    
    res.json({ authUrl });
  });

  app.post("/api/calendar/microsoft/callback", isAuthenticated, async (req: any, res) => {
    try {
      const { code } = req.body;
      const userId = req.user.claims.sub;

      // Exchange code for token (simplified - would need actual Microsoft Graph implementation)
      // This would normally make a POST request to Microsoft's token endpoint
      
      res.json({ message: "Intégration Microsoft en cours de développement" });
    } catch (error) {
      console.error("Erreur callback Microsoft:", error);
      res.status(500).json({ message: "Erreur intégration Microsoft" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function addToGoogleCalendar(eventData: any): Promise<string | null> {
  try {
    // Initialize Google Calendar API
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const event = {
      summary: eventData.title,
      description: eventData.description,
      location: eventData.venue,
      start: {
        dateTime: eventData.date.toISOString(),
        timeZone: 'America/Montreal',
      },
      end: {
        dateTime: new Date(eventData.date.getTime() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours duration
        timeZone: 'America/Montreal',
      },
    };

    const response = await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary',
      requestBody: event,
    });

    return response.data.id || null;
  } catch (error) {
    console.error('Erreur Google Calendar:', error);
    return null;
  }
}
