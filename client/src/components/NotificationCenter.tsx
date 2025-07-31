import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';

interface SimpleNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  timestamp: Date;
}

export function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<SimpleNotification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // WebSocket désactivé - système de notification supprimé
    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, [isAuthenticated, user]);

  const unreadCount = notifications.length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'fas fa-plus-circle text-western-success';
      case 'event_updated':
        return 'fas fa-edit text-western-warning';
      case 'event_deleted':
        return 'fas fa-trash text-red-500';
      case 'calendar_synced':
        return 'fas fa-sync text-blue-500';
      case 'welcome':
        return 'fas fa-hat-cowboy text-western-brown';
      default:
        return 'fas fa-bell text-gray-500';
    }
  };

  const getNotificationAnimation = (type: string, index: number) => {
    const delay = index * 100; // Effet cascade
    
    switch (type) {
      case 'event_created':
        return `animate-bounce-in-right delay-${delay}`;
      case 'event_updated':
        return `animate-shake delay-${delay}`;
      case 'event_deleted':
        return `animate-slide-out-left delay-${delay}`;
      case 'calendar_synced':
        return `animate-pulse-western delay-${delay}`;
      case 'welcome':
        return `animate-tip-hat delay-${delay}`;
      default:
        return `animate-fade-in delay-${delay}`;
    }
  };

  return (
    <div className="relative">
      {/* Bouton de notification avec badge */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative hover:bg-western-sand/20 transition-all duration-300"
      >
        <i className={`fas fa-bell text-lg ${isConnected ? 'text-western-brown' : 'text-gray-400'}`}></i>
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs animate-pulse bg-western-warning"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
        {/* Indicateur de connexion */}
        <div 
          className={`absolute bottom-0 right-0 w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
      </Button>

      {/* Centre de notifications */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden shadow-western-lg z-50 animate-slide-in-right">
          <CardHeader className="bg-western-brown text-white p-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold flex items-center">
                <i className="fas fa-hat-cowboy mr-2"></i>
                Notifications du Ranch
              </CardTitle>
              <div className="flex items-center space-x-2">
                <span className={`text-xs px-2 py-1 rounded-full ${
                  isConnected ? 'bg-green-500' : 'bg-red-500'
                }`}>
                  {isConnected ? 'Connecté' : 'Déconnecté'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 hover:bg-white/20"
                >
                  <i className="fas fa-times text-xs"></i>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                <i className="fas fa-cactus text-3xl mb-2"></i>
                <p>Aucune notification, partner</p>
                <p className="text-xs mt-1">Le désert est calme aujourd'hui...</p>
              </div>
            ) : (
              <>
                {/* Actions */}
                <div className="p-3 border-b border-gray-200 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-600">
                      {notifications.length} notification(s)
                    </span>
                    <div className="space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setNotifications([])}
                        className="text-xs h-6 px-2 text-red-600 hover:text-red-700"
                      >
                        Tout effacer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Liste des notifications */}
                <div className="max-h-64 overflow-y-auto">
                  {notifications.map((notification, index) => (
                    <div
                      key={notification.id}
                      className={`p-3 border-b border-gray-100 hover:bg-western-sand/10 transition-all duration-300 cursor-pointer ${
                        !notification.isRead ? 'bg-western-sand/20 border-l-4 border-l-western-brown' : ''
                      } ${getNotificationAnimation(notification.type, index)}`}
                      onClick={() => {}}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center`}>
                          <i className={`${getNotificationIcon(notification.type)} text-sm`}></i>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="font-medium text-sm text-gray-900 truncate">
                              {notification.title}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setNotifications(prev => prev.filter(n => n.id !== notification.id));
                              }}
                              className="h-5 w-5 p-0 opacity-0 hover:opacity-100 hover:bg-red-100"
                            >
                              <i className="fas fa-times text-xs text-red-500"></i>
                            </Button>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            il y a quelques instants
                          </p>
                        </div>
                        <div className="w-2 h-2 bg-western-brown rounded-full flex-shrink-0 animate-pulse"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}