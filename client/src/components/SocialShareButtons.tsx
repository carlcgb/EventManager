import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { Event } from "@shared/schema";
import { toast } from "@/hooks/use-toast";

interface SocialShareButtonsProps {
  event: Event;
  variant?: "default" | "minimal";
}

export function SocialShareButtons({ event, variant = "default" }: SocialShareButtonsProps) {
  const eventUrl = `${window.location.origin}/event/${event.id}`;
  const eventDate = format(new Date(event.date), "d MMMM yyyy", { locale: fr });
  
  // Texte de partage personnalisé pour chaque plateforme
  const shareTexts = {
    facebook: `🤠 Rejoignez-moi à "${event.title}" le ${eventDate} à ${event.venue}!`,
    twitter: `🤠 Ne manquez pas "${event.title}" le ${eventDate} à ${event.venue}! ${eventUrl}`,
    linkedin: `Je vous invite à "${event.title}" qui aura lieu le ${eventDate} à ${event.venue}.${event.description ? ` ${event.description}` : ""} Plus d'infos: ${eventUrl}`,
    whatsapp: `🤠 Salut! Je t'invite à "${event.title}" le ${eventDate} à ${event.venue}. Plus d'infos: ${eventUrl}`,
    email: {
      subject: `Invitation: ${event.title}`,
      body: `Bonjour,\n\nJe vous invite à "${event.title}" qui aura lieu le ${eventDate} à ${event.venue}.\n\n${event.description ? `Description: ${event.description}\n\n` : ""}Plus d'informations: ${eventUrl}\n\nJ'espère vous y voir!\n\nCordialement`
    }
  };

  const handleFacebookShare = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}&quote=${encodeURIComponent(shareTexts.facebook)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({ title: "Partage Facebook", description: "Fenêtre de partage ouverte!" });
  };

  const handleTwitterShare = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTexts.twitter)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({ title: "Partage Twitter", description: "Fenêtre de partage ouverte!" });
  };

  const handleLinkedInShare = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(eventUrl)}&summary=${encodeURIComponent(shareTexts.linkedin)}`;
    window.open(url, '_blank', 'width=600,height=400');
    toast({ title: "Partage LinkedIn", description: "Fenêtre de partage ouverte!" });
  };

  const handleWhatsAppShare = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareTexts.whatsapp)}`;
    window.open(url, '_blank');
    toast({ title: "Partage WhatsApp", description: "Application WhatsApp ouverte!" });
  };

  const handleEmailShare = () => {
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(shareTexts.email.subject)}&body=${encodeURIComponent(shareTexts.email.body)}`;
    window.location.href = mailtoUrl;
    toast({ title: "Partage Email", description: "Client email ouvert!" });
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      toast({ 
        title: "Lien copié!", 
        description: "Le lien de l'événement a été copié dans votre presse-papier." 
      });
    } catch (err) {
      // Fallback pour les navigateurs qui ne supportent pas l'API clipboard
      const textArea = document.createElement('textarea');
      textArea.value = eventUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast({ 
        title: "Lien copié!", 
        description: "Le lien de l'événement a été copié dans votre presse-papier." 
      });
    }
  };

  if (variant === "minimal") {
    return (
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="text-western-brown border-western-brown hover:bg-western-brown hover:text-white"
        >
          <i className="fas fa-share-alt mr-1"></i>
          Partager
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-western-dark flex items-center">
        <i className="fas fa-share-alt mr-2 text-western-brown"></i>
        Partager cet événement
      </h4>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Facebook */}
        <Button
          variant="outline"
          onClick={handleFacebookShare}
          className="flex items-center justify-center space-x-2 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-colors"
        >
          <i className="fab fa-facebook-f text-blue-600"></i>
          <span>Facebook</span>
        </Button>

        {/* Twitter */}
        <Button
          variant="outline"
          onClick={handleTwitterShare}
          className="flex items-center justify-center space-x-2 hover:bg-blue-400 hover:text-white hover:border-blue-400 transition-colors"
        >
          <i className="fab fa-twitter text-blue-400"></i>
          <span>Twitter</span>
        </Button>

        {/* LinkedIn */}
        <Button
          variant="outline"
          onClick={handleLinkedInShare}
          className="flex items-center justify-center space-x-2 hover:bg-blue-700 hover:text-white hover:border-blue-700 transition-colors"
        >
          <i className="fab fa-linkedin-in text-blue-700"></i>
          <span>LinkedIn</span>
        </Button>

        {/* WhatsApp */}
        <Button
          variant="outline"
          onClick={handleWhatsAppShare}
          className="flex items-center justify-center space-x-2 hover:bg-green-500 hover:text-white hover:border-green-500 transition-colors"
        >
          <i className="fab fa-whatsapp text-green-500"></i>
          <span>WhatsApp</span>
        </Button>

        {/* Email */}
        <Button
          variant="outline"
          onClick={handleEmailShare}
          className="flex items-center justify-center space-x-2 hover:bg-gray-600 hover:text-white hover:border-gray-600 transition-colors"
        >
          <i className="fas fa-envelope text-gray-600"></i>
          <span>Email</span>
        </Button>

        {/* Copier le lien */}
        <Button
          variant="outline"
          onClick={handleCopyLink}
          className="flex items-center justify-center space-x-2 hover:bg-western-brown hover:text-white hover:border-western-brown transition-colors"
        >
          <i className="fas fa-link text-western-brown"></i>
          <span>Copier lien</span>
        </Button>
      </div>
    </div>
  );
}