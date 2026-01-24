import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc, increment } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { calculateLevel } from '@/lib/firebaseServices';

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  xp: number;
  level: number;
  rank: string;
  achievements: string[];
  streakDays: number;
  completedModules: number;
  lastActiveDate?: string;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateUserPoints: (points: number) => Promise<void>;
  addXp: (xp: number) => Promise<boolean | undefined>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

const getRankFromPoints = (points: number): string => {
  if (points >= 5000) return 'diamond';
  if (points >= 3000) return 'platinum';
  if (points >= 1500) return 'gold';
  if (points >= 500) return 'silver';
  return 'bronze';
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (uid: string) => {
    const docRef = doc(db, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      setUserProfile({
        ...data,
        xp: data.xp || 0,
        level: data.level || calculateLevel(data.xp || 0),
      } as UserProfile);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.uid);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        await fetchUserProfile(currentUser.uid);
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createUserProfile = async (user: User, displayName: string) => {
    const userRef = doc(db, 'users', user.uid);
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName || user.displayName || 'Novo Membro',
      photoURL: user.photoURL,
      points: 0,
      xp: 0,
      level: 1,
      rank: 'bronze',
      achievements: ['welcome'],
      streakDays: 1,
      completedModules: 0,
      lastActiveDate: new Date().toISOString().split('T')[0],
      createdAt: new Date(),
    };
    
    await setDoc(userRef, {
      ...newProfile,
      createdAt: serverTimestamp(),
    });
    
    setUserProfile(newProfile);
  };

  const signIn = async (email: string, password: string) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    
    // Update streak on login
    const userRef = doc(db, 'users', result.user.uid);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const today = new Date().toISOString().split('T')[0];
      const lastActive = userData.lastActiveDate;
      
      if (lastActive !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const newStreak = lastActive === yesterdayStr ? (userData.streakDays || 0) + 1 : 1;
        
        await updateDoc(userRef, {
          lastActiveDate: today,
          streakDays: newStreak,
        });
      }
    }
  };

  const signUp = async (email: string, password: string, displayName: string) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(result.user, displayName);
  };

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    const docRef = doc(db, 'users', result.user.uid);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      await createUserProfile(result.user, result.user.displayName || '');
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  const updateUserPoints = async (points: number) => {
    if (!user || !userProfile) return;
    
    const newPoints = userProfile.points + points;
    const newRank = getRankFromPoints(newPoints);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      points: increment(points),
      rank: newRank,
    });
    
    setUserProfile({
      ...userProfile,
      points: newPoints,
      rank: newRank,
    });
  };

  const addXp = async (xp: number) => {
    if (!user || !userProfile) return;
    
    const newXp = (userProfile.xp || 0) + xp;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > (userProfile.level || 1);
    
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, {
      xp: increment(xp),
      level: newLevel,
    });
    
    setUserProfile({
      ...userProfile,
      xp: newXp,
      level: newLevel,
    });
    
    return leveledUp;
  };

  const value = {
    user,
    userProfile,
    loading,
    signIn,
    signUp,
    signInWithGoogle,
    logout,
    updateUserPoints,
    addXp,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
