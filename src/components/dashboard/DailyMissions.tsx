import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, 
  MessageSquare, 
  Share2, 
  Target,
  CheckCircle,
  Clock,
  Gift,
  Loader2,
  ShoppingBag,
  Trophy,
  Sparkles
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  getUserDailyMissions, 
  initializeUserDailyMissions, 
  verifyAndFixLoginReward,
  checkAndAwardAllMissionsBonus,
  MISSION_REWARDS,
  ALL_MISSIONS_BONUS
} from '@/lib/missionService';

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

// Default daily missions configuration
const missionConfigs: Omit<DailyMission, 'progress' | 'completed' | 'claimed'>[] = [
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
    id: 'engage-community',
    title: 'Membro Ativo',
    description: 'Faça um post ou comentário na comunidade',
    xpReward: 75,
    pointsReward: 35,
    icon: MessageSquare,
    requirement: 1,
  },
  {
    id: 'share-progress',
    title: 'Compartilhador',
    description: 'Compartilhe um post da comunidade',
    xpReward: 50,
    pointsReward: 25,
    icon: Share2,
    requirement: 1,
  },
  {
    id: 'visit-store',
    title: 'Explorador',
    description: 'Visite a Vitrine de produtos',
    xpReward: 25,
    pointsReward: 15,
    icon: ShoppingBag,
    requirement: 1,
  },
];

export function DailyMissions() {
  const { user, refreshProfile } = useAuth();
  const [missions, setMissions] = useState<DailyMission[]>([]);
  const [timeUntilReset, setTimeUntilReset] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bonusClaimed, setBonusClaimed] = useState(false);

  // Load missions from Firebase
  const loadMissions = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const missionIds = missionConfigs.map(m => m.id);
      
      // Try to get existing missions for today
      let userMissions = await getUserDailyMissions(user.uid);
      let loginRewardGranted = false;
      
      // If no missions for today, initialize them
      if (!userMissions) {
        const result = await initializeUserDailyMissions(user.uid, missionIds);
        userMissions = result.missionsDoc;
        loginRewardGranted = result.loginRewardGranted;
      } else {
        // Verify XP was credited correctly (fixes old missions that didn't credit XP)
        const wasFixed = await verifyAndFixLoginReward(user.uid);
        if (wasFixed) {
          loginRewardGranted = true;
        }
      }
      
      // Show login reward toast and refresh profile
      if (loginRewardGranted) {
        const loginReward = MISSION_REWARDS['daily-login'];
        toast.success(
          <div className="flex flex-col">
            <span className="font-bold">🎯 Missão Completada!</span>
            <span className="text-sm text-muted-foreground">{loginReward.title}</span>
            <span className="text-xs text-primary">+{loginReward.xp} XP | +{loginReward.points} pts</span>
          </div>
        );
        // Refresh profile to update XP display
        refreshProfile();
      }
      
      // Merge mission configs with user progress
      const mergedMissions = missionConfigs.map(config => {
        const userMission = userMissions?.missions[config.id];
        return {
          ...config,
          progress: userMission?.progress ?? 0,
          completed: userMission?.completed ?? false,
          claimed: userMission?.claimed ?? false,
        };
      });
      
      setMissions(mergedMissions);
      setBonusClaimed(userMissions?.allMissionsBonusClaimed ?? false);
      
      // Check if all missions are completed and bonus wasn't claimed yet
      const allCompleted = mergedMissions.every(m => m.completed);
      if (allCompleted && !userMissions?.allMissionsBonusClaimed) {
        const bonusResult = await checkAndAwardAllMissionsBonus(user.uid);
        if (bonusResult?.awarded) {
          setBonusClaimed(true);
          toast.success(
            <div className="flex flex-col">
              <span className="font-bold">🏆 Bônus Desbloqueado!</span>
              <span className="text-sm text-muted-foreground">{ALL_MISSIONS_BONUS.title}</span>
              <span className="text-xs text-primary">+{ALL_MISSIONS_BONUS.xp} XP | +{ALL_MISSIONS_BONUS.points} pts</span>
            </div>
          );
        }
      }
    } catch (error) {
      console.error('Error loading missions:', error);
      // Fallback to local state if Firebase fails
      const fallbackMissions = missionConfigs.map(mission => ({
        ...mission,
        progress: mission.id === 'daily-login' ? 1 : 0,
        completed: mission.id === 'daily-login',
        claimed: mission.id === 'daily-login',
      }));
      setMissions(fallbackMissions);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

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

  const completedCount = missions.filter(m => m.completed).length;
  const allCompleted = completedCount === missions.length && missions.length > 0;
  const totalXp = missions.reduce((sum, m) => sum + (m.claimed ? m.xpReward : 0), 0) + (bonusClaimed ? ALL_MISSIONS_BONUS.xp : 0);

  if (loading) {
    return (
      <Card variant="gradient" className="animate-fade-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-accent" />
            Missões Diárias
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

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
                  
                  {mission.completed && mission.claimed && (
                    <Badge variant="outline" className="text-[10px] text-success border-success/30">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Resgatado
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* All missions bonus */}
        <div 
          className={`flex items-center gap-4 p-4 rounded-lg border transition-all duration-300 ${
            bonusClaimed 
              ? 'bg-gradient-to-r from-[#BFFF00]/20 to-[#9ACD32]/20 border-[#BFFF00]/50 shadow-[0_0_20px_rgba(191,255,0,0.2)]' 
              : allCompleted
              ? 'bg-primary/10 border-primary/30 animate-pulse'
              : 'bg-secondary/30 border-border/50 opacity-60'
          }`}
        >
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
            bonusClaimed 
              ? 'bg-gradient-to-br from-[#BFFF00] to-[#9ACD32] shadow-[0_0_15px_rgba(191,255,0,0.4)]' 
              : allCompleted
              ? 'bg-gradient-gold shadow-glow-gold'
              : 'bg-secondary'
          }`}>
            {bonusClaimed ? (
              <Trophy className="h-6 w-6 text-[#0a0a0a]" />
            ) : (
              <Sparkles className={`h-6 w-6 ${allCompleted ? 'text-[#0a0a0a]' : 'text-muted-foreground'}`} />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={`font-medium ${bonusClaimed ? 'text-[#BFFF00]' : ''}`}>
                {ALL_MISSIONS_BONUS.title}
              </p>
              {bonusClaimed && (
                <Badge variant="outline" className="text-[10px] text-[#BFFF00] border-[#BFFF00]/30">
                  <Trophy className="h-3 w-3 mr-1" />
                  Conquistado!
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {bonusClaimed 
                ? 'Você completou todas as missões!' 
                : `Complete todas as ${missions.length} missões para ganhar`}
            </p>
          </div>
          
          <div className="text-right">
            <p className={`text-sm font-bold ${bonusClaimed ? 'text-[#BFFF00]' : 'text-primary'}`}>
              +{ALL_MISSIONS_BONUS.xp} XP
            </p>
            <p className="text-xs text-muted-foreground">+{ALL_MISSIONS_BONUS.points} pts</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
