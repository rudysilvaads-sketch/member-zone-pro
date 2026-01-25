import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToConversations, Conversation } from '@/lib/chatService';
import { useBrowserNotifications } from './useBrowserNotifications';

// Notification sound as base64 data URI (short "ding" sound)
const NOTIFICATION_SOUND = 'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWGluZwAAAA8AAAACAAADhAC7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7u7//////////////////////////////////////////////////////////////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAAAAAAAAAAAA4T/////////////////////////////////';

// Create audio element for playing sounds
let notificationAudio: HTMLAudioElement | null = null;

const playNotificationSound = () => {
  try {
    if (!notificationAudio) {
      notificationAudio = new Audio(NOTIFICATION_SOUND);
      notificationAudio.volume = 0.5;
    }
    notificationAudio.currentTime = 0;
    notificationAudio.play().catch(() => {
      // Audio play failed - likely due to autoplay restrictions
    });
  } catch (error) {
    console.error('Error playing notification sound:', error);
  }
};

export function useUnreadMessages() {
  const { user } = useAuth();
  const { showNotification, requestPermission, permission, isSupported } = useBrowserNotifications();
  
  // All hooks must be called unconditionally and in the same order
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [notificationPermission, setNotificationPermission] = useState(permission);
  const previousUnreadRef = useRef<number>(0);
  const previousConversationsRef = useRef<Conversation[]>([]);
  const isInitialLoadRef = useRef(true);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    const result = await requestPermission();
    setNotificationPermission(result);
    return result;
  }, [requestPermission]);

  const handleNewMessages = useCallback((newCount: number, convos: Conversation[]) => {
    // Only process if not initial load and new unread count is higher
    if (!isInitialLoadRef.current && newCount > previousUnreadRef.current && user) {
      // Play sound
      playNotificationSound();
      
      // Find the conversation with the new message
      const previousConvoMap = new Map(
        previousConversationsRef.current.map(c => [c.id, c])
      );
      
      for (const convo of convos) {
        const prevConvo = previousConvoMap.get(convo.id);
        const currentUnread = convo.unreadCount?.[user.uid] || 0;
        const prevUnread = prevConvo?.unreadCount?.[user.uid] || 0;
        
        if (currentUnread > prevUnread && convo.lastMessageSenderId !== user.uid) {
          // Found a conversation with new unread messages
          const senderId = convo.lastMessageSenderId;
          const senderName = convo.participantNames?.[senderId] || 'Alguém';
          const message = convo.lastMessage || 'Nova mensagem';
          
          // Show browser notification
          showNotification(`${senderName}`, {
            body: message.length > 50 ? message.substring(0, 50) + '...' : message,
            tag: `chat-${convo.id}`,
          });
          
          break; // Only show one notification at a time
        }
      }
    }
    
    previousUnreadRef.current = newCount;
    previousConversationsRef.current = convos;
    
    // Reset initial load flag after first subscription callback
    if (isInitialLoadRef.current) {
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 2000);
    }
  }, [user, showNotification]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setConversations([]);
      previousUnreadRef.current = 0;
      previousConversationsRef.current = [];
      isInitialLoadRef.current = true;
      return;
    }

    const unsubscribe = subscribeToConversations(user.uid, (convos) => {
      setConversations(convos);
      
      // Calculate total unread messages across all conversations
      const totalUnread = convos.reduce((sum, convo) => {
        const userUnread = convo.unreadCount?.[user.uid] || 0;
        return sum + userUnread;
      }, 0);
      
      setUnreadCount(totalUnread);
      handleNewMessages(totalUnread, convos);
    });

    return () => {
      unsubscribe();
      isInitialLoadRef.current = true;
    };
  }, [user, handleNewMessages]);

  return { 
    unreadCount, 
    conversations, 
    playNotificationSound,
    requestNotificationPermission,
    notificationPermission,
    isNotificationsSupported: isSupported,
  };
}
