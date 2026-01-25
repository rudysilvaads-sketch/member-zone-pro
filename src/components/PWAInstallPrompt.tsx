import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already installed
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches 
      || (window.navigator as any).standalone 
      || document.referrer.includes('android-app://');
    
    setIsStandalone(isInStandaloneMode);
    
    // Check if iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(isIOSDevice);

    // Check if user dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-prompt-dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
    
    // Show again after 7 days
    if (dismissedTime && daysSinceDismissed < 7) {
      return;
    }

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Show prompt after a delay
      setTimeout(() => {
        setShowPrompt(true);
      }, 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show after delay if not installed
    if (isIOSDevice && !isInStandaloneMode) {
      setTimeout(() => {
        setShowPrompt(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
  };

  // Don't show if already installed
  if (isStandalone) return null;
  
  // Don't show if no prompt available (except iOS)
  if (!showPrompt) return null;

  return (
    <div 
      className={cn(
        "fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-300",
        "md:left-auto md:right-4 md:max-w-sm"
      )}
    >
      <Card className="bg-[#0a0a0a]/95 backdrop-blur-xl border-[#F5A623]/20 shadow-[0_0_30px_rgba(245,166,35,0.15)]">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F5A623] shadow-[0_0_20px_rgba(245,166,35,0.3)]">
              <Smartphone className="h-6 w-6 text-[#0a0a0a]" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white text-sm">Instalar La Casa</h3>
              <p className="text-xs text-white/60 mt-0.5">
                {isIOS 
                  ? 'Toque em "Compartilhar" e depois "Adicionar à Tela de Início"'
                  : 'Instale o app para acesso rápido e experiência completa offline'
                }
              </p>
              
              <div className="flex items-center gap-2 mt-3">
                {!isIOS && deferredPrompt && (
                  <Button 
                    onClick={handleInstall}
                    size="sm"
                    className="bg-[#F5A623] text-[#0a0a0a] hover:bg-[#F5A623]/90 font-medium h-8 px-3 text-xs"
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    Instalar Agora
                  </Button>
                )}
                <Button 
                  onClick={handleDismiss}
                  variant="ghost" 
                  size="sm"
                  className="text-white/50 hover:text-white hover:bg-white/5 h-8 px-3 text-xs"
                >
                  Depois
                </Button>
              </div>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              className="h-6 w-6 shrink-0 text-white/40 hover:text-white hover:bg-white/5 -mt-1 -mr-1"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};