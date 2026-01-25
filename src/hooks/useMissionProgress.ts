import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { getTodayDateString, MISSION_REWARDS, UserMissionsDoc } from '@/lib/missionService';

interface MissionProgress {
  completed: number;
  total: number;
  allCompleted: boolean;
  bonusClaimed: boolean;
  loading: boolean;
}

export function useMissionProgress(): MissionProgress {
  const { user } = useAuth();
  const [progress, setProgress] = useState<MissionProgress>({
    completed: 0,
    total: Object.keys(MISSION_REWARDS).length,
    allCompleted: false,
    bonusClaimed: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setProgress(prev => ({ ...prev, loading: false }));
      return;
    }

    const today = getTodayDateString();
    const missionDocRef = doc(db, 'users', user.uid, 'dailyMissions', today);

    const unsubscribe = onSnapshot(missionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as UserMissionsDoc;
        const missionIds = Object.keys(MISSION_REWARDS);
        const completedCount = missionIds.filter(id => data.missions[id]?.completed).length;
        
        setProgress({
          completed: completedCount,
          total: missionIds.length,
          allCompleted: completedCount === missionIds.length,
          bonusClaimed: data.allMissionsBonusClaimed ?? false,
          loading: false,
        });
      } else {
        setProgress({
          completed: 0,
          total: Object.keys(MISSION_REWARDS).length,
          allCompleted: false,
          bonusClaimed: false,
          loading: false,
        });
      }
    }, (error) => {
      console.error('Error listening to mission progress:', error);
      setProgress(prev => ({ ...prev, loading: false }));
    });

    return () => unsubscribe();
  }, [user?.uid]);

  return progress;
}
