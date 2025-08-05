import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin, Calendar } from "lucide-react";
import { extractVenueName } from "@/lib/utils";

interface VenueInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onVenueNameExtracted?: (venueName: string) => void;
}

interface FacebookEvent {
  id: string;
  name: string;
  venue: string;
  date: string;
  type: string;
  facebookUrl: string;
  searchType: 'event';
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export function VenueInput({ value, onChange, placeholder, onVenueNameExtracted }: VenueInputProps) {
  const [suggestions, setSuggestions] = useState<PlacePrediction[]>([]);
  const [events, setEvents] = useState<FacebookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchMode, setSearchMode] = useState<'venues' | 'events'>('venues');
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      if (searchMode === 'venues') {
        // Use our backend proxy for Google Places API
        const response = await fetch(
          `/api/places/autocomplete?input=${encodeURIComponent(query)}`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.predictions && Array.isArray(data.predictions)) {
            setSuggestions(data.predictions);
            setEvents([]);
            if (data.info_message) {
              console.log('Places API info:', data.info_message);
            }
          } else {
            console.log('No predictions received:', data);
            setSuggestions([]);
            setEvents([]);
          }
        } else {
          console.log('Places API proxy error:', response.status);
          setSuggestions([]);
          setEvents([]);
        }
      } else {
        // Search Facebook events
        const response = await fetch(
          `/api/facebook/search?q=${encodeURIComponent(query)}&type=events`
        );

        if (response.ok) {
          const data = await response.json();
          if (data.data && Array.isArray(data.data)) {
            setEvents(data.data);
            setSuggestions([]);
          } else {
            setEvents([]);
            setSuggestions([]);
          }
        } else {
          console.log('Facebook events search error:', response.status);
          setEvents([]);
          setSuggestions([]);
        }
      }
    } catch (error) {
      console.log("Search error:", error);
      setSuggestions([]);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowSuggestions(true);

    // Debounce the search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchPlaces(newValue);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: PlacePrediction) => {
    onChange(suggestion.description);
    setSuggestions([]);
    setEvents([]);
    setShowSuggestions(false);
    
    // Auto-extract venue name from selected address using enhanced function
    if (onVenueNameExtracted) {
      // Try the enhanced extraction function first
      let extractedName = extractVenueName(suggestion.description);
      
      // If that doesn't work, try the legacy method
      if (!extractedName) {
        extractedName = extractVenueNameFromAddress(suggestion);
      }
      
      if (extractedName && extractedName.length > 2) {
        onVenueNameExtracted(extractedName);
      }
    }
  };

  const handleEventClick = (event: FacebookEvent) => {
    onChange(`${event.name} (${event.venue})`);
    setSuggestions([]);
    setEvents([]);
    setShowSuggestions(false);
    
    // Extract venue name from Facebook event
    if (onVenueNameExtracted && event.venue) {
      onVenueNameExtracted(event.venue);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-CA', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    }).toUpperCase();
  };

  // Helper function to extract venue name from suggestion
  const extractVenueNameFromAddress = (suggestion: PlacePrediction): string => {
    // Priority 1: Use structured formatting main text if available
    if (suggestion.structured_formatting?.main_text) {
      const mainText = suggestion.structured_formatting.main_text;
      
      // Skip if it's just a generic location (city, province, etc.)
      if (isGenericLocation(mainText)) {
        return '';
      }
      
      return mainText;
    }
    
    // Priority 2: Extract from the description string
    const parts = suggestion.description.split(',');
    if (parts.length > 1) {
      const potentialVenueName = parts[0].trim();
      
      // Check if it looks like a venue name
      if (isValidVenueName(potentialVenueName)) {
        return potentialVenueName;
      }
    }
    
    return '';
  };

  // Helper to check if text is a generic location
  const isGenericLocation = (text: string): boolean => {
    const genericTerms = [
      'montréal', 'québec', 'laval', 'gatineau', 'longueuil', 'sherbrooke',
      'trois-rivières', 'chambly', 'granby', 'terrebonne', 'montreal', 'quebec'
    ];
    return genericTerms.some(term => text.toLowerCase().includes(term));
  };

  // Helper to validate if text looks like a venue name
  const isValidVenueName = (text: string): boolean => {
    return Boolean(text && 
           !text.match(/^\d/) && // Doesn't start with a number
           text.length > 3 && // Reasonable length
           !text.toLowerCase().includes('rue ') &&
           !text.toLowerCase().includes('avenue ') &&
           !text.toLowerCase().includes('boulevard ') &&
           !text.toLowerCase().includes('chemin ') &&
           !isGenericLocation(text));
  };

  const handleBlur = () => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      {/* Search Mode Toggle */}
      <div className="flex mb-2 rounded-lg bg-gray-100 p-1">
        <Button
          type="button"
          variant={searchMode === 'venues' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setSearchMode('venues');
            setSuggestions([]);
            setEvents([]);
          }}
          className="flex-1 text-sm"
        >
          <MapPin className="w-4 h-4 mr-1" />
          Lieux
        </Button>
        <Button
          type="button"
          variant={searchMode === 'events' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => {
            setSearchMode('events');
            setSuggestions([]);
            setEvents([]);
          }}
          className="flex-1 text-sm"
        >
          <Calendar className="w-4 h-4 mr-1" />
          Événements
        </Button>
      </div>

      <div className="relative">
        {searchMode === 'venues' ? (
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        ) : (
          <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500 w-4 h-4" />
        )}
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          placeholder={
            searchMode === 'venues' 
              ? (placeholder || "Entrez l'adresse du lieu")
              : "Rechercher des événements Facebook (ex: comédie montréal)"
          }
          className="pl-10 focus:ring-western-brown focus:border-western-brown"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>

      {showSuggestions && ((suggestions.length > 0 || events.length > 0) || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-western-brown mr-2"></div>
              {searchMode === 'venues' ? 'Recherche en cours...' : 'Recherche d\'événements...'}
            </div>
          ) : searchMode === 'venues' ? (
            // Venue suggestions
            suggestions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Aucune suggestion trouvée
              </div>
            ) : (
              suggestions.map((suggestion) => (
                <button
                  key={suggestion.place_id}
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      {suggestion.structured_formatting ? (
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {suggestion.structured_formatting.main_text}
                          </div>
                          <div className="text-xs text-gray-500">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-700">{suggestion.description}</span>
                      )}
                    </div>
                  </div>
                </button>
              ))
            )
          ) : (
            // Event suggestions
            events.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Aucun événement trouvé
              </div>
            ) : (
              events.map((event) => (
                <button
                  key={event.id}
                  type="button"
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                  onClick={() => handleEventClick(event)}
                >
                  <div className="flex items-start">
                    <Calendar className="w-4 h-4 text-purple-500 mr-3 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900 mb-1">
                        {event.name}
                      </div>
                      <div className="flex items-center text-xs text-gray-500 mb-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {event.venue}
                      </div>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{formatDate(event.date)}</span>
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                          {event.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )
          )}
        </div>
      )}
    </div>
  );
}