import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Event } from "@shared/schema";

interface SocialShareButtonProps {
  event: Event;
  platform: "facebook" | "twitter" | "linkedin" | "instagram" | "whatsapp" | "email";
  className?: string;
}

const platformConfigs = {
  facebook: {
    name: "Facebook",
    icon: "fab fa-facebook",
    color: "bg-blue-600 hover:bg-blue-700",
    shareUrl: (url: string, text: string) => 
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`,
  },
  twitter: {
    name: "Twitter",
    icon: "fab fa-twitter",
    color: "bg-sky-500 hover:bg-sky-600",
    shareUrl: (url: string, text: string) => 
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  linkedin: {
    name: "LinkedIn",
    icon: "fab fa-linkedin",
    color: "bg-blue-700 hover:bg-blue-800",
    shareUrl: (url: string, text: string) => 
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&title=${encodeURIComponent(text)}`,
  },
  instagram: {
    name: "Instagram",
    icon: "fab fa-instagram",
    color: "bg-pink-600 hover:bg-pink-700",
    shareUrl: (url: string, text: string) => 
      `https://www.instagram.com/`, // Instagram doesn't support direct URL sharing
  },
  whatsapp: {
    name: "WhatsApp",
    icon: "fab fa-whatsapp",
    color: "bg-green-500 hover:bg-green-600",
    shareUrl: (url: string, text: string) => 
      `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
  },
  email: {
    name: "Email",
    icon: "fas fa-envelope",
    color: "bg-gray-600 hover:bg-gray-700",
    shareUrl: (url: string, text: string) => 
      `mailto:?subject=${encodeURIComponent(`Événement: ${text}`)}&body=${encodeURIComponent(`Découvrez cet événement: ${text}\n\n${url}`)}`,
  },
};

export function SocialShareButton({ event, platform, className }: SocialShareButtonProps) {
  const { toast } = useToast();
  const [isSharing, setIsSharing] = useState(false);
  const config = platformConfigs[platform];

  const shareEventMutation = useMutation({
    mutationFn: async (shareData: { eventId: string; platform: string }) => {
      return await apiRequest("POST", "/api/events/share", shareData);
    },
    onSuccess: () => {
      toast({
        title: "Événement partagé",
        description: `L'événement a été partagé sur ${config.name} avec succès !`,
      });
      // Refresh badges and stats
      queryClient.invalidateQueries({ queryKey: ["/api/badges"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de partage",
        description: error.message || "Impossible de partager l'événement.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsSharing(false);
    },
  });

  const handleShare = async () => {
    setIsSharing(true);
    
    // Create share URL and text
    const eventUrl = `https://evenements.replit.app/event/${event.id}`;
    const shareText = `🤠 ${event.title} - ${new Date(event.date).toLocaleDateString('fr-FR')} à ${event.venue}`;
    
    try {
      // Record the share in database
      await shareEventMutation.mutateAsync({
        eventId: event.id,
        platform: platform,
      });

      // Open social sharing window/link
      const shareUrl = config.shareUrl(eventUrl, shareText);
      
      if (platform === "email") {
        // For email, use mailto link
        window.location.href = shareUrl;
      } else if (platform === "instagram") {
        // For Instagram, copy to clipboard and show instructions
        await navigator.clipboard.writeText(`${shareText} ${eventUrl}`);
        toast({
          title: "Texte copié",
          description: "Le texte a été copié. Collez-le dans votre story Instagram !",
        });
      } else {
        // For other platforms, open in new window
        const popup = window.open(
          shareUrl,
          `share-${platform}`,
          'width=600,height=400,scrollbars=yes,resizable=yes'
        );
        
        // Check if popup was blocked
        if (!popup || popup.closed || typeof popup.closed === 'undefined') {
          toast({
            title: "Popup bloqué",
            description: "Veuillez autoriser les popups pour partager sur les réseaux sociaux.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Share error:", error);
    }
  };

  return (
    <Button
      onClick={handleShare}
      disabled={isSharing || shareEventMutation.isPending}
      className={`${config.color} text-white ${className}`}
      size="sm"
    >
      <i className={`${config.icon} mr-2`}></i>
      {isSharing ? "Partage..." : config.name}
    </Button>
  );
}