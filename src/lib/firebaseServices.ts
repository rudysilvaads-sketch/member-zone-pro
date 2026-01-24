import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  query, 
  orderBy, 
  limit,
  where,
  increment,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Types
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  points: number;
  rank: string;
  achievements: string[];
  streakDays: number;
  completedModules: number;
  createdAt: Timestamp;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  pointsRequired?: number;
  condition?: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  requiredRank?: string;
  featured?: boolean;
  stock?: number;
}

export interface Purchase {
  id: string;
  userId: string;
  productId: string;
  productName: string;
  price: number;
  purchasedAt: Timestamp;
}

// Users
export const getTopUsers = async (limitCount: number = 10): Promise<(UserProfile & { position: number })[]> => {
  const usersRef = collection(db, 'users');
  const q = query(usersRef, orderBy('points', 'desc'), limit(limitCount));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc, index) => ({
    ...doc.data() as UserProfile,
    position: index + 1,
  }));
};

export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const docRef = doc(db, 'users', uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as UserProfile;
  }
  return null;
};

export const updateUserPoints = async (uid: string, pointsToAdd: number) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    points: increment(pointsToAdd),
  });
};

export const updateUserStreak = async (uid: string, streakDays: number) => {
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    streakDays,
  });
};

// Achievements
export const getAchievements = async (): Promise<Achievement[]> => {
  const achievementsRef = collection(db, 'achievements');
  const snapshot = await getDocs(achievementsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Achievement[];
};

export const unlockAchievement = async (uid: string, achievementId: string) => {
  const userRef = doc(db, 'users', uid);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    const userData = userSnap.data() as UserProfile;
    if (!userData.achievements.includes(achievementId)) {
      await updateDoc(userRef, {
        achievements: [...userData.achievements, achievementId],
      });
      return true;
    }
  }
  return false;
};

// Products
export const getProducts = async (): Promise<Product[]> => {
  const productsRef = collection(db, 'products');
  const snapshot = await getDocs(productsRef);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Product[];
};

export const getProductById = async (productId: string): Promise<Product | null> => {
  const docRef = doc(db, 'products', productId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return { id: docSnap.id, ...docSnap.data() } as Product;
  }
  return null;
};

export const purchaseProduct = async (
  uid: string, 
  product: Product
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Get user
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      return { success: false, error: 'Usuário não encontrado' };
    }
    
    const userData = userSnap.data() as UserProfile;
    
    // Check if user has enough points
    if (userData.points < product.price) {
      return { success: false, error: 'Pontos insuficientes' };
    }
    
    // Check rank requirement
    const rankOrder = ['bronze', 'silver', 'gold', 'platinum', 'diamond'];
    if (product.requiredRank) {
      const userRankIndex = rankOrder.indexOf(userData.rank);
      const requiredRankIndex = rankOrder.indexOf(product.requiredRank.toLowerCase());
      
      if (userRankIndex < requiredRankIndex) {
        return { success: false, error: `Requer rank ${product.requiredRank}` };
      }
    }
    
    // Deduct points
    await updateDoc(userRef, {
      points: increment(-product.price),
    });
    
    // Create purchase record
    const purchaseRef = doc(collection(db, 'purchases'));
    await setDoc(purchaseRef, {
      userId: uid,
      productId: product.id,
      productName: product.name,
      price: product.price,
      purchasedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Purchase error:', error);
    return { success: false, error: 'Erro ao processar compra' };
  }
};

export const getUserPurchases = async (uid: string): Promise<Purchase[]> => {
  const purchasesRef = collection(db, 'purchases');
  const q = query(purchasesRef, where('userId', '==', uid), orderBy('purchasedAt', 'desc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Purchase[];
};

// Initialize default data (run once)
export const initializeDefaultData = async () => {
  // Default achievements
  const achievements: Omit<Achievement, 'id'>[] = [
    { name: 'Primeiro Passo', description: 'Complete seu primeiro módulo', icon: 'star', rarity: 'common' },
    { name: 'Em Chamas', description: 'Mantenha um streak de 7 dias', icon: 'flame', rarity: 'rare' },
    { name: 'Mestre do Foco', description: 'Complete 10 módulos sem pausar', icon: 'target', rarity: 'epic' },
    { name: 'Velocidade Luz', description: 'Complete um módulo em menos de 5 min', icon: 'zap', rarity: 'legendary' },
    { name: 'Campeão', description: 'Alcance o top 10 do ranking', icon: 'trophy', rarity: 'legendary' },
    { name: 'Colecionador', description: 'Desbloqueie 20 conquistas', icon: 'medal', rarity: 'epic' },
  ];
  
  for (const achievement of achievements) {
    const docRef = doc(db, 'achievements', achievement.name.toLowerCase().replace(/\s+/g, '-'));
    await setDoc(docRef, achievement, { merge: true });
  }
  
  // Default products
  const products: Omit<Product, 'id'>[] = [
    {
      name: 'Curso Avançado',
      description: 'Desbloqueie conteúdo exclusivo de nível avançado',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=250&fit=crop',
      available: true,
      featured: true,
    },
    {
      name: 'Mentoria VIP',
      description: '1 hora de mentoria individual com especialista',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=250&fit=crop',
      available: true,
      requiredRank: 'Platinum',
    },
    {
      name: 'Badge Exclusiva',
      description: 'Badge personalizada para seu perfil',
      price: 500,
      image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=250&fit=crop',
      available: true,
    },
  ];
  
  for (const product of products) {
    const docRef = doc(db, 'products', product.name.toLowerCase().replace(/\s+/g, '-'));
    await setDoc(docRef, product, { merge: true });
  }
};
