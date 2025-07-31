import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { CalendarIntegration } from "@shared/schema";

export default function CalendarIntegrations() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect non-authenticated users
  if (!authLoading && !isAuthenticated) {
    toast({
      title: "Non autorisé",
      description: "Vous devez être connecté pour accéder à cette page.",
      variant: "destructive",
    });
    setTimeout(() => {
      window.location.href = "/api/login";
    }, 500);
    return null;
  }

  const { data: integrations = [], isLoading } = useQuery<CalendarIntegration[]>({
    queryKey: ["/api/calendar-integrations"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 2;
    },
  });

  const toggleIntegrationMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await apiRequest(`/api/calendar-integrations/${id}`, "PATCH", { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-integrations"] });
      toast({
        title: "Intégration mise à jour",
        description: "Le statut de l'intégration a été modifié avec succès.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de modifier l'intégration. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const deleteIntegrationMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest(`/api/calendar-integrations/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-integrations"] });
      toast({
        title: "Intégration supprimée",
        description: "L'intégration calendrier a été supprimée avec succès.",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Non autorisé",
          description: "Vous êtes déconnecté. Reconnexion en cours...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erreur",
        description: "Impossible de supprimer l'intégration. Veuillez réessayer.",
        variant: "destructive",
      });
    },
  });

  const handleMicrosoftAuth = async () => {
    try {
      const response = await fetch("/api/calendar/microsoft/auth", {
        credentials: "include",
      });
      const { authUrl } = await response.json();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Erreur d'authentification",
        description: "Impossible de se connecter à Microsoft Calendar.",
        variant: "destructive",
      });
    }
  };

  const handleAppleCalendarExport = async () => {
    try {
      const response = await fetch("/api/calendar-export", {
        credentials: "include",
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de l'export");
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'sam-hebert-events.ics';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export réussi",
        description: "Le fichier calendrier a été téléchargé. Vous pouvez l'importer dans Apple Calendar.",
      });
    } catch (error) {
      toast({
        title: "Erreur d'export",
        description: "Impossible d'exporter le calendrier. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'microsoft':
        return '🗓️';
      case 'apple':
        return '🍎';
      case 'google':
        return '📅';
      default:
        return '📆';
    }
  };

  const getProviderName = (provider: string) => {
    switch (provider) {
      case 'microsoft':
        return 'Microsoft Outlook';
      case 'apple':
        return 'Apple Calendar';
      case 'google':
        return 'Google Calendar';
      default:
        return provider;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-western-dark">
            Intégrations Calendrier
          </h1>
          <p className="text-gray-600 text-lg">
            Synchronisez vos événements avec vos calendriers préférés
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-western">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🗓️</span>
              </div>
              <CardTitle className="text-xl">Microsoft Outlook</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Synchronisez automatiquement avec Outlook Calendar
              </p>
              <Button 
                onClick={handleMicrosoftAuth}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                Connecter Outlook
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-western">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">🍎</span>
              </div>
              <CardTitle className="text-xl">Apple Calendar</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <p className="text-gray-600 text-sm">
                Exportez vos événements vers Apple Calendar
              </p>
              <Button 
                onClick={handleAppleCalendarExport}
                className="w-full bg-gray-600 hover:bg-gray-700"
              >
                Exporter vers Apple
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-western">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">📅</span>
              </div>
              <CardTitle className="text-xl">Google Calendar</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {integrations.find(i => i.provider === 'google' && i.isActive) ? (
                <>
                  <p className="text-gray-600 text-sm">
                    Synchronisation automatique activée
                  </p>
                  <Badge className="bg-green-100 text-green-800">
                    Connecté
                  </Badge>
                </>
              ) : (
                <>
                  <p className="text-gray-600 text-sm">
                    Connectez votre compte Google pour synchroniser automatiquement
                  </p>
                  <Button 
                    onClick={() => window.location.href = '/api/auth/google'}
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    Connecter Google Calendar
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Existing Integrations */}
        {integrations.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-western-dark">
              Intégrations Actives
            </h2>
            
            <div className="space-y-4">
              {integrations.map((integration) => (
                <Card key={integration.id} className="shadow-western">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-western-sand rounded-full flex items-center justify-center">
                          <span className="text-2xl">
                            {getProviderIcon(integration.provider)}
                          </span>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-western-dark">
                            {getProviderName(integration.provider)}
                          </h3>
                          <p className="text-gray-600 text-sm">
                            Ajouté le {new Date(integration.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-600">
                            {integration.isActive ? 'Actif' : 'Inactif'}
                          </span>
                          <Switch
                            checked={integration.isActive || false}
                            onCheckedChange={(checked) =>
                              toggleIntegrationMutation.mutate({
                                id: integration.id,
                                isActive: checked,
                              })
                            }
                            disabled={toggleIntegrationMutation.isPending}
                          />
                        </div>

                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteIntegrationMutation.mutate(integration.id)}
                          disabled={deleteIntegrationMutation.isPending}
                        >
                          Supprimer
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Help Section */}
        <Card className="shadow-western bg-western-sand/20">
          <CardHeader>
            <CardTitle className="text-xl text-western-dark">
              Comment ça fonctionne ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-western-dark mb-2">
                  Microsoft Outlook
                </h4>
                <p className="text-gray-600 text-sm">
                  Une fois connecté, tous vos nouveaux événements seront automatiquement 
                  ajoutés à votre calendrier Outlook. Vous pourrez les modifier depuis 
                  Outlook et les changements se synchroniseront.
                </p>
              </div>
              <div>
                <h4 className="font-semibold text-western-dark mb-2">
                  Apple Calendar
                </h4>
                <p className="text-gray-600 text-sm">
                  Exportez un fichier .ics que vous pouvez importer dans Apple Calendar 
                  sur Mac, iPhone ou iPad. Répétez l'export pour obtenir les dernières 
                  mises à jour.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}