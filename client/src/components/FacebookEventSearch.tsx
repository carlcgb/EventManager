import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

interface FacebookResult {
  id: string;
  name: string;
  url: string;
  type: 'page' | 'event';
  profilePicture?: string;
  description?: string;
  location?: string;
  category?: string;
  ticketUrl?: string;
  facebookUrl?: string;
}

interface FacebookEventSearchProps {
  eventTitle?: string;
  venueName?: string;
  onSelect?: (result: FacebookResult) => void;
}

export function FacebookEventSearch({ eventTitle, venueName, onSelect }: FacebookEventSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<FacebookResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const searchFacebook = async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(`/api/facebook/search?q=${encodeURIComponent(query)}&type=all`);
      
      if (response.ok) {
        const data = await response.json();
        setResults(data.data || []);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(false);
      }
    } catch (error) {
      console.error('Facebook search error:', error);
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelect = (result: FacebookResult) => {
    onSelect?.(result);
    setSearchQuery(result.name);
    setShowResults(false);
    
    toast({
      title: "Page Facebook sélectionnée",
      description: `${result.name} ajoutée à votre événement`,
    });
  };

  const quickSearch = (searchTerm: string) => {
    setSearchQuery(searchTerm);
    searchFacebook(searchTerm);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <FormLabel className="text-sm font-medium text-gray-700 flex items-center">
          <i className="fab fa-facebook text-blue-600 mr-2"></i>
          Recherche Facebook
        </FormLabel>
        <div className="flex gap-2">
          {eventTitle && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => quickSearch(eventTitle)}
            >
              <i className="fas fa-search mr-1"></i>
              Événement
            </Button>
          )}
          {venueName && (
            <Button
              type="button"
              variant="outline" 
              size="sm"
              className="text-xs h-7"
              onClick={() => quickSearch(venueName)}
            >
              <i className="fas fa-map-marker-alt mr-1"></i>
              Lieu
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <div className="relative">
          <i className="fab fa-facebook text-blue-600 absolute left-3 top-1/2 transform -translate-y-1/2 z-10"></i>
          <Input
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              searchFacebook(e.target.value);
            }}
            placeholder="Rechercher une page ou un événement Facebook..."
            className="pl-10 pr-10"
            onFocus={() => {
              if (searchQuery.length > 1) {
                searchFacebook(searchQuery);
              }
            }}
            onBlur={() => {
              setTimeout(() => setShowResults(false), 200);
            }}
          />
          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>

        {/* Results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto">
            <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
              <i className="fab fa-facebook text-blue-600 mr-1"></i>
              {results.length} résultat{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
            </div>
            {results.map((result, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                onClick={() => handleSelect(result)}
              >
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                    {result.profilePicture ? (
                      <img
                        src={result.profilePicture}
                        alt={result.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className={`${result.type === 'event' ? 'fas fa-calendar' : 'fab fa-facebook'} text-blue-600`}></i>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {result.name}
                      </div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        result.type === 'event' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {result.type === 'event' ? 'Événement' : 'Page'}
                      </span>
                    </div>
                    {result.description && (
                      <div className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {result.description}
                      </div>
                    )}
                    {result.location && (
                      <div className="text-xs text-gray-400 mt-1 flex items-center">
                        <i className="fas fa-map-marker-alt mr-1"></i>
                        {result.location}
                      </div>
                    )}
                    {result.category && (
                      <div className="text-xs text-blue-600 mt-1">
                        {result.category}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {showResults && results.length === 0 && !isSearching && searchQuery.length > 1 && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
            <div className="p-4 text-center text-gray-500">
              <i className="fas fa-search text-gray-400 mb-2"></i>
              <div className="text-sm">Aucun résultat trouvé</div>
              <div className="text-xs mt-1">Essayez un autre terme de recherche</div>
            </div>
          </div>
        )}
      </div>

      {/* Quick search suggestions */}
      <div className="text-xs text-gray-500">
        <strong>Astuce:</strong> Recherchez le nom de votre événement ou du lieu pour trouver la page Facebook correspondante
      </div>
    </div>
  );
}