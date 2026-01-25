import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface GlobalChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  senderRank: string;
  senderLevel: number;
  content: string;
  audioUrl?: string | null;
  imageUrl?: string | null;
  createdAt: Timestamp;
}

export interface ChatSettings {
  isLocked: boolean;
  lockedBy?: string;
  lockedAt?: Timestamp;
  lastClearedAt?: Timestamp;
  lastClearedBy?: string;
}

// Get chat settings
export const getChatSettings = async (): Promise<ChatSettings> => {
  try {
    const settingsRef = doc(db, 'settings', 'globalChat');
    const snapshot = await getDoc(settingsRef);
    
    if (snapshot.exists()) {
      const data = snapshot.data() as ChatSettings;
      console.log('Chat settings loaded:', data);
      return data;
    }
    
    console.log('No chat settings found, returning default');
    return { isLocked: false };
  } catch (error) {
    console.error('Error getting chat settings:', error);
    return { isLocked: false };
  }
};

// Subscribe to chat settings
export const subscribeToChatSettings = (
  callback: (settings: ChatSettings) => void
) => {
  const settingsRef = doc(db, 'settings', 'globalChat');
  
  return onSnapshot(settingsRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.data() as ChatSettings;
      console.log('Chat settings updated (realtime):', data);
      callback(data);
    } else {
      console.log('No chat settings document, using default');
      callback({ isLocked: false });
    }
  }, (error) => {
    console.error('Error subscribing to chat settings:', error);
    callback({ isLocked: false });
  });
};

// Toggle chat lock (admin only)
export const toggleChatLock = async (
  isLocked: boolean,
  adminId: string
): Promise<boolean> => {
  try {
    const settingsRef = doc(db, 'settings', 'globalChat');
    
    const updateData = {
      isLocked,
      lockedBy: isLocked ? adminId : null,
      lockedAt: isLocked ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    };
    
    console.log('Toggling chat lock:', updateData);
    
    await setDoc(settingsRef, updateData, { merge: true });
    
    console.log('Chat lock status updated successfully');
    return true;
  } catch (error) {
    console.error('Error toggling chat lock:', error);
    return false;
  }
};

// Clear all chat messages (admin only)
export const clearAllMessages = async (adminId: string): Promise<boolean> => {
  try {
    const messagesRef = collection(db, 'globalChat');
    const snapshot = await getDocs(messagesRef);
    
    // Delete in batches of 500 (Firestore limit)
    const batchSize = 500;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);
      
      chunk.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
      });
      
      await batch.commit();
    }
    
    // Update settings with last cleared info
    const settingsRef = doc(db, 'settings', 'globalChat');
    await setDoc(settingsRef, {
      lastClearedAt: serverTimestamp(),
      lastClearedBy: adminId,
    }, { merge: true });
    
    return true;
  } catch (error) {
    console.error('Error clearing messages:', error);
    return false;
  }
};

// Clean messages older than 7 days
export const cleanOldMessages = async (): Promise<number> => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const messagesRef = collection(db, 'globalChat');
    const q = query(
      messagesRef,
      where('createdAt', '<', Timestamp.fromDate(sevenDaysAgo))
    );
    
    const snapshot = await getDocs(q);
    let deletedCount = 0;
    
    const batchSize = 500;
    const docs = snapshot.docs;
    
    for (let i = 0; i < docs.length; i += batchSize) {
      const batch = writeBatch(db);
      const chunk = docs.slice(i, i + batchSize);
      
      chunk.forEach((docSnapshot) => {
        batch.delete(docSnapshot.ref);
        deletedCount++;
      });
      
      await batch.commit();
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning old messages:', error);
    return 0;
  }
};

// Send a message to global chat (text, audio, or image)
export const sendGlobalMessage = async (
  senderId: string,
  senderName: string,
  senderAvatar: string | null,
  senderRank: string,
  senderLevel: number,
  content: string,
  audioUrl?: string | null,
  imageUrl?: string | null,
  isAdmin?: boolean
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if chat is locked (admins can bypass)
    const settings = await getChatSettings();
    console.log('Checking chat lock status:', { isLocked: settings.isLocked, isAdmin });
    
    if (settings.isLocked && !isAdmin) {
      console.log('Chat is locked and user is not admin, blocking message');
      return { success: false, error: 'O chat está bloqueado por um administrador' };
    }
    
    const messagesRef = collection(db, 'globalChat');
    
    const messageData = {
      senderId,
      senderName,
      senderAvatar,
      senderRank,
      senderLevel,
      content: content.trim(),
      audioUrl: audioUrl || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
    };
    
    console.log('Saving global message to Firestore:', messageData);
    
    const docRef = await addDoc(messagesRef, messageData);
    console.log('Message saved with ID:', docRef.id);
    
    return { success: true };
  } catch (error) {
    console.error('Error sending global message:', error);
    return { success: false, error: 'Erro ao enviar mensagem' };
  }
};

// Subscribe to global chat messages
export const subscribeToGlobalChat = (
  callback: (messages: GlobalChatMessage[]) => void,
  messageLimit: number = 100
) => {
  const messagesRef = collection(db, 'globalChat');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as GlobalChatMessage[];
    // Reverse to show oldest first
    callback(messages.reverse());
  });
};

// Get recent global chat messages (non-realtime)
export const getGlobalMessages = async (messageLimit: number = 50): Promise<GlobalChatMessage[]> => {
  const messagesRef = collection(db, 'globalChat');
  const q = query(messagesRef, orderBy('createdAt', 'desc'), limit(messageLimit));
  const snapshot = await getDocs(q);
  
  const messages = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as GlobalChatMessage[];
  
  return messages.reverse();
};

// Delete a message (admin only)
export const deleteGlobalMessage = async (messageId: string): Promise<boolean> => {
  try {
    await deleteDoc(doc(db, 'globalChat', messageId));
    return true;
  } catch (error) {
    console.error('Error deleting global message:', error);
    return false;
  }
};
