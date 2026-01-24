import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  BookOpen, 
  MessageSquare, 
  Share2, 
  Trophy, 
  Target,
  CheckCircle,
  Clock,
  Gift,
  Loader2
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  icon: React.ElementType;
  requirement: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

const missionIcons: Record<string, React.ElementType> = {
  login: Zap,
  module: BookOpen,
  comment: MessageSquare,
  share: Share2,
  streak: Trophy,
  complete: Target,
};

// Default daily missions
const defaultMissions: Omit<DailyMission, 'progress' | 'completed' | 'claimed'>[] = [
  {
    id: 'daily-login',
    title: 'Login Diário',
    description: 'Faça login na plataforma',
    xpReward: 50,
    pointsReward: 25,
    icon: Zap,
    requirement: 1,
  },
  {
    id: 'complete-module',
    title: 'Estudante Dedicado',
    description: 'Complete 1 módulo de estudo',
    xpReward: 100,
    pointsReward: 50,
    icon: BookOpen,
    requirement: 1,
  },
  {
    id: 'engage-community',
    title: 'Membro Ativo',
    description: 'Interaja na comunidade',
    xpReward: 75,
    pointsReward: 35,
    icon: MessageSquare,
    requirement: 1,
  },
  {
    id: 'share-progress',
    title: 'Compartilhador',
    description: 'Compartilhe seu progresso',
    xpReward: 50,
    pointsReward: 25,
    icon: Share2,
    requirement: 1,
  },
];

export function DailyMissions() {
  const { user, userProfile, updateUserPoints } = useAuth();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');

  useEffect(() => {
    // Initialize missions with login already completed
    const initialMissions = defaultMissions.map(mission => ({
      ...mission,
      progress: mission.id === 'daily-login' ? 1 : 0,
      completed: mission.id === 'daily-login',
      claimed: false,
    }));
    setMissions(initialMissions);
  }, []);

  useEffect(() => {
    // Calculate time until daily reset (midnight)
    const updateTimer = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const diff = tomorrow.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeUntilReset(`${hours}h ${minutes}m`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleClaimReward = async (mission: DailyMission) => {
    if (!mission.completed || mission.claimed || !user) return;
    
    setClaimingId(mission.id);
    
    try {
      await updateUserPoints(mission.pointsReward);
      
      setMissions(prev => prev.map(m => 
        m.id === mission.id ? { ...m, claimed: true } : m
      ));
      
      toast.success(
        <div className="flex flex-col">
          <span className="font-bold">Recompensa Resgatada!</span>
          <span className="text-sm">+{mission.xpReward} XP | +{mission.pointsReward} pontos</span>
        </div>
      );
    } catch (error) {
      toast.error('Erro ao resgatar recompensa');
    } finally {
      setClaimingId(null);
    }
  };

  const completedCount = missions.filter(m => m.completed).length;
  const claimedCount = missions.filter(m => m.claimed).length;
  const totalXp = missions.reduce((sum, m) => sum + (m.claimed ? m.xpReward : 0), 0);

  return (
    <Card variant="gradient" className="animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-accent" />
          Missões Diárias
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Reinicia em {timeUntilReset}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress summary */}
        <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-accent">
              <Gift className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">Progresso Diário</p>
              <p className="text-xs text-muted-foreground">
                {completedCount}/{missions.length} missões completas
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-bold text-primary">+{totalXp} XP</p>
            <p className="text-xs text-muted-foreground">ganhos hoje</p>
          </div>
        </div>

        {/* Mission list */}
        <div className="space-y-3">
          {missions.map((mission, index) => {
            const Icon = mission.icon;
            const progressPercent = (mission.progress / mission.requirement) * 100;
            
            return (
              <div
                key={mission.id}
                className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-200 animate-slide-in-right ${
                  mission.claimed 
                    ? 'bg-success/10 border-success/30' 
                    : mission.completed 
                    ? 'bg-primary/10 border-primary/30' 
                    : 'bg-secondary/50 border-border'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  mission.claimed 
                    ? 'bg-success' 
                    : mission.completed 
                    ? 'bg-gradient-gold shadow-glow-gold' 
                    : 'bg-secondary'
                }`}>
                  {mission.claimed ? (
                    <CheckCircle className="h-6 w-6 text-success-foreground" />
                  ) : (
                    <Icon className={`h-6 w-6 ${mission.completed ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`font-medium ${mission.claimed ? 'line-through text-muted-foreground' : ''}`}>
                      {mission.title}
                    </p>
                    {mission.completed && !mission.claimed && (
                      <Badge variant="gold" className="text-[10px]">Pronto!</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{mission.description}</p>
                  
                  {!mission.completed && (
                    <div className="mt-2">
                      <Progress value={progressPercent} className="h-1.5" />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {mission.progress}/{mission.requirement}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-primary">+{mission.xpReward} XP</p>
                    <p className="text-xs text-muted-foreground">+{mission.pointsReward} pts</p>
                  </div>
                  
                  {mission.completed && !mission.claimed && (
                    <Button
                      size="sm"
                      variant="gold"
                      onClick={() => handleClaimReward(mission)}
                      disabled={claimingId === mission.id}
                    >
                      {claimingId === mission.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Resgatar'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
