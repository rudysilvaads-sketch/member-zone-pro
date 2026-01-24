import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc,
  deleteDoc,
  addDoc,
  query, 
  orderBy, 
  limit,
  where,
  increment,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  onSnapshot,
  writeBatch,
  Unsubscribe
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

// Types
export interface UserProfile {
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
  createdAt: Timestamp;
  unlockedAvatars?: string[];
  currentAvatarId?: string;
  unlockedFrames?: string[];
  currentFrameId?: string;
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

export type ProductCategory = 'avatars' | 'items' | 'benefits' | 'courses' | 'other';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  available: boolean;
  category?: ProductCategory;
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

export interface Mission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  pointsReward: number;
  type: 'daily' | 'weekly' | 'special';
  requirement: number;
  icon: string;
}

export interface UserMission {
  missionId: string;
  progress: number;
  completed: boolean;
  completedAt?: Timestamp;
  claimedAt?: Timestamp;
}

// Level system helpers
export const calculateLevel = (xp: number): number => {
  // XP needed per level increases: Level 1 = 100, Level 2 = 200, etc.
  let level = 1;
  let xpNeeded = 100;
  let totalXp = 0;
  
  while (totalXp + xpNeeded <= xp) {
    totalXp += xpNeeded;
    level++;
    xpNeeded = level * 100;
  }
  
  return level;
};

export const getXpForLevel = (level: number): number => {
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += i * 100;
  }
  return totalXp;
};

export const getXpToNextLevel = (currentXp: number): { current: number; needed: number; progress: number } => {
  const level = calculateLevel(currentXp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level + 1);
  const xpNeededForNext = xpForNextLevel - xpForCurrentLevel;
  const currentProgress = currentXp - xpForCurrentLevel;
  
  return {
    current: currentProgress,
    needed: xpNeededForNext,
    progress: (currentProgress / xpNeededForNext) * 100
  };
};

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
  
  // Default products - Sample showcase items
  const products: Omit<Product, 'id'>[] = [
    // AVATARES
    {
      name: 'Avatar Ninja',
      description: 'Avatar exclusivo estilo ninja com máscara e olhos brilhantes. Mostre sua determinação!',
      price: 800,
      image: 'https://images.unsplash.com/photo-1618336753974-aae8e04506aa?w=400&h=400&fit=crop',
      available: true,
      category: 'avatars',
      featured: true,
    },
    {
      name: 'Avatar Robô',
      description: 'Avatar futurista com design de robô cyberpunk. Perfeito para amantes de tecnologia.',
      price: 1200,
      image: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400&h=400&fit=crop',
      available: true,
      category: 'avatars',
      requiredRank: 'Silver',
    },
    {
      name: 'Avatar Espacial',
      description: 'Astronauta com capacete estilizado. Explore o universo do conhecimento!',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=400&fit=crop',
      available: true,
      category: 'avatars',
      requiredRank: 'Gold',
    },
    
    // ITENS
    {
      name: 'Badge Campeão',
      description: 'Badge dourada exclusiva para exibir no seu perfil. Mostra que você é um verdadeiro campeão!',
      price: 500,
      image: 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=400&h=400&fit=crop',
      available: true,
      category: 'items',
    },
    {
      name: 'Tema Neon',
      description: 'Tema visual neon cyberpunk para seu dashboard. Cores vibrantes e futuristas.',
      price: 750,
      image: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=400&fit=crop',
      available: true,
      category: 'items',
      featured: true,
    },
    {
      name: 'Efeito de Partículas',
      description: 'Efeito visual de partículas brilhantes ao redor do seu avatar no ranking.',
      price: 1000,
      image: 'https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?w=400&h=400&fit=crop',
      available: true,
      category: 'items',
      requiredRank: 'Silver',
    },
    
    // BENEFÍCIOS
    {
      name: 'Mentoria Individual',
      description: '1 hora de mentoria individual com um especialista da área. Tire todas suas dúvidas!',
      price: 3000,
      image: 'https://images.unsplash.com/photo-1552581234-26160f608093?w=400&h=400&fit=crop',
      available: true,
      category: 'benefits',
      requiredRank: 'Platinum',
      featured: true,
    },
    {
      name: 'Acesso VIP',
      description: 'Acesso antecipado a novos cursos e recursos exclusivos antes do lançamento oficial.',
      price: 2000,
      image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop',
      available: true,
      category: 'benefits',
      requiredRank: 'Gold',
    },
    {
      name: 'Certificado Premium',
      description: 'Certificado personalizado com selo holográfico para impressão física.',
      price: 1500,
      image: 'https://images.unsplash.com/photo-1589330694653-ded6df03f754?w=400&h=400&fit=crop',
      available: true,
      category: 'benefits',
    },
    
    // CURSOS
    {
      name: 'Curso Avançado de Produtividade',
      description: 'Módulos exclusivos sobre técnicas avançadas de produtividade e gestão de tempo.',
      price: 2500,
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=400&fit=crop',
      available: true,
      category: 'courses',
      featured: true,
    },
    {
      name: 'Masterclass Liderança',
      description: 'Curso completo sobre liderança e gestão de equipes com cases reais.',
      price: 4000,
      image: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=400&h=400&fit=crop',
      available: true,
      category: 'courses',
      requiredRank: 'Platinum',
    },
    {
      name: 'Workshop Criatividade',
      description: 'Workshop interativo para desenvolver seu potencial criativo e inovador.',
      price: 1800,
      image: 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?w=400&h=400&fit=crop',
      available: true,
      category: 'courses',
    },
  ];
  
  for (const product of products) {
    const docRef = doc(db, 'products', product.name.toLowerCase().replace(/\s+/g, '-'));
    await setDoc(docRef, product, { merge: true });
  }
};

