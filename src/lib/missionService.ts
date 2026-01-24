import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

// Initialize or update user's daily missions
export const initializeUserDailyMissions = async (
  userId: string,
  missionIds: string[]
): Promise<UserMissionsDoc> => {
  const today = getTodayDateString();
  const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
  
  // Check if document already exists
  const existingDoc = await getDoc(missionDocRef);
  
  if (existingDoc.exists()) {
    return existingDoc.data() as UserMissionsDoc;
  }
  
  // Create new missions for today
  const missions: Record<string, UserDailyMission> = {};
  
  missionIds.forEach(missionId => {
    missions[missionId] = {
      missionId,
      progress: missionId === 'daily-login' ? 1 : 0, // Login is auto-completed
      completed: missionId === 'daily-login',
      claimed: false,
    };
  });
  
  const newDoc: UserMissionsDoc = {
    date: today,
    missions,
    updatedAt: serverTimestamp() as Timestamp,
  };
  
  await setDoc(missionDocRef, newDoc);
  
  return newDoc;
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

// Complete a specific mission type (called when user performs an action)
export const completeMission = async (
  userId: string,
  missionId: string,
  requirement: number = 1
): Promise<boolean> => {
  try {
    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', userId, 'dailyMissions', today);
    
    const missionDoc = await getDoc(missionDocRef);
    
    if (!missionDoc.exists()) {
      return false;
    }
    
    const data = missionDoc.data() as UserMissionsDoc;
    const mission = data.missions[missionId];
    
    if (!mission || mission.completed) {
      return false; // Already completed or doesn't exist
    }
    
    const newProgress = Math.min(mission.progress + 1, requirement);
    const completed = newProgress >= requirement;
    
    await updateDoc(missionDocRef, {
      [`missions.${missionId}.progress`]: newProgress,
      [`missions.${missionId}.completed`]: completed,
      [`missions.${missionId}.completedAt`]: completed ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    
    return completed;
  } catch (error) {
    console.error('Error completing mission:', error);
    return false;
  }
};
