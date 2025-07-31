import { Client } from '@microsoft/microsoft-graph-client';
import ical from 'ical-generator';
import { v4 as uuidv4 } from 'uuid';
import type { Event, CalendarIntegration } from '@shared/schema';

// Calendar provider types
export type CalendarProvider = 'google' | 'microsoft' | 'apple';

export interface CalendarEventData {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
}

// Microsoft Graph Calendar Service
export class MicrosoftCalendarService {
  private client: Client;

  constructor(accessToken: string) {
    this.client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
  }

  async createEvent(eventData: CalendarEventData): Promise<string> {
    try {
      const event = {
        subject: eventData.title,
        body: {
          contentType: 'text' as const,
          content: eventData.description || ''
        },
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'UTC'
        },
        location: {
          displayName: eventData.location || ''
        }
      };

      const response = await this.client.api('/me/events').post(event);
      return response.id;
    } catch (error) {
      console.error('Erreur création événement Microsoft:', error);
      throw error;
    }
  }

  async updateEvent(eventId: string, eventData: CalendarEventData): Promise<void> {
    try {
      const event = {
        subject: eventData.title,
        body: {
          contentType: 'text' as const,
          content: eventData.description || ''
        },
        start: {
          dateTime: eventData.startTime.toISOString(),
          timeZone: 'UTC'
        },
        end: {
          dateTime: eventData.endTime.toISOString(),
          timeZone: 'UTC'
        },
        location: {
          displayName: eventData.location || ''
        }
      };

      await this.client.api(`/me/events/${eventId}`).patch(event);
    } catch (error) {
      console.error('Erreur mise à jour événement Microsoft:', error);
      throw error;
    }
  }

  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.client.api(`/me/events/${eventId}`).delete();
    } catch (error) {
      console.error('Erreur suppression événement Microsoft:', error);
      throw error;
    }
  }

  async getCalendars() {
    try {
      const response = await this.client.api('/me/calendars').get();
      return response.value;
    } catch (error) {
      console.error('Erreur récupération calendriers Microsoft:', error);
      throw error;
    }
  }
}

// Apple Calendar Service (iCal generation)
export class AppleCalendarService {
  generateICalEvent(eventData: CalendarEventData, eventId?: string): string {
    const calendar = ical({ name: 'Sam Hébert - Événements' });
    
    calendar.createEvent({
      id: eventId || uuidv4(),
      start: eventData.startTime,
      end: eventData.endTime,
      summary: eventData.title,
      description: eventData.description || '',
      location: eventData.location || ''
    });

    return calendar.toString();
  }

  generateICalFile(events: (Event & { eventData: CalendarEventData })[]): string {
    const calendar = ical({ 
      name: 'Sam Hébert - Événements',
      description: 'Calendrier des spectacles de Sam Hébert'
    });

    events.forEach(event => {
      calendar.createEvent({
        id: event.id,
        start: event.eventData.startTime,
        end: event.eventData.endTime,
        summary: event.eventData.title,
        description: event.eventData.description || '',
        location: event.eventData.location || '',
        created: event.createdAt,
        lastModified: event.updatedAt
      });
    });

    return calendar.toString();
  }
}

// Main Calendar Integration Service
export class CalendarIntegrationService {
  private microsoftService?: MicrosoftCalendarService;
  private appleService: AppleCalendarService;

  constructor() {
    this.appleService = new AppleCalendarService();
  }

  private initMicrosoftService(accessToken: string) {
    this.microsoftService = new MicrosoftCalendarService(accessToken);
  }

  async syncEventToCalendars(
    event: Event, 
    integrations: CalendarIntegration[]
  ): Promise<{ [provider: string]: string }> {
    const results: { [provider: string]: string } = {};
    
    const eventData: CalendarEventData = {
      title: event.title,
      description: event.description || '',
      startTime: new Date(event.date),
      endTime: new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000), // 2h par défaut
      location: event.venue
    };

    for (const integration of integrations) {
      if (!integration.isActive) continue;

      try {
        switch (integration.provider) {
          case 'microsoft':
            if (integration.accessToken) {
              this.initMicrosoftService(integration.accessToken);
              const microsoftEventId = await this.microsoftService!.createEvent(eventData);
              results.microsoft = microsoftEventId;
            }
            break;

          case 'apple':
            // Pour Apple Calendar, on génère un fichier iCal
            const icalContent = this.appleService.generateICalEvent(eventData, event.id);
            results.apple = icalContent;
            break;

          case 'google':
            // Google Calendar integration déjà implémentée
            // On pourrait l'étendre ici
            break;
        }
      } catch (error) {
        console.error(`Erreur sync calendrier ${integration.provider}:`, error);
      }
    }

    return results;
  }

  async updateEventInCalendars(
    event: Event,
    integrations: CalendarIntegration[]
  ): Promise<void> {
    const eventData: CalendarEventData = {
      title: event.title,
      description: event.description || '',
      startTime: new Date(event.date),
      endTime: new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000),
      location: event.venue
    };

    for (const integration of integrations) {
      if (!integration.isActive) continue;

      try {
        switch (integration.provider) {
          case 'microsoft':
            if (integration.accessToken && event.microsoftEventId) {
              this.initMicrosoftService(integration.accessToken);
              await this.microsoftService!.updateEvent(event.microsoftEventId, eventData);
            }
            break;

          case 'apple':
            // Pour Apple, on regénère le fichier iCal
            break;
        }
      } catch (error) {
        console.error(`Erreur mise à jour calendrier ${integration.provider}:`, error);
      }
    }
  }

  async deleteEventFromCalendars(
    event: Event,
    integrations: CalendarIntegration[]
  ): Promise<void> {
    for (const integration of integrations) {
      if (!integration.isActive) continue;

      try {
        switch (integration.provider) {
          case 'microsoft':
            if (integration.accessToken && event.microsoftEventId) {
              this.initMicrosoftService(integration.accessToken);
              await this.microsoftService!.deleteEvent(event.microsoftEventId);
            }
            break;

          case 'apple':
            // Pour Apple, l'événement sera retiré du prochain export iCal
            break;
        }
      } catch (error) {
        console.error(`Erreur suppression calendrier ${integration.provider}:`, error);
      }
    }
  }

  // Génère un fichier iCal pour tous les événements (compatible Apple Calendar)
  generateFullCalendarExport(events: Event[]): string {
    const eventDataArray = events.map(event => ({
      ...event,
      eventData: {
        title: event.title,
        description: event.description || '',
        startTime: new Date(event.date),
        endTime: new Date(new Date(event.date).getTime() + 2 * 60 * 60 * 1000),
        location: event.venue
      }
    }));

    return this.appleService.generateICalFile(eventDataArray);
  }
}