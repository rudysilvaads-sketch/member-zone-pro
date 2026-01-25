import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/firebaseServices';
import { toast } from 'sonner';

// Achievement definitions that match platform capabilities
export const ACHIEVEMENTS = [
  // === COMUM (Common) ===
  { id: 'welcome', name: 'Bem-vindo', description: 'Criou uma conta na plataforma', icon: 'star', rarity: 'common' },
  { id: 'first-post', name: 'Primeira Voz', description: 'Publique seu primeiro post', icon: 'message-square', rarity: 'common' },
  { id: 'first-like', name: 'Primeiro Like', description: 'Dê seu primeiro like em um post', icon: 'heart', rarity: 'common' },
  { id: 'first-comment', name: 'Primeiro Comentário', description: 'Comente em um post pela primeira vez', icon: 'message-circle', rarity: 'common' },
  { id: 'first-purchase', name: 'Primeira Compra', description: 'Resgate seu primeiro produto', icon: 'shopping-bag', rarity: 'common' },
  
  // === RARO (Rare) ===
  { id: 'streak-7', name: 'Em Chamas', description: 'Mantenha um streak de 7 dias', icon: 'flame', rarity: 'rare' },
  { id: 'social-butterfly', name: 'Borboleta Social', description: 'Envie 10 mensagens privadas', icon: 'send', rarity: 'rare' },
  { id: 'community-star', name: 'Estrela da Comunidade', description: 'Publique 10 posts', icon: 'star', rarity: 'rare' },
  { id: 'level-5', name: 'Subindo de Nível', description: 'Alcance o nível 5', icon: 'trending-up', rarity: 'rare' },
  { id: 'missions-complete', name: 'Missões do Dia', description: 'Complete todas as missões diárias', icon: 'check-circle', rarity: 'rare' },
  
  // === ÉPICO (Epic) ===
  { id: 'streak-30', name: 'Dedicação Total', description: 'Mantenha um streak de 30 dias', icon: 'flame', rarity: 'epic' },
  { id: 'level-10', name: 'Veterano', description: 'Alcance o nível 10', icon: 'award', rarity: 'epic' },
  { id: 'influencer', name: 'Influenciador', description: 'Receba 50 likes nos seus posts', icon: 'heart', rarity: 'epic' },
  { id: 'referral-master', name: 'Recrutador', description: 'Convide 5 amigos para a plataforma', icon: 'users', rarity: 'epic' },
  { id: 'collector', name: 'Colecionador', description: 'Resgate 5 produtos', icon: 'package', rarity: 'epic' },
  
  // === LENDÁRIO (Legendary) ===
  { id: 'top-10', name: 'Campeão', description: 'Alcance o top 10 do ranking', icon: 'trophy', rarity: 'legendary' },
  { id: 'top-1', name: 'Lenda', description: 'Alcance o 1º lugar do ranking', icon: 'crown', rarity: 'legendary' },
  { id: 'level-20', name: 'Mestre', description: 'Alcance o nível 20', icon: 'zap', rarity: 'legendary' },
  { id: 'streak-100', name: 'Imortal', description: 'Mantenha um streak de 100 dias', icon: 'flame', rarity: 'legendary' },
];

// XP rewards for achievements by rarity
const ACHIEVEMENT_XP: Record<string, number> = {
  common: 50,
  rare: 150,
  epic: 500,
  legendary: 1000,
};

// Get achievement by ID
export const getAchievementById = (id: string) => {
  return ACHIEVEMENTS.find(a => a.id === id);
};

// Unlock achievement and award XP
export const unlockAchievement = async (
  uid: string, 
  achievementId: string,
  showToast: boolean = true
): Promise<{ success: boolean; xpAwarded?: number }> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) return { success: false };
    
    const userData = userSnap.data() as UserProfile;
    
    // Check if already unlocked
    if (userData.achievements?.includes(achievementId)) {
      return { success: false };
    }
    
    const achievement = getAchievementById(achievementId);
    if (!achievement) return { success: false };
    
    const xpReward = ACHIEVEMENT_XP[achievement.rarity] || 50;
    
    // Update user with new achievement and XP
    await updateDoc(userRef, {
      achievements: [...(userData.achievements || []), achievementId],
      xp: (userData.xp || 0) + xpReward,
    });
    
    // Show toast notification
    if (showToast) {
      const rarityEmojis: Record<string, string> = {
        common: '🌟',
        rare: '💎',
        epic: '🔮',
        legendary: '👑',
      };
      
      const emoji = rarityEmojis[achievement.rarity] || '🌟';
      
      toast.success(`${emoji} Conquista Desbloqueada: ${achievement.name} (+${xpReward} XP)`);
    }
    
    return { success: true, xpAwarded: xpReward };
  } catch (error) {
    console.error('Error unlocking achievement:', error);
    return { success: false };
  }
};