// ============ COMMUNITY POSTS ============

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorRank: string;
  authorLevel: number;
  content: string;
  imageUrl?: string | null;
  imagePath?: string | null; // Storage path for deletion
  likes: string[]; // array of user IDs who liked
  commentsCount: number;
  createdAt: Timestamp;
  updatedAt?: Timestamp;
}

export interface Comment {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string | null;
  authorRank: string;
  content: string;
  createdAt: Timestamp;
}

// Upload image to Firebase Storage
export const uploadPostImage = async (
  userId: string,
  file: File
): Promise<{ success: boolean; url?: string; path?: string; error?: string }> => {
  try {
    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { success: false, error: 'Imagem muito grande. Máximo 5MB.' };
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'Tipo de arquivo não suportado. Use JPG, PNG, GIF ou WebP.' };
    }
    
    // Generate unique filename
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const path = `posts/${userId}/${timestamp}.${extension}`;
    
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    return { success: true, url, path };
  } catch (error) {
    console.error('Error uploading image:', error);
    return { success: false, error: 'Erro ao fazer upload da imagem' };
  }
};

// Delete image from Firebase Storage
export const deletePostImage = async (path: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, path);
    await deleteObject(storageRef);
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

// Create a new post
export const createPost = async (
  user: { uid: string; displayName: string; photoURL: string | null; rank: string; level?: number },
  content: string,
  imageUrl?: string | null,
  imagePath?: string | null
): Promise<{ success: boolean; postId?: string; error?: string }> => {
  try {
    const postsRef = collection(db, 'posts');
    const postData: Record<string, any> = {
      authorId: user.uid,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      authorRank: user.rank,
      authorLevel: user.level || 1,
      content: content.trim(),
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp(),
    };
    
    if (imageUrl) {
      postData.imageUrl = imageUrl;
      postData.imagePath = imagePath;
    }
    
    const docRef = await addDoc(postsRef, postData);
    return { success: true, postId: docRef.id };
  } catch (error) {
    console.error('Error creating post:', error);
    return { success: false, error: 'Erro ao criar post' };
  }
};

