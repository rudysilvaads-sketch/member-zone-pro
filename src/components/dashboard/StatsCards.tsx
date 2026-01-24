import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Star, Target, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  userRank: number | null;
  points: number;
  achievements: number;
  streakDays: number;
}

export function StatsCards({ userRank, points, achievements, streakDays }: StatsCardsProps) {
  const stats = [
    {
      label: "Sua Posição",
      value: userRank ? `#${userRank}` : "-",
      change: userRank && userRank <= 10 ? "Top 10!" : "",
      changeType: "positive" as const,
      icon: Trophy,
      iconColor: "text-primary",
    },
    {
      label: "Pontos Totais",
      value: points.toLocaleString(),
      change: "",
      changeType: "positive" as const,
      icon: Star,
      iconColor: "text-primary",
    },
    {
      label: "Conquistas",
      value: `${achievements}/24`,
      change: "",
      changeType: "positive" as const,
      icon: Target,
      iconColor: "text-accent",
    },
    {
      label: "Streak Atual",
      value: `${streakDays} dias`,
      change: streakDays >= 7 ? "Incrível!" : "",
      changeType: streakDays >= 7 ? "record" as const : "positive" as const,
      icon: TrendingUp,
      iconColor: "text-success",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          variant="gradient"
          className="animate-fade-in"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
                {stat.change && (
                  <p
                    className={
                      stat.changeType === "positive"
                        ? "text-success text-sm font-medium"
                        : stat.changeType === "record"
                        ? "text-primary text-sm font-medium"
                        : "text-muted-foreground text-sm"
                    }
                  >
                    {stat.change}
                  </p>
                )}
              </div>
              <div className={`h-12 w-12 rounded-lg bg-secondary flex items-center justify-center ${stat.iconColor}`}>
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
