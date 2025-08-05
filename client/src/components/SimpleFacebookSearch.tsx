import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ExternalLink, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FacebookPage {
  id: string;
  name: string;
  url: string;
  profilePicture?: string;
  verified: boolean;
}

interface SimpleFacebookSearchProps {
  placeholder?: string;
  onPageSelected?: (page: FacebookPage) => void;
}

export function SimpleFacebookSearch({ placeholder, onPageSelected }: SimpleFacebookSearchProps) {
  const [query, setQuery] = useState("");
  const [pages, setPages] = useState<FacebookPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const searchPages = async (searchQuery: string) => {
    if (searchQuery.length < 2) {
      setPages([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/facebook/search?q=${encodeURIComponent(searchQuery)}&type=venues`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setPages(data.data);
        } else {
          setPages([]);
        }
      } else {
        setPages([]);
      }
    } catch (error) {
      console.log("Erreur de recherche:", error);
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setQuery(newValue);
    setShowResults(true);

    // Debounce la recherche
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      searchPages(newValue);
    }, 300);
  };

  const handlePageClick = (page: FacebookPage) => {
    // Copier le lien dans le presse-papiers
    navigator.clipboard.writeText(page.url).then(() => {
      toast({
        title: "Lien copié",
        description: `Le lien de "${page.name}" a été copié dans le presse-papiers`,
      });
    }).catch(() => {
      toast({
        title: "Page trouvée",
        description: `${page.name}`,
      });
    });

    if (onPageSelected) {
      onPageSelected(page);
    }

    setShowResults(false);
    setQuery(page.name);
  };

  const handleBlur = () => {
    // Délai pour permettre le clic
    setTimeout(() => {
      setShowResults(false);
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
    <div className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          ref={inputRef}
          value={query}
          onChange={handleInputChange}
          onBlur={handleBlur}
          onFocus={() => setShowResults(true)}
          placeholder={placeholder || "Rechercher une page Facebook (ex: Le Bordel, Centre Bell...)"}
          className="pl-10 pr-4 focus:ring-blue-500 focus:border-blue-500"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
        />
      </div>

      {showResults && (pages.length > 0 || isLoading) && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-sm text-gray-500 text-center flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
              Recherche en cours...
            </div>
          ) : pages.length === 0 ? (
            <div className="p-4 text-sm text-gray-500 text-center">
              <Search className="w-6 h-6 mx-auto mb-2 text-gray-300" />
              Aucune page trouvée
            </div>
          ) : (
            pages.map((page) => (
              <button
                key={page.id}
                type="button"
                className="w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0 transition-colors"
                onClick={() => handlePageClick(page)}
              >
                <div className="flex items-center">
                  {page.profilePicture ? (
                    <img
                      src={page.profilePicture}
                      alt={page.name}
                      className="w-10 h-10 rounded-full mr-3 flex-shrink-0 object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-blue-100 rounded-full mr-3 flex-shrink-0 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">
                        {page.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 truncate">
                        {page.name}
                      </span>
                      {page.verified && (
                        <div className="ml-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center mt-1">
                      <span className="text-xs text-gray-500 mr-2">Page Facebook</span>
                      <Copy className="w-3 h-3 text-blue-500" />
                      <span className="text-xs text-blue-500 ml-1">Cliquer pour copier</span>
                    </div>
                  </div>
                  
                  <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}