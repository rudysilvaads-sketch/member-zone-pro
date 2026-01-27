import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc,
  updateDoc,
  doc,
  getDoc,
  where
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ============= Types =============

export interface TutorialLesson {
  id: string;
  topicId: string;
  title: string;
  description: string;
  youtubeUrl: string;
  youtubeId: string; // Extracted from URL
  duration?: string; // e.g., "15:30"
  order: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TutorialTopic {
  id: string;
  title: string;
  description: string;
  thumbnailUrl?: string;
  lessonsCount: number;
  order: number;
  isPublished: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TopicWithLessons extends TutorialTopic {
  lessons: TutorialLesson[];
}

// ============= Helper Functions =============

/**
 * Extract YouTube video ID from various URL formats
 */
export const extractYoutubeId = (url: string): string | null => {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Get YouTube thumbnail URL from video ID
 */
export const getYoutubeThumbnail = (videoId: string, quality: 'default' | 'medium' | 'high' | 'maxres' = 'high'): string => {
  const qualityMap = {
    default: 'default',
    medium: 'mqdefault',
    high: 'hqdefault',
    maxres: 'maxresdefault'
  };
  return `https://img.youtube.com/vi/${videoId}/${qualityMap[quality]}.jpg`;
};

/**
 * Get YouTube embed URL from video ID
 */
export const getYoutubeEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// ============= Topic Functions =============

/**
 * Create a new tutorial topic
 */
export const createTopic = async (
  title: string,
  description: string,
  createdBy: string,
  thumbnailUrl?: string
): Promise<{ success: boolean; topicId?: string; error?: string }> => {
  try {
    const topicsRef = collection(db, 'tutorial_topics');
    
    // Get current count for ordering
    const snapshot = await getDocs(topicsRef);
    const order = snapshot.size;
    
    const topicData = {
      title: title.trim(),
      description: description.trim(),
      thumbnailUrl: thumbnailUrl || null,
      lessonsCount: 0,
      order,
      isPublished: false,
      createdBy,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(topicsRef, topicData);
    return { success: true, topicId: docRef.id };
  } catch (error) {
    console.error('Error creating topic:', error);
    return { success: false, error: 'Erro ao criar tópico' };
  }
};

/**
 * Update a tutorial topic
 */
export const updateTopic = async (
  topicId: string,
  updates: Partial<Pick<TutorialTopic, 'title' | 'description' | 'thumbnailUrl' | 'isPublished' | 'order'>>
): Promise<boolean> => {
  try {
    const topicRef = doc(db, 'tutorial_topics', topicId);
    await updateDoc(topicRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error updating topic:', error);
    return false;
  }
};

/**
 * Delete a tutorial topic and all its lessons
 */
export const deleteTopic = async (topicId: string): Promise<boolean> => {
  try {
    // First delete all lessons in this topic
    const lessonsRef = collection(db, 'tutorial_lessons');
    const q = query(lessonsRef, where('topicId', '==', topicId));
    const snapshot = await getDocs(q);
    
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // Then delete the topic
    await deleteDoc(doc(db, 'tutorial_topics', topicId));
    return true;
  } catch (error) {
    console.error('Error deleting topic:', error);
    return false;
  }
};

/**
 * Subscribe to all topics (realtime)
 */
export const subscribeToTopics = (
  callback: (topics: TutorialTopic[]) => void,
  publishedOnly: boolean = true
) => {
  const topicsRef = collection(db, 'tutorial_topics');
  let q;
  
  if (publishedOnly) {
    q = query(topicsRef, where('isPublished', '==', true), orderBy('order', 'asc'));
  } else {
    q = query(topicsRef, orderBy('order', 'asc'));
  }
  
  return onSnapshot(q, (snapshot) => {
    const topics = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<TutorialTopic, 'id'>;
      return { id: docSnap.id, ...data } as TutorialTopic;
    });
    callback(topics);
  });
};

/**
 * Get all topics (non-realtime)
 */
export const getTopics = async (publishedOnly: boolean = true): Promise<TutorialTopic[]> => {
  const topicsRef = collection(db, 'tutorial_topics');
  let q;
  
  if (publishedOnly) {
    q = query(topicsRef, where('isPublished', '==', true), orderBy('order', 'asc'));
  } else {
    q = query(topicsRef, orderBy('order', 'asc'));
  }
  
  const snapshot = await getDocs(q);
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as Omit<TutorialTopic, 'id'>;
    return {
      id: docSnap.id,
      ...data,
    } as TutorialTopic;
  });
};

/**
 * Get a single topic by ID
 */
export const getTopic = async (topicId: string): Promise<TutorialTopic | null> => {
  try {
    const topicRef = doc(db, 'tutorial_topics', topicId);
    const snapshot = await getDoc(topicRef);
    
    if (!snapshot.exists()) return null;
    
    const data = snapshot.data();
    return {
      id: snapshot.id,
      title: data.title,
      description: data.description,
      thumbnailUrl: data.thumbnailUrl,
      lessonsCount: data.lessonsCount,
      order: data.order,
      isPublished: data.isPublished,
      createdBy: data.createdBy,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    } as TutorialTopic;
  } catch (error) {
    console.error('Error getting topic:', error);
    return null;
  }
};

// ============= Lesson Functions =============

/**
 * Create a new lesson in a topic
 */
export const createLesson = async (
  topicId: string,
  title: string,
  description: string,
  youtubeUrl: string,
  duration?: string
): Promise<{ success: boolean; lessonId?: string; error?: string }> => {
  try {
    const youtubeId = extractYoutubeId(youtubeUrl);
    
    if (!youtubeId) {
      return { success: false, error: 'URL do YouTube inválida' };
    }
    
    const lessonsRef = collection(db, 'tutorial_lessons');
    
    // Get current lessons count for ordering
    const q = query(lessonsRef, where('topicId', '==', topicId));
    const snapshot = await getDocs(q);
    const order = snapshot.size;
    
    const lessonData = {
      topicId,
      title: title.trim(),
      description: description.trim(),
      youtubeUrl: youtubeUrl.trim(),
      youtubeId,
      duration: duration?.trim() || null,
      order,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(lessonsRef, lessonData);
    
    // Update lessons count in topic
    const topicRef = doc(db, 'tutorial_topics', topicId);
    const topicSnap = await getDoc(topicRef);
    if (topicSnap.exists()) {
      await updateDoc(topicRef, {
        lessonsCount: (topicSnap.data().lessonsCount || 0) + 1,
        updatedAt: serverTimestamp(),
      });
    }
    
    return { success: true, lessonId: docRef.id };
  } catch (error) {
    console.error('Error creating lesson:', error);
    return { success: false, error: 'Erro ao criar aula' };
  }
};

/**
 * Update a lesson
 */
export const updateLesson = async (
  lessonId: string,
  updates: Partial<Pick<TutorialLesson, 'title' | 'description' | 'youtubeUrl' | 'duration' | 'order'>>
): Promise<boolean> => {
  try {
    const lessonRef = doc(db, 'tutorial_lessons', lessonId);
    
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    
    // If youtubeUrl is being updated, extract the new ID
    if (updates.youtubeUrl) {
      const youtubeId = extractYoutubeId(updates.youtubeUrl);
      if (!youtubeId) return false;
      updateData.youtubeId = youtubeId;
    }
    
    await updateDoc(lessonRef, updateData);
    return true;
  } catch (error) {
    console.error('Error updating lesson:', error);
    return false;
  }
};

/**
 * Delete a lesson
 */
export const deleteLesson = async (lessonId: string, topicId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'tutorial_lessons', lessonId));
    
