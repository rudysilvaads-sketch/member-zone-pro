import { useEffect, useState, useCallback } from 'react';
import { doc, setDoc, onSnapshot, collection, query, where, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

interface OnlineUser {
  online: boolean;
  lastSeen: Timestamp;
  displayName: string;
  photoURL: string | null;
  oderId: string;
}

export const usePresence = () => {
  const { user, userProfile } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Record<string, OnlineUser>>({});

  // Set up presence for current user
  useEffect(() => {
    if (!user || !userProfile) {
      return;
    }

    const userPresenceRef = doc(db, 'presence', user.uid);

    // Set user as online
    const setOnline = async () => {
      try {
        await setDoc(userPresenceRef, {
          oderId: user.uid,
          online: true,
          lastSeen: Timestamp.now(),
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        });
      } catch (err) {
        console.error('Error setting online status:', err);
      }
    };

    // Set user as offline
    const setOffline = async () => {
      try {
        await setDoc(userPresenceRef, {
          oderId: user.uid,
          online: false,
          lastSeen: Timestamp.now(),
          displayName: userProfile.displayName,
          photoURL: userProfile.photoURL,
        });
      } catch (err) {
        console.error('Error setting offline status:', err);
      }
    };

    // Set online immediately
    setOnline();

    // Update presence every 30 seconds
    const interval = setInterval(() => {
      setOnline();
    }, 30000);

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        setOnline();
      } else {
        setOffline();
      }
    };

    // Handle before unload
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status on page close
      const data = JSON.stringify({
        oderId: user.uid,
        online: false,
        lastSeen: new Date().toISOString(),
        displayName: userProfile.displayName,
        photoURL: userProfile.photoURL,
      });
      navigator.sendBeacon?.('/api/presence-offline', data);
      setOffline();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      setOffline();
    };
  }, [user, userProfile]);

  // Listen to all online users
  useEffect(() => {
    const presenceRef = collection(db, 'presence');
    
    const unsubscribe = onSnapshot(presenceRef, (snapshot) => {
      const now = Date.now();
      const filtered: Record<string, OnlineUser> = {};
      
      snapshot.forEach((docSnap) => {
        const userData = docSnap.data() as OnlineUser;
        const lastSeenTime = userData.lastSeen?.toMillis() || 0;
        
        // Consider online if lastSeen within 60 seconds and marked as online
        if (userData.online && now - lastSeenTime < 60000) {
          filtered[docSnap.id] = userData;
        }
      });
      
      setOnlineUsers(filtered);
    }, (error) => {
      console.error('Error listening to presence:', error);
    });

    return () => unsubscribe();
  }, []);

  const isUserOnline = useCallback((oderId: string): boolean => {
    const userData = onlineUsers[oderId];
    if (!userData) return false;
    const lastSeenTime = userData.lastSeen?.toMillis() || 0;
    return userData.online && Date.now() - lastSeenTime < 60000;
  }, [onlineUsers]);

  return {
    onlineUsers,
    isUserOnline,
    onlineCount: Object.keys(onlineUsers).length,
  };
};
