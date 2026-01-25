import { useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { checkAndUnlockAchievements } from '@/lib/achievementService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { UserProfile } from '@/lib/firebaseServices';

export function useAchievements() {
  const { user, userProfile, refreshProfile } = useAuth();

  // Check achievements based on current user stats
  const checkAchievements = useCallback(async (context?: {
    action?: 'post' | 'like' | 'comment' | 'purchase' | 'message' | 'mission_complete';
  }) => {
    if (!user || !userProfile) return;

    try {
      // Get user's post count
      const postsQuery = query(
        collection(db, 'posts'),
        where('authorId', '==', user.uid)
      );
      const postsSnap = await getDocs(postsQuery);
      const postCount = postsSnap.size;

      // Get user's purchase count
      const purchasesQuery = query(
        collection(db, 'purchases'),
        where('userId', '==', user.uid)
      );
      const purchasesSnap = await getDocs(purchasesQuery);
      const purchaseCount = purchasesSnap.size;

      // Get total likes received on user's posts
      let receivedLikes = 0;
      postsSnap.forEach(doc => {
        const data = doc.data();
        receivedLikes += data.likes?.length || 0;
      });

      // Get referral count
      const referralsQuery = query(
        collection(db, 'referrals'),
        where('referrerId', '==', user.uid)
      );
      const referralsSnap = await getDocs(referralsQuery);
      const referralCount = referralsSnap.size;

      // Get user's ranking position
      const usersQuery = query(collection(db, 'users'));
      const usersSnap = await getDocs(usersQuery);
      const allUsers = usersSnap.docs.map(doc => ({
        uid: doc.id,
        points: doc.data().points || 0
      }));
      allUsers.sort((a, b) => b.points - a.points);
      const rankingPosition = allUsers.findIndex(u => u.uid === user.uid) + 1;

      // Check and unlock achievements
      await checkAndUnlockAchievements(user.uid, userProfile as unknown as UserProfile, {
        ...context,
        postCount,
        purchaseCount,
        receivedLikes,
        referralCount,
        rankingPosition: rankingPosition > 0 ? rankingPosition : undefined,
      });

      // Refresh profile to get updated achievements
      await refreshProfile();
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  }, [user, userProfile, refreshProfile]);

  // Trigger achievement check on post creation
  const onPostCreated = useCallback(async () => {
    await checkAchievements({ action: 'post' });
  }, [checkAchievements]);

  // Trigger achievement check on like
  const onLikeGiven = useCallback(async () => {
    await checkAchievements({ action: 'like' });
  }, [checkAchievements]);

  // Trigger achievement check on comment
  const onCommentCreated = useCallback(async () => {
    await checkAchievements({ action: 'comment' });
  }, [checkAchievements]);

  // Trigger achievement check on purchase
  const onPurchaseMade = useCallback(async () => {
    await checkAchievements({ action: 'purchase' });
  }, [checkAchievements]);

  // Trigger achievement check on mission complete
  const onAllMissionsComplete = useCallback(async () => {
    await checkAchievements({ action: 'mission_complete' });
  }, [checkAchievements]);

  return {
    checkAchievements,
    onPostCreated,
    onLikeGiven,
    onCommentCreated,
    onPurchaseMade,
    onAllMissionsComplete,
  };
}
