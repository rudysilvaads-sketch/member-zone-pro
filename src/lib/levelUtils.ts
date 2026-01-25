// Level calculation utilities - centralized for reuse

export const calculateLevel = (xp: number): number => {
  // Each level requires progressively more XP
  // Level 1: 0-99 XP, Level 2: 100-299 XP, etc.
  let level = 1;
  let xpRequired = 100;
  let totalXpRequired = 0;
  
  while (xp >= totalXpRequired + xpRequired) {
    totalXpRequired += xpRequired;
    level++;
    xpRequired = Math.floor(100 * Math.pow(1.2, level - 1));
  }
  
  return level;
};

export const getXpForLevel = (level: number): number => {
  let totalXp = 0;
  for (let i = 1; i < level; i++) {
    totalXp += Math.floor(100 * Math.pow(1.2, i - 1));
  }
  return totalXp;
};

export const getXpToNextLevel = (currentXp: number): { current: number; needed: number; progress: number } => {
  const level = calculateLevel(currentXp);
  const xpForCurrentLevel = getXpForLevel(level);
  const xpForNextLevel = getXpForLevel(level + 1);
  const xpNeeded = xpForNextLevel - xpForCurrentLevel;
  const xpProgress = currentXp - xpForCurrentLevel;
  
  return {
    current: xpProgress,
    needed: xpNeeded,
    progress: (xpProgress / xpNeeded) * 100,
  };
};

export const getLevelTitle = (level: number): string => {
  if (level >= 50) return 'Lendário';
  if (level >= 40) return 'Mestre Supremo';
  if (level >= 30) return 'Mestre';
  if (level >= 25) return 'Expert';
  if (level >= 20) return 'Especialista';
  if (level >= 15) return 'Avançado';
  if (level >= 10) return 'Intermediário';
  if (level >= 5) return 'Aprendiz';
  return 'Iniciante';
};

export const getLevelColor = (level: number): string => {
  if (level >= 50) return 'from-[#F5A623] via-[#E8920D] to-[#FFB84D]';
  if (level >= 40) return 'from-[#F5A623] via-[#FFB84D] to-[#E8920D]';
  if (level >= 30) return 'from-[#F5A623] to-[#E8920D]';
  if (level >= 20) return 'from-[#F5A623]/90 to-[#FFB84D]/90';
  if (level >= 10) return 'from-[#F5A623]/80 to-[#E8920D]/80';
  return 'from-[#F5A623]/60 to-[#E8920D]/60';
};
