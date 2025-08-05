import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Event } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { formatFrenchDate } from "@/lib/utils";
import { extractCityFromAddress, extractVenueNameFromAddress } from "@shared/utils";
import { VenueInput } from "@/components/VenueInput";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import EditEventDialog from "@/components/EditEventDialog";

const eventFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  venueName: z.string().min(1, "Le nom du bar/lieu est requis"),
  venue: z.string().min(1, "L'adresse est requise"),
  date: z.string().min(1, "La date est requise"),
  ticketsUrl: z.string().url("L'URL doit être valide").optional().or(z.literal("")),
  facebookId: z.string().optional(),
  addToCalendar: z.boolean().default(true),
  sendNotification: z.boolean().default(false),
});

type EventFormData = z.infer<typeof eventFormSchema>;

export default function Home() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isSearchingFacebook, setIsSearchingFacebook] = useState(false);
  const [venueOptions, setVenueOptions] = useState<{
    facebookUrl?: string;
    websiteUrl?: string;
    placeName?: string;
  }>({});
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [facebookSearchSuggestions, setFacebookSearchSuggestions] = useState<any[]>([]);
  const [showFacebookSuggestions, setShowFacebookSuggestions] = useState(false);
  const [facebookSearchQuery, setFacebookSearchQuery] = useState('');
  const [savedVenues, setSavedVenues] = useState<any[]>([]);
  const [showSavedVenues, setShowSavedVenues] = useState(false);
  const [isOptionsExpanded, setIsOptionsExpanded] = useState(false);

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      venueName: "",
      venue: "",
      date: "",
      ticketsUrl: "",
      facebookId: "",
      addToCalendar: true,
      sendNotification: false,
    },
  });

  // Fetch real events and stats from API
  const { data: events = [], isLoading: eventsLoading } = useQuery<Event[]>({
    queryKey: ["/api/events"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 2;
    },
  });

  const { data: stats = { monthlyEvents: 0, publishedEvents: 0, pendingEvents: 0 }, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/events/stats"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 2;
    },
  });

  // Load saved venues on component mount
  useEffect(() => {
    fetchSavedVenues();
  }, []);

  // Create event mutation with real API
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData & { city: string }) => {
      const eventData = {
        ...data,
        date: data.date, // Send date as-is since it's now date-only
      };
      
      const response = await apiRequest("POST", "/api/events", eventData);
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Événement créé !",
        description: (data as any)?.message || "Événement créé avec succès",
      });
      form.reset();
      // Refresh events and stats
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/stats"] });
    },
    onError: (error: Error) => {
      console.error("Erreur complète:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: error.message || "Impossible de créer l'événement. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  // Function to search for venue details and auto-fill social media links
  const searchVenueDetails = async (venueName: string, venueAddress?: string) => {
    setIsSearchingFacebook(true);
    try {
      const params = new URLSearchParams({ venueName });
      if (venueAddress) {
        params.append('address', venueAddress);
      }
      
      const response = await fetch(`/api/places/venue-details?${params}`);
      const data = await response.json();
      
      console.log('Venue details response:', data);
      
      // Store the venue options for the dropdown
      setVenueOptions({
        facebookUrl: data.facebookUrl && !data.facebookUrl.includes('/search/') ? data.facebookUrl : undefined,
        websiteUrl: data.websiteUrl,
        placeName: data.placeName || venueName
      });
      
      // Auto-fill Facebook ID field with venue name for easy editing
      const cleanVenueName = (data.placeName || venueName)
        .toLowerCase()
        .replace(/[^\w\s]/g, '') // Remove special characters
        .replace(/\s+/g, '') // Remove spaces
        .replace(/^(le|la|les|du|des|de|d)\s*/i, ''); // Remove French articles
      
      if (cleanVenueName) {
        form.setValue('facebookId', cleanVenueName);
      }
      
      // Auto-select the best URL option
      let selectedUrl = '';
      let urlType = '';
      
      if (data.facebookUrl && !data.facebookUrl.includes('/search/')) {
        selectedUrl = data.facebookUrl;
        urlType = 'Facebook';
      } else if (data.websiteUrl) {
        selectedUrl = data.websiteUrl;
        urlType = 'Site web';
      } else if (cleanVenueName) {
        // If no official page found, pre-fill with Facebook URL from the ID
        selectedUrl = `https://www.facebook.com/${cleanVenueName}`;
        urlType = 'Facebook (suggéré)';
        setPreviewUrl(selectedUrl);
      }
      
      if (selectedUrl) {
        form.setValue('ticketsUrl', selectedUrl);
        toast({
          title: `${urlType} trouvé`,
          description: `Lien ajouté automatiquement pour ${data.placeName || venueName}`,
        });
      }
    } catch (error) {
      console.log('Could not fetch venue details:', error);
    } finally {
      setIsSearchingFacebook(false);
    }
  };

  // Function to get Facebook profile picture
  const getFacebookProfilePicture = (facebookId: string) => {
    return `https://graph.facebook.com/${facebookId}/picture?type=large`;
  };

  // Function to search Facebook pages
  const searchFacebookPages = async (query: string) => {
    if (query.length < 2) {
      setFacebookSearchSuggestions([]);
      return;
    }
    
    setIsSearchingFacebook(true);
    try {
      // First, filter saved venues that match the query
      const matchingSavedVenues = savedVenues.filter(venue => 
        venue.venueName.toLowerCase().includes(query.toLowerCase())
      ).map(venue => ({
        id: venue.facebookId || '',
        name: venue.venueName,
        url: venue.facebookUrl || '',
        profilePicture: venue.profilePictureUrl || '',
        verified: true,
        isSaved: true
      }));

      // Then search for new Facebook pages
      const response = await fetch(`/api/facebook/search?q=${encodeURIComponent(query)}`);
      let newPages = [];
      
      if (response.ok) {
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          // Filter out pages that are already saved
          const savedIds = savedVenues.map(v => v.facebookId).filter(Boolean);
          newPages = data.data.filter((page: any) => !savedIds.includes(page.id));
        }
      }

      // Combine saved venues (first) and new pages
      const allSuggestions = [...matchingSavedVenues, ...newPages];
      setFacebookSearchSuggestions(allSuggestions);
      
    } catch (error) {
      console.error('Facebook search error:', error);
      setFacebookSearchSuggestions([]);
    } finally {
      setIsSearchingFacebook(false);
    }
  };

  // Function to fetch saved venues
  const fetchSavedVenues = async () => {
    try {
      const response = await fetch('/api/venues/saved');
      if (response.ok) {
        const data = await response.json();
        setSavedVenues(data.venues || []);
      }
    } catch (error) {
      console.error('Error fetching saved venues:', error);
    }
  };

  // Function to save a venue
  const saveVenue = async (venueData: any) => {
    try {
      const response = await fetch('/api/venues/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venueData),
      });
      
      if (response.ok) {
        await fetchSavedVenues(); // Refresh the list
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error saving venue:', error);
      return false;
    }
  };

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      // Extract city from the venue address
      const city = extractCityFromAddress(data.venue);
      
      const eventData = {
        ...data,
        city: city
      };
      
      console.log("Données soumises:", eventData);
      await createEventMutation.mutateAsync(eventData);
      
      // Save venue after successful event creation
      if (data.venueName && data.venue) {
        const venueData = {
          venueName: data.venueName,
          venueAddress: data.venue,
          facebookId: data.facebookId || null,
          facebookUrl: data.ticketsUrl?.includes('facebook.com') ? data.ticketsUrl : null,
        };
        await saveVenue(venueData);
      }
    } catch (error) {
      console.error("Erreur onSubmit:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    window.location.href = '/api/logout';
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleEditFromModal = (event: Event) => {
    setEditingEvent(event);
    setIsDetailsModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-western-brown"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black/30 backdrop-blur-[1px]">
      {/* Navigation Header */}
      <header className="bg-western-dark shadow-western-lg border-b-4 border-western-brown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-western-brown rounded-full flex items-center justify-center">
                <i className="fas fa-hat-cowboy text-western-beige text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-western-beige">Sam Hébert</h1>
                <p className="text-western-sand text-sm">Gestionnaire d'Événements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Event Statistics - Discrete */}
              <div className="hidden lg:flex items-center space-x-3 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-calendar-week text-western-brown"></i>
                  <span className="text-western-dark font-medium">
                    {statsLoading ? '...' : (stats as any)?.monthlyEvents || 0}
                  </span>
                  <span className="text-gray-500">ce mois</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-globe text-western-success"></i>
                  <span className="text-western-dark font-medium">
                    {statsLoading ? '...' : (stats as any)?.publishedEvents || 0}
                  </span>
                  <span className="text-gray-500">publiés</span>
                </div>
                <div className="w-px h-4 bg-gray-300"></div>
                <div className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-clock text-western-warning"></i>
                  <span className="text-western-dark font-medium">
                    {statsLoading ? '...' : (stats as any)?.pendingEvents || 0}
                  </span>
                  <span className="text-gray-500">en attente</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-2 bg-western-brown/20 px-4 py-2 rounded-lg">
                <i className="fas fa-user-circle text-western-sand"></i>
                <span className="text-western-beige font-medium">
                  {(user as any)?.firstName || (user as any)?.email || 'Utilisateur'}
                </span>
              </div>
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="bg-western-danger hover:bg-red-700 flex items-center space-x-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">


        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Event Creation Form */}
          <div className="xl:col-span-2">
            <Card className="shadow-western-lg overflow-hidden card-blur">
              <CardHeader className="bg-gradient-to-r from-western-brown to-western-chocolate text-white">
                <CardTitle className="text-2xl font-bold flex items-center text-western-beige">
                  <i className="fas fa-plus-circle mr-3"></i>
                  Créer un Nouvel Événement
                </CardTitle>
                <p className="text-western-sand mt-2">
                  Ajoutez un événement à votre calendrier et publiez-le sur votre site web
                </p>
              </CardHeader>
              
              <CardContent className="p-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-heading text-western-brown mr-2"></i>
                            Titre de l'événement
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Spectacle d'humour au Théâtre Corona"
                              className="border-2 border-gray-200 focus:border-western-brown"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-map-marker-alt text-western-brown mr-2"></i>
                            Adresse complète
                          </FormLabel>
                          <FormControl>
                            <VenueInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Ex: Théâtre Corona, Montréal"
                              onVenueNameExtracted={(extractedName) => {
                                // Always replace the venue name when address changes
                                form.setValue('venueName', extractedName);
                                // Clear previous Facebook ID and URL
                                form.setValue('facebookId', '');
                                form.setValue('ticketsUrl', '');
                                setPreviewUrl('');
                                setVenueOptions({});
                                // Search for Facebook page with the extracted venue name
                                searchVenueDetails(extractedName, field.value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="venueName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-store text-western-brown mr-2"></i>
                            Nom du bar/lieu
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: La Taverne Vieux-Chambly, Le Bordel Comédie Club..."
                              className="border-2 border-gray-200 focus:border-western-brown"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center justify-between">
                            <span className="flex items-center">
                              <i className="fas fa-calendar text-western-brown mr-2"></i>
                              Date
                            </span>
                            {field.value && (
                              <span className="text-xs text-western-brown font-medium">
                                {formatFrenchDate(field.value)}
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="border-2 border-gray-200 focus:border-western-brown"
                              autoComplete="off"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ticketsUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-ticket-alt text-western-brown mr-2"></i>
                            URL des billets
                            <span className="text-xs text-gray-500 ml-2">(optionnel)</span>
                            {isSearchingFacebook && (
                              <span className="text-xs text-blue-600 ml-2 flex items-center">
                                <i className="fas fa-spinner fa-spin mr-1"></i>
                                Recherche de page Facebook...
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              <Input
                                {...field}
                                type="url"
                                placeholder="https://exemple.com/acheter-billets"
                                className="border-2 border-gray-200 focus:border-western-brown"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                              />
                              {(venueOptions.facebookUrl || venueOptions.websiteUrl) && (
                                <div className="space-y-2">
                                  <p className="text-xs text-gray-600">
                                    Options trouvées pour {venueOptions.placeName}:
                                  </p>
                                  <div className="flex gap-2">
                                    {venueOptions.facebookUrl && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8 flex items-center"
                                        onClick={() => {
                                          form.setValue('ticketsUrl', venueOptions.facebookUrl!);
                                          setPreviewUrl(venueOptions.facebookUrl!);
                                          toast({
                                            title: "Facebook sélectionné",
                                            description: "Lien Facebook ajouté au champ URL des billets"
                                          });
                                        }}
                                      >
                                        <i className="fab fa-facebook mr-1"></i>
                                        Facebook
                                      </Button>
                                    )}
                                    {venueOptions.websiteUrl && (
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-8 flex items-center"
                                        onClick={() => {
                                          form.setValue('ticketsUrl', venueOptions.websiteUrl!);
                                          setPreviewUrl(venueOptions.websiteUrl!);
                                          toast({
                                            title: "Site web sélectionné",
                                            description: "Lien du site web ajouté au champ URL des billets"
                                          });
                                        }}
                                      >
                                        <i className="fas fa-globe mr-1"></i>
                                        Site web
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              )}
                              
                              {/* Saved Venues */}
                              {savedVenues.length > 0 && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <FormLabel className="text-xs font-medium text-gray-700 flex items-center">
                                      <i className="fas fa-bookmark text-green-600 mr-2"></i>
                                      Lieux sauvegardés
                                    </FormLabel>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={() => setShowSavedVenues(!showSavedVenues)}
                                    >
                                      {showSavedVenues ? (
                                        <i className="fas fa-chevron-up"></i>
                                      ) : (
                                        <i className="fas fa-chevron-down"></i>
                                      )}
                                    </Button>
                                  </div>
                                  
                                  {showSavedVenues && (
                                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                                      {savedVenues.map((venue, index) => (
                                        <button
                                          key={index}
                                          type="button"
                                          className="w-full p-2 text-left hover:bg-green-100 focus:bg-green-100 focus:outline-none rounded border border-green-300"
                                          onClick={() => {
                                            form.setValue('venueName', venue.venueName);
                                            form.setValue('venue', venue.venueAddress || '');
                                            if (venue.facebookId) {
                                              form.setValue('facebookId', venue.facebookId);
                                              form.setValue('ticketsUrl', venue.facebookUrl || '');
                                              setPreviewUrl(venue.facebookUrl || '');
                                            }
                                            toast({
                                              title: "Lieu sélectionné",
                                              description: `${venue.venueName} ajouté au formulaire`
                                            });
                                          }}
                                        >
                                          <div className="flex items-center space-x-2">
                                            {venue.profilePictureUrl && (
                                              <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                <img
                                                  src={venue.profilePictureUrl}
                                                  alt={venue.venueName}
                                                  className="w-full h-full object-cover"
                                                />
                                              </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                              <div className="text-xs font-medium text-gray-900 truncate">
                                                {venue.venueName}
                                              </div>
                                              {venue.venueAddress && (
                                                <div className="text-xs text-gray-500 truncate">
                                                  {venue.venueAddress}
                                                </div>
                                              )}
                                              <div className="text-xs text-green-600">
                                                Utilisé {venue.useCount} fois
                                              </div>
                                            </div>
                                          </div>
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Facebook Page Search */}
                              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                <FormField
                                  control={form.control}
                                  name="facebookId"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-xs font-medium text-gray-700 flex items-center">
                                        <i className="fab fa-facebook text-blue-600 mr-2"></i>
                                        Recherche rapide de page Facebook
                                      </FormLabel>
                                      <div className="relative">
                                        <div className="flex items-center">
                                          <div className="relative flex-1">
                                            <i className="fab fa-facebook text-blue-600 absolute left-3 top-1/2 transform -translate-y-1/2 z-10"></i>
                                            <Input
                                              value={facebookSearchQuery}
                                              placeholder="Chercher une page Facebook (ex: Le Bordel)"
                                              className="pl-10 pr-10 text-xs h-8"
                                              autoComplete="off"
                                              autoCorrect="off"
                                              autoCapitalize="off"
                                              spellCheck="false"
                                              onChange={(e) => {
                                                setFacebookSearchQuery(e.target.value);
                                                const query = e.target.value;
                                                if (query.length === 0) {
                                                  // Show saved venues when field is empty
                                                  setFacebookSearchSuggestions(savedVenues.map(venue => ({
                                                    id: venue.facebookId || '',
                                                    name: venue.venueName,
                                                    url: venue.facebookUrl || '',
                                                    profilePicture: venue.profilePictureUrl || '',
                                                    verified: true,
                                                    isSaved: true
                                                  })));
                                                } else {
                                                  searchFacebookPages(query);
                                                }
                                                setShowFacebookSuggestions(true);
                                              }}
                                              onFocus={() => {
                                                if (facebookSearchQuery.length === 0 && savedVenues.length > 0) {
                                                  // Show saved venues when focusing on empty field
                                                  setFacebookSearchSuggestions(savedVenues.map(venue => ({
                                                    id: venue.facebookId || '',
                                                    name: venue.venueName,
                                                    url: venue.facebookUrl || '',
                                                    profilePicture: venue.profilePictureUrl || '',
                                                    verified: true,
                                                    isSaved: true
                                                  })));
                                                  setShowFacebookSuggestions(true);
                                                } else if (facebookSearchQuery.length > 1) {
                                                  searchFacebookPages(facebookSearchQuery);
                                                  setShowFacebookSuggestions(true);
                                                }
                                              }}
                                              onBlur={() => {
                                                setTimeout(() => setShowFacebookSuggestions(false), 200);
                                              }}
                                            />
                                            {isSearchingFacebook && (
                                              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                        
                                        {/* Facebook Search Results */}
                                        {showFacebookSuggestions && facebookSearchSuggestions.length > 0 && (
                                          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                                            <div className="p-2 text-xs text-gray-500 border-b bg-gray-50">
                                              <i className="fab fa-facebook text-blue-600 mr-1"></i>
                                              {facebookSearchSuggestions.some(s => s.isSaved) ? "Lieux sauvegardés" : "Pages Facebook trouvées"}
                                            </div>
                                            {facebookSearchSuggestions.map((suggestion, index) => (
                                              <button
                                                key={index}
                                                type="button"
                                                className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-gray-100 last:border-b-0"
                                                onClick={async () => {
                                                  field.onChange(suggestion.id);
                                                  form.setValue('ticketsUrl', suggestion.url);
                                                  setPreviewUrl(suggestion.url);
                                                  setFacebookSearchQuery('');
                                                  setShowFacebookSuggestions(false);
                                                  
                                                  if (suggestion.isSaved) {
                                                    // If it's a saved venue, also fill in venue details
                                                    const savedVenue = savedVenues.find(v => v.facebookId === suggestion.id || v.venueName === suggestion.name);
                                                    if (savedVenue) {
                                                      form.setValue('venueName', savedVenue.venueName);
                                                      if (savedVenue.venueAddress) {
                                                        form.setValue('venue', savedVenue.venueAddress);
                                                      }
                                                    }
                                                    toast({
                                                      title: "Lieu sauvegardé sélectionné",
                                                      description: `${suggestion.name} ajouté au formulaire`
                                                    });
                                                  } else {
                                                    // Save new venue data
                                                    const venueData = {
                                                      venueName: form.getValues('venueName') || suggestion.name,
                                                      venueAddress: form.getValues('venue'),
                                                      facebookId: suggestion.id,
                                                      facebookUrl: suggestion.url,
                                                      profilePictureUrl: suggestion.profilePicture,
                                                    };
                                                    
                                                    await saveVenue(venueData);
                                                    
                                                    toast({
                                                      title: "Page Facebook ajoutée",
                                                      description: `${suggestion.name} sélectionnée et sauvegardée`
                                                    });
                                                  }
                                                }}
                                              >
                                                <div className="flex items-center space-x-2">
                                                  <div className="w-6 h-6 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                                                    <img
                                                      src={suggestion.profilePicture}
                                                      alt={suggestion.name}
                                                      className="w-full h-full object-cover"
                                                      onError={(e) => {
                                                        e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzk3NEY2Ii8+CjxwYXRoIGQ9Ik0xMyAxMlYxNUgxNUwxNS4yIDEySDEzWk0xMiA3QzE0LjIgNyAxNS41IDguNSAxNS41IDEwLjVWMTJIMTNWMTAuNUMxMyAxMC4xIDEyLjYgMTAgMTIuMiAxMEgxMFY4LjVDMTAgOC4xIDEwLjQgNyAxMiA3WiIgZmlsbD0id2hpdGUiLz4KPC9zdmc+Cg==';
                                                      }}
                                                    />
                                                  </div>
                                                  <div className="flex-1 min-w-0">
                                                    <div className="flex items-center space-x-1">
                                                      <div className="text-xs font-medium text-gray-900 truncate">
                                                        {suggestion.name}
                                                      </div>
                                                      {suggestion.verified && (
                                                        <div className="w-3 h-3 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                          <i className="fas fa-check text-white text-xs"></i>
                                                        </div>
                                                      )}
                                                      {suggestion.isSaved && (
                                                        <div className="w-3 h-3 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                                                          <i className="fas fa-bookmark text-white text-xs"></i>
                                                        </div>
                                                      )}
                                                    </div>
                                                    <div className="text-xs text-gray-500 truncate">
                                                      {suggestion.id ? `facebook.com/${suggestion.id}` : 'Lieu sauvegardé'}
                                                    </div>
                                                  </div>
                                                </div>
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>
                                      <p className="text-xs text-gray-600 mt-1">
                                        Tapez le nom du lieu pour chercher sa page Facebook et l'ajouter automatiquement
                                      </p>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                              
                              {/* URL Preview */}
                              {previewUrl && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <p className="text-xs font-medium text-gray-700">Page sélectionnée :</p>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="text-xs h-6 px-2"
                                      onClick={() => setPreviewUrl('')}
                                    >
                                      <i className="fas fa-times"></i>
                                    </Button>
                                  </div>
                                  <div className="bg-white rounded border p-4">
                                    <div className="flex items-center space-x-3">
                                      {previewUrl.includes('facebook.com') ? (
                                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
                                          <img
                                            src={getFacebookProfilePicture(form.getValues('facebookId') || '')}
                                            alt="Photo de profil Facebook"
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                              e.currentTarget.nextElementSibling.style.display = 'flex';
                                            }}
                                          />
                                          <i className="fab fa-facebook text-blue-600 text-xl hidden"></i>
                                        </div>
                                      ) : (
                                        <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                                          <i className="fas fa-globe text-gray-600 text-xl"></i>
                                        </div>
                                      )}
                                      <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">
                                          {previewUrl.includes('facebook.com') ? 'Page Facebook' : 'Site Web'}
                                        </p>
                                        <p className="text-xs text-gray-600 truncate">{previewUrl}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                          Cliquez sur "Aperçu" pour vérifier que la page existe
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="mt-2 flex items-center justify-between">
                                    <div className="flex space-x-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="text-xs h-7 px-3"
                                        onClick={() => window.open(previewUrl, '_blank')}
                                      >
                                        <i className="fas fa-external-link-alt mr-1"></i>
                                        Aperçu
                                      </Button>
                                      {previewUrl.includes('facebook.com') && (
                                        <Button
                                          type="button"
                                          variant="outline"
                                          size="sm"
                                          className="text-xs h-7 px-3"
                                          onClick={() => {
                                            const facebookId = form.getValues('facebookId');
                                            if (facebookId) {
                                              const searchUrl = `https://www.facebook.com/search/pages/?q=${encodeURIComponent(facebookId)}`;
                                              window.open(searchUrl, '_blank');
                                            }
                                          }}
                                        >
                                          <i className="fas fa-search mr-1"></i>
                                          Rechercher
                                        </Button>
                                      )}
                                    </div>
                                    <span className="text-xs text-green-600 font-medium flex items-center">
                                      <i className="fas fa-check-circle mr-1"></i>
                                      Prêt à utiliser
                                    </span>
                                  </div>
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-gray-50 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setIsOptionsExpanded(!isOptionsExpanded)}
                        className="w-full flex items-center justify-between p-4 hover:bg-gray-100 transition-colors rounded-lg"
                      >
                        <h3 className="font-semibold text-gray-700 flex items-center">
                          <i className="fas fa-cog text-western-brown mr-2"></i>
                          Options
                        </h3>
                        <i className={`fas fa-chevron-${isOptionsExpanded ? 'up' : 'down'} text-gray-500 transition-transform`}></i>
                      </button>
                      {isOptionsExpanded && (
                        <div className="px-4 pb-4 space-y-3">
                        <FormField
                          control={form.control}
                          name="addToCalendar"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0 p-3 bg-green-50 rounded-lg border border-green-200">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                />
                              </FormControl>
                              <div className="flex flex-col flex-1">
                                <FormLabel className="text-sm text-gray-700 flex items-center justify-between">
                                  <span className="flex items-center">
                                    <i className="fas fa-calendar-plus text-green-600 mr-2"></i>
                                    Synchroniser avec Google Calendar
                                  </span>
                                  <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                    Connecté
                                  </span>
                                </FormLabel>
                                <p className="text-xs text-gray-600 mt-1">
                                  Votre compte Google est connecté automatiquement. Décochez pour ne pas synchroniser cet événement.
                                </p>
                              </div>
                            </FormItem>
                          )}
                        />

                        <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              <i className="fas fa-link text-blue-600 mr-2"></i>
                              <span className="text-sm font-medium text-gray-700">Intégration Google Calendar</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => {
                                // Add disconnect/reconnect functionality
                                toast({
                                  title: "Intégration Google",
                                  description: "Pour modifier la connexion, reconnectez-vous à votre compte.",
                                });
                              }}
                            >
                              <i className="fas fa-cog mr-1"></i>
                              Gérer
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            Connecté comme {(user as any)?.email}
                          </p>
                        </div>

                        <FormField
                          control={form.control}
                          name="sendNotification"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="data-[state=checked]:bg-western-brown data-[state=checked]:border-western-brown"
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-700 flex items-center">
                                <i className="fas fa-bell text-western-brown mr-2"></i>
                                Envoyer une notification
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        type="submit"
                        disabled={isSubmitting || createEventMutation.isPending}
                        className="flex-1 bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-semibold py-3 shadow-western"
                      >
                        {isSubmitting || createEventMutation.isPending ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Création...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save mr-2"></i>
                            Créer
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* Recent Events Sidebar */}
          <div className="space-y-6">
            <Card className="shadow-western overflow-hidden card-blur">
              <CardHeader className="bg-western-chocolate text-white">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <i className="fas fa-history mr-2"></i>
                  Événements Récents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-gray-100">
                  {eventsLoading ? (
                    <div className="p-4 animate-pulse space-y-4">
                      <div className="h-16 bg-gray-200 rounded"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                      <div className="h-16 bg-gray-200 rounded"></div>
                    </div>
                  ) : events.length > 0 ? (
                    events
                      .sort((a: Event, b: Event) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
                      .slice(0, 5)
                      .map((event: Event) => (
                        <div 
                          key={event.id} 
                          className="p-4 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-gray-900 mb-1">{event.title}</h4>
                              <div className="flex items-center text-sm text-gray-600 space-x-3">
                                <span className="flex items-center">
                                  <i className="fas fa-calendar text-western-brown mr-1"></i>
                                  {(event as any).displayDate || formatFrenchDate(event.date)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1 space-y-1">
                                {event.venueName && (
                                  <div className="flex items-center">
                                    <i className="fas fa-store text-western-brown mr-1"></i>
                                    {event.venueName}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <i className="fas fa-map-marker-alt text-western-brown mr-1"></i>
                                  {event.city || event.venue}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  event.status === "published"
                                    ? "bg-western-success/10 text-western-success"
                                    : event.status === "pending"
                                    ? "bg-western-warning/10 text-western-warning"
                                    : "bg-gray-100 text-gray-600"
                                }`}
                              >
                                {event.status === "published" ? "Publié" : 
                                 event.status === "pending" ? "En attente" : "Brouillon"}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <i className="fas fa-calendar-plus text-4xl mb-4"></i>
                      <p>Aucun événement créé</p>
                      <p className="text-sm">Créez votre premier événement ci-dessus</p>
                    </div>
                  )}
                </div>
                {events.length > 0 && (
                  <div className="p-4 border-t border-gray-100">
                    <div className="flex flex-col space-y-2">
                      <Button
                        variant="ghost"
                        className="w-full text-western-brown hover:text-western-chocolate font-medium text-sm"
                        onClick={() => window.location.href = '/events'}
                      >
                        <span>Voir tous les événements</span>
                        <i className="fas fa-arrow-right ml-2"></i>
                      </Button>
                      <Button
                        variant="ghost"
                        className="w-full text-western-rust hover:text-western-dark font-medium text-sm"
                        onClick={() => window.location.href = '/calendar-integrations'}
                      >
                        <span>Intégrations calendrier</span>
                        <i className="fas fa-calendar-sync ml-2"></i>
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Event Details Modal */}
      <EventDetailsModal
        event={selectedEvent}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onEdit={handleEditFromModal}
      />

      {/* Edit Event Dialog */}
      {editingEvent && (
        <EditEventDialog
          event={editingEvent}
          isOpen={!!editingEvent}
          onClose={() => setEditingEvent(null)}
        />
      )}


    </div>
  );
}
