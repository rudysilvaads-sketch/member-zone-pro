import { 
  collection, 
  addDoc, 
  query, 
  where,
  getDocs,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============= Types =============

export interface TutorialView {
  id: string;
  lessonId: string;
  lessonTitle: string;
  topicId: string;
  topicTitle: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar?: string;
  viewedAt: Timestamp;
  completed: boolean;
  completedAt?: Timestamp;
}

export interface ViewStats {
  totalViews: number;
  uniqueViewers: number;
  completions: number;
}

export interface LessonViewStats {
  lessonId: string;
  lessonTitle: string;
  topicTitle: string;
  views: number;
  completions: number;
  viewers: {
    userName: string;
    userEmail: string;
    userAvatar?: string;
    viewedAt: Timestamp;
    completed: boolean;
  }[];
}

// ============= Track Views =============

/**
 * Record when a user views a lesson
 */
export const recordLessonView = async (
  lessonId: string,
  lessonTitle: string,
  topicId: string,
  topicTitle: string,
  userId: string,
  userName: string,
  userEmail: string,
  userAvatar?: string
): Promise<boolean> => {
  try {
    // Check if already viewed today to avoid duplicate entries
    const viewsRef = collection(db, 'tutorial_views');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingQuery = query(
      viewsRef,
      where('lessonId', '==', lessonId),
      where('userId', '==', userId)
    );
    
    const existingSnap = await getDocs(existingQuery);
    
    // If user already viewed this lesson, don't record again
    if (!existingSnap.empty) {
      return true;
    }
    
    await addDoc(viewsRef, {
      lessonId,
      lessonTitle,
      topicId,
      topicTitle,
      userId,
      userName,
      userEmail,
      userAvatar: userAvatar || null,
      viewedAt: serverTimestamp(),
      completed: false,
      completedAt: null,
    });
    
    console.log('Recorded lesson view:', { lessonId, userId });
    return true;
  } catch (error) {
    console.error('Error recording lesson view:', error);
    return false;
  }
};

/**
 * Mark a lesson as completed for a user
 */
export const markLessonCompleted = async (
  lessonId: string,
  userId: string
): Promise<boolean> => {
  try {
    const viewsRef = collection(db, 'tutorial_views');
    const q = query(
      viewsRef,
      where('lessonId', '==', lessonId),
      where('userId', '==', userId)
    );
    
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return false;
    }
    
    // Update the view record
    const { updateDoc, doc } = await import('firebase/firestore');
    const viewDoc = snapshot.docs[0];
    await updateDoc(doc(db, 'tutorial_views', viewDoc.id), {
      completed: true,
      completedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error marking lesson completed:', error);
    return false;
  }
};

// ============= Get Stats =============

/**
 * Get all tutorial views (admin only)
 */
export const getAllTutorialViews = async (): Promise<TutorialView[]> => {
  try {
    const viewsRef = collection(db, 'tutorial_views');
    const snapshot = await getDocs(viewsRef);
    
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as TutorialView)).sort((a, b) => {
      const aTime = a.viewedAt?.toMillis?.() || 0;
      const bTime = b.viewedAt?.toMillis?.() || 0;
      return bTime - aTime; // Most recent first
    });
  } catch (error) {
    console.error('Error getting tutorial views:', error);
    return [];
  }
};

/**
 * Subscribe to tutorial views in realtime (admin only)
 */
export const subscribeToTutorialViews = (
  callback: (views: TutorialView[]) => void
) => {
  const viewsRef = collection(db, 'tutorial_views');
  
  return onSnapshot(viewsRef, (snapshot) => {
    const views = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as TutorialView)).sort((a, b) => {
      const aTime = a.viewedAt?.toMillis?.() || 0;
      const bTime = b.viewedAt?.toMillis?.() || 0;
      return bTime - aTime;
    });
    
    callback(views);
  }, (error) => {
    console.error('Error subscribing to tutorial views:', error);
    callback([]);
  });
};

/**
 * Get aggregated view stats per lesson
 */
export const getLessonViewStats = (views: TutorialView[]): LessonViewStats[] => {
  const statsMap = new Map<string, LessonViewStats>();
  
  views.forEach(view => {
    if (!statsMap.has(view.lessonId)) {
      statsMap.set(view.lessonId, {
        lessonId: view.lessonId,
        lessonTitle: view.lessonTitle,
        topicTitle: view.topicTitle,
        views: 0,
        completions: 0,
        viewers: [],
      });
    }
    
    const stats = statsMap.get(view.lessonId)!;
    stats.views++;
    if (view.completed) stats.completions++;
    stats.viewers.push({
      userName: view.userName,
      userEmail: view.userEmail,
      userAvatar: view.userAvatar,
      viewedAt: view.viewedAt,
      completed: view.completed,
    });
  });
  
  return Array.from(statsMap.values()).sort((a, b) => b.views - a.views);
};

/**
 * Get overall view stats
 */
export const getOverallViewStats = (views: TutorialView[]): ViewStats => {
  const uniqueUserIds = new Set(views.map(v => v.userId));
  const completions = views.filter(v => v.completed).length;
  
  return {
    totalViews: views.length,
    uniqueViewers: uniqueUserIds.size,
    completions,
  };
};

/**
 * Get views for a specific user
 */
export const getUserViews = async (userId: string): Promise<TutorialView[]> => {
  try {
    const viewsRef = collection(db, 'tutorial_views');
    const q = query(viewsRef, where('userId', '==', userId));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    } as TutorialView));
  } catch (error) {
    console.error('Error getting user views:', error);
    return [];
  }
};
