import { useEffect, useRef, useState } from "react";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { signInWithGoogle, clearRecaptcha } from "@/lib/firebase";

interface RecaptchaLoginProps {
  onSuccess?: () => void;
}

export function RecaptchaLogin({ onSuccess }: RecaptchaLoginProps) {
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaRef = useRef<ReCAPTCHA>(null);
  const { toast } = useToast();

  // Get reCAPTCHA site key from environment
  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      clearRecaptcha();
    };
  }, []);

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
  };

  const handleRecaptchaExpired = () => {
    setRecaptchaToken(null);
    toast({
      title: "reCAPTCHA expiré",
      description: "Veuillez vérifier à nouveau le reCAPTCHA",
      variant: "destructive",
    });
  };

  const handleLogin = async () => {
    // For Google Sign-in, reCAPTCHA is recommended but not mandatory
    // as Google provides its own bot protection
    if (!recaptchaSiteKey) {
      // If no reCAPTCHA configured, proceed directly
      await performGoogleSignIn();
      return;
    }

    if (!recaptchaToken) {
      toast({
        title: "Vérification requise",
        description: "Veuillez compléter la vérification reCAPTCHA",
        variant: "destructive",
      });
      return;
    }

    await performGoogleSignIn();
  };

  const performGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans votre espace événements !",
      });
      onSuccess?.();
    } catch (error: any) {
      console.error('Login error:', error);
      
      // Reset reCAPTCHA on error
      if (recaptchaRef.current) {
        recaptchaRef.current.reset();
        setRecaptchaToken(null);
      }

      // Handle specific Firebase auth errors
      let errorMessage = "Erreur de connexion. Veuillez réessayer.";
      
      if (error.code === 'auth/popup-blocked') {
        errorMessage = "Popup bloquée. Autorisez les popups pour ce site.";
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "Connexion annulée.";
      } else if (error.code === 'auth/invalid-api-key') {
        errorMessage = "Configuration Firebase incorrecte.";
      }

      toast({
        title: "Erreur de connexion",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!recaptchaSiteKey) {
    // Fallback without reCAPTCHA if not configured
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
            onClick={performGoogleSignIn}
            disabled={isLoading}
            className="w-full bg-western-brown hover:bg-western-chocolate text-white font-medium py-3"
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Connexion...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Se connecter avec Google</span>
              </div>
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-western">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl text-western-dark">
          Connexion Sécurisée
        </CardTitle>
        <p className="text-gray-600">
          Connectez-vous pour gérer vos événements
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* reCAPTCHA */}
        <div className="flex justify-center">
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={recaptchaSiteKey}
            onChange={handleRecaptchaChange}
            onExpired={handleRecaptchaExpired}
            theme="light"
            size="normal"
          />
        </div>

        {/* Login Button */}
        <Button
          onClick={handleLogin}
          disabled={isLoading}
          className="w-full bg-western-brown hover:bg-western-chocolate text-white font-medium py-3"
        >
          {isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Connexion...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Se connecter avec Google</span>
            </div>
          )}
        </Button>

        {/* Security Notice */}
        <p className="text-xs text-gray-500 text-center">
          🔒 Connexion sécurisée protégée par reCAPTCHA et Google.
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