import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Flame, Zap, Gift, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

// Streak milestones with bonus multipliers
const streakMilestones = [
  { days: 3, bonus: 1.1, label: '3 dias', icon: Flame },
  { days: 7, bonus: 1.25, label: '1 semana', icon: Zap },
  { days: 14, bonus: 1.5, label: '2 semanas', icon: Gift },
  { days: 30, bonus: 2.0, label: '1 mês', icon: Trophy },
];

export function getStreakBonus(streakDays: number): number {
  let bonus = 1.0;
  for (const milestone of streakMilestones) {
    if (streakDays >= milestone.days) {
      bonus = milestone.bonus;
    }
  }
  return bonus;
}

export function StreakCard() {
  const { userProfile } = useAuth();
  const streakDays = userProfile?.streakDays || 0;
  const currentBonus = getStreakBonus(streakDays);
  
  // Find next milestone
  const nextMilestone = streakMilestones.find(m => m.days > streakDays);
  const daysToNext = nextMilestone ? nextMilestone.days - streakDays : 0;
  
  // Calculate progress to next milestone
  const prevMilestone = [...streakMilestones].reverse().find(m => m.days <= streakDays);
  const prevDays = prevMilestone?.days || 0;
  const nextDays = nextMilestone?.days || streakDays;
  const progress = nextMilestone 
    ? ((streakDays - prevDays) / (nextDays - prevDays)) * 100 
    : 100;

  return (
    <Card className="overflow-hidden">
      <div className="bg-gradient-to-r from-[#F5A623]/20 via-[#E8920D]/20 to-[#F5A623]/20 p-[1px] rounded-xl">
        <CardContent className="bg-[#0a0a0a] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full",
                streakDays >= 7 ? "bg-gradient-to-br from-[#F5A623] to-[#E8920D] shadow-[0_0_20px_rgba(245,166,35,0.4)]" : "bg-[#F5A623]/10"
              )}>
                <Flame className={cn(
                  "h-6 w-6",
                  streakDays >= 7 ? "text-[#0a0a0a]" : "text-[#F5A623]"
                )} />
              </div>
              <div>
                <p className="text-sm text-white/50">Sequência de Login</p>
                <p className="text-2xl font-bold text-white">
                  {streakDays} {streakDays === 1 ? 'dia' : 'dias'}
                </p>
              </div>
            </div>
            
            {currentBonus > 1 && (
              <Badge className="bg-[#F5A623] text-[#0a0a0a] border-0 text-sm px-3 py-1 font-bold shadow-[0_0_10px_rgba(245,166,35,0.3)]">
                +{Math.round((currentBonus - 1) * 100)}% XP
              </Badge>
            )}
          </div>
          
          {/* Progress bar */}
          {nextMilestone && (
            <div className="space-y-2">
              <div className="flex justify-between text-xs text-white/50">
                <span>{prevMilestone?.label || 'Início'}</span>
                <span>{nextMilestone.label}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#F5A623] to-[#E8920D] transition-all duration-500 shadow-[0_0_10px_rgba(245,166,35,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-white/50">
                Mais {daysToNext} {daysToNext === 1 ? 'dia' : 'dias'} para {Math.round((nextMilestone.bonus - 1) * 100)}% de bônus de XP
              </p>
            </div>
          )}
          
          {/* Max streak reached */}
          {!nextMilestone && streakDays >= 30 && (
            <div className="flex items-center justify-center gap-2 p-2 bg-[#F5A623]/10 rounded-lg border border-[#F5A623]/20">
              <Trophy className="h-4 w-4 text-[#F5A623]" />
              <span className="text-sm font-medium text-[#F5A623]">
                Bônus máximo alcançado!
              </span>
            </div>
          )}
          
          {/* Streak milestones preview */}
          <div className="flex justify-between mt-4 gap-2">
            {streakMilestones.map((milestone) => {
              const Icon = milestone.icon;
              const isAchieved = streakDays >= milestone.days;
              return (
                <div 
                  key={milestone.days}
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all",
                    isAchieved 
                      ? "bg-[#F5A623]/10 text-[#F5A623] border border-[#F5A623]/20" 
                      : "bg-white/5 text-white/40"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{milestone.label}</span>
                  <span className="text-[10px]">+{Math.round((milestone.bonus - 1) * 100)}%</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </div>
    </Card>
  );
}
