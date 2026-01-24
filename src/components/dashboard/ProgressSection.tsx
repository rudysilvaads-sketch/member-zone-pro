import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Crown, ArrowUp } from "lucide-react";

interface ProgressSectionProps {
  currentPoints: number;
  currentRank: string;
  completedModules: number;
  achievements: number;
  streakDays: number;
}

const rankThresholds: Record<string, { next: string; points: number }> = {
  bronze: { next: 'silver', points: 500 },
  silver: { next: 'gold', points: 1500 },
  gold: { next: 'platinum', points: 3000 },
  platinum: { next: 'diamond', points: 5000 },
  diamond: { next: 'diamond', points: 10000 },
};

const getBadgeVariant = (rank: string) => {
  switch (rank.toLowerCase()) {
    case 'diamond': return 'diamond';
    case 'platinum': return 'platinum';
    case 'gold': return 'gold';
    case 'silver': return 'silver';
    default: return 'bronze';
  }
};

export function ProgressSection({ 
  currentPoints, 
  currentRank, 
  completedModules, 
  achievements, 
  streakDays 
}: ProgressSectionProps) {
  const rankInfo = rankThresholds[currentRank.toLowerCase()] || rankThresholds.bronze;
  const previousRankPoints = currentRank === 'bronze' ? 0 : 
    Object.entries(rankThresholds).find(([_, v]) => v.next === currentRank)?.[1]?.points || 0;
  
  const pointsInCurrentRank = currentPoints - previousRankPoints;
  const pointsNeededForNext = rankInfo.points - previousRankPoints;
  const progress = Math.min((pointsInCurrentRank / pointsNeededForNext) * 100, 100);
  const pointsToNextRank = Math.max(rankInfo.points - currentPoints, 0);

  return (
    <Card variant="gradient" className="animate-fade-in relative overflow-hidden" style={{ animationDelay: "100ms" }}>
      <div className="absolute inset-0 bg-gradient-to-br from-[#BFFF00]/5 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-white">
          <TrendingUp className="h-5 w-5 text-[#BFFF00]" />
          Seu Progresso
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 relative">
        {/* Current Rank */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BFFF00] shadow-[0_0_25px_rgba(191,255,0,0.4)]">
              <Crown className="h-6 w-6 text-[#0a0a0a]" />
            </div>
            <div>
              <p className="text-sm text-white/50">Rank Atual</p>
              <p className="text-xl font-bold text-[#BFFF00] italic">{currentRank.toUpperCase()}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-[#BFFF00]">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm font-medium">{currentPoints.toLocaleString()} pts</span>
            </div>
          </div>
        </div>

        {/* Progress to Next Rank */}
        {currentRank !== 'diamond' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant={getBadgeVariant(currentRank)}>{currentRank.toUpperCase()}</Badge>
                <span className="text-sm text-white/30">→</span>
                <Badge variant={getBadgeVariant(rankInfo.next)}>{rankInfo.next.toUpperCase()}</Badge>
              </div>
              <span className="text-sm text-white/50">
                {currentPoints.toLocaleString()} / {rankInfo.points.toLocaleString()} pts
              </span>
            </div>
            <Progress value={progress} className="h-3" />
            <p className="text-center text-sm text-white/50">
              Faltam <span className="font-bold text-[#BFFF00]">{pointsToNextRank.toLocaleString()}</span> pontos para o próximo rank!
            </p>
          </div>
        )}

        {currentRank === 'diamond' && (
          <div className="text-center py-4">
            <p className="text-lg font-bold text-[#BFFF00]">🎉 Rank Máximo Atingido!</p>
            <p className="text-sm text-white/50">Você é uma lenda!</p>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 pt-2">
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-[#BFFF00]">{completedModules}</p>
            <p className="text-xs text-white/50">Módulos</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-[#BFFF00]">{achievements}</p>
            <p className="text-xs text-white/50">Conquistas</p>
          </div>
          <div className="text-center p-3 rounded-xl bg-white/5 border border-white/10">
            <p className="text-2xl font-bold text-[#BFFF00]">{streakDays}</p>
            <p className="text-xs text-white/50">Dias Streak</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
