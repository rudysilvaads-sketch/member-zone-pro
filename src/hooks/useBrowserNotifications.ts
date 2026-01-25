import { useEffect, useCallback, useRef } from 'react';

type NotificationPermission = 'default' | 'denied' | 'granted';

interface UseBrowserNotificationsReturn {
  permission: NotificationPermission;
  requestPermission: () => Promise<NotificationPermission>;
  showNotification: (title: string, options?: NotificationOptions) => void;
  isSupported: boolean;
}

export function useBrowserNotifications(): UseBrowserNotificationsReturn {
  const permissionRef = useRef<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  
  const isSupported = typeof Notification !== 'undefined';

  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      console.warn('Notifications not supported in this browser');
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      permissionRef.current = result;
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isSupported]);

  const showNotification = useCallback((title: string, options?: NotificationOptions) => {
    if (!isSupported) return;
    
    // Only show if permission granted and page is not visible
    if (permissionRef.current !== 'granted') {
      console.log('Notification permission not granted');
      return;
    }

    // Check if page is visible
    if (document.visibilityState === 'visible') {
      console.log('Page is visible, skipping notification');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'chat-notification', // Prevents duplicate notifications
        ...options,
      });

      // Auto close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      // Focus window when notification is clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }, [isSupported]);

  // Request permission on mount if not already granted
  useEffect(() => {
    if (isSupported && Notification.permission === 'default') {
      // Don't auto-request, wait for user interaction
    }
  }, [isSupported]);

  return {
    permission: permissionRef.current,
    requestPermission,
    showNotification,
    isSupported,
  };
}
