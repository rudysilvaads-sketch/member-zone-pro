import { useEffect, useState } from 'react';
import { Sparkles, Star, Trophy, Zap } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { calculateLevel, getLevelTitle } from '@/lib/levelUtils';

interface LevelUpAnimationProps {
  previousLevel: number;
  newLevel: number;
  onClose: () => void;
}

export function LevelUpAnimation({ previousLevel, newLevel, onClose }: LevelUpAnimationProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showContent, setShowContent] = useState(false);
  const [showParticles, setShowParticles] = useState(false);

  useEffect(() => {
    // Staggered animation entrance
    const timer1 = setTimeout(() => setShowParticles(true), 100);
    const timer2 = setTimeout(() => setShowContent(true), 300);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300);
  };

  const newTitle = getLevelTitle(newLevel);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md border-none bg-transparent shadow-none overflow-visible">
        <div className="relative flex flex-col items-center justify-center p-8">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-radial from-[#BFFF00]/30 via-[#BFFF00]/10 to-transparent rounded-3xl blur-3xl animate-pulse" />
          
          {/* Floating particles */}
          {showParticles && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {[...Array(12)].map((_, i) => (
                <div
                  key={i}
                  className="absolute animate-float-particle"
                  style={{
                    left: `${10 + Math.random() * 80}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: `${2 + Math.random() * 2}s`,
                  }}
                >
                  <Sparkles className="h-4 w-4 text-[#BFFF00] opacity-70" />
                </div>
              ))}
              {[...Array(8)].map((_, i) => (
                <div
                  key={`star-${i}`}
                  className="absolute animate-twinkle"
                  style={{
                    left: `${5 + Math.random() * 90}%`,
                    top: `${5 + Math.random() * 90}%`,
                    animationDelay: `${i * 0.15}s`,
                  }}
                >
                  <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                </div>
              ))}
            </div>
          )}

          {/* Main content card */}
          <div 
            className={`relative z-10 flex flex-col items-center p-8 rounded-3xl bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border-2 border-[#BFFF00]/50 shadow-[0_0_60px_rgba(191,255,0,0.3)] transition-all duration-500 ${
              showContent ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
            }`}
          >
            {/* Level up badge */}
            <div className="absolute -top-4 px-4 py-1 bg-[#BFFF00] rounded-full">
              <span className="text-xs font-bold text-[#0a0a0a] uppercase tracking-wider flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Level Up!
              </span>
            </div>

            {/* Trophy icon with glow */}
            <div className="relative mb-4 mt-4">
              <div className="absolute inset-0 bg-[#BFFF00]/40 rounded-full blur-xl animate-pulse" />
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#BFFF00] to-[#9ACD32] shadow-[0_0_40px_rgba(191,255,0,0.5)]">
                <Trophy className="h-12 w-12 text-[#0a0a0a]" />
              </div>
            </div>

            {/* Level transition */}
            <div className="flex items-center gap-4 mb-4">
              <div className="flex flex-col items-center opacity-50">
                <span className="text-sm text-white/50">Nível</span>
                <span className="text-2xl font-bold text-white/70">{previousLevel}</span>
              </div>
              
              <div className="flex items-center">
                <div className="w-8 h-0.5 bg-gradient-to-r from-white/20 to-[#BFFF00]" />
                <Zap className="h-6 w-6 text-[#BFFF00] mx-1 animate-pulse" />
                <div className="w-8 h-0.5 bg-gradient-to-r from-[#BFFF00] to-white/20" />
              </div>
              
              <div className="flex flex-col items-center">
                <span className="text-sm text-[#BFFF00]">Nível</span>
                <span className="text-4xl font-bold text-[#BFFF00] animate-bounce-slow">{newLevel}</span>
              </div>
            </div>

            {/* New title */}
            <div className="text-center mb-6">
              <p className="text-white/70 text-sm mb-1">Novo título desbloqueado:</p>
              <p className="text-xl font-bold text-white">
                ✨ {newTitle} ✨
              </p>
            </div>

            {/* Close button */}
            <Button 
              onClick={handleClose}
              className="bg-[#BFFF00] hover:bg-[#BFFF00]/90 text-[#0a0a0a] font-bold px-8"
            >
              Incrível!
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
