import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { subscribeToConversations, Conversation } from '@/lib/chatService';

export function useUnreadMessages() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      setConversations([]);
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
    });

    return () => unsubscribe();
  }, [user]);

  return { unreadCount, conversations };
}
