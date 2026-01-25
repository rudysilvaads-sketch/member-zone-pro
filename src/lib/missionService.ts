import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  increment,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { calculateLevel } from '@/lib/firebaseServices';

// Mission rewards configuration
export const MISSION_REWARDS: Record<string, { xp: number; points: number; title: string }> = {
  'daily-login': { xp: 50, points: 25, title: 'Login Diário' },
  'engage-community': { xp: 75, points: 35, title: 'Membro Ativo' },
  'share-progress': { xp: 50, points: 25, title: 'Compartilhador' },
  'visit-store': { xp: 25, points: 15, title: 'Explorador' },
};

// Bonus for completing all daily missions
export const ALL_MISSIONS_BONUS = {
  xp: 100,
  points: 50,
  title: 'Dedicação Total',
  description: 'Completou todas as missões do dia!',
};

export interface UserDailyMission {
  missionId: string;
  progress: number;
  completed: boolean;
  claimed: boolean;
  completedAt?: Timestamp;
  claimedAt?: Timestamp;
}

export interface UserMissionsDoc {
  date: string; // Format: YYYY-MM-DD
  missions: Record<string, UserDailyMission>;
  updatedAt: Timestamp;
  xpVerified?: boolean; // Flag to prevent duplicate reward grants
  allMissionsBonusClaimed?: boolean; // Flag to track if bonus was claimed
}

// Get today's date string in YYYY-MM-DD format
export const getTodayDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Get user's daily missions for today
export const getUserDailyMissions = async (
  userId: string
): Promise<UserMissionsDoc | null> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    const missionDoc = await getDoc(missionDocRef);
    
    if (missionDoc.exists()) {
      return missionDoc.data() as UserMissionsDoc;
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user daily missions:', error);
    return null;
  }
};

// Verify and fix login reward if it was marked as claimed but XP wasn't credited
export const verifyAndFixLoginReward = async (userId: string): Promise<boolean> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    const missionDoc = await getDoc(missionDocRef);
    
    if (!missionDoc.exists()) return false;
    
    const data = missionDoc.data() as UserMissionsDoc;
    const loginMission = data.missions['daily-login'];
    
    // If login mission is claimed, we should verify XP was credited
    // by checking if there's a xpVerified flag
    if (loginMission?.claimed && !data.xpVerified) {
      const loginReward = MISSION_REWARDS['daily-login'];
      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentXp = userData.xp || 0;
        const currentPoints = userData.points || 0;
        const newXp = currentXp + loginReward.xp;
        const newPoints = currentPoints + loginReward.points;
        const newLevel = calculateLevel(newXp);
        
        console.log('Fixing missing login reward:', {
          userId,
          currentXp,
          newXp,
          currentPoints,
          newPoints
        });
        
        await updateDoc(userDocRef, {
          xp: newXp,
          points: newPoints,
          level: newLevel,
        });
        
        // Mark as verified to prevent duplicate rewards
        await updateDoc(missionDocRef, {
          xpVerified: true,
        });
        
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error('Error verifying login reward:', error);
    return false;
  }
};


export const initializeUserDailyMissions = async (
  userId: string,
  missionIds: string[]
): Promise<{ missionsDoc: UserMissionsDoc; loginRewardGranted: boolean }> => {
  const today = getTodayDateString();
  const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
  
  // Check if document already exists
  const existingDoc = await getDoc(missionDocRef);
  
  if (existingDoc.exists()) {
    return { missionsDoc: existingDoc.data() as UserMissionsDoc, loginRewardGranted: false };
  }
  
  // Create new missions for today
  const missions: Record<string, UserDailyMission> = {};
  
  missionIds.forEach(missionId => {
    const isLogin = missionId === 'daily-login';
    missions[missionId] = {
      missionId,
      progress: isLogin ? 1 : 0,
      completed: isLogin,
      claimed: isLogin, // Auto-claim login reward
    };
  });
  
  const newDoc: UserMissionsDoc = {
    date: today,
    missions,
    updatedAt: serverTimestamp() as Timestamp,
    xpVerified: true, // Mark as verified since we're granting reward now
  };
  
  await setDoc(missionDocRef, newDoc);
  
  // Auto-award login reward and update level
  const loginReward = MISSION_REWARDS['daily-login'];
  if (loginReward) {
    const userDocRef = doc(db, 'users', userId);
    
    // First get current XP to calculate new level
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      console.error('User document not found for userId:', userId);
      return { missionsDoc: newDoc, loginRewardGranted: false };
    }
    
    const userData = userDoc.data();
    const currentXp = userData.xp || 0;
    const currentPoints = userData.points || 0;
    const newXp = currentXp + loginReward.xp;
    const newPoints = currentPoints + loginReward.points;
    const newLevel = calculateLevel(newXp);
    
    console.log('Awarding login reward:', {
      userId,
      currentXp,
      currentPoints,
      newXp,
      newPoints,
      newLevel,
      reward: loginReward
    });
    
    // Use set with merge instead of increment to ensure values are set correctly
    await updateDoc(userDocRef, {
      xp: newXp,
      points: newPoints,
      level: newLevel,
    });
    
    console.log('Login reward applied successfully');
  }
  
  return { missionsDoc: newDoc, loginRewardGranted: true };
};

