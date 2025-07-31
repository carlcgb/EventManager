import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/firebase";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import EditEventDialog from "@/components/EditEventDialog";
import { AddressDisplay } from "@/components/AddressDisplay";
import { EventDetailsModal } from "@/components/EventDetailsModal";
import type { Event } from "@shared/schema";

export default function Events() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Fetch events from API
  const { data: events = [], isLoading: eventsLoading, error: eventsError } = useQuery({
    queryKey: ["/api/events"],
    enabled: !!user, // Only fetch when user is authenticated
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const response = await apiRequest("DELETE", `/api/events/${eventId}`);
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Événement supprimé",
        description: "L'événement a été supprimé avec succès.",
      });
      // Invalidate and refetch events
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/stats"] });
    },
    onError: (error: any) => {
      console.error('Delete error:', error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer l'événement.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  const handleDeleteEvent = (eventId: string, eventTitle: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'événement "${eventTitle}" ?`)) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleEventClick = (event: Event) => {
    setSelectedEvent(event);
    setIsDetailsModalOpen(true);
  };

  const handleEditFromModal = (event: Event) => {
    setEditingEvent(event);
    setIsDetailsModalOpen(false);
  };

  if (isLoading || eventsLoading) {
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
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="text-western-beige hover:text-white"
              >
                <i className="fas fa-home mr-2"></i>
                Tableau de bord
              </Button>
              <div className="hidden md:flex items-center space-x-2 bg-western-brown/20 px-4 py-2 rounded-lg">
                <i className="fas fa-user-circle text-western-sand"></i>
                <span className="text-western-beige font-medium">
                  {user?.displayName || user?.email}
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
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-western-beige mb-2 drop-shadow-lg">Tous les Événements</h2>
          <p className="text-western-sand font-medium">Gérez tous vos événements passés et à venir</p>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {eventsError ? (
            <div className="col-span-full text-center py-12">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
                <p className="text-red-600">Impossible de charger les événements. Vérifiez votre connexion.</p>
              </div>
            </div>
          ) : events.length > 0 ? (
            events.map((event: any) => (
              <Card 
                key={event.id} 
                className="shadow-western hover:shadow-western-lg transition-all duration-200 cursor-pointer hover:scale-105"
                onClick={() => handleEventClick(event)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2">
                      {event.title}
                    </CardTitle>
                    <div className="flex items-center space-x-2 ml-2">
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
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Event Details */}
                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="fas fa-calendar text-western-brown mr-2 w-4"></i>
                      <span>{format(new Date(event.date), "EEEE d MMMM yyyy à HH:mm", { locale: fr })}</span>
                    </div>
                    <AddressDisplay address={event.venue} showMapLink={true} />
                    {event.description && (
                      <div className="flex items-start text-sm text-gray-600">
                        <i className="fas fa-align-left text-western-brown mr-2 w-4 mt-0.5"></i>
                        <span className="line-clamp-3">{event.description}</span>
                      </div>
                    )}
                  </div>

                  {/* Event Options */}
                  <div className="flex flex-wrap gap-2">
                    {event.addToCalendar && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        <i className="fas fa-calendar-check mr-1"></i>
                        Calendrier
                      </span>
                    )}
                    {event.publishToWebsite && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        <i className="fas fa-globe mr-1"></i>
                        Site web
                      </span>
                    )}
                    {event.sendNotification && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 text-orange-800">
                        <i className="fas fa-bell mr-1"></i>
                        Notification
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200">
                    <span className="text-xs text-gray-500">
                      Créé le {format(new Date(event.createdAt), "d/MM/yyyy", { locale: fr })}
                    </span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingEvent(event);
                        }}
                        className="text-western-brown border-western-brown hover:bg-western-brown hover:text-white"
                      >
                        <i className="fas fa-edit mr-1"></i>
                        Modifier
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEvent(event.id, event.title);
                        }}
                        disabled={deleteEventMutation.isPending}
                        className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full">
              <Card className="shadow-western">
                <CardContent className="p-12 text-center">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-calendar-plus text-gray-400 text-4xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun événement</h3>
                  <p className="text-gray-600 mb-6">
                    Vous n'avez pas encore créé d'événements. Commencez par créer votre premier événement.
                  </p>
                  <Button
                    onClick={() => window.location.href = '/'}
                    className="bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-semibold"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Créer un Événement
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
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