    // Update lessons count in topic
    const topicRef = doc(db, 'tutorial_topics', topicId);
    const topicSnap = await getDoc(topicRef);
    if (topicSnap.exists()) {
      await updateDoc(topicRef, {
        lessonsCount: Math.max((topicSnap.data().lessonsCount || 1) - 1, 0),
        updatedAt: serverTimestamp(),
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error deleting lesson:', error);
    return false;
  }
};

/**
 * Subscribe to lessons of a topic (realtime)
 */
export const subscribeToLessons = (
  topicId: string,
  callback: (lessons: TutorialLesson[]) => void
) => {
  const lessonsRef = collection(db, 'tutorial_lessons');
  const q = query(lessonsRef, where('topicId', '==', topicId), orderBy('order', 'asc'));
  
  return onSnapshot(q, (snapshot) => {
    const lessons = snapshot.docs.map(docSnap => {
      const data = docSnap.data() as Omit<TutorialLesson, 'id'>;
      return { id: docSnap.id, ...data } as TutorialLesson;
    });
    callback(lessons);
  });
};

/**
 * Get lessons of a topic (non-realtime)
 */
export const getLessons = async (topicId: string): Promise<TutorialLesson[]> => {
  const lessonsRef = collection(db, 'tutorial_lessons');
  const q = query(lessonsRef, where('topicId', '==', topicId), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(docSnap => {
    const data = docSnap.data() as Omit<TutorialLesson, 'id'>;
    return { id: docSnap.id, ...data } as TutorialLesson;
  });
};

/**
 * Get a topic with all its lessons
 */
export const getTopicWithLessons = async (topicId: string): Promise<TopicWithLessons | null> => {
  try {
    const topic = await getTopic(topicId);
    if (!topic) return null;
    
    const lessons = await getLessons(topicId);
    
    return {
      ...topic,
      lessons,
    };
  } catch (error) {
    console.error('Error getting topic with lessons:', error);
    return null;
  }
};

/**
 * Get all topics with their lessons
 */
export const getAllTopicsWithLessons = async (publishedOnly: boolean = true): Promise<TopicWithLessons[]> => {
  try {
    const topics = await getTopics(publishedOnly);
    
    const topicsWithLessons = await Promise.all(
      topics.map(async (topic) => {
        const lessons = await getLessons(topic.id);
        return { ...topic, lessons };
      })
    );
    
    return topicsWithLessons;
  } catch (error) {
    console.error('Error getting all topics with lessons:', error);
    return [];
  }
};
