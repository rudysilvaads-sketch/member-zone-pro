import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown, ArrowUp } from "lucide-react";

export function ProgressSection() {
  const currentPoints = 1250;
  const nextRankPoints = 2000;
  const progress = (currentPoints / nextRankPoints) * 100;

  return (
    <Card variant="gold" className="animate-fade-in" style={{ animationDelay: "100ms" }}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Seu Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Rank */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-gold shadow-glow-gold animate-pulse-glow">
              <Crown className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rank Atual</p>
              <p className="text-xl font-bold text-gradient-gold">GOLD</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-success">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm font-medium">+150 pts hoje</span>
            </div>
          </div>
        </div>

        {/* Progress to Next Rank */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="gold">GOLD</Badge>
              <span className="text-sm text-muted-foreground">→</span>
              <Badge variant="platinum">PLATINUM</Badge>
            </div>
            <span className="text-sm text-muted-foreground">
              {currentPoints.toLocaleString()} / {nextRankPoints.toLocaleString()} pts
            </span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-center text-sm text-muted-foreground">
            Faltam <span className="font-bold text-primary">{(nextRankPoints - currentPoints).toLocaleString()}</span> pontos para o próximo rank!
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold">23</p>
            <p className="text-xs text-muted-foreground">Módulos</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">8</p>
            <p className="text-xs text-muted-foreground">Conquistas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold">7</p>
            <p className="text-xs text-muted-foreground">Dias Streak</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