// Update mission progress
export const updateMissionProgress = async (
  userId: string,
  missionId: string,
  progress: number,
  requirement: number
): Promise<boolean> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    
    const completed = progress >= requirement;
    
    await updateDoc(missionDocRef, {
      [`missions.${missionId}.progress`]: progress,
      [`missions.${missionId}.completed`]: completed,
      [`missions.${missionId}.completedAt`]: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error updating mission progress:', error);
    return false;
  }
};

// Claim mission reward
export const claimMissionReward = async (
  userId: string,
  missionId: string
): Promise<boolean> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    
    await updateDoc(missionDocRef, {
      [`missions.${missionId}.claimed`]: true,
      [`missions.${missionId}.claimedAt`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error claiming mission reward:', error);
    return false;
  }
};

// Complete a specific mission type AND auto-claim rewards
export const completeMission = async (
  userId: string,
  missionId: string,
  requirement: number = 1
): Promise<{ 
  completed: boolean; 
  rewards?: { xp: number; points: number; title: string };
  bonusAwarded?: { awarded: boolean; bonus?: typeof ALL_MISSIONS_BONUS } | null;
}> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    
    let missionDoc = await getDoc(missionDocRef);
    
    // If daily missions document doesn't exist, initialize it first
    if (!missionDoc.exists()) {
      console.log('Daily missions not initialized, creating now for user:', userId);
      const missionIds = Object.keys(MISSION_REWARDS);
      await initializeUserDailyMissions(userId, missionIds);
      
      // Re-fetch the document after initialization
      missionDoc = await getDoc(missionDocRef);
      
      if (!missionDoc.exists()) {
        console.error('Failed to initialize daily missions for user:', userId);
        return { completed: false };
      }
    }
    
    const data = missionDoc.data() as UserMissionsDoc;
    const mission = data.missions[missionId];
    
    if (!mission) {
      console.error('Mission not found in document:', missionId);
      return { completed: false };
    }
    
    if (mission.completed) {
      console.log('Mission already completed:', missionId);
      return { completed: false }; // Already completed
    }
    
    const newProgress = Math.min(mission.progress + 1, requirement);
    const completed = newProgress >= requirement;
    
    // Update mission progress
    await updateDoc(missionDocRef, {
      [`missions.${missionId}.progress`]: newProgress,
      [`missions.${missionId}.completed`]: completed,
      [`missions.${missionId}.completedAt`]: completed ? serverTimestamp() : null,
      [`missions.${missionId}.claimed`]: completed, // Auto-claim when completed
      [`missions.${missionId}.claimedAt`]: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    
    // If completed, auto-award XP and points and update level
    if (completed) {
      const rewards = MISSION_REWARDS[missionId];
      if (rewards) {
        const userDocRef = doc(db, 'users', userId);
        
        // First get current XP to calculate new level
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const currentXp = userData.xp || 0;
          const currentPoints = userData.points || 0;
          const newXp = currentXp + rewards.xp;
          const newPoints = currentPoints + rewards.points;
          const newLevel = calculateLevel(newXp);
          
          console.log('Awarding mission reward:', {
            userId,
            missionId,
            currentXp,
            currentPoints,
            newXp,
            newPoints,
            newLevel,
            rewards
          });
          
          await updateDoc(userDocRef, {
            xp: newXp,
            points: newPoints,
            level: newLevel,
          });
          
          console.log('Mission reward applied successfully');
        }
        
        // Check if all missions are now completed and award bonus
        const bonusResult = await checkAndAwardAllMissionsBonus(userId);
        
        return { completed: true, rewards, bonusAwarded: bonusResult };
      }
    }
    
    return { completed };
  } catch (error) {
    console.error('Error completing mission:', error);
    return { completed: false };
  }
};

// Check if all missions are completed and award bonus
export const checkAndAwardAllMissionsBonus = async (
  userId: string
): Promise<{ awarded: boolean; bonus?: typeof ALL_MISSIONS_BONUS } | null> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    const missionDoc = await getDoc(missionDocRef);
    
    if (!missionDoc.exists()) return null;
    
    const data = missionDoc.data() as UserMissionsDoc;
    
    // Check if bonus already claimed
    if (data.allMissionsBonusClaimed) {
      return { awarded: false };
    }
    
    // Check if all missions are completed
    const missionIds = Object.keys(MISSION_REWARDS);
    const allCompleted = missionIds.every(id => data.missions[id]?.completed);
    
    if (!allCompleted) {
      return { awarded: false };
    }
    
    // Award bonus
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (!userDoc.exists()) {
      return { awarded: false };
    }
    
    const userData = userDoc.data();
    const currentXp = userData.xp || 0;
    const currentPoints = userData.points || 0;
    const newXp = currentXp + ALL_MISSIONS_BONUS.xp;
    const newPoints = currentPoints + ALL_MISSIONS_BONUS.points;
    const newLevel = calculateLevel(newXp);
    
    console.log('Awarding all missions bonus:', {
      userId,
      currentXp,
      newXp,
      currentPoints,
      newPoints,
      bonus: ALL_MISSIONS_BONUS
    });
    
    await updateDoc(userDocRef, {
      xp: newXp,
      points: newPoints,
      level: newLevel,
    });
    
    // Mark bonus as claimed
    await updateDoc(missionDocRef, {
      allMissionsBonusClaimed: true,
    });
    
    console.log('All missions bonus applied successfully');
    
    return { awarded: true, bonus: ALL_MISSIONS_BONUS };
  } catch (error) {
    console.error('Error checking/awarding all missions bonus:', error);
    return null;
  }
};
