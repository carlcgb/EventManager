import { useState } from "react";
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
import { registerUserSchema } from "@shared/schema";

export default function Register() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof registerUserSchema>>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: z.infer<typeof registerUserSchema>) => {
      return await apiRequest("/api/auth/register", {
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
        title: "Compte créé avec succès",
        description: "Bienvenue dans l'application !",
      });
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erreur lors de la création du compte",
        description: error.message || "Une erreur est survenue",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof registerUserSchema>) => {
    registerMutation.mutate(data);
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
          <CardTitle className="text-2xl font-bold text-amber-800">Créer un compte</CardTitle>
          <CardDescription className="text-amber-600">
            Rejoignez-nous pour commencer à gérer vos événements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-800">Prénom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="John"
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
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-800">Nom</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Doe"
                          className="border-amber-300 focus:border-amber-500"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
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
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-amber-800">Confirmer le mot de passe</FormLabel>
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
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? "Création..." : "Créer mon compte"}
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center">
            <p className="text-sm text-amber-600">
              Déjà un compte ?{" "}
              <Link href="/login" className="text-amber-800 hover:underline font-medium">
                Se connecter
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}