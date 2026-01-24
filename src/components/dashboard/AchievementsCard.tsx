import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Lock, Star, Zap, Target, Flame, Trophy, Medal } from "lucide-react";

const achievements = [
  {
    id: 1,
    name: "Primeiro Passo",
    description: "Complete seu primeiro módulo",
    icon: Star,
    unlocked: true,
    rarity: "common",
  },
  {
    id: 2,
    name: "Em Chamas",
    description: "Mantenha um streak de 7 dias",
    icon: Flame,
    unlocked: true,
    rarity: "rare",
  },
  {
    id: 3,
    name: "Mestre do Foco",
    description: "Complete 10 módulos sem pausar",
    icon: Target,
    unlocked: true,
    rarity: "epic",
  },
  {
    id: 4,
    name: "Velocidade Luz",
    description: "Complete um módulo em menos de 5 min",
    icon: Zap,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: 5,
    name: "Campeão",
    description: "Alcance o top 10 do ranking",
    icon: Trophy,
    unlocked: false,
    rarity: "legendary",
  },
  {
    id: 6,
    name: "Colecionador",
    description: "Desbloqueie 20 conquistas",
    icon: Medal,
    unlocked: false,
    rarity: "epic",
  },
];

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

export function AchievementsCard() {
  return (
    <Card variant="gradient" className="animate-fade-in" style={{ animationDelay: "300ms" }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5 text-accent" />
          Conquistas Recentes
        </CardTitle>
        <a href="/achievements" className="text-sm text-primary hover:underline">
          Ver todas
        </a>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {achievements.map((achievement, index) => (
            <div
              key={achievement.id}
              className={`relative flex flex-col items-center rounded-lg border p-4 text-center transition-all duration-200 hover:scale-105 animate-scale-in ${getRarityStyles(
                achievement.rarity,
                achievement.unlocked
              )}`}
              style={{ animationDelay: `${(index + 5) * 100}ms` }}
            >
              {!achievement.unlocked && (
                <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-background/50 backdrop-blur-sm">
                  <Lock className="h-6 w-6 text-muted-foreground" />
                </div>
              )}
              <achievement.icon
                className={`h-8 w-8 ${
                  achievement.unlocked
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
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
