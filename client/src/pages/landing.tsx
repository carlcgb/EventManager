import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-western-gradient flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-24 h-24 bg-western-brown rounded-full flex items-center justify-center shadow-western-lg">
              <i className="fas fa-hat-cowboy text-western-beige text-4xl"></i>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold text-western-dark">
              Sam Hébert
            </h1>
            <h2 className="text-2xl text-western-brown font-semibold">
              Le Cowboy de l'Humour
            </h2>
            <p className="text-xl text-gray-700 max-w-lg mx-auto">
              Gestionnaire d'événements personnel pour organiser vos spectacles, 
              gérer votre calendrier et publier sur votre site web.
            </p>
          </div>
        </div>

        {/* Login Card */}
        <Card className="shadow-western-lg border-2 border-western-brown">
          <CardHeader className="text-center bg-western-brown text-white rounded-t-lg">
            <CardTitle className="text-2xl font-bold">
              <i className="fas fa-sign-in-alt mr-3"></i>
              Accès Gestionnaire
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            <div className="space-y-6">
              <p className="text-center text-gray-600">
                Connectez-vous pour accéder à votre tableau de bord de gestion d'événements.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-western-sand rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-plus text-western-brown text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Créer des événements</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-western-sand rounded-lg flex items-center justify-center">
                    <i className="fas fa-calendar-check text-western-brown text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Gérer le calendrier</p>
                </div>
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-western-sand rounded-lg flex items-center justify-center">
                    <i className="fas fa-globe text-western-brown text-xl"></i>
                  </div>
                  <p className="text-sm font-medium text-gray-700">Publier en ligne</p>
                </div>
              </div>

              <Button 
                className="w-full bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-semibold py-4 text-lg shadow-western"
                onClick={() => window.location.href = '/api/login'}
              >
                <i className="fas fa-key mr-3"></i>
                Se Connecter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-gray-600">
          <p className="text-sm">
            © 2025 Sam Hébert - Gestionnaire d'Événements
          </p>
        </div>
      </div>
    </div>
  );
}