// Check and unlock achievements based on user stats
export const checkAndUnlockAchievements = async (
  uid: string,
  userData: UserProfile,
  context?: {
    action?: 'post' | 'like' | 'comment' | 'purchase' | 'message' | 'mission_complete';
    postCount?: number;
    likeCount?: number;
    commentCount?: number;
    purchaseCount?: number;
    messageCount?: number;
    receivedLikes?: number;
    referralCount?: number;
    rankingPosition?: number;
  }
): Promise<void> => {
  const currentAchievements = userData.achievements || [];
  
  // Helper to check if achievement is already unlocked
  const hasAchievement = (id: string) => currentAchievements.includes(id);
  
  // === STREAK ACHIEVEMENTS ===
  if (userData.streakDays >= 7 && !hasAchievement('streak-7')) {
    await unlockAchievement(uid, 'streak-7');
  }
  if (userData.streakDays >= 30 && !hasAchievement('streak-30')) {
    await unlockAchievement(uid, 'streak-30');
  }
  if (userData.streakDays >= 100 && !hasAchievement('streak-100')) {
    await unlockAchievement(uid, 'streak-100');
  }
  
  // === LEVEL ACHIEVEMENTS ===
  if (userData.level >= 5 && !hasAchievement('level-5')) {
    await unlockAchievement(uid, 'level-5');
  }
  if (userData.level >= 10 && !hasAchievement('level-10')) {
    await unlockAchievement(uid, 'level-10');
  }
  if (userData.level >= 20 && !hasAchievement('level-20')) {
    await unlockAchievement(uid, 'level-20');
  }
  
  // === CONTEXT-BASED ACHIEVEMENTS ===
  if (context) {
    // First post
    if (context.action === 'post' && context.postCount === 1 && !hasAchievement('first-post')) {
      await unlockAchievement(uid, 'first-post');
    }
    
    // Community star (10 posts)
    if (context.postCount && context.postCount >= 10 && !hasAchievement('community-star')) {
      await unlockAchievement(uid, 'community-star');
    }
    
    // First like
    if (context.action === 'like' && context.likeCount === 1 && !hasAchievement('first-like')) {
      await unlockAchievement(uid, 'first-like');
    }
    
    // First comment
    if (context.action === 'comment' && context.commentCount === 1 && !hasAchievement('first-comment')) {
      await unlockAchievement(uid, 'first-comment');
    }
    
    // First purchase
    if (context.action === 'purchase' && context.purchaseCount === 1 && !hasAchievement('first-purchase')) {
      await unlockAchievement(uid, 'first-purchase');
    }
    
    // Collector (5 purchases)
    if (context.purchaseCount && context.purchaseCount >= 5 && !hasAchievement('collector')) {
      await unlockAchievement(uid, 'collector');
    }
    
    // Social butterfly (10 messages)
    if (context.messageCount && context.messageCount >= 10 && !hasAchievement('social-butterfly')) {
      await unlockAchievement(uid, 'social-butterfly');
    }
    
    // Influencer (50 received likes)
    if (context.receivedLikes && context.receivedLikes >= 50 && !hasAchievement('influencer')) {
      await unlockAchievement(uid, 'influencer');
    }
    
    // Referral master (5 referrals)
    if (context.referralCount && context.referralCount >= 5 && !hasAchievement('referral-master')) {
      await unlockAchievement(uid, 'referral-master');
    }
    
    // All daily missions complete
    if (context.action === 'mission_complete' && !hasAchievement('missions-complete')) {
      await unlockAchievement(uid, 'missions-complete');
    }
    
    // Ranking achievements
    if (context.rankingPosition) {
      if (context.rankingPosition <= 10 && !hasAchievement('top-10')) {
        await unlockAchievement(uid, 'top-10');
      }
      if (context.rankingPosition === 1 && !hasAchievement('top-1')) {
        await unlockAchievement(uid, 'top-1');
      }
    }
  }
};
