import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { Event } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { NotificationCenter } from "@/components/NotificationCenter";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { VenueInput } from "@/components/VenueInput";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import EditEventDialog from "@/components/EditEventDialog";

const eventFormSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().optional(),
  date: z.string().min(1, "La date est requise"),
  time: z.string().min(1, "L'heure est requise"),
  venue: z.string().min(1, "Le lieu est requis"),
  addToCalendar: z.boolean().default(true),
  publishToWebsite: z.boolean().default(true),
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

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: "",
      description: "",
      date: "",
      time: "",
      venue: "",
      addToCalendar: true,
      publishToWebsite: true,
      sendNotification: false,
    },
  });

  // Fetch real events and stats from API
  const { data: events = [], isLoading: eventsLoading } = useQuery({
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

  // Create event mutation with real API
  const createEventMutation = useMutation({
    mutationFn: async (data: EventFormData) => {
      const eventData = {
        ...data,
        date: new Date(`${data.date}T${data.time}`).toISOString(),
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

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Données soumises:", data);
      await createEventMutation.mutateAsync(data);
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
              <NotificationCenter />
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
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-l-4 border-western-brown shadow-western card-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements ce mois</p>
                  <p className="text-3xl font-bold text-western-brown">
                    {statsLoading ? (
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      (stats as any)?.monthlyEvents || 0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-western-brown/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-calendar-check text-western-brown text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-western-success shadow-western card-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements publiés</p>
                  <p className="text-3xl font-bold text-western-success">
                    {statsLoading ? (
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      (stats as any)?.publishedEvents || 0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-western-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-globe text-western-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-western-warning shadow-western card-blur">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">En attente</p>
                  <p className="text-3xl font-bold text-western-warning">
                    {statsLoading ? (
                      <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                    ) : (
                      (stats as any)?.pendingEvents || 0
                    )}
                  </p>
                </div>
                <div className="w-12 h-12 bg-western-warning/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-clock text-western-warning text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

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
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-align-left text-western-brown mr-2"></i>
                            Description
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Décrivez votre événement..."
                              className="border-2 border-gray-200 focus:border-western-brown resize-none"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                              <i className="fas fa-calendar text-western-brown mr-2"></i>
                              Date
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                className="border-2 border-gray-200 focus:border-western-brown"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="time"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                              <i className="fas fa-clock text-western-brown mr-2"></i>
                              Heure
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="time"
                                className="border-2 border-gray-200 focus:border-western-brown"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="venue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-semibold text-gray-700 flex items-center">
                            <i className="fas fa-map-marker-alt text-western-brown mr-2"></i>
                            Lieu
                          </FormLabel>
                          <FormControl>
                            <VenueInput
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Ex: Théâtre Corona, Montréal"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-700 mb-3">Options de publication</h3>
                      <div className="space-y-3">
                        <FormField
                          control={form.control}
                          name="addToCalendar"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-700">
                                Ajouter à mon calendrier
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="publishToWebsite"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-700">
                                Publier sur le site web
                              </FormLabel>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="sendNotification"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                              <FormLabel className="text-sm text-gray-700">
                                Envoyer une notification
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      </div>
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
                            Créer l'Événement
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
                      .sort((a: Event, b: Event) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
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
                                  {format(new Date(event.date), "d MMMM yyyy", { locale: fr })}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                <div className="flex items-center">
                                  <i className="fas fa-map-marker-alt text-western-brown mr-1"></i>
                                  {event.venue}
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

      {/* Notification Center */}
      <NotificationCenter />
    </div>
  );
}
