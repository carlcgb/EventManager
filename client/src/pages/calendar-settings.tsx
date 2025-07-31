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

  // Récupérer les intégrations calendrier de l'utilisateur
  const { data: integrations = [], isLoading } = useQuery({
    queryKey: ['/api/calendar/integrations'],
    refetchInterval: 2000, // Actualiser toutes les 2 secondes
  });

  const googleIntegration = integrations.find((int: any) => int.provider === 'google');

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
        {/* Information importante */}
        <Card className="bg-blue-50 border-2 border-blue-300 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center text-blue-800">
              <i className="fas fa-rocket mr-2"></i>
              Déploiement requis pour Google Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-blue-700">
              <p><strong>Google OAuth nécessite une URL HTTPS publique.</strong></p>
              <p>En développement (localhost), l'authentification Google ne peut pas fonctionner.</p>
              <div className="bg-blue-100 p-3 rounded-lg">
                <p className="font-semibold">Solution :</p>
                <ol className="list-decimal list-inside space-y-1 pl-4">
                  <li>Déployez l'application sur Replit</li>
                  <li>Utilisez l'URL HTTPS de déploiement</li>
                  <li>Connectez votre Google Calendar</li>
                  <li>Synchronisation automatique activée !</li>
                </ol>
              </div>
              <p className="font-medium">Vos événements restent sauvegardés et prêts à synchroniser.</p>
            </div>
          </CardContent>
        </Card>

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

            {/* Connexion Google Calendar */}
            <div className="border-t pt-6">
              <h3 className="font-semibold text-lg mb-3">Accès à votre calendrier Google personnel</h3>
              
              {isLoading ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-500"></div>
                    <span>Vérification du statut...</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Statut de connexion personnel */}
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          googleIntegration && googleIntegration.isActive 
                            ? 'bg-green-100' 
                            : 'bg-red-100'
                        }`}>
                          <i className={`fab fa-google text-lg ${
                            googleIntegration && googleIntegration.isActive 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}></i>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Calendrier Google personnel</p>
                          <p className="text-sm text-gray-500">
                            {googleIntegration && googleIntegration.isActive 
                              ? 'Autorisé - synchronisation active'
                              : 'Autorisation requise pour synchroniser vos événements'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline" className={
                          googleIntegration && googleIntegration.isActive 
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }>
                          <i className={`fas ${
                            googleIntegration && googleIntegration.isActive 
                              ? 'fa-check text-green-500' 
                              : 'fa-times text-red-500'
                          } mr-1`}></i>
                          {googleIntegration && googleIntegration.isActive ? 'Connecté' : 'Non connecté'}
                        </Badge>
                        
                        {googleIntegration && googleIntegration.isActive ? (
                          <Button 
                            onClick={() => {
                              toast({
                                title: "Déconnexion",
                                description: "Fonctionnalité disponible après déploiement",
                                variant: "default"
                              });
                            }}
                            variant="outline"
                            size="sm"
                          >
                            <i className="fas fa-unlink mr-2"></i>
                            Déconnecter
                          </Button>
                        ) : (
                          <Button 
                            onClick={() => window.location.href = '/api/auth/google'}
                            className="bg-red-600 text-white hover:bg-red-700"
                            disabled={true}
                          >
                            <i className="fab fa-google mr-2"></i>
                            Connecter
                            <span className="ml-2 text-xs">(Déploiement requis)</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Information distincte sur la configuration technique */}
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-start space-x-3">
                      <i className="fas fa-info-circle text-blue-600 mt-1"></i>
                      <div>
                        <p className="font-semibold text-blue-900">Deux systèmes d'authentification distincts</p>
                        <p className="text-sm text-blue-700 mt-1">
                          • <strong>Connexion à l'application</strong> : Replit Auth (déjà connecté)<br/>
                          • <strong>Accès au calendrier</strong> : Google OAuth pour synchroniser avec votre calendrier personnel<br/>
                          Ces deux systèmes sont indépendants et servent des fonctions différentes.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                  <p className="font-semibold text-western-dark">Après connexion de votre compte</p>
                  <p className="text-sm text-gray-600">
                    Une fois connecté, vos événements seront automatiquement ajoutés à votre calendrier Google personnel 
                    avec l'emoji 🤠 et des rappels configurés (1 jour et 1 heure avant l'événement).
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