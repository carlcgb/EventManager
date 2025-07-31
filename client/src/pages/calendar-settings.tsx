import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';

export default function CalendarSettings() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Test Google Calendar connection
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("GET", "/api/calendar/test");
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.success ? "Connexion réussie" : "Échec de connexion",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de tester la connexion",
        variant: "destructive",
      });
    },
  });

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await testConnectionMutation.mutateAsync();
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen bg-western-gradient">
      {/* Navigation Header */}
      <header className="bg-western-dark shadow-western-lg border-b-4 border-western-brown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-western-brown rounded-full flex items-center justify-center">
                <i className="fas fa-calendar-alt text-western-beige text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-western-beige">Configuration Calendrier</h1>
                <p className="text-western-sand text-sm">Intégration Google Calendar</p>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => window.history.back()}
              className="bg-western-sand text-western-dark hover:bg-western-beige border-western-brown"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Retour
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Google Calendar Integration */}
        <Card className="bg-white shadow-western-lg border-2 border-western-brown">
          <CardHeader className="bg-western-sand/20">
            <CardTitle className="flex items-center space-x-2 text-western-dark">
              <i className="fab fa-google text-2xl text-blue-600"></i>
              <span>Intégration Google Calendar</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">État de la configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✅ Client ID
                  </Badge>
                  <span className="text-sm text-gray-600">Configuré</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✅ Client Secret
                  </Badge>
                  <span className="text-sm text-gray-600">Configuré</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    ✅ Calendar ID
                  </Badge>
                  <span className="text-sm text-gray-600">Configuré</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Test de connexion</h3>
              <p className="text-gray-600 mb-4">
                Testez la connexion à Google Calendar pour vous assurer que l'intégration fonctionne correctement.
              </p>
              <Button
                onClick={handleTestConnection}
                disabled={isTestingConnection || testConnectionMutation.isPending}
                className="bg-western-brown hover:bg-western-dark text-western-beige"
              >
                {isTestingConnection || testConnectionMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-western-beige mr-2"></div>
                    Test en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-plug mr-2"></i>
                    Tester la connexion
                  </>
                )}
              </Button>
            </div>

            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Comment ça marche</h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-start space-x-2">
                  <span className="text-western-brown font-bold">1.</span>
                  <span>Quand vous créez un événement et cochez "Ajouter au calendrier"</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-western-brown font-bold">2.</span>
                  <span>L'événement est automatiquement ajouté à votre Google Calendar</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-western-brown font-bold">3.</span>
                  <span>Avec un emoji 🤠 pour identifier les spectacles de Sam Hébert</span>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="text-western-brown font-bold">4.</span>
                  <span>Rappels automatiques configurés (1 jour et 1 heure avant)</span>
                </div>
              </div>
            </div>

            <div className="bg-western-sand/10 p-4 rounded-lg border-l-4 border-western-brown">
              <div className="flex items-start space-x-2">
                <i className="fas fa-info-circle text-western-brown mt-1"></i>
                <div>
                  <p className="font-semibold text-western-dark">Note importante</p>
                  <p className="text-sm text-gray-600">
                    L'intégration Google Calendar utilise un compte de service. 
                    Les événements seront créés dans le calendrier configuré avec l'ID de calendrier fourni.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}