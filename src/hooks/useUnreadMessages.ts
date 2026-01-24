import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToConversations, Conversation } from '@/lib/chatService';

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
  
  // All hooks must be called unconditionally and in the same order
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const previousUnreadRef = useRef<number>(0);
  const isInitialLoadRef = useRef(true);

  const handleNewMessages = useCallback((newCount: number) => {
    // Only play sound if not initial load and new unread count is higher
    if (!isInitialLoadRef.current && newCount > previousUnreadRef.current) {
      playNotificationSound();
    }
    
    previousUnreadRef.current = newCount;
    
    // Reset initial load flag after first subscription callback
    if (isInitialLoadRef.current) {
      setTimeout(() => {
        isInitialLoadRef.current = false;
      }, 2000);
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setConversations([]);
      previousUnreadRef.current = 0;
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
      handleNewMessages(totalUnread);
    });

    return () => {
      unsubscribe();
      isInitialLoadRef.current = true;
    };
  }, [user, handleNewMessages]);

  return { unreadCount, conversations, playNotificationSound };
}
