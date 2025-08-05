
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { signInWithGoogle } from "@/lib/firebase";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
      setLocation("/");
    } catch (error: any) {
      toast({
        title: "Erreur de connexion Google",
        description: error.message || "Impossible de se connecter avec Google",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-red-50 flex items-center justify-center p-4">
      {/* Background western elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-10 left-10 text-amber-200 text-6xl opacity-20">🤠</div>
        <div className="absolute top-20 right-20 text-amber-200 text-4xl opacity-20">⭐</div>
        <div className="absolute bottom-20 left-20 text-amber-200 text-5xl opacity-20">🏜️</div>
        <div className="absolute bottom-10 right-10 text-amber-200 text-4xl opacity-20">🌵</div>
      </div>

      <Card className="w-full max-w-md bg-white/60 backdrop-blur-md shadow-2xl border-0">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amber-800">Connexion</CardTitle>
          <CardDescription className="text-amber-600">
            Connectez-vous à votre compte pour gérer vos événements
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Google Sign In - Now the primary method */}
          <Button
            type="button"
            onClick={handleGoogleSignIn}
            className="w-full bg-white hover:bg-gray-50 text-gray-900 border border-gray-300 flex items-center justify-center gap-3 h-12 text-base font-medium"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Connecter avec Google
          </Button>

          <div className="text-center text-sm text-amber-700 bg-white/20 backdrop-blur-md p-4 rounded-lg border-0 shadow-lg">
            <p className="font-medium">Connexion sécurisée avec Google</p>
            <p className="text-amber-600 mt-1">
              Utilisez votre compte Google pour accéder à vos événements en toute sécurité
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}