import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { extractVenueName } from "@/lib/utils";

interface VenueInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onVenueNameExtracted?: (venueName: string) => void;
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
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchPlaces = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);
    try {
      // Use our backend proxy for Google Places API
      const response = await fetch(
        `/api/places/autocomplete?input=${encodeURIComponent(query)}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.predictions && Array.isArray(data.predictions)) {
          setSuggestions(data.predictions);
          if (data.info_message) {
            console.log('Places API info:', data.info_message);
          }
        } else {
          console.log('No predictions received:', data);
          setSuggestions([]);
        }
      } else {
        console.log('Places API proxy error:', response.status);
        setSuggestions([]);
      }
    } catch (error) {
      console.log("Places API proxy error:", error);
      setSuggestions([]);
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
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-300 w-4 h-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || "Entrez l'adresse du lieu"}
          className="pl-10 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:bg-white/30 rounded-lg"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>

      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-purple-200 text-center flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-400 mr-2"></div>
              Recherche en cours...
            </div>
          ) : suggestions.length === 0 ? (
            <div className="p-3 text-sm text-purple-200 text-center">
              Aucune suggestion trouvée
            </div>
          ) : (
            suggestions.map((suggestion) => (
              <button
              key={suggestion.place_id}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-white/10 focus:bg-white/10 focus:outline-none border-b border-white/10 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <div className="flex items-center">
                <MapPin className="w-4 h-4 text-purple-300 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  {suggestion.structured_formatting ? (
                    <div>
                      <div className="text-sm font-medium text-white">
                        {suggestion.structured_formatting.main_text}
                      </div>
                      <div className="text-xs text-purple-200">
                        {suggestion.structured_formatting.secondary_text}
                      </div>
                    </div>
                  ) : (
                    <span className="text-sm text-white">{suggestion.description}</span>
                  )}
                </div>
              </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}