import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  deleteDoc,
  doc
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

// Send a message to global chat (text, audio, or image)
export const sendGlobalMessage = async (
  senderId: string,
  senderName: string,
  senderAvatar: string | null,
  senderRank: string,
  senderLevel: number,
  content: string,
  audioUrl?: string | null,
  imageUrl?: string | null
): Promise<{ success: boolean; error?: string }> => {
  try {
    const messagesRef = collection(db, 'globalChat');
    
    await addDoc(messagesRef, {
      senderId,
      senderName,
      senderAvatar,
      senderRank,
      senderLevel,
      content: content.trim(),
      audioUrl: audioUrl || null,
      imageUrl: imageUrl || null,
      createdAt: serverTimestamp(),
    });
    
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
