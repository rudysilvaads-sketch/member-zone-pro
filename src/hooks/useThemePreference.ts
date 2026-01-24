import { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

export function useThemePreference() {
  const { theme, setTheme } = useTheme();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Load theme preference from Firestore on mount
  useEffect(() => {
    const loadThemePreference = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          if (data.themePreference) {
            setTheme(data.themePreference);
          }
        }
      } catch (error) {
        console.error('Error loading theme preference:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadThemePreference();
  }, [user, setTheme]);

  // Save theme preference to Firestore
  const saveThemePreference = async (newTheme: string) => {
    setTheme(newTheme);

    if (!user) return;

    setIsSaving(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        themePreference: newTheme,
      });
    } catch (error) {
      console.error('Error saving theme preference:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    theme,
    setTheme: saveThemePreference,
    isLoading,
    isSaving,
  };
}
