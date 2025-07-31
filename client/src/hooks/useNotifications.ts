import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';

export interface Notification {
  id: string;
  type: 'event_created' | 'event_updated' | 'event_deleted' | 'calendar_synced' | 'welcome';
  title: string;
  message: string;
  timestamp: Date;
  data?: any;
  isRead?: boolean;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    // WebSocket désactivé - système de notification supprimé
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, user]);

  const playNotificationSound = (type: string) => {
    // Créer des sons western synthétiques pour les notifications
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    
    const playTone = (frequency: number, duration: number, delay: number = 0) => {
      setTimeout(() => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
        oscillator.type = 'triangle'; // Son plus doux, style western
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + duration);
      }, delay);
    };

    // Sons spécifiques selon le type de notification
    switch (type) {
      case 'event_created':
        // Son de succès : progression ascendante (comme un lasso qui attrape)
        playTone(440, 0.2); // La
        playTone(554, 0.2, 100); // Do#
        playTone(659, 0.3, 200); // Mi
        break;
      
      case 'event_updated':
        // Son de modification : double note (comme un fouet)
        playTone(523, 0.15); // Do
        playTone(523, 0.15, 150);
        break;
      
      case 'event_deleted':
        // Son de suppression : note descendante (comme quelque chose qui part)
        playTone(659, 0.2); // Mi
        playTone(523, 0.3, 100); // Do
        break;
      
      case 'calendar_synced':
        // Son de synchronisation : motif répétitif (comme des sabots de cheval)
        playTone(440, 0.1); // La
        playTone(440, 0.1, 100);
        playTone(440, 0.1, 200);
        playTone(523, 0.2, 300); // Do
        break;
      
      case 'welcome':
        // Son de bienvenue : mélodie western simple
        playTone(392, 0.2); // Sol
        playTone(440, 0.2, 200); // La
        playTone(523, 0.3, 400); // Do
        break;
      
      default:
        // Son par défaut
        playTone(440, 0.2);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, isRead: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, isRead: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => 
      prev.filter(notification => notification.id !== id)
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return {
    notifications,
    isConnected,
    unreadCount,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll
  };
}