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
  if (level >= 50) return 'from-amber-400 via-orange-500 to-red-500';
  if (level >= 40) return 'from-purple-400 via-pink-500 to-red-500';
  if (level >= 30) return 'from-blue-400 via-purple-500 to-pink-500';
  if (level >= 20) return 'from-cyan-400 via-blue-500 to-purple-500';
  if (level >= 10) return 'from-green-400 via-cyan-500 to-blue-500';
  return 'from-gray-400 via-gray-500 to-gray-600';
};

export function LevelProgress({ xp, points }: LevelProgressProps) {
  const level = calculateLevel(xp);
  const { current, needed, progress } = getXpToNextLevel(xp);
  const title = getLevelTitle(level);
  const colorGradient = getLevelColor(level);

  return (
    <Card variant="accent" className="animate-fade-in overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorGradient} opacity-10`} />
      <CardHeader className="relative">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-accent" />
          Seu Nível
        </CardTitle>
      </CardHeader>
      <CardContent className="relative space-y-6">
        {/* Level display */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${colorGradient} shadow-lg`}>
              <span className="text-3xl font-bold text-white">{level}</span>
              <div className="absolute -bottom-1 -right-1">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background border-2 border-accent">
                  <Star className="h-4 w-4 text-accent" />
                </div>
              </div>
            </div>
            <div>
              <Badge variant="accent" className="mb-1">{title}</Badge>
              <p className="text-2xl font-bold">Nível {level}</p>
              <p className="text-sm text-muted-foreground">{xp.toLocaleString()} XP total</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center gap-1 text-success">
              <ArrowUp className="h-4 w-4" />
              <span className="text-sm font-medium">Ativo</span>
            </div>
            <p className="text-2xl font-bold text-primary">{points.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">pontos</p>
          </div>
        </div>

        {/* Progress to next level */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Próximo nível</span>
            <span className="font-medium">{current.toLocaleString()} / {needed.toLocaleString()} XP</span>
          </div>
          <Progress value={progress} className="h-3" />
          <p className="text-center text-xs text-muted-foreground">
            Faltam <span className="font-bold text-primary">{(needed - current).toLocaleString()}</span> XP para o nível {level + 1}
          </p>
        </div>

        {/* Level milestones */}
        <div className="grid grid-cols-5 gap-2 pt-2">
          {[5, 10, 20, 30, 50].map((milestone) => (
            <div
              key={milestone}
              className={`flex flex-col items-center p-2 rounded-lg text-center transition-all ${
                level >= milestone 
                  ? 'bg-primary/20 border border-primary/30' 
                  : 'bg-secondary/50 opacity-50'
              }`}
            >
              <span className="text-lg font-bold">{milestone}</span>
              <span className="text-[10px] text-muted-foreground">
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
