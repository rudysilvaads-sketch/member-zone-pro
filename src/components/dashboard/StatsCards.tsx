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
    },
    {
      label: "Pontos Totais",
      value: points.toLocaleString(),
      change: "",
      changeType: "positive" as const,
      icon: Star,
    },
    {
      label: "Conquistas",
      value: `${achievements}/24`,
      change: "",
      changeType: "positive" as const,
      icon: Target,
    },
    {
      label: "Streak Atual",
      value: `${streakDays} dias`,
      change: streakDays >= 7 ? "Incrível!" : "",
      changeType: streakDays >= 7 ? "record" as const : "positive" as const,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card 
          key={stat.label} 
          variant="gradient"
          className="animate-fade-in group hover:border-[#F5A623]/30 transition-all duration-300"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-white/50">{stat.label}</p>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                {stat.change && (
                  <p
                    className={
                      stat.changeType === "positive"
                        ? "text-[#F5A623] text-sm font-medium"
                        : stat.changeType === "record"
                        ? "text-[#F5A623] text-sm font-medium"
                        : "text-white/50 text-sm"
                    }
                  >
                    {stat.change}
                  </p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-[#F5A623]/10 border border-[#F5A623]/20 flex items-center justify-center group-hover:bg-[#F5A623]/20 group-hover:shadow-[0_0_15px_rgba(245,166,35,0.2)] transition-all duration-300">
                <stat.icon className="h-6 w-6 text-[#F5A623]" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
