import { useState, useEffect, useRef, useCallback } from 'react';

interface UseLevelUpDetectionProps {
  currentLevel: number | undefined;
}

export function useLevelUpDetection({ currentLevel }: UseLevelUpDetectionProps) {
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [previousLevel, setPreviousLevel] = useState<number | null>(null);
  const [newLevel, setNewLevel] = useState<number | null>(null);
  const lastKnownLevel = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (currentLevel === undefined) return;

    // Skip first render to avoid showing animation on page load
    if (isFirstRender.current) {
      lastKnownLevel.current = currentLevel;
      isFirstRender.current = false;
      return;
    }

    // Detect level up
    if (lastKnownLevel.current !== null && currentLevel > lastKnownLevel.current) {
      setPreviousLevel(lastKnownLevel.current);
      setNewLevel(currentLevel);
      setShowLevelUp(true);
    }

    lastKnownLevel.current = currentLevel;
  }, [currentLevel]);

  const closeLevelUp = useCallback(() => {
    setShowLevelUp(false);
    setPreviousLevel(null);
    setNewLevel(null);
  }, []);

  return {
    showLevelUp,
    previousLevel,
    newLevel,
    closeLevelUp,
  };
}
