import { useEffect, useState, useCallback } from 'react';
import { ref, onValue, onDisconnect, set, serverTimestamp, off } from 'firebase/database';
import { realtimeDb } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineUser {
  online: boolean;
  lastSeen: number;
  displayName: string;
  photoURL: string | null;
}

export const usePresence = () => {
  const { user, userProfile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});

  // Log on mount
  useEffect(() => {
    console.log('usePresence: Hook mounted, realtimeDb:', !!realtimeDb);
  }, []);

  // Set up presence for current user
  useEffect(() => {
    if (!user || !userProfile) {
      console.log('usePresence: No user or userProfile');
      return;
    }

    console.log('usePresence: Setting up presence for user:', user.uid);
    const userStatusRef = ref(realtimeDb, `presence/${user.uid}`);
    const connectedRef = ref(realtimeDb, '.info/connected');

    const handleConnected = (snapshot: any) => {
      console.log('usePresence: Connected status:', snapshot.val());
      if (snapshot.val() === true) {
        // User is connected
        const userStatus: OnlineUser = {
          online: true,
          lastSeen: Date.now(),
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        };

        // Set up disconnect handler
        onDisconnect(userStatusRef).set({
          online: false,
          lastSeen: Date.now(),
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        }).catch(err => console.error('usePresence: onDisconnect error:', err));

        // Set user as online
        set(userStatusRef, userStatus)
          .then(() => console.log('usePresence: User set as online'))
          .catch(err => console.error('usePresence: Error setting online status:', err));
      }
    };

    onValue(connectedRef, handleConnected, (error) => {
      console.error('usePresence: Error listening to connected ref:', error);
    });

    // Update presence periodically
    const interval = setInterval(() => {
      if (user) {
        set(userStatusRef, {
          online: true,
          lastSeen: Date.now(),
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        });
      }
    }, 60000); // Every minute

    return () => {
      off(connectedRef);
      clearInterval(interval);
      // Set offline when unmounting
      set(userStatusRef, {
        online: false,
        lastSeen: Date.now(),
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
      });
    };
  }, [user, userProfile]);

  // Listen to all online users
  useEffect(() => {
    const presenceRef = ref(realtimeDb, 'presence');

    const handlePresence = (snapshot: any) => {
      const data = snapshot.val();
      console.log('usePresence: Received presence data:', data);
      if (data) {
        // Filter to only show users online in the last 2 minutes
        const now = Date.now();
        const filtered: Record<string, OnlineUser> = {};
        Object.entries(data).forEach(([uid, userData]: [string, any]) => {
          if (userData.online && now - userData.lastSeen < 120000) {
            filtered[uid] = userData;
          }
        });
        console.log('usePresence: Filtered online users:', Object.keys(filtered).length);
        setOnlineUsers(filtered);
      } else {
        setOnlineUsers({});
      }
    };

    onValue(presenceRef, handlePresence, (error) => {
      console.error('usePresence: Error listening to presence:', error);
    });

    return () => {
      off(presenceRef);
    };
  }, []);

  const isUserOnline = useCallback((userId: string): boolean => {
    const userData = onlineUsers[userId];
    if (!userData) return false;
    return userData.online && Date.now() - userData.lastSeen < 120000;
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: Object.keys(onlineUsers).length,
  };
};
