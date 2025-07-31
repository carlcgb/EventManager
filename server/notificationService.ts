import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

export interface NotificationData {
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'calendar_synced' | 'welcome';
  title: string;
  message: string;
  userId: string;
  timestamp: Date;
  data?: any;
}

class NotificationService {
  private wss: WebSocketServer | null = null;
  private connections: Map<string, WebSocket[]> = new Map();

  initialize(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info: any) => {
        // In production, you'd verify the user's authentication here
        return true;
      }
    });

    this.wss.on('connection', (ws, req) => {
      console.log('Nouvelle connexion WebSocket');

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message.toString());
          if (data.type === 'auth' && data.userId) {
            this.addConnection(data.userId, ws);
            
            // Envoyer une notification de bienvenue
            this.sendToUser(data.userId, {
              type: 'welcome',
              title: 'Howdy, Cowboy !',
              message: 'Connexion établie avec succès au ranch des notifications',
              userId: data.userId,
              timestamp: new Date()
            });
          }
        } catch (error) {
          console.error('Erreur parsing message WebSocket:', error);
        }
      });

      ws.on('close', () => {
        console.log('Connexion WebSocket fermée');
        this.removeConnection(ws);
      });

      ws.on('error', (error) => {
        console.error('Erreur WebSocket:', error);
        this.removeConnection(ws);
      });
    });
  }

  private addConnection(userId: string, ws: WebSocket) {
    if (!this.connections.has(userId)) {
      this.connections.set(userId, []);
    }
    this.connections.get(userId)!.push(ws);
    console.log(`Utilisateur ${userId} connecté via WebSocket`);
  }

  private removeConnection(ws: WebSocket) {
    for (const [userId, connections] of Array.from(this.connections.entries())) {
      const index = connections.indexOf(ws);
      if (index !== -1) {
        connections.splice(index, 1);
        if (connections.length === 0) {
          this.connections.delete(userId);
        }
        console.log(`Connexion supprimée pour l'utilisateur ${userId}`);
        break;
      }
    }
  }

  sendToUser(userId: string, notification: NotificationData) {
    const connections = this.connections.get(userId);
    if (!connections || connections.length === 0) {
      console.log(`Aucune connexion WebSocket pour l'utilisateur ${userId}`);
      return;
    }

    const message = JSON.stringify(notification);
    connections.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    
    console.log(`Notification envoyée à l'utilisateur ${userId}:`, notification.title);
  }

  broadcast(notification: Omit<NotificationData, 'userId'>) {
    if (!this.wss) return;

    const message = JSON.stringify(notification);
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
    
    console.log('Notification diffusée à tous les utilisateurs:', notification.title);
  }

  // Méthodes utilitaires pour créer des notifications spécifiques
  notifyEventCreated(userId: string, eventTitle: string, eventData?: any) {
    this.sendToUser(userId, {
      type: 'event_created',
      title: 'Nouvel Événement Créé !',
      message: `"${eventTitle}" a été ajouté au ranch`,
      userId,
      timestamp: new Date(),
      data: eventData
    });
  }

  notifyEventUpdated(userId: string, eventTitle: string, eventData?: any) {
    this.sendToUser(userId, {
      type: 'event_updated',
      title: 'Événement Mis à Jour',
      message: `"${eventTitle}" a été modifié`,
      userId,
      timestamp: new Date(),
      data: eventData
    });
  }

  notifyEventDeleted(userId: string, eventTitle: string) {
    this.sendToUser(userId, {
      type: 'event_deleted',
      title: 'Événement Supprimé',
      message: `"${eventTitle}" a quitté le ranch`,
      userId,
      timestamp: new Date()
    });
  }

  notifyCalendarSynced(userId: string, calendarName: string, eventCount: number) {
    this.sendToUser(userId, {
      type: 'calendar_synced',
      title: 'Calendrier Synchronisé',
      message: `${eventCount} événements synchronisés avec ${calendarName}`,
      userId,
      timestamp: new Date(),
      data: { calendarName, eventCount }
    });
  }
}

export const notificationService = new NotificationService();