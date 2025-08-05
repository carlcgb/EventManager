import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";

import Home from "@/pages/home";
import Events from "@/pages/events";
import CalendarIntegrations from "@/pages/calendar-integrations";
import CalendarSettings from "@/pages/calendar-settings";

import PublicEvent from "@/pages/public-event";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <Switch>
      {isLoading || !isAuthenticated ? (
        <>
          <Route path="/" component={Landing} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Login} />
          <Route path="/event/:id" component={PublicEvent} />
        </>
      ) : (
        <>
          <Route path="/" component={Home} />
          <Route path="/events" component={Events} />
          <Route path="/calendar-integrations" component={CalendarIntegrations} />
          <Route path="/calendar-settings" component={CalendarSettings} />

          <Route path="/event/:id" component={PublicEvent} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
