import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Lock, Check, Zap, Crown, Star, Frame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Frame as FrameType,
  defaultFrames,
  premiumFrames,
  exclusiveFrames,
  getCategoryLabel,
  getCategoryColor,
} from "@/lib/frameData";

interface FrameSelectorProps {
  onFrameChange?: (frameId: string) => void;
}

export function FrameSelector({ onFrameChange }: FrameSelectorProps) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [selectedFrame, setSelectedFrame] = useState<FrameType | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const unlockedFrames = userProfile?.unlockedFrames || [];
  const currentFrameId = userProfile?.currentFrameId || 'frame-none';
  const currentXp = userProfile?.xp || 0;
  const currentLevel = userProfile?.level || 1;

  const isFrameUnlocked = (frame: FrameType): boolean => {
    if (frame.category === 'default') return true;
    return unlockedFrames.includes(frame.id);
  };

  const canUnlockFrame = (frame: FrameType): boolean => {
    if (isFrameUnlocked(frame)) return false;
    if (frame.xpCost > currentXp) return false;
    if (frame.requiredLevel && frame.requiredLevel > currentLevel) return false;
    return true;
  };

  const handleFrameClick = (frame: FrameType) => {
    if (isFrameUnlocked(frame)) {
      handleSelectFrame(frame);
    } else if (canUnlockFrame(frame)) {
      setSelectedFrame(frame);
      setConfirmDialogOpen(true);
    } else {
      if (frame.requiredLevel && frame.requiredLevel > currentLevel) {
        toast.error(`Requer nível ${frame.requiredLevel}`);
      } else {
        toast.error(`XP insuficiente (necessário: ${frame.xpCost})`);
      }
    }
  };

  const handleSelectFrame = async (frame: FrameType) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        currentFrameId: frame.id,
      });
      
      await refreshProfile();
      onFrameChange?.(frame.id);
      toast.success(`Moldura "${frame.name}" selecionada!`);
    } catch (error) {
      toast.error('Erro ao selecionar moldura');
    }
  };

  const handlePurchaseFrame = async () => {
    if (!user || !selectedFrame) return;

    setPurchasing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: increment(-selectedFrame.xpCost),
        unlockedFrames: arrayUnion(selectedFrame.id),
        currentFrameId: selectedFrame.id,
      });
      
      await refreshProfile();
      onFrameChange?.(selectedFrame.id);
      toast.success(`Moldura "${selectedFrame.name}" desbloqueada e equipada!`);
      setConfirmDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao desbloquear moldura');
    } finally {
      setPurchasing(false);
    }
  };

  const renderFramePreview = (frame: FrameType, size: 'sm' | 'lg' = 'sm') => {
    const sizeClass = size === 'lg' ? 'h-20 w-20' : 'h-14 w-14';
    
    return (
      <div className={cn("avatar-frame-wrapper", frame.animationClass)}>
        <Avatar 
          className={cn(
            sizeClass,
            "avatar-with-frame",
            frame.borderStyle,
            frame.glowStyle
          )}
        >
          <AvatarImage src={userProfile?.photoURL || undefined} />
          <AvatarFallback className="bg-primary/20 text-sm">
            {userProfile?.displayName?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>
    );
  };

  const renderFrameGrid = (frames: FrameType[]) => (
    <div className="grid grid-cols-3 gap-5 sm:grid-cols-4 md:grid-cols-5">
      {frames.map((frame) => {
        const unlocked = isFrameUnlocked(frame);
        const canUnlock = canUnlockFrame(frame);
        const isCurrentFrame = currentFrameId === frame.id;
        const isLegendary = frame.id === 'frame-legendary';

        return (
          <HoverCard key={frame.id} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div
                className={cn(
                  "relative group cursor-pointer transition-all duration-300",
                  !unlocked && !canUnlock && "opacity-50"
                )}
                onClick={() => handleFrameClick(frame)}
              >
                <div
                  className={cn(
                    "relative rounded-xl p-2 transition-all duration-300 flex flex-col items-center",
                    isCurrentFrame && "ring-2 ring-primary ring-offset-2 ring-offset-background bg-primary/5",
                    unlocked && !isCurrentFrame && "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background hover:bg-secondary/50",
                    canUnlock && "hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
                  )}
                >
                  {renderFramePreview(frame)}

                  {/* Locked overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-sm">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Selected check */}
                  {isCurrentFrame && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Frame info */}
                <div className="mt-2 text-center">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    unlocked && isLegendary && "text-gradient-gold font-bold"
                  )}>{frame.name}</p>
                  {unlocked && frame.category !== 'default' && (
                    <Badge className={cn("text-[10px] px-1.5 py-0 mt-1", getCategoryColor(frame.category))}>
                      {isLegendary ? '✨ Lendária' : getCategoryLabel(frame.category)}
                    </Badge>
                  )}
                  {!unlocked && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-xs text-muted-foreground">{frame.xpCost}</span>
                    </div>
                  )}
                </div>
              </div>
            </HoverCardTrigger>
            
            {/* Hover Preview Card */}
            <HoverCardContent 
              side="right" 
              align="center" 
              className="w-72 p-4"
              sideOffset={10}
            >
              <div className="flex flex-col items-center space-y-3">
                {/* Large Frame Preview */}
                {renderFramePreview(frame, 'lg')}
                
                {/* Frame Details */}
                <div className="text-center space-y-2">
                  <h4 className={cn(
                    "font-bold text-lg",
                    isLegendary && "text-gradient-gold"
                  )}>{frame.name}</h4>
                  
                  <Badge className={cn("px-2 py-0.5", getCategoryColor(frame.category))}>
                    {isLegendary ? '✨ Lendária' : getCategoryLabel(frame.category)}
                  </Badge>
                  
                  {frame.description && (
                    <p className="text-sm text-muted-foreground">{frame.description}</p>
                  )}
                  
                  {/* Status & Requirements */}
                  <div className="pt-2 border-t border-border space-y-1">
                    {isCurrentFrame && (
                      <div className="flex items-center justify-center gap-1 text-primary">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Equipada</span>
                      </div>
                    )}
                    
                    {unlocked && !isCurrentFrame && (
                      <p className="text-sm text-muted-foreground">Clique para equipar</p>
                    )}
                    
                    {!unlocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary">{frame.xpCost}</span>
                          <span className="text-sm text-muted-foreground">XP</span>
                        </div>
                        
                        {frame.requiredLevel && (
                          <div className="flex items-center justify-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Nível {frame.requiredLevel} necessário
                            </span>
                          </div>
                        )}
                        
                        {canUnlock ? (
                          <p className="text-sm text-success font-medium">✓ Disponível para compra</p>
                        ) : (
                          <p className="text-sm text-destructive">
                            {frame.requiredLevel && frame.requiredLevel > currentLevel 
                              ? `Requer nível ${frame.requiredLevel}` 
                              : 'XP insuficiente'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Frame className="h-5 w-5 text-primary" />
            Molduras
          </CardTitle>
          <CardDescription>
            Personalize a moldura do seu avatar. Molduras premium custam XP.
          </CardDescription>
          <div className="flex items-center gap-4 mt-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Zap className="h-3 w-3" />
              {currentXp.toLocaleString()} XP
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Star className="h-3 w-3" />
              Nível {currentLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="default" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="default" className="text-xs sm:text-sm">
                Padrão
              </TabsTrigger>
              <TabsTrigger value="premium" className="text-xs sm:text-sm">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </TabsTrigger>
              <TabsTrigger value="exclusive" className="text-xs sm:text-sm">
                <Star className="h-3 w-3 mr-1" />
                Exclusivo
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[280px] pr-4">
              <TabsContent value="default" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Molduras gratuitas disponíveis para todos.
                  </p>
                </div>
                {renderFrameGrid(defaultFrames)}
              </TabsContent>

              <TabsContent value="premium" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Molduras especiais com efeitos únicos.
                  </p>
                </div>
                {renderFrameGrid(premiumFrames)}
              </TabsContent>

              <TabsContent value="exclusive" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Molduras raras com animações impressionantes.
                  </p>
                </div>
                {renderFrameGrid(exclusiveFrames)}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desbloquear Moldura</DialogTitle>
            <DialogDescription>
              Você está prestes a desbloquear uma moldura premium.
            </DialogDescription>
          </DialogHeader>
          
          {selectedFrame && (
            <div className="flex flex-col items-center py-6">
              {renderFramePreview(selectedFrame, 'lg')}
              <h3 className="mt-4 text-lg font-bold">{selectedFrame.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedFrame.description}</p>
              <Badge className={cn("mt-2", getCategoryColor(selectedFrame.category))}>
                {getCategoryLabel(selectedFrame.category)}
              </Badge>
              
              <div className="mt-4 flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-bold text-primary">{selectedFrame.xpCost}</span>
                <span className="text-muted-foreground">XP</span>
              </div>
              
              <p className="mt-2 text-sm text-muted-foreground">
                Seu XP após a compra: {(currentXp - selectedFrame.xpCost).toLocaleString()}
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="gold" 
              onClick={handlePurchaseFrame}
              disabled={purchasing}
            >
              {purchasing ? 'Desbloqueando...' : 'Desbloquear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
