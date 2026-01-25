import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Lock, Star, Zap, Target, Flame, Trophy, Medal, Heart, MessageSquare, MessageCircle, ShoppingBag, Send, TrendingUp, CheckCircle, Users, Package, Crown } from "lucide-react";
import { ACHIEVEMENTS } from "@/lib/achievementService";

// Map icon names to components
const iconMap: Record<string, any> = {
  'star': Star,
  'flame': Flame,
  'target': Target,
  'zap': Zap,
  'trophy': Trophy,
  'medal': Medal,
  'heart': Heart,
  'message-square': MessageSquare,
  'message-circle': MessageCircle,
  'shopping-bag': ShoppingBag,
  'send': Send,
  'trending-up': TrendingUp,
  'check-circle': CheckCircle,
  'users': Users,
  'package': Package,
  'award': Award,
  'crown': Crown,
};

interface AchievementsCardProps {
  unlockedAchievements: string[];
}

const getRarityStyles = (rarity: string, unlocked: boolean) => {
  if (!unlocked) return "bg-secondary border-border opacity-50";
  
  switch (rarity) {
    case "legendary":
      return "bg-gradient-gold border-gold shadow-glow-gold";
    case "epic":
      return "bg-gradient-accent border-accent shadow-glow-accent";
    case "rare":
      return "bg-secondary border-rank-diamond";
    default:
      return "bg-secondary border-success";
  }
};

export function AchievementsCard({ unlockedAchievements }: AchievementsCardProps) {
  // Show only first 7 achievements for dashboard preview
  const displayAchievements = ACHIEVEMENTS.slice(0, 7);
  
  return (
    <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Conquistas ({unlockedAchievements.length}/{ACHIEVEMENTS.length})
        </CardTitle>
        <a href="/achievements" className="text-sm text-primary hover:underline">
          Ver todas
        </a>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {displayAchievements.map((achievement, index) => {
            const unlocked = unlockedAchievements.includes(achievement.id);
            const Icon = iconMap[achievement.icon] || Star;
            
            return (
              <div
                key={achievement.id}
                className={`relative flex flex-col items-center rounded-lg border p-4 text-center transition-all duration-200 hover:scale-105 animate-scale-in ${getRarityStyles(
                  achievement.rarity,
                  unlocked
                )}`}
                style={{ animationDelay: `${(index + 5) * 50}ms` }}
                title={achievement.description}
              >
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
                    <Lock className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <Icon
                  className={`h-8 w-8 ${
                    unlocked
                      ? achievement.rarity === "legendary"
                        ? "text-primary-foreground"
                        : achievement.rarity === "epic"
                        ? "text-accent-foreground"
                        : "text-foreground"
                      : "text-muted-foreground"
                  }`}
                />
                <p className="mt-2 text-xs font-medium">{achievement.name}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