// Get posts with pagination
export const getPosts = async (limitCount: number = 20): Promise<Post[]> => {
  try {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Post[];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

// Toggle like on a post
export const toggleLikePost = async (
  postId: string, 
  userId: string
): Promise<{ success: boolean; liked: boolean }> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      return { success: false, liked: false };
    }
    
    const post = postSnap.data() as Post;
    const isLiked = post.likes?.includes(userId);
    
    await updateDoc(postRef, {
      likes: isLiked ? arrayRemove(userId) : arrayUnion(userId),
    });
    
    return { success: true, liked: !isLiked };
  } catch (error) {
    console.error('Error toggling like:', error);
    return { success: false, liked: false };
  }
};

// Delete a post
export const deletePost = async (postId: string, userId: string): Promise<boolean> => {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) return false;
    
    const post = postSnap.data() as Post;
    if (post.authorId !== userId) return false;
    
    // Delete image from storage if exists
    if (post.imagePath) {
      await deletePostImage(post.imagePath);
    }
    
    // Delete all comments for this post
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const commentsSnap = await getDocs(commentsRef);
    for (const commentDoc of commentsSnap.docs) {
      await deleteDoc(commentDoc.ref);
    }
    
    await deleteDoc(postRef);
    return true;
  } catch (error) {
    console.error('Error deleting post:', error);
    return false;
  }
};

// Add a comment to a post
export const addComment = async (
  postId: string,
  user: { uid: string; displayName: string; photoURL: string | null; rank: string },
  content: string
): Promise<{ success: boolean; comment?: Comment; error?: string }> => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const commentData = {
      postId,
      authorId: user.uid,
      authorName: user.displayName,
      authorAvatar: user.photoURL,
      authorRank: user.rank,
      content: content.trim(),
      createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(commentsRef, commentData);
    
    // Increment comments count on post
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(1),
    });
    
    return { 
      success: true, 
      comment: { id: docRef.id, ...commentData, createdAt: Timestamp.now() } as Comment 
    };
  } catch (error) {
    console.error('Error adding comment:', error);
    return { success: false, error: 'Erro ao adicionar comentário' };
  }
};

// Get comments for a post
export const getComments = async (postId: string): Promise<Comment[]> => {
  try {
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Comment[];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

// Delete a comment
export const deleteComment = async (
  postId: string, 
  commentId: string, 
  userId: string
): Promise<boolean> => {
  try {
    const commentRef = doc(db, 'posts', postId, 'comments', commentId);
    const commentSnap = await getDoc(commentRef);
    
    if (!commentSnap.exists()) return false;
    
    const comment = commentSnap.data() as Comment;
    if (comment.authorId !== userId) return false;
    
    await deleteDoc(commentRef);
    
    // Decrement comments count
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      commentsCount: increment(-1),
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

// ============ NOTIFICATIONS ============

export interface Notification {
  id: string;
  userId: string; // recipient
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar: string | null;
  type: 'like' | 'comment';
  postId: string;
  postContent?: string; // first 50 chars of post
  commentContent?: string; // for comment notifications
  read: boolean;
  createdAt: Timestamp;
}

// Create notification
export const createNotification = async (
  notification: Omit<Notification, 'id' | 'read' | 'createdAt'>
): Promise<boolean> => {
  try {
    // Don't create notification for own actions
    if (notification.userId === notification.fromUserId) return false;
    
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      read: false,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

// Get notifications for a user
export const getNotifications = async (
  userId: string, 
  limitCount: number = 20
): Promise<Notification[]> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef, 
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'), 
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// Subscribe to real-time notifications
export const subscribeToNotifications = (
  userId: string,
  callback: (notifications: Notification[]) => void
): Unsubscribe => {
  const notificationsRef = collection(db, 'notifications');
  const q = query(
    notificationsRef,
    where('userId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const notifications = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Notification[];
    callback(notifications);
  }, (error) => {
    console.error('Error subscribing to notifications:', error);
  });
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId: string): Promise<boolean> => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, { read: true });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return false;
  }
};

// Mark all notifications as read
export const markAllNotificationsAsRead = async (userId: string): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.update(doc.ref, { read: true });
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    return false;
  }
};

// Delete notification
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'notifications', notificationId));
    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

// Clear all notifications for a user
export const clearAllNotifications = async (userId: string): Promise<boolean> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(notificationsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });
    
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return false;
  }
};
