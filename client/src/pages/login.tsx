
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { loginUserSchema } from "@shared/schema";

export default function Login() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof loginUserSchema>>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: z.infer<typeof loginUserSchema>) => {
      return await apiRequest("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur de connexion",
        description: error.message || "Email ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof loginUserSchema>) => {
    loginMutation.mutate(data);
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

      <Card className="w-full max-w-md bg-white/60 backdrop-blur-sm border-amber-200 shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-amber-800">Connexion</CardTitle>
          <CardDescription className="text-amber-600">
            Connectez-vous à votre compte pour gérer vos événements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-800">Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="votre@email.com"
                        className="border-amber-300 focus:border-amber-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-800">Mot de passe</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="border-amber-300 focus:border-amber-500"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Connexion..." : "Se connecter"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <p className="text-sm text-amber-600">
              Pas encore de compte ?{" "}
              <Link href="/register" className="text-amber-800 hover:underline font-medium">
                Créer un compte
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}