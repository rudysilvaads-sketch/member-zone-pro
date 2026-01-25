import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Star, ArrowUp } from 'lucide-react';
import { calculateLevel, getXpToNextLevel } from '@/lib/firebaseServices';

interface LevelProgressProps {
  xp: number;
  points: number;
}

const getLevelTitle = (level: number): string => {
  if (level >= 50) return 'Lendário';
  if (level >= 40) return 'Mestre Supremo';
  if (level >= 30) return 'Mestre';
  if (level >= 25) return 'Expert';
  if (level >= 20) return 'Especialista';
  if (level >= 15) return 'Avançado';
  if (level >= 10) return 'Intermediário';
  if (level >= 5) return 'Aprendiz';
  return 'Iniciante';
};

const getLevelColor = (level: number): string => {
  if (level >= 50) return 'from-[#F5A623] via-[#E8920D] to-[#FFB84D]';
  if (level >= 40) return 'from-[#F5A623] via-[#FFB84D] to-[#E8920D]';
  if (level >= 30) return 'from-[#F5A623] to-[#E8920D]';
  if (level >= 20) return 'from-[#F5A623]/90 to-[#FFB84D]/90';
  if (level >= 10) return 'from-[#F5A623]/80 to-[#E8920D]/80';
  return 'from-[#F5A623]/60 to-[#E8920D]/60';
};

export function LevelProgress({ xp, points }: LevelProgressProps) {
  const level = calculateLevel(xp);
  const { current, needed, progress } = getXpToNextLevel(xp);
  const title = getLevelTitle(level);
  const colorGradient = getLevelColor(level);

  return (
    <Card variant="gradient" className="animate-fade-in overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5A623]/5 to-transparent" />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2 text-white">
          <Sparkles className="h-5 w-5 text-[#F5A623]" />
          Seu Nível
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Level display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${colorGradient} shadow-[0_0_30px_rgba(245,166,35,0.3)]`}>
              <span className="text-3xl font-bold text-[#0a0a0a]">{level}</span>
              <div className="absolute -bottom-1 -right-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0a0a0a] border-2 border-[#F5A623]">
                  <Star className="h-4 w-4 text-[#F5A623]" />
                </div>
              </div>
            </div>
            <div>
              <Badge variant="accent" className="mb-1">{title}</Badge>
              <p className="text-2xl font-bold text-white">Nível {level}</p>
              <p className="text-sm text-white/50">{xp.toLocaleString()} XP total</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-[#F5A623]">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm font-medium">Ativo</span>
            </div>
            <p className="text-2xl font-bold text-[#F5A623]">{points.toLocaleString()}</p>
            <p className="text-xs text-white/50">pontos</p>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">Próximo nível</span>
            <span className="font-medium text-white">{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-center text-xs text-white/50">
            Faltam <span className="font-bold text-[#F5A623]">{(needed - current).toLocaleString()}</span> XP para o nível {level + 1}
          </p>
        </div>

        {/* Level milestones */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {[5, 10, 20, 30, 50].map((milestone) => (
            <div
              key={milestone}
              className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                level >= milestone 
                  ? 'bg-[#F5A623]/10 border border-[#F5A623]/30' 
                  : 'bg-white/5 opacity-50'
              }`}
            >
              <span className={`text-lg font-bold ${level >= milestone ? 'text-[#F5A623]' : 'text-white/50'}`}>{milestone}</span>
              <span className="text-[10px] text-white/50">
                {milestone === 5 ? 'Aprendiz' : 
                 milestone === 10 ? 'Inter.' : 
                 milestone === 20 ? 'Espec.' : 
                 milestone === 30 ? 'Mestre' : 'Lenda'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
