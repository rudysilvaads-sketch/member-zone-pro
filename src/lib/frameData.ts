// Frame system for avatars with free defaults and premium options

export interface Frame {
  id: string;
  name: string;
  category: 'default' | 'premium' | 'exclusive';
  xpCost: number;
  requiredLevel?: number;
  description?: string;
  // CSS classes for the frame effect
  borderStyle: string;
  glowStyle?: string;
  animationClass?: string;
}

// Default frames - Free for all users
export const defaultFrames: Frame[] = [
  {
    id: 'frame-none',
    name: 'Sem Moldura',
    category: 'default',
    xpCost: 0,
    description: 'Avatar sem moldura',
    borderStyle: 'border-2 border-border',
  },
  {
    id: 'frame-simple',
    name: 'Simples',
    category: 'default',
    xpCost: 0,
    description: 'Borda simples elegante',
    borderStyle: 'border-3 border-muted-foreground/30',
  },
  {
    id: 'frame-primary',
    name: 'Primária',
    category: 'default',
    xpCost: 0,
    description: 'Borda na cor primária',
    borderStyle: 'border-3 border-primary/50',
  },
];

// Premium frames - Require XP to unlock
export const premiumFrames: Frame[] = [
  {
    id: 'frame-gold',
    name: 'Dourada',
    category: 'premium',
    xpCost: 300,
    requiredLevel: 3,
    description: 'Moldura dourada brilhante',
    borderStyle: 'frame-gold',
    glowStyle: 'shadow-[0_0_15px_hsl(45,100%,50%,0.4)]',
  },
  {
    id: 'frame-silver',
    name: 'Prateada',
    category: 'premium',
    xpCost: 250,
    requiredLevel: 3,
    description: 'Moldura prateada elegante',
    borderStyle: 'frame-silver',
    glowStyle: 'shadow-[0_0_12px_hsl(220,20%,70%,0.4)]',
  },
  {
    id: 'frame-bronze',
    name: 'Bronze',
    category: 'premium',
    xpCost: 200,
    requiredLevel: 2,
    description: 'Moldura bronze clássica',
    borderStyle: 'frame-bronze',
    glowStyle: 'shadow-[0_0_12px_hsl(25,70%,45%,0.4)]',
  },
  {
    id: 'frame-neon-blue',
    name: 'Neon Azul',
    category: 'premium',
    xpCost: 400,
    requiredLevel: 5,
    description: 'Efeito neon azul vibrante',
    borderStyle: 'frame-neon-blue',
    glowStyle: 'shadow-[0_0_20px_hsl(199,95%,55%,0.6)]',
    animationClass: 'animate-pulse-slow',
  },
  {
    id: 'frame-neon-purple',
    name: 'Neon Roxo',
    category: 'premium',
    xpCost: 400,
    requiredLevel: 5,
    description: 'Efeito neon roxo místico',
    borderStyle: 'frame-neon-purple',
    glowStyle: 'shadow-[0_0_20px_hsl(262,90%,60%,0.6)]',
    animationClass: 'animate-pulse-slow',
  },
  {
    id: 'frame-neon-green',
    name: 'Neon Verde',
    category: 'premium',
    xpCost: 400,
    requiredLevel: 5,
    description: 'Efeito neon verde matrix',
    borderStyle: 'frame-neon-green',
    glowStyle: 'shadow-[0_0_20px_hsl(142,76%,45%,0.6)]',
    animationClass: 'animate-pulse-slow',
  },
  {
    id: 'frame-gradient-sunset',
    name: 'Pôr do Sol',
    category: 'premium',
    xpCost: 600,
    requiredLevel: 8,
    description: 'Gradiente quente animado',
    borderStyle: 'frame-gradient-sunset',
    animationClass: 'frame-rotate-slow',
  },
  {
    id: 'frame-gradient-ocean',
    name: 'Oceano',
    category: 'premium',
    xpCost: 600,
    requiredLevel: 8,
    description: 'Gradiente azul oceânico',
    borderStyle: 'frame-gradient-ocean',
    animationClass: 'frame-rotate-slow',
  },
];

// Exclusive frames - High XP and level requirements
export const exclusiveFrames: Frame[] = [
  {
    id: 'frame-rainbow',
    name: 'Arco-Íris',
    category: 'exclusive',
    xpCost: 1500,
    requiredLevel: 15,
    description: 'Todas as cores do arco-íris',
    borderStyle: 'frame-rainbow',
    animationClass: 'frame-rotate',
  },
  {
    id: 'frame-fire',
    name: 'Fogo',
    category: 'exclusive',
    xpCost: 2000,
    requiredLevel: 20,
    description: 'Chamas ardentes',
    borderStyle: 'frame-fire',
    glowStyle: 'shadow-[0_0_25px_hsl(15,100%,50%,0.5)]',
    animationClass: 'frame-flicker',
  },
  {
    id: 'frame-ice',
    name: 'Gelo',
    category: 'exclusive',
    xpCost: 2000,
    requiredLevel: 20,
    description: 'Cristais de gelo',
    borderStyle: 'frame-ice',
    glowStyle: 'shadow-[0_0_25px_hsl(199,100%,70%,0.5)]',
    animationClass: 'animate-pulse-slow',
  },
  {
    id: 'frame-diamond',
    name: 'Diamante',
    category: 'exclusive',
    xpCost: 3000,
    requiredLevel: 25,
    description: 'Brilho de diamante',
    borderStyle: 'frame-diamond',
    glowStyle: 'shadow-[0_0_30px_hsl(199,100%,80%,0.6)]',
    animationClass: 'frame-sparkle',
  },
  {
    id: 'frame-legendary',
    name: 'Lendária',
    category: 'exclusive',
    xpCost: 5000,
    requiredLevel: 35,
    description: 'A moldura mais rara',
    borderStyle: 'frame-legendary',
    glowStyle: 'shadow-[0_0_40px_hsl(45,100%,60%,0.7)]',
    animationClass: 'frame-legendary-anim',
  },
];

export const allFrames: Frame[] = [...defaultFrames, ...premiumFrames, ...exclusiveFrames];

export const getFrameById = (id: string): Frame | undefined => {
  return allFrames.find(frame => frame.id === id);
};

export const getCategoryLabel = (category: Frame['category']): string => {
  const labels: Record<Frame['category'], string> = {
    default: 'Padrão',
    premium: 'Premium',
    exclusive: 'Exclusivo',
  };
  return labels[category];
};

export const getCategoryColor = (category: Frame['category']): string => {
  const colors: Record<Frame['category'], string> = {
    default: 'bg-muted text-muted-foreground',
    premium: 'bg-primary/20 text-primary',
    exclusive: 'bg-gradient-gold text-primary-foreground',
  };
  return colors[category];
};
