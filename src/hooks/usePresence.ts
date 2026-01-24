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

  // Set up presence for current user
  useEffect(() => {
    if (!user || !userProfile) return;

    const userStatusRef = ref(realtimeDb, `presence/${user.uid}`);
    const connectedRef = ref(realtimeDb, '.info/connected');

    const handleConnected = (snapshot: any) => {
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
        });

        // Set user as online
        set(userStatusRef, userStatus);
      }
    };

    onValue(connectedRef, handleConnected);

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
      if (data) {
        // Filter to only show users online in the last 2 minutes
        const now = Date.now();
        const filtered: Record<string, OnlineUser> = {};
        Object.entries(data).forEach(([uid, userData]: [string, any]) => {
          if (userData.online && now - userData.lastSeen < 120000) {
            filtered[uid] = userData;
          }
        });
        setOnlineUsers(filtered);
      } else {
        setOnlineUsers({});
      }
    };

    onValue(presenceRef, handlePresence);

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
