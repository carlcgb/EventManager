import { Badge as BadgeType, UserBadge } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatFrenchDate } from "@/lib/utils";

interface BadgeDisplayProps {
  badge: BadgeType;
  userBadge?: UserBadge;
  size?: "sm" | "md" | "lg";
  showDescription?: boolean;
}

export function BadgeDisplay({ badge, userBadge, size = "md", showDescription = false }: BadgeDisplayProps) {
  const isEarned = !!userBadge;
  
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-lg",
    lg: "w-16 h-16 text-2xl"
  };

  const badgeColors = {
    gold: "bg-gradient-to-br from-yellow-400 to-yellow-600 text-yellow-900",
    silver: "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-800",
    bronze: "bg-gradient-to-br from-orange-400 to-orange-600 text-orange-900",
    blue: "bg-gradient-to-br from-blue-400 to-blue-600 text-blue-900",
    green: "bg-gradient-to-br from-green-400 to-green-600 text-green-900",
    purple: "bg-gradient-to-br from-purple-400 to-purple-600 text-purple-900",
    red: "bg-gradient-to-br from-red-400 to-red-600 text-red-900",
    gray: "bg-gradient-to-br from-gray-400 to-gray-600 text-gray-900",
  };

  const colorClass = badgeColors[badge.color as keyof typeof badgeColors] || badgeColors.gray;

  if (!showDescription) {
    return (
      <div className="relative group">
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClass}
            rounded-full flex items-center justify-center font-bold shadow-lg
            ${isEarned ? '' : 'opacity-30 grayscale'}
            transform transition-transform hover:scale-110
          `}
          title={`${badge.name}${isEarned ? ` - Obtenu le ${formatFrenchDate(userBadge!.earnedAt)}` : ' - Non obtenu'}`}
        >
          <i className={badge.icon}></i>
        </div>
        
        {/* Tooltip on hover */}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
          <div className="font-semibold">{badge.name}</div>
          {isEarned && userBadge && (
            <div className="text-gray-300">
              {formatFrenchDate(userBadge.earnedAt)}
            </div>
          )}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-black"></div>
        </div>
      </div>
    );
  }

  return (
    <Card className={`${isEarned ? 'border-2 border-western-brown shadow-western' : 'opacity-60'}`}>
      <CardContent className="p-4 text-center">
        <div
          className={`
            ${sizeClasses[size]} 
            ${colorClass}
            rounded-full flex items-center justify-center font-bold shadow-lg mx-auto mb-3
            ${isEarned ? '' : 'opacity-50 grayscale'}
          `}
        >
          <i className={badge.icon}></i>
        </div>
        
        <div className="space-y-2">
          <h3 className={`font-bold ${isEarned ? 'text-western-dark' : 'text-gray-500'}`}>
            {badge.name}
          </h3>
          
          {badge.description && (
            <p className={`text-sm ${isEarned ? 'text-gray-600' : 'text-gray-400'}`}>
              {badge.description}
            </p>
          )}
          
          {isEarned && userBadge ? (
            <Badge className="bg-western-success text-white">
              <i className="fas fa-check mr-1"></i>
              Obtenu le {formatFrenchDate(userBadge.earnedAt)}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-gray-500 border-gray-300">
              <i className="fas fa-lock mr-1"></i>
              Non obtenu
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}