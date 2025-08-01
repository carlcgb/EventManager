import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AddressDisplay } from "./AddressDisplay";
import { SocialShareButtons } from "./SocialShareButtons";
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
            {getStatusBadge(event.status)}
          </div>
          {event.description && (
            <DialogDescription className="text-lg text-gray-600 mt-2">
              {event.description}
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
                <p className="text-gray-700">
                  {format(new Date(event.date), 'EEEE d MMMM yyyy', { locale: fr })}
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
                <AddressDisplay address={event.venue} />
              </div>
            </div>
          </div>

          {/* Options */}
          <div className="bg-western-sand/20 rounded-lg p-4">
            <h3 className="font-semibold text-western-dark mb-3">Options configurées</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className={`flex items-center space-x-2 p-2 rounded ${event.addToCalendar ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <i className={`fas ${event.addToCalendar ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <span className="text-sm">Calendrier</span>
              </div>
              <div className={`flex items-center space-x-2 p-2 rounded ${event.publishToWebsite ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                <i className={`fas ${event.publishToWebsite ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
                <span className="text-sm">Site web</span>
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

          {/* Informations système */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-700 mb-2">Informations</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Créé le :</strong> {format(new Date(event.createdAt), 'd MMMM yyyy', { locale: fr })}</p>
              <p><strong>Modifié le :</strong> {format(new Date(event.updatedAt), 'd MMMM yyyy', { locale: fr })}</p>
              <p><strong>ID :</strong> <code className="bg-gray-200 px-1 rounded text-xs">{event.id}</code></p>
            </div>
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