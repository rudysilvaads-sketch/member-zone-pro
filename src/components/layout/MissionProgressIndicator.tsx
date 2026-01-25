import { Target, Trophy, Sparkles } from 'lucide-react';
import { useMissionProgress } from '@/hooks/useMissionProgress';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Link } from 'react-router-dom';

export function MissionProgressIndicator() {
  const { completed, total, allCompleted, bonusClaimed, loading } = useMissionProgress();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 animate-pulse">
        <div className="h-4 w-4 rounded bg-white/10" />
        <div className="h-3 w-12 rounded bg-white/10" />
      </div>
    );
  }

  const progressPercent = total > 0 ? (completed / total) * 100 : 0;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link 
            to="/" 
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 hover:scale-105 ${
              bonusClaimed
                ? 'bg-gradient-to-r from-[#BFFF00]/20 to-[#9ACD32]/20 border-[#BFFF00]/50 shadow-[0_0_15px_rgba(191,255,0,0.3)]'
                : allCompleted
                ? 'bg-[#BFFF00]/10 border-[#BFFF00]/30 animate-pulse'
                : 'bg-white/5 border-white/10 hover:border-[#BFFF00]/30'
            }`}
          >
            {/* Icon */}
            <div className={`relative ${bonusClaimed ? 'text-[#BFFF00]' : allCompleted ? 'text-[#BFFF00]' : 'text-white/60'}`}>
              {bonusClaimed ? (
                <Trophy className="h-4 w-4" />
              ) : allCompleted ? (
                <Sparkles className="h-4 w-4" />
              ) : (
                <Target className="h-4 w-4" />
              )}
            </div>

            {/* Progress indicator */}
            <div className="flex items-center gap-1.5">
              {/* Mini progress dots */}
              <div className="flex gap-0.5">
                {Array.from({ length: total }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-1.5 rounded-full transition-all duration-300 ${
                      i < completed
                        ? bonusClaimed
                          ? 'bg-[#BFFF00] shadow-[0_0_4px_rgba(191,255,0,0.5)]'
                          : 'bg-[#BFFF00]'
                        : 'bg-white/20'
                    }`}
                  />
                ))}
              </div>

              {/* Count text */}
              <span className={`text-xs font-medium ${
                bonusClaimed ? 'text-[#BFFF00]' : allCompleted ? 'text-[#BFFF00]' : 'text-white/60'
              }`}>
                {completed}/{total}
              </span>
            </div>

            {/* Bonus indicator */}
            {bonusClaimed && (
              <span className="text-[10px] font-bold text-[#0a0a0a] bg-[#BFFF00] px-1.5 py-0.5 rounded">
                +100
              </span>
            )}
          </Link>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="bg-[#1a1a1a] border-[#BFFF00]/30">
          <div className="text-center">
            <p className="font-medium text-white">Missões Diárias</p>
            <p className="text-xs text-white/60">
              {bonusClaimed 
                ? '🏆 Todas completas! Bônus resgatado!' 
                : allCompleted 
                ? '✨ Todas completas! Bônus aguardando...'
                : `${completed} de ${total} missões completas`}
            </p>
            {!bonusClaimed && (
              <div className="mt-1 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#BFFF00] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
