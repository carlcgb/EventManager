import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";


interface SimpleLoginProps {
  onSuccess?: () => void;
}

export function SimpleLogin({ onSuccess }: SimpleLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async () => {
    setIsLoading(true);
    window.location.href = '/api/login';
  };

  return (
    <Card className="w-full max-w-md shadow-western">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-western-dark">
          Connexion
        </CardTitle>
        <p className="text-gray-600">
          Connectez-vous pour gérer vos événements
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-western-brown hover:bg-western-chocolate text-white font-medium py-3"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Redirection...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <i className="fas fa-sign-in-alt text-lg"></i>
              <span>Se connecter</span>
            </div>
          )}
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-gray-500 text-center">
          Connexion sécurisée protégée par Google.
          <br />
          <a 
            href="https://policies.google.com/privacy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-western-brown hover:underline"
          >
            Politique de confidentialité
          </a>
          {" et "}
          <a 
            href="https://policies.google.com/terms" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-western-brown hover:underline"
          >
            Conditions d'utilisation
          </a>
        </p>
      </CardContent>
    </Card>
  );
}