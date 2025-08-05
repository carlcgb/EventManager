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
import { FacebookEventSearch } from "@/components/FacebookEventSearch";
import { FacebookAutocomplete } from "@/components/FacebookAutocomplete";

const eventFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  venueName: z.string().min(1, "Le nom du bar/lieu est requis"),
  venue: z.string().min(1, "L'adresse est requise"),
  date: z.string().min(1, "La date est requise"),
  ticketsUrl: z.string().url("L'URL doit être valide").optional().or(z.literal("")),
  facebookEventUrl: z.string().url("L'URL doit être valide").optional().or(z.literal("")),
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
      facebookEventUrl: "",
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

  // Function to auto-fill Facebook ID field based on venue name
  const autoFillFacebookId = (venueName: string) => {
    const cleanVenueName = venueName
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '') // Remove spaces
      .replace(/^(le|la|les|du|des|de|d)\s*/i, '') // Remove French articles
      .replace(/(club|bar|resto|restaurant|comédie|comedy|theatre|theater)/gi, ''); // Remove common venue words
    
    if (cleanVenueName.length > 2) {
      form.setValue('facebookId', cleanVenueName);
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
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50">
      {/* Navigation Header */}
      <header className="bg-white/60 backdrop-blur-md shadow-2xl border-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-amber-600 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                <i className="fas fa-calendar-star text-white text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-amber-800">Sam Hébert</h1>
                <p className="text-amber-600 text-sm">Gestionnaire d'Événements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Event Statistics - Discrete */}
              <div className="hidden lg:flex items-center space-x-3 bg-amber-100/80 backdrop-blur-md px-4 py-2 rounded-xl border-0 shadow-lg">
                <div className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-calendar-week text-amber-600"></i>
                  <span className="text-amber-800 font-medium">
                    {statsLoading ? '...' : (stats as any)?.monthlyEvents || 0}
                  </span>
                  <span className="text-amber-600">ce mois</span>
                </div>
                <div className="w-px h-4 bg-amber-300"></div>
                <div className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-globe text-green-600"></i>
                  <span className="text-amber-800 font-medium">
                    {statsLoading ? '...' : (stats as any)?.publishedEvents || 0}
                  </span>
                  <span className="text-amber-600">publiés</span>
                </div>
                <div className="w-px h-4 bg-amber-300"></div>
                <div className="flex items-center space-x-1 text-xs">
                  <i className="fas fa-clock text-yellow-600"></i>
                  <span className="text-amber-800 font-medium">
                    {statsLoading ? '...' : (stats as any)?.pendingEvents || 0}
                  </span>
                  <span className="text-amber-600">en attente</span>
                </div>
              </div>
              
              <div className="hidden md:flex items-center space-x-2 bg-amber-100/80 backdrop-blur-md px-4 py-2 rounded-xl border-0">
                <i className="fas fa-user-circle text-amber-600"></i>
                <span className="text-amber-800 font-medium">
                  {(user as any)?.firstName || (user as any)?.email || 'Utilisateur'}
                </span>
              </div>
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm border border-red-400/50 flex items-center space-x-2 rounded-xl shadow-lg"
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
            <Card className="bg-white/60 backdrop-blur-md border-0 shadow-2xl overflow-hidden">
              <CardHeader className="bg-amber-100/80 backdrop-blur-sm text-amber-800 border-0">
                <CardTitle className="text-2xl font-bold flex items-center text-amber-800">
                  <i className="fas fa-plus-circle mr-3 text-amber-600"></i>
                  Créer un Nouvel Événement
                </CardTitle>
                <p className="text-amber-600 mt-2">
                  Ajoutez un événement à votre calendrier et publiez-le sur votre site web
                </p>
              </CardHeader>
              
              <CardContent className="p-6 bg-white/30 backdrop-blur-sm">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" autoComplete="off">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-amber-800 flex items-center">
                            <i className="fas fa-heading text-amber-600 mr-2"></i>
                            Titre de l'événement
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Spectacle d'humour au Théâtre Corona"
                              className="bg-white/80 backdrop-blur-sm border-0 text-amber-800 placeholder:text-amber-500 focus:bg-white/90 rounded-lg"
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
                          <FormLabel className="text-sm font-semibold text-amber-800 flex items-center">
                            <i className="fas fa-map-marker-alt text-amber-600 mr-2"></i>
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
                                // Only clear Facebook info if it's venue-related, not event-related
                                const currentTicketsUrl = form.getValues('ticketsUrl');
                                const isEventUrl = currentTicketsUrl?.includes('/events/');
                                
                                if (!isEventUrl) {
                                  // Clear previous Facebook ID and URL only if it's not an event URL
                                  form.setValue('facebookId', '');
                                  form.setValue('ticketsUrl', '');
                                  setPreviewUrl('');
                                }
                                // Auto-fill Facebook ID based on venue name
                                autoFillFacebookId(extractedName);
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
                          <FormLabel className="text-sm font-semibold text-white flex items-center">
                            <i className="fas fa-store text-purple-300 mr-2"></i>
                            Nom du bar/lieu
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: La Taverne Vieux-Chambly, Le Bordel Comédie Club..."
                              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:bg-white/30 rounded-lg"
                              autoComplete="off"
                              autoCorrect="off"
                              autoCapitalize="off"
                              spellCheck="false"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />

                          {/* Recherche Facebook automatique qui apparaît quand le nom du lieu est extrait */}
                          {field.value && field.value.length > 2 && (
                            <div className="mt-3">
                              <FacebookAutocomplete
                                venueName={field.value}
                                eventTitle={form.watch('title')}
                                autoTrigger={true}
                                placeholder="Rechercher la page Facebook du lieu..."
                                label="Recherche Facebook automatique"
                                onSelect={(result: any) => {
                                  // Remplir automatiquement les champs appropriés
                                  form.setValue('facebookId', result.id);
                                  
                                  if (result.type === 'event') {
                                    // Pour les événements: remplir l'URL des billets et l'événement Facebook
                                    if (result.ticketUrl) {
                                      form.setValue('ticketsUrl', result.ticketUrl);
                                    }
                                    form.setValue('facebookEventUrl', result.facebookUrl || result.url);
                                    setPreviewUrl(result.ticketUrl || result.url);
                                  } else {
                                    // Pour les pages: remplir l'URL des billets avec la page Facebook
                                    form.setValue('ticketsUrl', result.url);
                                    setPreviewUrl(result.url);
                                  }
                                  
                                  toast({
                                    title: "Facebook sélectionné",
                                    description: `${result.name} ajouté automatiquement`,
                                  });
                                }}
                              />
                            </div>
                          )}
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="date"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-white flex items-center justify-between">
                            <span className="flex items-center">
                              <i className="fas fa-calendar text-purple-300 mr-2"></i>
                              Date
                            </span>
                            {field.value && (
                              <span className="text-xs text-purple-200 font-medium">
                                {formatFrenchDate(field.value)}
                              </span>
                            )}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              className="bg-white/20 backdrop-blur-sm border border-white/30 text-white focus:border-purple-400 focus:bg-white/30 rounded-lg"
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
                          <FormLabel className="text-sm font-semibold text-white flex items-center">
                            <i className="fas fa-ticket-alt text-purple-300 mr-2"></i>
                            URL des billets
                            <span className="text-xs text-purple-200 ml-2">(optionnel)</span>
                            {isSearchingFacebook && (
                              <span className="text-xs text-blue-300 ml-2 flex items-center">
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
                                className="bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder:text-purple-200 focus:border-purple-400 focus:bg-white/30 rounded-lg"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck="false"
                              />


                              {/* Hidden field for Facebook ID */}
                              <FormField
                                control={form.control}
                                name="facebookId"
                                render={({ field }) => (
                                  <FormItem className="hidden">
                                    <FormControl>
                                      <Input {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                              

                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="facebookEventUrl"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fab fa-facebook text-western-brown mr-2"></i>
                            Événement Facebook
                            <span className="text-xs text-gray-500 ml-2">(optionnel)</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              placeholder="https://www.facebook.com/events/123456789"
                              className="border-2 border-gray-200 focus:border-western-brown"
                              autoComplete="off"
                              autoCorrect="off"
                              spellCheck="false"
                            />
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
                                  className="data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 border-white/30"
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-white flex items-center">
                                <i className="fas fa-bell text-purple-300 mr-2"></i>
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
                        className="flex-1 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-3 shadow-2xl backdrop-blur-sm border border-purple-400/30 rounded-xl"
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
            <Card className="bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-purple-600/80 to-violet-600/80 backdrop-blur-sm text-white border-b border-white/20">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <i className="fas fa-history mr-2 text-purple-200"></i>
                  Événements Récents
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 bg-white/5 backdrop-blur-sm">
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
                          className="p-4 hover:bg-white/10 transition-colors duration-200 cursor-pointer"
                          onClick={() => handleEventClick(event)}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-semibold text-white mb-1">{event.title}</h4>
                              <div className="flex items-center text-sm text-purple-200 space-x-3">
                                <span className="flex items-center">
                                  <i className="fas fa-calendar text-purple-300 mr-1"></i>
                                  {(event as any).displayDate || formatFrenchDate(event.date)}
                                </span>
                              </div>
                              <div className="text-sm text-purple-200 mt-1 space-y-1">
                                {event.venueName && (
                                  <div className="flex items-center">
                                    <i className="fas fa-store text-purple-300 mr-1"></i>
                                    {event.venueName}
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <i className="fas fa-map-marker-alt text-purple-300 mr-1"></i>
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
