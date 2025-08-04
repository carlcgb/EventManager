import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "@/components/AddressDisplay";
import { SocialShareButtons } from "@/components/SocialShareButtons";
import { formatFrenchDate } from "@/lib/utils";
import type { Event } from "@shared/schema";

export default function PublicEvent() {
  const [match, params] = useRoute("/event/:id");
  const eventId = params?.id;

  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/public/${eventId}`],
    enabled: !!eventId,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-western-sand via-white to-western-cream">
        <div className="container mx-auto px-4 py-12">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin w-12 h-12 border-4 border-western-brown border-t-transparent rounded-full"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-western-sand via-white to-western-cream">
        <div className="container mx-auto px-4 py-12">
          <Card className="max-w-2xl mx-auto shadow-western">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-exclamation-triangle text-red-500 text-4xl"></i>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Événement introuvable</h1>
              <p className="text-gray-600 mb-6">
                Cet événement n'existe pas ou n'est plus disponible.
              </p>
              <Button onClick={() => window.location.href = '/'}>
                Retour à l'accueil
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800 border-green-200">🎯 Publié</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">⏳ En attente</Badge>;
      case 'draft':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">📝 Brouillon</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-western-sand via-white to-western-cream">
      {/* Header */}
      <div className="bg-western-brown/10 border-b border-western-brown/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-western-brown rounded-full flex items-center justify-center">
                <i className="fas fa-calendar-alt text-white"></i>
              </div>
              <h1 className="text-2xl font-bold text-western-dark">Détails de l'événement</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => window.location.href = '/'}
              className="text-western-brown border-western-brown hover:bg-western-brown hover:text-white"
            >
              <i className="fas fa-home mr-2"></i>
              Accueil
            </Button>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-4xl mx-auto shadow-western">
          <CardHeader className="border-b border-gray-200">
            <div className="flex items-center justify-between">
              <CardTitle className="text-3xl font-bold text-western-dark flex items-center space-x-3">
                <span>🤠</span>
                <span>{event.title}</span>
              </CardTitle>
              {getStatusBadge(event.status || 'draft')}
            </div>
            {event.venueName && (
              <p className="text-lg text-gray-600 mt-4 flex items-center">
                <i className="fas fa-store text-western-brown mr-2"></i>
                {event.venueName}
              </p>
            )}
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Date */}
            <div className="bg-western-sand/20 rounded-lg p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-western-brown rounded-full flex items-center justify-center">
                  <i className="fas fa-calendar-alt text-white text-2xl"></i>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-western-dark">Date</h3>
                  <p className="text-lg text-gray-700 mt-1 font-semibold">
                    {(event as any).displayDate || formatFrenchDate(event.date || '')}
                  </p>
                </div>
              </div>
            </div>

            {/* Lieu */}
            <div className="bg-western-sand/20 rounded-lg p-6">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 bg-western-brown rounded-full flex items-center justify-center">
                  <i className="fas fa-map-marker-alt text-white text-2xl"></i>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-western-dark mb-2">Lieu</h3>
                  <AddressDisplay address={event.venue} showMapLink={true} />
                </div>
              </div>
            </div>

            {/* Billets */}
            {event.ticketsUrl && (
              <div className="bg-western-sand/20 rounded-lg p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-western-brown rounded-full flex items-center justify-center">
                    <i className="fas fa-ticket-alt text-white text-2xl"></i>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-western-dark mb-4">Billets</h3>
                    <a
                      href={event.ticketsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <i className="fas fa-ticket-alt mr-3"></i>
                      Acheter des billets
                      <i className="fas fa-external-link-alt ml-2"></i>
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* Partage sur les réseaux sociaux */}
            <div className="bg-western-sand/20 rounded-lg p-6">
              <SocialShareButtons event={event} />
            </div>

            {/* Informations sur l'événement */}
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Informations sur l'événement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <p><strong>Publié le :</strong> {formatFrenchDate(event.createdAt)}</p>
                </div>
                <div>
                  <p><strong>Statut :</strong> {event.status === 'published' ? 'Publié' : event.status === 'pending' ? 'En attente' : 'Brouillon'}</p>
                </div>
              </div>
            </div>

            {/* Call to action */}
            <div className="text-center pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-western-dark mb-3">
                Organisez vos propres événements
              </h3>
              <p className="text-gray-600 mb-4">
                Créez et gérez facilement vos événements avec notre plateforme
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-semibold px-8 py-3"
              >
                <i className="fas fa-plus mr-2"></i>
                Créer un événement
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}