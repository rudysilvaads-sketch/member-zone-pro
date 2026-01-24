import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { Lock, Sparkles, Check, Zap, Crown, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { doc, updateDoc, arrayUnion, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  Avatar as AvatarType,
  defaultAvatars,
  premiumAvatars,
  exclusiveAvatars,
  getCategoryLabel,
  getCategoryColor,
} from "@/lib/avatarData";

// Sparkle particles component for exclusive avatars
const SparkleParticles = () => (
  <>
    {[...Array(6)].map((_, i) => (
      <span key={i} className="sparkle" />
    ))}
  </>
);

interface AvatarSelectorProps {
  currentAvatarId?: string;
  onAvatarChange?: (avatarUrl: string) => void;
}

export function AvatarSelector({ currentAvatarId, onAvatarChange }: AvatarSelectorProps) {
  const { user, userProfile, refreshProfile } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarType | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [purchasing, setPurchasing] = useState(false);

  const unlockedAvatars = userProfile?.unlockedAvatars || [];
  const currentXp = userProfile?.xp || 0;
  const currentLevel = userProfile?.level || 1;

  const isAvatarUnlocked = (avatar: AvatarType): boolean => {
    if (avatar.category === 'default') return true;
    return unlockedAvatars.includes(avatar.id);
  };

  const canUnlockAvatar = (avatar: AvatarType): boolean => {
    if (isAvatarUnlocked(avatar)) return false;
    if (avatar.xpCost > currentXp) return false;
    if (avatar.requiredLevel && avatar.requiredLevel > currentLevel) return false;
    return true;
  };

  const handleAvatarClick = (avatar: AvatarType) => {
    if (isAvatarUnlocked(avatar)) {
      // Avatar is unlocked, select it directly
      handleSelectAvatar(avatar);
    } else if (canUnlockAvatar(avatar)) {
      // Avatar can be purchased, show confirmation
      setSelectedAvatar(avatar);
      setConfirmDialogOpen(true);
    } else {
      // Avatar is locked
      if (avatar.requiredLevel && avatar.requiredLevel > currentLevel) {
        toast.error(`Requer nível ${avatar.requiredLevel}`);
      } else {
        toast.error(`XP insuficiente (necessário: ${avatar.xpCost})`);
      }
    }
  };

  const handleSelectAvatar = async (avatar: AvatarType) => {
    if (!user) return;

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        photoURL: avatar.url,
        currentAvatarId: avatar.id,
      });
      
      await refreshProfile();
      onAvatarChange?.(avatar.url);
      toast.success(`Avatar "${avatar.name}" selecionado!`);
    } catch (error) {
      toast.error('Erro ao selecionar avatar');
    }
  };

  const handlePurchaseAvatar = async () => {
    if (!user || !selectedAvatar) return;

    setPurchasing(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        xp: increment(-selectedAvatar.xpCost),
        unlockedAvatars: arrayUnion(selectedAvatar.id),
        photoURL: selectedAvatar.url,
        currentAvatarId: selectedAvatar.id,
      });
      
      await refreshProfile();
      onAvatarChange?.(selectedAvatar.url);
      toast.success(`Avatar "${selectedAvatar.name}" desbloqueado e equipado!`);
      setConfirmDialogOpen(false);
    } catch (error) {
      toast.error('Erro ao desbloquear avatar');
    } finally {
      setPurchasing(false);
    }
  };

  // Get avatar effect classes based on category
  const getAvatarEffectClasses = (avatar: AvatarType, unlocked: boolean) => {
    if (!unlocked) return "";
    
    switch (avatar.category) {
      case 'exclusive':
        // Check for legendary (highest tier exclusive)
        if (avatar.xpCost >= 5000) {
          return "avatar-legendary avatar-sparkles avatar-hover-glow";
        }
        return "avatar-exclusive avatar-sparkles avatar-hover-glow";
      case 'premium':
        return "avatar-premium avatar-hover-glow";
      default:
        return "avatar-hover-glow";
    }
  };

  const renderAvatarGrid = (avatars: AvatarType[]) => (
    <div className="grid grid-cols-3 gap-6 sm:grid-cols-4 md:grid-cols-5">
      {avatars.map((avatar) => {
        const unlocked = isAvatarUnlocked(avatar);
        const canUnlock = canUnlockAvatar(avatar);
        const isCurrentAvatar = userProfile?.currentAvatarId === avatar.id || 
          (userProfile?.photoURL === avatar.url);
        const effectClasses = getAvatarEffectClasses(avatar, unlocked);
        const isLegendary = avatar.category === 'exclusive' && avatar.xpCost >= 5000;

        return (
          <HoverCard key={avatar.id} openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
              <div
                className={cn(
                  "relative group cursor-pointer transition-all duration-300",
                  !unlocked && !canUnlock && "opacity-50"
                )}
                onClick={() => handleAvatarClick(avatar)}
              >
                <div
                  className={cn(
                    "relative rounded-xl p-1 transition-all duration-300",
                    isCurrentAvatar && "ring-2 ring-primary ring-offset-2 ring-offset-background",
                    unlocked && !isCurrentAvatar && "hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 hover:ring-offset-background",
                    canUnlock && "hover:ring-2 hover:ring-accent hover:ring-offset-2 hover:ring-offset-background"
                  )}
                >
                  <div className={cn("relative flex items-center justify-center", effectClasses)}>
                    {avatar.category === 'exclusive' && unlocked && <SparkleParticles />}
                    <Avatar className={cn(
                      "h-16 w-16 border-2",
                      unlocked && avatar.category === 'exclusive' ? "border-transparent" : "border-border",
                      unlocked && avatar.category === 'premium' ? "border-transparent" : ""
                    )}>
                      <AvatarImage src={avatar.url} alt={avatar.name} />
                      <AvatarFallback>{avatar.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                  </div>

                  {/* Locked overlay */}
                  {!unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-xl backdrop-blur-sm">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}

                  {/* Selected check */}
                  {isCurrentAvatar && (
                    <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center z-10">
                      <Check className="h-3 w-3 text-primary-foreground" />
                    </div>
                  )}
                </div>

                {/* Avatar info */}
                <div className="mt-3 text-center">
                  <p className={cn(
                    "text-xs font-medium truncate",
                    unlocked && isLegendary && "text-gradient-gold font-bold"
                  )}>{avatar.name}</p>
                  {unlocked && avatar.category !== 'default' && (
                    <Badge className={cn("text-[10px] px-1.5 py-0 mt-1", getCategoryColor(avatar.category))}>
                      {isLegendary ? '✨ Lendário' : getCategoryLabel(avatar.category)}
                    </Badge>
                  )}
                  {!unlocked && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      <Zap className="h-3 w-3 text-primary" />
                      <span className="text-xs text-muted-foreground">{avatar.xpCost}</span>
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
                {/* Large Avatar Preview */}
                <div className={cn("relative", effectClasses)}>
                  {avatar.category === 'exclusive' && unlocked && <SparkleParticles />}
                  <Avatar className={cn(
                    "h-24 w-24 border-3",
                    unlocked && avatar.category === 'exclusive' ? "border-transparent" : "border-border",
                    unlocked && avatar.category === 'premium' ? "border-transparent" : ""
                  )}>
                    <AvatarImage src={avatar.url} alt={avatar.name} />
                    <AvatarFallback className="text-2xl">{avatar.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                </div>
                
                {/* Avatar Details */}
                <div className="text-center space-y-2">
                  <h4 className={cn(
                    "font-bold text-lg",
                    isLegendary && "text-gradient-gold"
                  )}>{avatar.name}</h4>
                  
                  <Badge className={cn("px-2 py-0.5", getCategoryColor(avatar.category))}>
                    {isLegendary ? '✨ Lendário' : getCategoryLabel(avatar.category)}
                  </Badge>
                  
                  {avatar.description && (
                    <p className="text-sm text-muted-foreground">{avatar.description}</p>
                  )}
                  
                  {/* Status & Requirements */}
                  <div className="pt-2 border-t border-border space-y-1">
                    {isCurrentAvatar && (
                      <div className="flex items-center justify-center gap-1 text-primary">
                        <Check className="h-4 w-4" />
                        <span className="text-sm font-medium">Equipado</span>
                      </div>
                    )}
                    
                    {unlocked && !isCurrentAvatar && (
                      <p className="text-sm text-muted-foreground">Clique para equipar</p>
                    )}
                    
                    {!unlocked && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          <span className="font-bold text-primary">{avatar.xpCost}</span>
                          <span className="text-sm text-muted-foreground">XP</span>
                        </div>
                        
                        {avatar.requiredLevel && (
                          <div className="flex items-center justify-center gap-2">
                            <Star className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Nível {avatar.requiredLevel} necessário
                            </span>
                          </div>
                        )}
                        
                        {canUnlock ? (
                          <p className="text-sm text-success font-medium">✓ Disponível para compra</p>
                        ) : (
                          <p className="text-sm text-destructive">
                            {avatar.requiredLevel && avatar.requiredLevel > currentLevel 
                              ? `Requer nível ${avatar.requiredLevel}` 
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
            <Sparkles className="h-5 w-5 text-primary" />
            Avatares
          </CardTitle>
          <CardDescription>
            Escolha seu avatar. Avatares premium custam XP para desbloquear.
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
                <Sparkles className="h-3 w-3 mr-1" />
                Exclusivo
              </TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[300px] pr-4">
              <TabsContent value="default" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Avatares gratuitos disponíveis para todos.
                  </p>
                </div>
                {renderAvatarGrid(defaultAvatars)}
              </TabsContent>

              <TabsContent value="premium" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Avatares especiais. Gaste XP para desbloqueá-los permanentemente.
                  </p>
                </div>
                {renderAvatarGrid(premiumAvatars)}
              </TabsContent>

              <TabsContent value="exclusive" className="mt-0">
                <div className="mb-4">
                  <p className="text-sm text-muted-foreground">
                    Avatares raros para membros de alto nível.
                  </p>
                </div>
                {renderAvatarGrid(exclusiveAvatars)}
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </CardContent>
      </Card>

      {/* Purchase Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Desbloquear Avatar</DialogTitle>
            <DialogDescription>
              Você está prestes a desbloquear um avatar premium.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAvatar && (
            <div className="flex flex-col items-center py-6">
              <Avatar className="h-24 w-24 border-4 border-primary/20">
                <AvatarImage src={selectedAvatar.url} alt={selectedAvatar.name} />
                <AvatarFallback>{selectedAvatar.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <h3 className="mt-4 text-lg font-bold">{selectedAvatar.name}</h3>
              <p className="text-sm text-muted-foreground">{selectedAvatar.description}</p>
              <Badge className={cn("mt-2", getCategoryColor(selectedAvatar.category))}>
                {getCategoryLabel(selectedAvatar.category)}
              </Badge>
              
              <div className="mt-4 flex items-center gap-2 text-lg">
                <Zap className="h-5 w-5 text-primary" />
                <span className="font-bold text-primary">{selectedAvatar.xpCost}</span>
                <span className="text-muted-foreground">XP</span>
              </div>
              
              <p className="mt-2 text-sm text-muted-foreground">
                Seu XP após a compra: {(currentXp - selectedAvatar.xpCost).toLocaleString()}
              </p>
            </div>
          )}

          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setConfirmDialogOpen(false)}>
              Cancelar
            </Button>
            <Button 
              variant="gold" 
              onClick={handlePurchaseAvatar}
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
