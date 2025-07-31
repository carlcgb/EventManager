import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { notificationService } from "./notificationService";
import { GoogleCalendarService } from "./calendarService";
import { insertEventSchema, updateEventSchema, insertCalendarIntegrationSchema } from "@shared/schema";
import { CalendarIntegrationService } from "./calendarService";

// Google Calendar integration function
async function addToGoogleCalendar(eventData: any): Promise<string | null> {
  try {
    console.log("Tentative d'ajout à Google Calendar:", eventData.title);
    
    console.log("Google Calendar API keys present:", {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      calendarId: !!process.env.GOOGLE_CALENDAR_ID
    });

    // Créer le service Google Calendar
    const googleCalendarService = new GoogleCalendarService();
    
    // Convertir les données d'événement au format requis
    const startTime = new Date(eventData.date);
    const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 heures par défaut
    
    const calendarEventData = {
      title: eventData.title,
      description: eventData.description || '',
      startTime: startTime,
      endTime: endTime,
      location: eventData.venue || ''
    };

    // Créer l'événement dans Google Calendar
    const eventId = await googleCalendarService.createEvent(calendarEventData);
    
    console.log("Événement Google Calendar créé avec succès avec ID:", eventId);
    return eventId;
  } catch (error) {
    console.error('Erreur Google Calendar:', error);
    return null;
  }
}

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

  app.post("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      console.log("POST /api/events - req.user:", req.user);
      console.log("POST /api/events - req.isAuthenticated():", req.isAuthenticated());
      
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
        calendarEventId: calendarEventId || undefined,
      });

      // Envoyer notification en temps réel
      notificationService.notifyEventCreated(userId, event.title, event);

      let message = "Événement créé avec succès";
      if (eventData.addToCalendar) {
        message = calendarEventId 
          ? "🤠 Événement créé et ajouté à Google Calendar avec succès !"
          : "Événement créé (ajout au calendrier échoué, mais votre événement est sauvegardé)";
      }

      res.json({
        event,
        message,
        calendarIntegration: {
          requested: eventData.addToCalendar,
          successful: !!calendarEventId,
          calendarEventId
        }
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

      // Envoyer notification en temps réel
      notificationService.notifyEventUpdated(userId, event.title, event);

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

      const success = await storage.deleteEvent(eventId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }

      // Envoyer notification en temps réel
      notificationService.notifyEventDeleted(userId, "Événement supprimé");

      res.json({ message: "Événement supprimé avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'événement:", error);
      res.status(500).json({ message: "Échec de la suppression de l'événement" });
    }
  });

  // Test Google Calendar connection
  app.get("/api/calendar/test", isAuthenticated, async (req: any, res) => {
    try {
      const testEvent = {
        title: "Test de connexion Google Calendar",
        description: "Test automatique de l'intégration",
        date: new Date(),
        venue: "Test"
      };
      
      const googleCalendarService = new GoogleCalendarService();
      const startTime = new Date();
      const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);
      
      const calendarEventData = {
        title: testEvent.title,
        description: testEvent.description,
        startTime: startTime,
        endTime: endTime,
        location: testEvent.venue
      };
      
      const calendarEventId = await googleCalendarService.createEvent(calendarEventData);
      
      res.json({
        success: !!calendarEventId,
        message: calendarEventId 
          ? "✅ Connexion Google Calendar réussie !" 
          : "❌ Échec de la connexion Google Calendar",
        calendarEventId,
        hasCredentials: {
          clientId: !!process.env.GOOGLE_CLIENT_ID,
          clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
          calendarId: !!process.env.GOOGLE_CALENDAR_ID
        }
      });
    } catch (error) {
      console.error("Erreur test Google Calendar:", error);
      res.status(500).json({ 
        success: false, 
        message: "Erreur lors du test de connexion",
        error: (error as Error).message 
      });
    }
  });

  // Calendar integration routes
  app.get("/api/calendar/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrations = await storage.getUserCalendarIntegrations(userId);
      res.json(integrations);
    } catch (error) {
      console.error("Erreur lors de la récupération des intégrations:", error);
      res.status(500).json({ message: "Échec de la récupération des intégrations" });
    }
  });

  app.post("/api/calendar/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const integrationData = insertCalendarIntegrationSchema.parse(req.body);

      const integration = await storage.createCalendarIntegration({
        ...integrationData,
        userId,
      });

      res.json({
        integration,
        message: "Intégration calendrier créée avec succès"
      });
    } catch (error) {
      console.error("Erreur lors de la création de l'intégration:", error);
      res.status(400).json({ message: "Échec de la création de l'intégration" });
    }
  });

  const httpServer = createServer(app);
  
  // Initialiser le service de notifications WebSocket
  notificationService.initialize(httpServer);
  
  return httpServer;
}