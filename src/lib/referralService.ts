import { doc, getDoc, setDoc, updateDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const XP_REWARD_PER_REFERRAL = 150;

// Generate a unique referral code for a user
export const generateReferralCode = (uid: string): string => {
  // Create a short, readable code based on uid
  const base = uid.slice(0, 8).toUpperCase();
  return `REF${base}`;
};

// Get or create referral code for user
export const getUserReferralCode = async (uid: string): Promise<string> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    if (data.referralCode) {
      return data.referralCode;
    }
    
    // Generate and save referral code
    const referralCode = generateReferralCode(uid);
    await updateDoc(userRef, { referralCode });
    return referralCode;
  }
  
  return generateReferralCode(uid);
};

// Get user ID by referral code
export const getUserByReferralCode = async (referralCode: string): Promise<string | null> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, where('referralCode', '==', referralCode));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].id;
  }
  
  return null;
};

// Process a referral when a new user signs up
export const processReferral = async (
  referrerUid: string, 
  newUserUid: string
): Promise<{ success: boolean; xpAwarded: number }> => {
  try {
    // Create referral record
    const referralRef = doc(db, 'referrals', `${referrerUid}_${newUserUid}`);
    await setDoc(referralRef, {
      referrerId: referrerUid,
      referredUserId: newUserUid,
      xpAwarded: XP_REWARD_PER_REFERRAL,
      createdAt: new Date(),
    });
    
    // Update referrer's stats
    const referrerRef = doc(db, 'users', referrerUid);
    await updateDoc(referrerRef, {
      referralCount: increment(1),
      xp: increment(XP_REWARD_PER_REFERRAL),
    });
    
    // Mark the new user as referred
    const newUserRef = doc(db, 'users', newUserUid);
    await updateDoc(newUserRef, {
      referredBy: referrerUid,
    });
    
    return { success: true, xpAwarded: XP_REWARD_PER_REFERRAL };
  } catch (error) {
    console.error('Error processing referral:', error);
    return { success: false, xpAwarded: 0 };
  }
};

// Get user's referral stats
export const getReferralStats = async (uid: string): Promise<{
  referralCode: string;
  referralCount: number;
  totalXpEarned: number;
}> => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const data = userSnap.data();
    const referralCode = data.referralCode || await getUserReferralCode(uid);
    const referralCount = data.referralCount || 0;
    
    return {
      referralCode,
      referralCount,
      totalXpEarned: referralCount * XP_REWARD_PER_REFERRAL,
    };
  }
  
  return {
    referralCode: await getUserReferralCode(uid),
    referralCount: 0,
    totalXpEarned: 0,
  };
};
