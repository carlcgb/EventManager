import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";

interface VenueInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface PlacePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text: string;
  };
}

export function VenueInput({ value, onChange, placeholder }: VenueInputProps) {
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
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder || "Entrez l'adresse du lieu"}
          className="pl-10 focus:ring-western-brown focus:border-western-brown"
        />
      </div>

      {showSuggestions && (suggestions.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-western-brown mr-2"></div>
              Recherche en cours...
            </div>
          ) : suggestions.length === 0 ? (
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
          )}
        </div>
      )}
    </div>
  );
}