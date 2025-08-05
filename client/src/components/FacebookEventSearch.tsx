import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Clock } from "lucide-react";

interface FacebookEvent {
  id: string;
  name: string;
  venue: string;
  date: string;
  type: string;
  facebookUrl: string;
  searchType: 'event';
}

interface FacebookEventSearchProps {
  value: string;
  onChange: (value: string) => void;
  onEventSelected?: (event: FacebookEvent) => void;
  placeholder?: string;
}

export function FacebookEventSearch({ value, onChange, onEventSelected, placeholder }: FacebookEventSearchProps) {
  const [events, setEvents] = useState<FacebookEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const searchEvents = async (query: string) => {
    if (query.length < 2) {
      setEvents([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/facebook/search?q=${encodeURIComponent(query)}&type=events`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setEvents(data.data);
        } else {
          setEvents([]);
        }
      } else {
        console.log('Facebook events search error:', response.status);
        setEvents([]);
      }
    } catch (error) {
      console.log("Facebook events search error:", error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setShowEvents(true);

    // Debounce the search
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchEvents(newValue);
    }, 300);
  };

  const handleEventClick = (event: FacebookEvent) => {
    onChange(event.name);
    setEvents([]);
    setShowEvents(false);
    
    if (onEventSelected) {
      onEventSelected(event);
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

  const handleBlur = () => {
    // Delay hiding events to allow clicking
    setTimeout(() => {
      setShowEvents(false);
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
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowEvents(true)}
          placeholder={placeholder || "Rechercher des événements Facebook"}
          className="pl-10 focus:ring-western-brown focus:border-western-brown"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>

      {showEvents && (events.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="p-3 text-sm text-gray-500 text-center flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-western-brown mr-2"></div>
              Recherche d'événements...
            </div>
          ) : events.length === 0 ? (
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
                      <Clock className="w-3 h-3 mr-1" />
                      {formatDate(event.date)}
                      <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs">
                        {event.type}
                      </span>
                    </div>
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