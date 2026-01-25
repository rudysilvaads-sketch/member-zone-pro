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
  if (level >= 50) return 'from-[#BFFF00] via-[#9ACD32] to-[#7CFC00]';
  if (level >= 40) return 'from-[#BFFF00] via-[#DFFF00] to-[#9ACD32]';
  if (level >= 30) return 'from-[#BFFF00] to-[#9ACD32]';
  if (level >= 20) return 'from-[#BFFF00]/90 to-[#7CFC00]/90';
  if (level >= 10) return 'from-[#BFFF00]/80 to-[#9ACD32]/80';
  return 'from-[#BFFF00]/60 to-[#9ACD32]/60';
};
