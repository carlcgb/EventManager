import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateEventSchema } from "@shared/schema";
import type { Event } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { VenueInput } from "@/components/VenueInput";

interface EditEventDialogProps {
  event: Event;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditEventDialog({ event, isOpen, onClose }: EditEventDialogProps) {
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(updateEventSchema),
    defaultValues: {
      title: event.title,
      description: event.description || "",
      date: event.date, // Date is already in YYYY-MM-DD format
      venue: event.venue,
      addToCalendar: event.addToCalendar || false,
      publishToWebsite: event.publishToWebsite || false,
      sendNotification: event.sendNotification || false,
      status: event.status || "draft",
    },
  });

  const updateEventMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest("PUT", `/api/events/${event.id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Événement modifié",
        description: "L'événement a été modifié avec succès.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/events"] });
      queryClient.invalidateQueries({ queryKey: ["/api/events/stats"] });
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de modifier l'événement.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    updateEventMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-western-dark">
            Modifier l'événement
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-western-dark font-semibold">
                    Titre de l'événement *
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Entrez le titre de l'événement" 
                      className="focus:ring-western-brown focus:border-western-brown"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-western-dark font-semibold">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Décrivez votre événement..." 
                      className="focus:ring-western-brown focus:border-western-brown min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-western-dark font-semibold">
                      Date *
                    </FormLabel>
                    <FormControl>
                      <Input 
                        type="date" 
                        className="focus:ring-western-brown focus:border-western-brown"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-western-dark font-semibold">
                      Lieu *
                    </FormLabel>
                    <FormControl>
                      <VenueInput 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Entrez l'adresse du lieu"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-western-dark">Options</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="addToCalendar"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-western-brown data-[state=checked]:border-western-brown"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-western-dark font-medium">
                          Ajouter à Google Calendar
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          Synchronise avec votre calendrier personnel
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="publishToWebsite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-western-brown data-[state=checked]:border-western-brown"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-western-dark font-medium">
                          Publier sur le site web
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          Visible dans la liste publique des événements
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sendNotification"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-western-brown data-[state=checked]:border-western-brown"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-western-dark font-medium">
                          Envoyer des notifications
                        </FormLabel>
                        <p className="text-sm text-gray-600">
                          Notifier les participants par email
                        </p>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-western-dark font-semibold">
                        Statut
                      </FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="focus:ring-western-brown focus:border-western-brown">
                            <SelectValue placeholder="Choisir le statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="draft">Brouillon</SelectItem>
                          <SelectItem value="pending">En attente</SelectItem>
                          <SelectItem value="published">Publié</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={onClose}
                className="border-western-brown text-western-brown hover:bg-western-sand/20"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={updateEventMutation.isPending}
                className="bg-western-brown hover:bg-western-brown/90 text-white"
              >
                {updateEventMutation.isPending ? "Modification..." : "Modifier l'événement"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}