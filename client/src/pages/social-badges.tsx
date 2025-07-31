import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BadgeDisplay } from "@/components/BadgeDisplay";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Badge as BadgeType, UserBadge, UserStats } from "@shared/schema";

export default function SocialBadges() {
  const { user, isLoading } = useAuth();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      toast({
        title: "Déconnexion réussie",
        description: "À bientôt !",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Erreur lors de la déconnexion",
        variant: "destructive",
      });
    }
  };

  // Fetch user badges
  const { data: userBadges = [], isLoading: badgesLoading } = useQuery<UserBadge[]>({
    queryKey: ["/api/user/badges"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 2;
    },
  });

  // Fetch all available badges
  const { data: allBadges = [], isLoading: allBadgesLoading } = useQuery<BadgeType[]>({
    queryKey: ["/api/badges"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 2;
    },
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery<UserStats>({
    queryKey: ["/api/user/stats"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 2;
    },
  });

  if (isLoading || badgesLoading || allBadgesLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-black/30 backdrop-blur-[1px] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-western-brown"></div>
      </div>
    );
  }

  // Organize badges by status
  const earnedBadges = allBadges.filter(badge => 
    userBadges.some(userBadge => userBadge.badgeId === badge.id)
  );
  
  const availableBadges = allBadges.filter(badge => 
    !userBadges.some(userBadge => userBadge.badgeId === badge.id)
  );

  const getBadgeProgress = (badge: BadgeType) => {
    if (!userStats) return 0;
    
    const req = badge.requirement as any;
    switch (req.type) {
      case 'events_created':
        return Math.min(100, (parseInt(userStats.eventsCreated) / req.target) * 100);
      case 'events_published':
        return Math.min(100, (parseInt(userStats.eventsPublished) / req.target) * 100);
      case 'events_shared':
        return Math.min(100, (parseInt(userStats.eventsShared) / req.target) * 100);
      case 'calendar_integrations':
        return Math.min(100, (parseInt(userStats.calendarIntegrations) / req.target) * 100);
      case 'streak_days':
        return Math.min(100, (parseInt(userStats.streakDays) / req.target) * 100);
      default:
        return 0;
    }
  };

  return (
    <div className="min-h-screen bg-black/30 backdrop-blur-[1px]">
      {/* Header */}
      <header className="bg-western-dark shadow-western-lg border-b-4 border-western-brown">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-western-brown rounded-full flex items-center justify-center">
                <i className="fas fa-trophy text-western-beige text-xl"></i>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-western-beige">Badges & Récompenses</h1>
                <p className="text-western-sand text-sm">Débloquez des badges en créant et partageant vos événements</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => window.location.href = '/'}
                className="text-western-beige hover:text-white"
              >
                <i className="fas fa-home mr-2"></i>
                Tableau de bord
              </Button>
              <div className="hidden md:flex items-center space-x-2 bg-western-brown/20 px-4 py-2 rounded-lg">
                <i className="fas fa-user-circle text-western-sand"></i>
                <span className="text-western-beige font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
              </div>
              <Button 
                variant="destructive"
                onClick={handleLogout}
                className="bg-western-danger hover:bg-red-700 flex items-center space-x-2"
              >
                <i className="fas fa-sign-out-alt"></i>
                <span className="hidden sm:inline">Déconnexion</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-l-4 border-western-brown shadow-western">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Badges obtenus</p>
                  <p className="text-3xl font-bold text-western-brown">
                    {earnedBadges.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-western-brown/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-trophy text-western-brown text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-western-success shadow-western">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Événements créés</p>
                  <p className="text-3xl font-bold text-western-success">
                    {userStats?.eventsCreated || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-western-success/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-plus-circle text-western-success text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500 shadow-western">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Partages sociaux</p>
                  <p className="text-3xl font-bold text-blue-500">
                    {userStats?.totalShares || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-share-alt text-blue-500 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-purple-500 shadow-western">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Série de jours</p>
                  <p className="text-3xl font-bold text-purple-500">
                    {userStats?.streakDays || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <i className="fas fa-fire text-purple-500 text-xl"></i>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center mb-6">
              <h2 className="text-2xl font-bold text-western-dark">
                Badges obtenus
              </h2>
              <Badge className="ml-4 bg-western-success text-white">
                {earnedBadges.length} badge{earnedBadges.length > 1 ? 's' : ''}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {earnedBadges.map((badge) => {
                const userBadge = userBadges.find(ub => ub.badgeId === badge.id);
                return (
                  <BadgeDisplay
                    key={badge.id}
                    badge={badge}
                    userBadge={userBadge}
                    size="lg"
                    showDescription={true}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Available Badges */}
        <div>
          <div className="flex items-center mb-6">
            <h2 className="text-2xl font-bold text-western-dark">
              Badges disponibles
            </h2>
            <Badge variant="outline" className="ml-4">
              {availableBadges.length} à débloquer
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {availableBadges.map((badge) => {
              const progress = getBadgeProgress(badge);
              return (
                <div key={badge.id} className="relative">
                  <BadgeDisplay
                    badge={badge}
                    size="lg" 
                    showDescription={true}
                  />
                  
                  {/* Progress indicator */}
                  {progress > 0 && (
                    <div className="absolute top-2 right-2">
                      <div className="bg-white rounded-full p-1 shadow-lg">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center relative">
                          <svg className="w-8 h-8 transform -rotate-90 absolute">
                            <circle
                              cx="16"
                              cy="16"
                              r="14"
                              stroke="currentColor"
                              strokeWidth="2"
                              fill="none"
                              className="text-western-brown"
                              strokeDasharray={`${(progress / 100) * 87.96} 87.96`}
                            />
                          </svg>
                          <span className="text-xs font-bold text-western-brown">
                            {Math.round(progress)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* No badges message */}
        {allBadges.length === 0 && (
          <Card className="shadow-western">
            <CardContent className="p-12 text-center">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <i className="fas fa-trophy text-gray-400 text-4xl"></i>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Aucun badge disponible</h3>
              <p className="text-gray-600 mb-6">
                Les badges seront bientôt configurés. Continuez à créer et partager vos événements !
              </p>
              <Button
                onClick={() => window.location.href = '/'}
                className="bg-gradient-to-r from-western-brown to-western-chocolate hover:from-western-chocolate hover:to-western-brown text-white font-semibold"
              >
                <i className="fas fa-plus mr-2"></i>
                Créer un Événement
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}