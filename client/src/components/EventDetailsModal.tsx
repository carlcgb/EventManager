import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AddressDisplay } from "./AddressDisplay";
import { SocialShareButtons } from "./SocialShareButtons";
import { formatFrenchDate } from "@/lib/utils";
import type { Event } from "@shared/schema";

interface EventDetailsModalProps {
  event: Event | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (event: Event) => void;
}

export function EventDetailsModal({ event, isOpen, onClose, onEdit }: EventDetailsModalProps) {
  if (!event) return null;

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

  const handleEdit = () => {
    onEdit(event);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-bold text-western-dark flex items-center space-x-2">
              <span>🤠</span>
              <span>{event.title}</span>
            </DialogTitle>
            {getStatusBadge(event.status || 'draft')}
          </div>
          {event.venueName && (
            <DialogDescription className="text-lg text-gray-600 mt-2 flex items-center">
              <i className="fas fa-store text-western-brown mr-2"></i>
              {event.venueName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Date et heure */}
          <div className="bg-western-sand/20 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-western-brown rounded-full flex items-center justify-center">
                <i className="fas fa-calendar-alt text-white text-lg"></i>
              </div>
              <div>
                <h3 className="font-semibold text-western-dark">Date</h3>
                <p className="text-gray-700 font-semibold">
                  {(event as any).displayDate || formatFrenchDate(event.date || '')}
                </p>
              </div>
            </div>
          </div>

          {/* Lieu */}
          <div className="bg-western-sand/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-12 h-12 bg-western-brown rounded-full flex items-center justify-center">
                <i className="fas fa-map-marker-alt text-white text-lg"></i>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-western-dark mb-2">Lieu</h3>
                {event.venue && <AddressDisplay address={event.venue} />}
                {!event.venue && <p className="text-gray-500 italic">Adresse non spécifiée</p>}
              </div>
            </div>
          </div>

          {/* Billets */}
          {event.ticketsUrl && (
            <div className="bg-western-sand/20 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <div className="w-12 h-12 bg-western-brown rounded-full flex items-center justify-center">
                  <i className="fas fa-ticket-alt text-white text-lg"></i>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-western-dark mb-2">Billets</h3>
                  <a
                    href={event.ticketsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-western-brown text-white rounded-lg hover:bg-western-brown/90 transition-colors"
                  >
                    <i className="fas fa-external-link-alt mr-2"></i>
                    Acheter des billets
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* Options */}
          <div className="bg-western-sand/20 rounded-lg p-4">
            <h3 className="font-semibold text-western-dark mb-3">Options configurées</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`flex items-center space-x-2 p-2 rounded ${event.addToCalendar ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <i className={`fas ${event.addToCalendar ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <span className="text-sm">Calendrier</span>
              </div>

              <div className={`flex items-center space-x-2 p-2 rounded ${event.sendNotification ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <i className={`fas ${event.sendNotification ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <span className="text-sm">Notification</span>
              </div>
            </div>
          </div>

          {/* Partage sur les réseaux sociaux */}
          <div className="bg-western-sand/20 rounded-lg p-4">
            <SocialShareButtons event={event} />
          </div>



          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Fermer
            </Button>
            <Button 
              onClick={handleEdit}
              className="bg-western-brown hover:bg-western-brown/90 text-white"
            >
              <i className="fas fa-edit mr-2"></i>
              Modifier
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}