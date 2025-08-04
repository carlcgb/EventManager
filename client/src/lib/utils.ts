import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatFrenchDate(date: Date | string | null): string {
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

// Function to extract venue name from Google Places description
export function extractVenueName(description: string): string {
  // Comprehensive Quebec venues database
  const knownVenues = [
    // Comedy clubs
    { pattern: /le bordel com[eé]die club/i, name: 'Le Bordel Comédie Club' },
    { pattern: /le bordel/i, name: 'Le Bordel' },
    { pattern: /le foutoir/i, name: 'Le Foutoir' },
    { pattern: /comedy nest/i, name: 'Comedy Nest' },
    { pattern: /comedy works/i, name: 'Comedy Works' },
    
    // Bars and pubs - Montreal
    { pattern: /bar le raymond/i, name: 'Bar Le Raymond' },
    { pattern: /saint[- ]?bock/i, name: 'Saint-Bock' },
    { pattern: /le r[eé]servoir/i, name: 'Le Réservoir' },
    { pattern: /le dieu du ciel/i, name: 'Le Dieu du Ciel' },
    { pattern: /brutopia/i, name: 'Brutopia' },
    { pattern: /pub quartier latin/i, name: 'Pub Quartier Latin' },
    { pattern: /chez serge/i, name: 'Chez Serge' },
    { pattern: /bistro le mythos/i, name: 'Bistro Le Mythos' },
    { pattern: /pub st[- ]?patrick/i, name: 'Pub St-Patrick' },
    { pattern: /mckibbin'?s/i, name: "McKibbin's Irish Pub" },
    { pattern: /hurley'?s/i, name: "Hurley's Irish Pub" },
    { pattern: /le warehouse/i, name: 'Le Warehouse' },
    { pattern: /bily kun/i, name: 'Bily Kun' },
    { pattern: /pub île noire/i, name: 'Pub Île Noire' },
    { pattern: /saint[- ]?sulpice/i, name: 'Saint-Sulpice' },
    { pattern: /cock'?n'?bull/i, name: "Cock'n'Bull" },
    { pattern: /ye olde orchard/i, name: 'Ye Olde Orchard' },
    { pattern: /sir winston churchill/i, name: 'Sir Winston Churchill Complex' },
    { pattern: /rouge bar/i, name: 'Rouge Bar' },
    { pattern: /newtown/i, name: 'Newtown' },
    { pattern: /altitude 737/i, name: 'Altitude 737' },
    { pattern: /terrasse place d'?armes/i, name: "Terrasse Place d'Armes" },
    { pattern: /pub l'?île noire/i, name: "Pub l'Île Noire" },
    
    // Quebec City
    { pattern: /loup garou/i, name: 'Loup Garou' },
    { pattern: /chez maurice/i, name: 'Chez Maurice' },
    { pattern: /korrigann pub/i, name: 'Korrigann Pub' },
    { pattern: /pub du faubourg/i, name: 'Pub du Faubourg' },
    { pattern: /sacr[eé][- ]?c[oœ]ur pub/i, name: 'Sacré-Cœur Pub' },
    { pattern: /pub thomas dunn/i, name: 'Pub Thomas Dunn' },
    { pattern: /pub saint[- ]?alexandre/i, name: 'Pub Saint-Alexandre' },
    { pattern: /aviatic club/i, name: 'Aviatic Club' },
    { pattern: /pub universitaire/i, name: 'Pub Universitaire' },
    
    // Breweries
    { pattern: /unibroue/i, name: 'Unibroue' },
    { pattern: /dieu du ciel/i, name: 'Dieu du Ciel' },
    { pattern: /benelux/i, name: 'Benelux' },
    { pattern: /brasserie harricana/i, name: 'Brasserie Harricana' },
    { pattern: /brasserie pit caribou/i, name: 'Brasserie Pit Caribou' },
    
    // Music venues
    { pattern: /club soda/i, name: 'Club Soda' },
    { pattern: /house of targ/i, name: 'House of Targ' },
    { pattern: /corona theatre/i, name: 'Corona Theatre' },
    { pattern: /olympia/i, name: 'Théâtre Olympia' },
    { pattern: /métropolis/i, name: 'Métropolis' },
    { pattern: /virgin mobile corona/i, name: 'Virgin Mobile Corona Theatre' },
    
    // Restaurants with events
    { pattern: /resto[- ]?bar/i, name: 'Resto-Bar' },
    { pattern: /brasserie t!/i, name: 'Brasserie T!' },
    { pattern: /modav[kz]/i, name: 'Modavie' },
    { pattern: /vieux[- ]?port steakhouse/i, name: 'Vieux-Port Steakhouse' },
  ];

  // First check known venues
  for (const venue of knownVenues) {
    if (venue.pattern.test(description)) {
      return venue.name;
    }
  }

  // Advanced generic patterns for extracting venue names
  const genericPatterns = [
    // Match venue types followed by name
    /(?:bar|pub|restaurant|bistro|caf[eé]|brasserie|club|lounge|taverne)\s+([^,\-\n]{2,40}?)(?:\s*[,\-\n]|$)/i,
    
    // Match name followed by venue type
    /([^,\-\n]{2,40}?)\s+(?:bar|pub|restaurant|bistro|caf[eé]|brasserie|club|lounge|taverne)(?:\s*[,\-\n]|$)/i,
    
    // Match "Le/La/Les NAME"
    /\b(?:le|la|les)\s+([^,\-\n]{2,30}?)(?:\s*[,\-\n]|$)/i,
    
    // Match "Chez NAME"
    /\bchez\s+([^,\-\n]{2,30}?)(?:\s*[,\-\n]|$)/i,
    
    // Match quoted venue names
    /"([^"]{2,40})"/,
    
    // Match first meaningful part (not just numbers or addresses)
    /^([^,\-\n0-9]{3,40}?)(?:\s*[,\-\n]|$)/,
    
    // Match anything before address numbers
    /^([^,\-\n]{3,40}?)\s*\d+/,
    
    // Match business names in parentheses
    /\(([^)]{3,40})\)/,
  ];

  for (const pattern of genericPatterns) {
    const match = description.match(pattern);
    if (match && match[1]) {
      let name = match[1].trim();
      
      // Clean up the extracted name
      name = name.replace(/\s+/g, ' '); // normalize spaces
      name = name.replace(/['"]/g, ''); // remove quotes
      
      // Filter out common non-venue words and patterns
      const excludePatterns = [
        /^\d+$/, // just numbers
        /^(rue|avenue|boulevard|street|road|qu[eé]bec|montr[eé]al|canada|qc|ontario|on)$/i,
        /^(the|and|et|de|du|des|la|le|les|un|une)$/i,
        /^(north|south|east|west|nord|sud|est|ouest)$/i,
        /^(auto|gas|station|parking|metro|bus)$/i,
        /^\w{1,2}$/, // too short
      ];
      
      const isValid = !excludePatterns.some(pattern => pattern.test(name)) && 
                     name.length >= 3 && 
                     name.length <= 50 &&
                     !/^\d+/.test(name); // doesn't start with number
      
      if (isValid) {
        // Capitalize first letter of each word
        return name.replace(/\b\w/g, l => l.toUpperCase());
      }
    }
  }

  return '';
}
