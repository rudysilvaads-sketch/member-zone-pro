import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  or,
  and
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { createNotification } from '@/lib/firebaseServices';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  createdAt: Timestamp;
  read: boolean;
}

export interface Conversation {
  id: string;
  participants: string[];
  participantNames: Record<string, string>;
  participantAvatars: Record<string, string | null>;
  lastMessage: string;
  lastMessageAt: Timestamp;
  lastMessageSenderId: string;
  unreadCount: Record<string, number>;
  createdAt: Timestamp;
}

// Get or create a conversation between two users
export const getOrCreateConversation = async (
  user1Id: string,
  user1Name: string,
  user1Avatar: string | null,
  user2Id: string,
  user2Name: string,
  user2Avatar: string | null
): Promise<string> => {
  const conversationsRef = collection(db, 'conversations');
  
  // Check if conversation already exists
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', user1Id)
  );
  
  const snapshot = await getDocs(q);
  const existing = snapshot.docs.find(doc => {
    const data = doc.data();
    return data.participants.includes(user2Id);
  });
  
  if (existing) {
    return existing.id;
  }
  
  // Create new conversation
  const newConversation = {
    participants: [user1Id, user2Id],
    participantNames: {
      [user1Id]: user1Name,
      [user2Id]: user2Name,
    },
    participantAvatars: {
      [user1Id]: user1Avatar,
      [user2Id]: user2Avatar,
    },
    lastMessage: '',
    lastMessageAt: serverTimestamp(),
    lastMessageSenderId: '',
    unreadCount: {
      [user1Id]: 0,
      [user2Id]: 0,
    },
    createdAt: serverTimestamp(),
  };
  
  const docRef = await addDoc(conversationsRef, newConversation);
  return docRef.id;
};

// Send a message
export const sendMessage = async (
  conversationId: string,
  senderId: string,
  senderName: string,
  senderAvatar: string | null,
  content: string,
  recipientId: string
): Promise<{ success: boolean; error?: string }> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    
    await addDoc(messagesRef, {
      conversationId,
      senderId,
      senderName,
      senderAvatar,
      content: content.trim(),
      createdAt: serverTimestamp(),
      read: false,
    });
    
    // Update conversation with last message
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      lastMessage: content.substring(0, 100),
      lastMessageAt: serverTimestamp(),
      lastMessageSenderId: senderId,
      [`unreadCount.${recipientId}`]: (await getUnreadCount(conversationId, recipientId)) + 1,
    });
    
    // Create notification for the recipient
    try {
      console.log('Creating message notification for recipient:', recipientId, 'from:', senderId);
      const notifResult = await createNotification({
        userId: recipientId,
        fromUserId: senderId,
        fromUserName: senderName,
        fromUserAvatar: senderAvatar,
        type: 'message',
        postContent: content.substring(0, 100),
      });
      console.log('Notification created:', notifResult);
    } catch (notifError) {
      console.error('Error creating message notification:', notifError);
      // Don't fail the message send if notification fails
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending message:', error);
    return { success: false, error: 'Erro ao enviar mensagem' };
  }
};

// Get unread count for a user in a conversation (simplified to avoid composite index)
const getUnreadCount = async (conversationId: string, userId: string): Promise<number> => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    // Simple query without composite index requirement
    const q = query(messagesRef, where('read', '==', false));
    const snapshot = await getDocs(q);
    // Filter client-side to exclude own messages
    return snapshot.docs.filter(doc => doc.data().senderId !== userId).length;
  } catch (error) {
    console.error('Error getting unread count:', error);
    return 0;
  }
};

// Subscribe to messages in a conversation
export const subscribeToMessages = (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  const messagesRef = collection(db, 'conversations', conversationId, 'messages');
  const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(100));
  
  return onSnapshot(q, (snapshot) => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as ChatMessage[];
    callback(messages);
  });
};

// Subscribe to user's conversations (simplified - sort client-side to avoid composite index)
export const subscribeToConversations = (
  userId: string,
  callback: (conversations: Conversation[]) => void
) => {
  const conversationsRef = collection(db, 'conversations');
  // Simple query without orderBy to avoid composite index
  const q = query(
    conversationsRef,
    where('participants', 'array-contains', userId),
    limit(50)
  );
  
  return onSnapshot(q, (snapshot) => {
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Conversation[];
    
    // Sort client-side by lastMessageAt
    conversations.sort((a, b) => {
      const timeA = a.lastMessageAt?.toMillis?.() || 0;
      const timeB = b.lastMessageAt?.toMillis?.() || 0;
      return timeB - timeA;
    });
    
    callback(conversations);
  });
};

// Mark messages as read (simplified to avoid composite index)
export const markMessagesAsRead = async (
  conversationId: string,
  userId: string
) => {
  try {
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    // Simple query - just get unread messages
    const q = query(messagesRef, where('read', '==', false));
    
    const snapshot = await getDocs(q);
    // Filter client-side to only update messages from other users
    const messagesToUpdate = snapshot.docs.filter(doc => doc.data().senderId !== userId);
    
    const updates = messagesToUpdate.map(msgDoc => 
      updateDoc(msgDoc.ref, { read: true })
    );
    await Promise.all(updates);
    
    // Reset unread count
    const conversationRef = doc(db, 'conversations', conversationId);
    await updateDoc(conversationRef, {
      [`unreadCount.${userId}`]: 0,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Admin: Get all conversations
export const getAllConversations = async (): Promise<Conversation[]> => {
  const conversationsRef = collection(db, 'conversations');
  const q = query(conversationsRef, orderBy('lastMessageAt', 'desc'), limit(100));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Conversation[];
};

// Admin: Subscribe to a specific conversation's messages
export const adminSubscribeToMessages = (
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) => {
  return subscribeToMessages(conversationId, callback);
};
