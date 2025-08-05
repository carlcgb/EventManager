import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./auth";

import { GoogleCalendarService } from "./calendarService";
import { google } from 'googleapis';
import { insertEventSchema, updateEventSchema, insertCalendarIntegrationSchema, insertSavedVenueSchema, savedVenues } from "@shared/schema";
import { CalendarIntegrationService } from "./calendarService";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { eq, desc, and } from 'drizzle-orm';
import { db } from './db';

// Helper function to format dates in French
function formatFrenchDate(date: Date | string | null): string {
  if (!date) return 'Date non disponible';
  
  let dateObj: Date;
  if (typeof date === 'string') {
    // Pour éviter les problèmes de timezone avec les dates au format YYYY-MM-DD,
    // on force l'interprétation en tant que date locale
    if (date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = date.split('-').map(Number);
      dateObj = new Date(year, month - 1, day); // month est 0-indexé
    } else {
      dateObj = new Date(date);
    }
  } else {
    dateObj = date;
  }
  
  return format(dateObj, 'dd MMMM yyyy', { locale: fr }).toUpperCase();
}

// Google Calendar integration function
async function addToGoogleCalendar(eventData: any): Promise<string | null> {
  try {
    console.log("Tentative d'ajout à Google Calendar:", eventData.title);
    
    console.log("Google Calendar API keys present:", {
      clientId: !!process.env.GOOGLE_CLIENT_ID,
      clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      calendarId: !!process.env.GOOGLE_CALENDAR_ID
    });

    // Vérifier que toutes les clés nécessaires sont présentes
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error("Clés Google API manquantes - GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET sont requis");
    }

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

  // Google Places API proxy endpoint
  // New endpoint to search for venue social media links
  // Facebook Pages and Events search endpoint
  app.get('/api/facebook/search', async (req, res) => {
    try {
      const query = req.query.q as string;
      const searchType = req.query.type as string || 'page'; // 'page', 'event', or 'all'
      
      if (!query || query.length < 2) {
        return res.json({ data: [] });
      }

      // Check if we have a Facebook access token for real API calls
      const facebookToken = process.env.FACEBOOK_ACCESS_TOKEN;
      
      if (facebookToken) {
        // Use real Facebook Graph API
        try {
          const apiSearchType = searchType === 'event' ? 'event' : 'page';
          const fields = apiSearchType === 'event' 
            ? 'id,name,description,place,start_time,cover'
            : 'id,name,category,location,picture,verification_status,website';
          
          const response = await fetch(
            `https://graph.facebook.com/v18.0/search?q=${encodeURIComponent(query)}&type=${apiSearchType}&fields=${fields}&access_token=${facebookToken}&limit=10`
          );
          
          if (response.ok) {
            const data = await response.json();
            const results = data.data?.map((item: any) => ({
              id: item.id,
              name: item.name,
              url: `https://facebook.com/${item.id}`,
              profilePicture: item.picture?.data?.url || `https://graph.facebook.com/${item.id}/picture?type=large`,
              verified: item.verification_status === 'blue_verified' || item.verification_status === 'gray_verified',
              address: item.location?.street || item.place?.location?.street || '',
              category: item.category || 'Événement',
              description: item.description || '',
              type: apiSearchType,
              isSaved: false
            })) || [];
            
            return res.json({ data: results });
          }
        } catch (error) {
          console.error('Facebook API error:', error);
          // Fall back to predefined database if API fails
        }
      }
      
      // Fallback: Define known Quebec venues with their Facebook IDs, real names, and categories
      const quebecVenues = [
        { id: 'bordelcomedie', name: 'Le Bordel Comédie Club', address: 'Montréal, QC', category: 'Club de comédie', type: 'page' },
        { id: 'lebordel', name: 'Le Bordel', address: 'Montréal, QC', category: 'Bar', type: 'page' },
        { id: 'lefoutoir', name: 'Le Foutoir', address: 'Montréal, QC', category: 'Bar/Restaurant', type: 'page' },
        { id: 'comedynesttwo', name: 'Comedy Nest', address: 'Montréal, QC', category: 'Club de comédie', type: 'page' },
        { id: 'comedyworksmontreal', name: 'Comedy Works', address: 'Montréal, QC', category: 'Club de comédie', type: 'page' },
        { id: 'barleraymond', name: 'Bar Le Raymond', address: 'Montréal, QC', category: 'Bar', type: 'page' },
        { id: 'saintbock', name: 'Saint-Bock', address: 'Montréal, QC', category: 'Brasserie', type: 'page' },
        { id: 'lereservoir', name: 'Le Réservoir', address: 'Montréal, QC', category: 'Brasserie', type: 'page' },
        { id: 'ledieuducielmontreal', name: 'Le Dieu du Ciel', address: 'Montréal, QC', category: 'Brasserie', type: 'page' },
        { id: 'unibroue', name: 'Unibroue', address: 'Chambly, QC', category: 'Brasserie', type: 'page' },
        { id: 'brutopia', name: 'Brutopia', address: 'Montréal, QC', category: 'Brasserie', type: 'page' },
        { id: 'pubquartierlatinmtl', name: 'Pub Quartier Latin', address: 'Montréal, QC', category: 'Pub', type: 'page' },
        { id: 'chezserge', name: 'Chez Serge', address: 'Montréal, QC', category: 'Restaurant', type: 'page' },
        { id: 'bistrolemythos', name: 'Bistro Le Mythos', address: 'Montréal, QC', category: 'Restaurant', type: 'page' },
        { id: 'pubstpatrick', name: 'Pub St-Patrick', address: 'Montréal, QC', category: 'Pub', type: 'page' },
        { id: 'loupgaron', name: 'Loup Garou', address: 'Québec, QC', category: 'Bar', type: 'page' },
        { id: 'chezmaurice', name: 'Chez Maurice', address: 'Québec, QC', category: 'Restaurant', type: 'page' },
        { id: 'korrigannpub', name: 'Korrigann Pub', address: 'Québec, QC', category: 'Pub', type: 'page' },
        { id: 'pubdufaubourg', name: 'Pub du Faubourg', address: 'Québec, QC', category: 'Pub', type: 'page' },
        { id: 'sacrecoeurpub', name: 'Sacré-Coeur Pub', address: 'Québec, QC', category: 'Pub', type: 'page' },
        // Granby venues
        { id: 'theatregranby', name: 'Théâtre Palace Granby', address: 'Granby, QC', category: 'Théâtre', type: 'page' },
        { id: 'centreculturelgranby', name: 'Centre culturel France Arbour', address: 'Granby, QC', category: 'Centre culturel', type: 'page' },
        { id: 'casinogranby', name: 'Casino de Granby', address: 'Granby, QC', category: 'Casino', type: 'page' },
        { id: 'pubgranby', name: 'Pub Granby', address: 'Granby, QC', category: 'Pub', type: 'page' },
        { id: 'sallegranby', name: 'Salle de spectacle Granby', address: 'Granby, QC', category: 'Salle de spectacle', type: 'page' },
        // Sample events (these would normally come from a real API)
        { id: 'event-stand-up-bordeL', name: 'Soirée Stand-up au Bordel', address: 'Montréal, QC', category: 'Spectacle', type: 'event', description: 'Soirée de stand-up avec des humoristes locaux' },
        { id: 'event-comedy-night', name: 'Comedy Night Montréal', address: 'Montréal, QC', category: 'Comédie', type: 'event', description: 'Nuit de la comédie avec plusieurs artistes' },
        { id: 'event-open-mic', name: 'Open Mic Comedy', address: 'Montréal, QC', category: 'Open Mic', type: 'event', description: 'Micro ouvert pour humoristes débutants' },
        { id: 'event-soiree-rire-granby', name: 'La soirée du rire de Granby', address: 'Granby, QC', category: 'Spectacle d\'humour', type: 'event', description: 'Soirée humoristique à Granby avec des artistes locaux' },
        { id: 'event-20sept-rire-granby', name: '20 septembre - La soirée du rire de Granby', address: 'Granby, QC', category: 'Spectacle d\'humour', type: 'event', description: 'Spectacle du 20 septembre à Granby' },
        { id: 'event-granby-comedy', name: 'Granby Comedy Show', address: 'Granby, QC', category: 'Comédie', type: 'event', description: 'Spectacle de comédie à Granby' },
        { id: 'event-rire-granby-automne', name: 'Soirée du rire Granby - Automne', address: 'Granby, QC', category: 'Humour', type: 'event', description: 'Soirée humoristique d\'automne à Granby' },
      ];
      
      // Normalize search query for better matching
      const normalizeText = (text: string) => {
        return text.toLowerCase()
          .replace(/[àáâãäå]/g, 'a')
          .replace(/[èéêë]/g, 'e')
          .replace(/[ìíîï]/g, 'i')
          .replace(/[òóôõö]/g, 'o')
          .replace(/[ùúûü]/g, 'u')
          .replace(/[ç]/g, 'c')
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      };
      
      const normalizedQuery = normalizeText(query);
      const queryWords = normalizedQuery.split(' ').filter(word => word.length > 1);
      
      // Score venues based on name similarity
      const scoredVenues = quebecVenues.map(venue => {
        const normalizedVenueName = normalizeText(venue.name);
        const venueWords = normalizedVenueName.split(' ').filter(word => word.length > 1);
        
        let score = 0;
        
        // Exact name match
        if (normalizedVenueName.includes(normalizedQuery)) {
          score += 100;
        }
        
        // Word matching
        let matchedWords = 0;
        queryWords.forEach(queryWord => {
          venueWords.forEach(venueWord => {
            if (venueWord.includes(queryWord) || queryWord.includes(venueWord)) {
              matchedWords++;
              score += 20;
            }
            // Partial word matching
            if (venueWord.length > 3 && queryWord.length > 3) {
              const commonLength = Math.min(venueWord.length, queryWord.length);
              const similarity = queryWord.substring(0, commonLength) === venueWord.substring(0, commonLength);
              if (similarity) {
                score += 10;
              }
            }
          });
        });
        
        // Bonus for matching most words
        if (matchedWords >= queryWords.length * 0.7) {
          score += 30;
        }
        
        // Check if query matches Facebook ID
        if (venue.id.includes(normalizedQuery.replace(/\s+/g, ''))) {
          score += 50;
        }
        
        return { ...venue, score };
      });
      
      // Filter venues based on search type
      let filteredItems = quebecVenues;
      if (searchType === 'page') {
        filteredItems = quebecVenues.filter(item => item.type === 'page');
      } else if (searchType === 'event') {
        filteredItems = quebecVenues.filter(item => item.type === 'event');
      }
      
      // Score venues based on name similarity
      const scoredItems = filteredItems.map(item => {
        const normalizedItemName = normalizeText(item.name);
        const itemWords = normalizedItemName.split(' ').filter(word => word.length > 1);
        
        let score = 0;
        
        // Exact name match
        if (normalizedItemName.includes(normalizedQuery)) {
          score += 100;
        }
        
        // Word matching
        let matchedWords = 0;
        queryWords.forEach(queryWord => {
          itemWords.forEach(itemWord => {
            if (itemWord.includes(queryWord) || queryWord.includes(itemWord)) {
              matchedWords++;
              score += 20;
            }
            // Partial word matching
            if (itemWord.length > 3 && queryWord.length > 3) {
              const commonLength = Math.min(itemWord.length, queryWord.length);
              const similarity = queryWord.substring(0, commonLength) === itemWord.substring(0, commonLength);
              if (similarity) {
                score += 10;
              }
            }
          });
        });
        
        // Bonus for matching most words
        if (matchedWords >= queryWords.length * 0.7) {
          score += 30;
        }
        
        // Check if query matches Facebook ID
        if (item.id.includes(normalizedQuery.replace(/\s+/g, ''))) {
          score += 50;
        }
        
        return { ...item, score };
      });
      
      // Filter and sort by score
      const filteredResults = scoredItems
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 10);
      
      // Build results with proper formatting
      const results = [];
      for (const item of filteredResults) {
        const facebookUrl = item.type === 'event' 
          ? `https://www.facebook.com/events/${item.id}`
          : `https://www.facebook.com/${item.id}`;
        const profilePictureUrl = item.type === 'page' 
          ? `https://graph.facebook.com/${item.id}/picture?type=large`
          : undefined;
        
        // For pages, verify the profile picture exists
        let isValidProfilePicture = false;
        if (item.type === 'page' && profilePictureUrl) {
          try {
            const response = await fetch(profilePictureUrl, { method: 'HEAD' });
            const contentType = response.headers.get('content-type');
            isValidProfilePicture = response.ok && (contentType?.startsWith('image/') || false);
          } catch (error) {
            // Profile picture doesn't exist
            isValidProfilePicture = false;
          }
        }
        
        results.push({
          id: item.id,
          name: item.name,
          url: facebookUrl,
          type: item.type,
          profilePicture: isValidProfilePicture ? profilePictureUrl : undefined,
          description: item.description || undefined,
          location: item.address,
          category: item.category,
          verified: true
        });
      }
      
      res.json({ data: results });
      
    } catch (error) {
      console.error('Facebook search error:', error);
      res.status(500).json({ error: 'Erreur lors de la recherche Facebook' });
    }
  });

  // Get saved venues for current user
  app.get('/api/venues/saved', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const venues = await db
        .select()
        .from(savedVenues)
        .where(eq(savedVenues.userId, userId))
        .orderBy(desc(savedVenues.lastUsed));

      res.json({ venues });
    } catch (error) {
      console.error('Error fetching saved venues:', error);
      res.status(500).json({ error: 'Failed to fetch saved venues' });
    }
  });

  // Save or update a venue
  app.post('/api/venues/save', isAuthenticated, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const venueData = insertSavedVenueSchema.parse(req.body);
      
      // Check if venue already exists for this user
      const existingVenue = await db
        .select()
        .from(savedVenues)
        .where(and(
          eq(savedVenues.userId, userId),
          eq(savedVenues.facebookId, venueData.facebookId || '')
        ))
        .limit(1);

      if (existingVenue.length > 0) {
        // Update use count and last used date
        const [updated] = await db
          .update(savedVenues)
          .set({
            useCount: (existingVenue[0].useCount || 0) + 1,
            lastUsed: new Date(),
            venueName: venueData.venueName, // Update in case venue name changed
            venueAddress: venueData.venueAddress,
            facebookUrl: venueData.facebookUrl,
            profilePictureUrl: venueData.profilePictureUrl,
            websiteUrl: venueData.websiteUrl,
            googleMapsUrl: venueData.googleMapsUrl,
          })
          .where(eq(savedVenues.id, existingVenue[0].id))
          .returning();

        res.json({ venue: updated, message: 'Venue usage updated' });
      } else {
        // Create new venue
        const [newVenue] = await db
          .insert(savedVenues)
          .values({
            ...venueData,
            userId,
          })
          .returning();

        res.json({ venue: newVenue, message: 'Venue saved successfully' });
      }
    } catch (error) {
      console.error('Error saving venue:', error);
      res.status(500).json({ error: 'Failed to save venue' });
    }
  });

  app.get("/api/places/venue-details", async (req, res) => {
    try {
      const { venueName, address } = req.query;
      
      if (!venueName || typeof venueName !== 'string') {
        return res.status(400).json({ error: 'venueName parameter is required' });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY_SERVER;
      if (!apiKey) {
        return res.json({ 
          facebookUrl: null,
          websiteUrl: null,
          message: 'API key not available - manual entry required'
        });
      }

      // First, search for the place using text search
      const searchQuery = address ? `${venueName} ${address}` : venueName;
      const searchUrl = new URL('https://maps.googleapis.com/maps/api/place/textsearch/json');
      searchUrl.searchParams.append('query', searchQuery);
      searchUrl.searchParams.append('key', apiKey);
      searchUrl.searchParams.append('language', 'fr');
      searchUrl.searchParams.append('region', 'ca');

      const searchResponse = await fetch(searchUrl.toString());
      const searchData = await searchResponse.json();

      if (searchData.status !== 'OK' || !searchData.results?.length) {
        return res.json({ 
          facebookUrl: null,
          websiteUrl: null,
          message: 'Venue not found in Google Places'
        });
      }

      // Get place details for the first result
      const placeId = searchData.results[0].place_id;
      const detailsUrl = new URL('https://maps.googleapis.com/maps/api/place/details/json');
      detailsUrl.searchParams.append('place_id', placeId);
      detailsUrl.searchParams.append('key', apiKey);
      detailsUrl.searchParams.append('fields', 'website,url,name,formatted_address,business_status,types');

      const detailsResponse = await fetch(detailsUrl.toString());
      const detailsData = await detailsResponse.json();

      if (detailsData.status !== 'OK') {
        return res.json({ 
          facebookUrl: null,
          websiteUrl: null,
          message: 'Could not fetch venue details'
        });
      }

      const result = detailsData.result || {};
      
      console.log('Venue details search results:', {
        placeName: searchData.results[0].name,
        placeId: searchData.results[0].place_id,
        website: result.website,
        url: result.url,
        types: result.types
      });
      
      // Extract Facebook URL if website contains facebook.com
      let facebookUrl = null;
      let websiteUrl = result.website || null;
      
      if (websiteUrl && websiteUrl.includes('facebook.com')) {
        facebookUrl = websiteUrl;
        websiteUrl = null; // Don't duplicate in website field
      }

      // If no website found, try to construct Facebook search URL
      if (!facebookUrl && !websiteUrl) {
        const cleanVenueName = venueName.replace(/[^\w\s]/g, '').trim();
        facebookUrl = `https://www.facebook.com/search/top?q=${encodeURIComponent(cleanVenueName)}`;
      }

      res.json({
        facebookUrl,
        websiteUrl,
        googleMapsUrl: result.url || null,
        placeName: searchData.results[0].name || venueName,
        debug: {
          searchQuery,
          foundPlace: searchData.results[0].name,
          hasWebsite: !!result.website
        }
      });

    } catch (error) {
      console.error('Venue details search error:', error);
      res.status(500).json({ 
        error: 'Internal server error',
        facebookUrl: null,
        websiteUrl: null
      });
    }
  });

  app.get("/api/places/autocomplete", async (req, res) => {
    try {
      const { input } = req.query;
      
      if (!input || typeof input !== 'string') {
        return res.status(400).json({ error: 'Input parameter is required' });
      }

      const apiKey = process.env.GOOGLE_PLACES_API_KEY_SERVER;
      console.log('API Key check:', apiKey ? 'Found' : 'Not found');
      if (!apiKey) {
        // Enhanced Quebec venues with real comedy and entertainment venues
        const quebecVenues = [
          // Comedy venues and bars
          `Le Bordel Comédie Club - Montréal, QC, Canada`,
          `Théâtre Corona - Montréal, QC, Canada`,
          `Le 164 - Saint-Jean-sur-Richelieu, QC, Canada`,
          `La Taverne Vieux-Chambly - Chambly, QC, Canada`,
          `Centre Bell - Montréal, QC, Canada`,
          `Théâtre St-Denis - Montréal, QC, Canada`,
          `Salle André-Mathieu - Laval, QC, Canada`,
          `Théâtre du Capitole - Québec, QC, Canada`,
          `L'Astral - Montréal, QC, Canada`,
          `Bar Le Ritz PDB - Montréal, QC, Canada`,
          // General format suggestions
          `${input} - Montréal, QC, Canada`,
          `${input} - Québec, QC, Canada`,
          `${input} - Laval, QC, Canada`,
          `${input} - Gatineau, QC, Canada`,
          `${input} - Longueuil, QC, Canada`,
          `${input} - Sherbrooke, QC, Canada`,
          `${input} - Trois-Rivières, QC, Canada`,
          `${input} - Saint-Jean-sur-Richelieu, QC, Canada`,
          `${input} - Chambly, QC, Canada`,
          `${input} - Granby, QC, Canada`
        ].filter(venue => venue.toLowerCase().includes(input.toLowerCase()))
         .slice(0, 5)
         .map((description, index) => ({
           description,
           place_id: `fallback_${index}`,
           structured_formatting: {
             main_text: description.split(' - ')[0],
             secondary_text: description.split(' - ')[1] || 'Québec, Canada'
           }
         }));

        return res.json({ 
          predictions: quebecVenues,
          status: 'FALLBACK_OK'
        });
      }

      const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      url.searchParams.append('input', input);
      url.searchParams.append('key', apiKey);
      url.searchParams.append('language', 'fr');
      url.searchParams.append('components', 'country:ca');
      url.searchParams.append('types', 'establishment|geocode');
      url.searchParams.append('location', '45.5017,-73.5673'); // Montreal coordinates
      url.searchParams.append('radius', '100000'); // 100km radius
      url.searchParams.append('strictbounds', 'false');

      const response = await fetch(url.toString());
      const data = await response.json();

      if (data.status === 'OK') {
        res.json({ predictions: data.predictions || [] });
      } else {
        console.log('Google Places API error:', data);
        // If API key has restrictions, fall back to Quebec venues
        if (data.status === 'REQUEST_DENIED') {
          const quebecVenues = [
            // Comedy venues and bars
            `Le Bordel Comédie Club - Montréal, QC, Canada`,
            `Théâtre Corona - Montréal, QC, Canada`,
            `Le 164 - Saint-Jean-sur-Richelieu, QC, Canada`,
            `La Taverne Vieux-Chambly - Chambly, QC, Canada`,
            `Centre Bell - Montréal, QC, Canada`,
            `Théâtre St-Denis - Montréal, QC, Canada`,
            `Salle André-Mathieu - Laval, QC, Canada`,
            `Théâtre du Capitole - Québec, QC, Canada`,
            `L'Astral - Montréal, QC, Canada`,
            `Bar Le Ritz PDB - Montréal, QC, Canada`,
            // General format suggestions
            `${input} - Montréal, QC, Canada`,
            `${input} - Québec, QC, Canada`,
            `${input} - Laval, QC, Canada`,
            `${input} - Gatineau, QC, Canada`,
            `${input} - Longueuil, QC, Canada`,
            `${input} - Sherbrooke, QC, Canada`,
            `${input} - Trois-Rivières, QC, Canada`,
            `${input} - Saint-Jean-sur-Richelieu, QC, Canada`,
            `${input} - Chambly, QC, Canada`,
            `${input} - Granby, QC, Canada`
          ].filter(venue => venue.toLowerCase().includes(input.toLowerCase()))
           .slice(0, 5)
           .map((description, index) => ({
             description,
             place_id: `fallback_${index}`,
             structured_formatting: {
               main_text: description.split(' - ')[0],
               secondary_text: description.split(' - ')[1] || 'Québec, Canada'
             }
           }));

          return res.json({ 
            predictions: quebecVenues,
            status: 'FALLBACK_USED',
            info_message: 'API key has restrictions - using Quebec venues fallback'
          });
        }
        res.json({ predictions: [] });
      }
    } catch (error) {
      console.error('Places API error:', error);
      res.status(500).json({ error: 'Failed to fetch places' });
    }
  });

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const user = req.user;
      res.json({
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl
      });
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      res.status(500).json({ message: "Échec de la récupération de l'utilisateur" });
    }
  });

  // Public events endpoint (for external websites)
  app.get("/api/public/events", async (req: any, res) => {
    try {
      // Add CORS headers for external access
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET');
      res.header('Access-Control-Allow-Headers', 'Content-Type');
      
      // Get all published events (not tied to specific user)
      const events = await storage.getPublishedEvents();
      
      // Transform dates to French format for display
      const eventsWithFrenchDates = events.map(event => ({
        ...event,
        displayDate: formatFrenchDate(event.date),
        displayCreatedAt: formatFrenchDate(event.createdAt),
        displayUpdatedAt: formatFrenchDate(event.updatedAt)
      }));
      
      res.json(eventsWithFrenchDates);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements publics:", error);
      res.status(500).json({ message: "Échec de la récupération des événements" });
    }
  });

  // Private events endpoint (requires authentication)
  // Public event route (no authentication required)
  app.get("/api/events/public/:id", async (req, res) => {
    try {
      const eventId = req.params.id;
      const event = await storage.getPublicEvent(eventId);
      
      if (!event) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }
      
      // Only return published events to public
      if (event.status !== 'published') {
        return res.status(404).json({ message: "Événement non disponible" });
      }

      res.json(event);
    } catch (error) {
      console.error("Erreur lors de la récupération de l'événement public:", error);
      res.status(500).json({ message: "Erreur serveur" });
    }
  });

  app.get("/api/events", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
      const events = await storage.getUserEvents(userId);
      
      // Transform dates to French format for display
      const eventsWithFrenchDates = events.map(event => ({
        ...event,
        displayDate: formatFrenchDate(event.date),
        displayCreatedAt: formatFrenchDate(event.createdAt),
        displayUpdatedAt: formatFrenchDate(event.updatedAt)
      }));
      
      res.json(eventsWithFrenchDates);
    } catch (error) {
      console.error("Erreur lors de la récupération des événements:", error);
      res.status(500).json({ message: "Échec de la récupération des événements" });
    }
  });

  app.get("/api/events/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
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
      
      const userId = (req as any).user.id;
      const eventData = insertEventSchema.parse(req.body);
      
      let calendarEventId = null;

      // Add to Google Calendar if requested
      if (eventData.addToCalendar) {
        try {
          console.log("Tentative d'ajout à Google Calendar pour:", eventData.title);
          
          // Vérifier si l'utilisateur a une intégration Google Calendar active
          const integrations = await storage.getUserCalendarIntegrations(userId);
          const googleIntegration = integrations.find(i => i.provider === 'google' && i.isActive);
          
          if (googleIntegration && googleIntegration.accessToken) {
            console.log("Found Google integration:", {
              id: googleIntegration.id,
              hasAccessToken: !!googleIntegration.accessToken,
              hasRefreshToken: !!googleIntegration.refreshToken,
              expiresAt: googleIntegration.expiresAt
            });
            
            const googleService = new GoogleCalendarService(
              googleIntegration.accessToken,
              googleIntegration.refreshToken || undefined
            );
            // Parse the date as date-only and set as all-day event
            const eventDate = new Date(eventData.date + 'T00:00:00'); // Start of day
            const endTime = new Date(eventData.date + 'T23:59:59'); // End of day
            
            console.log("Event date parsed:", eventDate);
            console.log("End time calculated:", endTime);
            
            calendarEventId = await googleService.createEvent({
              title: eventData.title,
              description: `Événement au ${eventData.venueName}`,
              startTime: eventDate,
              endTime: endTime,
              location: eventData.venue || ''
            });
            console.log("Succès ajout Google Calendar, ID:", calendarEventId);
          } else {
            console.log("Aucune intégration Google Calendar active trouvée pour l'utilisateur");
            calendarEventId = null;
          }
        } catch (calendarError: any) {
          console.error("Erreur détaillée lors de l'ajout au calendrier:", calendarError);
          console.error("Stack trace:", calendarError?.stack);
          // Continue without calendar integration
        }
      }

      const event = await storage.createEvent({
        ...eventData,
        userId,
        calendarEventId: calendarEventId || undefined,
      });



      let message = "Événement créé avec succès";
      if (eventData.addToCalendar) {
        message = calendarEventId 
          ? "Événement créé et ajouté à Google Calendar avec succès 🤠!"
          : "Événement créé. Pour l'ajouter à Google Calendar: allez dans Paramètres > Intégrations calendrier et connectez votre compte Google.";
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
      const userId = (req as any).user.id;
      const eventId = req.params.id;
      const eventData = updateEventSchema.parse(req.body);

      // Get the original event to check if it has a calendar event ID
      const originalEvent = await storage.getEvent(eventId, userId);
      if (!originalEvent) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }

      const event = await storage.updateEvent(eventId, userId, eventData);
      
      if (!event) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }

      let calendarUpdateMessage = "";

      // If the event was previously synced to Google Calendar, update it there too
      if (originalEvent.calendarEventId && eventData.addToCalendar !== false) {
        try {
          const integration = await storage.getActiveCalendarIntegration(userId, 'google');
          if (integration) {
            const googleCalendarService = new GoogleCalendarService(integration.accessToken, integration.refreshToken || undefined);
            const startTime = new Date(event.date);
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours duration

            const calendarEventData = {
              title: event.title,
              description: `Événement au ${event.venueName}`,
              startTime: startTime,
              endTime: endTime,
              location: event.venue
            };

            await googleCalendarService.updateEvent(
              originalEvent.calendarEventId,
              calendarEventData
            );

            calendarUpdateMessage = " et mis à jour dans Google Calendar";
          }
        } catch (calendarError) {
          console.error("Erreur lors de la mise à jour Google Calendar:", calendarError);
          calendarUpdateMessage = " (erreur lors de la mise à jour du calendrier)";
        }
      }

      // If adding to calendar for the first time
      if (eventData.addToCalendar && !originalEvent.calendarEventId) {
        try {
          const integration = await storage.getActiveCalendarIntegration(userId, 'google');
          if (integration) {
            const googleCalendarService = new GoogleCalendarService(integration.accessToken, integration.refreshToken || undefined);
            const startTime = new Date(event.date);
            const endTime = new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            const calendarEventData = {
              title: event.title,
              description: `Événement au ${event.venueName}`,
              startTime: startTime,
              endTime: endTime,
              location: event.venue
            };

            const calendarEventId = await googleCalendarService.createEvent(
              calendarEventData
            );

            // Note: calendarEventId would need to be added to updateEventSchema to be properly updated
            calendarUpdateMessage = " et ajouté à Google Calendar";
          }
        } catch (calendarError) {
          console.error("Erreur lors de l'ajout à Google Calendar:", calendarError);
        }
      }



      res.json({
        event,
        message: `Événement mis à jour avec succès${calendarUpdateMessage}`
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'événement:", error);
      res.status(400).json({ message: "Échec de la mise à jour de l'événement" });
    }
  });

  app.delete("/api/events/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
      const eventId = req.params.id;

      const success = await storage.deleteEvent(eventId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Événement non trouvé" });
      }



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
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(400).json({ message: "ID utilisateur manquant" });
      }
      
      const integrations = await storage.getUserCalendarIntegrations(userId);
      console.log(`Intégrations trouvées pour l'utilisateur ${userId}:`, integrations);
      res.json(integrations);
    } catch (error) {
      console.error("Erreur lors de la récupération des intégrations:", error);
      res.status(500).json({ 
        message: "Échec de la récupération des intégrations",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  // Alternative route for calendar-integrations page (legacy support)
  app.get("/api/calendar-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(400).json({ message: "ID utilisateur manquant" });
      }
      
      const integrations = await storage.getUserCalendarIntegrations(userId);
      console.log(`Intégrations (legacy route) pour l'utilisateur ${userId}:`, integrations);
      res.json(integrations);
    } catch (error) {
      console.error("Erreur lors de la récupération des intégrations (legacy):", error);
      res.status(500).json({ 
        message: "Échec de la récupération des intégrations",
        error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
      });
    }
  });

  app.post("/api/calendar/integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
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

  // Legacy support for calendar-integrations routes
  app.post("/api/calendar-integrations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
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

  app.patch("/api/calendar-integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
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
      console.error("Erreur lors de la mise à jour de l'intégration:", error);
      res.status(400).json({ message: "Échec de la mise à jour de l'intégration" });
    }
  });

  app.delete("/api/calendar-integrations/:id", isAuthenticated, async (req: any, res) => {
    try {
      const userId = (req as any).user.id;
      const integrationId = req.params.id;

      const success = await storage.deleteCalendarIntegration(integrationId, userId);
      
      if (!success) {
        return res.status(404).json({ message: "Intégration non trouvée" });
      }

      res.json({ message: "Intégration supprimée avec succès" });
    } catch (error) {
      console.error("Erreur lors de la suppression de l'intégration:", error);
      res.status(500).json({ message: "Échec de la suppression de l'intégration" });
    }
  });

  // Route pour initier l'authentification Google Calendar
  app.get("/api/auth/google", isAuthenticated, (req, res) => {
    try {
      // Configuration OAuth2 avec URL de callback pour Replit
      const callbackUrl = `https://evenements.replit.app/api/auth/google/callback`;
      
      console.log("Initiating Google OAuth with callback:", callbackUrl);
      console.log("User ID:", ((req as any).user as any).claims.sub);
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl
      );

      const scopes = ['https://www.googleapis.com/auth/calendar'];
      const url = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        state: ((req as any).user as any).claims.sub, // ID utilisateur pour associer le token
        prompt: 'consent', // Force consent screen pour obtenir refresh token
        include_granted_scopes: true, // For mobile compatibility
      });

      console.log("Redirecting to Google OAuth URL:", url);
      console.log("User-Agent:", req.get('User-Agent'));
      
      // Check if mobile device and handle accordingly
      const userAgent = req.get('User-Agent') || '';
      const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      if (isMobile) {
        // For mobile, we need to ensure the redirect works properly
        res.writeHead(302, {
          'Location': url,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        res.end();
      } else {
        res.redirect(url);
      }
    } catch (error) {
      console.error("Erreur lors de l'initiation OAuth Google:", error);
      res.redirect('/calendar-integrations?error=oauth-init-failed');
    }
  });

  // Route de callback Google OAuth
  app.get("/api/auth/google/callback", async (req: any, res) => {
    try {
      const { code, state, error } = req.query;
      
      console.log("Google OAuth callback received:");
      console.log("Code:", code ? "present" : "missing");
      console.log("State (User ID):", state);
      console.log("Error:", error);
      
      if (error) {
        console.error("Google OAuth error:", error);
        return res.redirect('/calendar-integrations?error=oauth-denied');
      }
      
      if (!code) {
        console.error("No authorization code received");
        return res.redirect('/calendar-integrations?error=no-code');
      }

      const userId = state; // ID utilisateur depuis le state
      if (!userId) {
        console.error("No user ID in state");
        return res.redirect('/calendar-integrations?error=no-user-id');
      }

      const callbackUrl = `https://evenements.replit.app/api/auth/google/callback`;
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        callbackUrl
      );

      console.log("Exchanging code for tokens...");
      const { tokens } = await oauth2Client.getToken(code as string);
      console.log("Tokens received:", {
        access_token: tokens.access_token ? "present" : "missing",
        refresh_token: tokens.refresh_token ? "present" : "missing",
        expiry_date: tokens.expiry_date
      });
      
      // Sauvegarder l'intégration calendrier avec le token
      const integration = await storage.createCalendarIntegration({
        userId: userId,
        provider: 'google',
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true,
      });

      console.log("Calendar integration created:", integration.id);
      res.redirect('/calendar-integrations?success=google-connected');
    } catch (error) {
      console.error('Erreur OAuth Google callback:', error);
      res.redirect('/calendar-integrations?error=oauth-failed');
    }
  });

  // Add logout route for compatibility
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Erreur lors de la déconnexion" });
      }
      res.clearCookie("connect.sid");
      res.redirect("/");
    });
  });

  const httpServer = createServer(app);
  


  return httpServer;
}