// Avatar system with free defaults and premium options

export interface Avatar {
  id: string;
  name: string;
  url: string;
  category: 'default' | 'premium' | 'exclusive';
  xpCost: number;
  requiredLevel?: number;
  description?: string;
}

// Default avatars - Free for all users (using glass/shapes style - more modern)
export const defaultAvatars: Avatar[] = [
  {
    id: 'default-1',
    name: 'Obsidian',
    url: 'https://api.dicebear.com/9.x/glass/svg?seed=obsidian',
    category: 'default',
    xpCost: 0,
    description: 'Elegância minimalista',
  },
  {
    id: 'default-2',
    name: 'Prism',
    url: 'https://api.dicebear.com/9.x/glass/svg?seed=prism',
    category: 'default',
    xpCost: 0,
    description: 'Reflexos de luz',
  },
  {
    id: 'default-3',
    name: 'Helix',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=helix&backgroundColor=0f172a',
    category: 'default',
    xpCost: 0,
    description: 'Forma geométrica',
  },
  {
    id: 'default-4',
    name: 'Quantum',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=quantum&backgroundColor=1e1b4b',
    category: 'default',
    xpCost: 0,
    description: 'Energia quântica',
  },
  {
    id: 'default-5',
    name: 'Onyx',
    url: 'https://api.dicebear.com/9.x/glass/svg?seed=onyx',
    category: 'default',
    xpCost: 0,
    description: 'Poder discreto',
  },
  {
    id: 'default-6',
    name: 'Nebula',
    url: 'https://api.dicebear.com/9.x/shapes/svg?seed=nebula&backgroundColor=312e81',
    category: 'default',
    xpCost: 0,
    description: 'Vastidão cósmica',
  },
  {
    id: 'default-7',
    name: 'Vertex',
    url: 'https://api.dicebear.com/9.x/identicon/svg?seed=vertex&backgroundColor=18181b',
    category: 'default',
    xpCost: 0,
    description: 'Precisão angular',
  },
  {
    id: 'default-8',
    name: 'Echo',
    url: 'https://api.dicebear.com/9.x/glass/svg?seed=echo',
    category: 'default',
    xpCost: 0,
    description: 'Reverberação silenciosa',
  },
];

// Premium avatars - Require XP to unlock (using rings/thumbs style - artistic)
export const premiumAvatars: Avatar[] = [
  {
    id: 'premium-1',
    name: 'Phoenix',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=phoenix&backgroundColor=7c2d12',
    category: 'premium',
    xpCost: 500,
    requiredLevel: 5,
    description: 'Renascimento eterno',
  },
  {
    id: 'premium-2',
    name: 'Specter',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=specter&backgroundColor=1e3a5f',
    category: 'premium',
    xpCost: 600,
    requiredLevel: 6,
    description: 'Presença etérea',
  },
  {
    id: 'premium-3',
    name: 'Crimson',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=crimson&backgroundColor=7f1d1d',
    category: 'premium',
    xpCost: 750,
    requiredLevel: 8,
    description: 'Intensidade carmesim',
  },
  {
    id: 'premium-4',
    name: 'Cipher',
    url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=cipher&backgroundColor=0c4a6e&shapeColor=38bdf8',
    category: 'premium',
    xpCost: 900,
    requiredLevel: 10,
    description: 'Código secreto',
  },
  {
    id: 'premium-5',
    name: 'Vortex',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=vortex&backgroundColor=4c1d95',
    category: 'premium',
    xpCost: 1000,
    requiredLevel: 12,
    description: 'Espiral dimensional',
  },
  {
    id: 'premium-6',
    name: 'Nexus',
    url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=nexus&backgroundColor=064e3b&shapeColor=34d399',
    category: 'premium',
    xpCost: 1200,
    requiredLevel: 14,
    description: 'Ponto de conexão',
  },
  {
    id: 'premium-7',
    name: 'Titan',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=titan&backgroundColor=451a03',
    category: 'premium',
    xpCost: 1400,
    requiredLevel: 16,
    description: 'Força colossal',
  },
  {
    id: 'premium-8',
    name: 'Aether',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=aether&backgroundColor=3730a3',
    category: 'premium',
    xpCost: 1600,
    requiredLevel: 18,
    description: 'Essência celestial',
  },
  {
    id: 'premium-9',
    name: 'Phantom',
    url: 'https://api.dicebear.com/9.x/thumbs/svg?seed=phantom&backgroundColor=1c1917&shapeColor=a8a29e',
    category: 'premium',
    xpCost: 1800,
    requiredLevel: 20,
    description: 'Sombra misteriosa',
  },
];

// Exclusive avatars - High XP and level requirements (unique artistic designs)
export const exclusiveAvatars: Avatar[] = [
  {
    id: 'exclusive-1',
    name: 'Sovereign',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=sovereign&backgroundColor=713f12&ring1Color=fbbf24&ring2Color=f59e0b&ring3Color=d97706&ring4Color=b45309&ring5Color=92400e',
    category: 'exclusive',
    xpCost: 2500,
    requiredLevel: 25,
    description: 'Autoridade absoluta',
  },
  {
    id: 'exclusive-2',
    name: 'Eclipse',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=eclipse&backgroundColor=0f0f0f&ring1Color=ffffff&ring2Color=a3a3a3&ring3Color=525252&ring4Color=262626&ring5Color=0a0a0a',
    category: 'exclusive',
    xpCost: 3000,
    requiredLevel: 28,
    description: 'Luz e escuridão',
  },
  {
    id: 'exclusive-3',
    name: 'Inferno',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=inferno&backgroundColor=450a0a&ring1Color=fef08a&ring2Color=fbbf24&ring3Color=f97316&ring4Color=dc2626&ring5Color=7f1d1d',
    category: 'exclusive',
    xpCost: 3500,
    requiredLevel: 32,
    description: 'Chamas eternas',
  },
  {
    id: 'exclusive-4',
    name: 'Void',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=void&backgroundColor=020617&ring1Color=6366f1&ring2Color=4f46e5&ring3Color=4338ca&ring4Color=3730a3&ring5Color=1e1b4b',
    category: 'exclusive',
    xpCost: 4000,
    requiredLevel: 35,
    description: 'Vazio infinito',
  },
  {
    id: 'exclusive-5',
    name: 'Celestial',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=celestial&backgroundColor=1e1b4b&ring1Color=f0abfc&ring2Color=c084fc&ring3Color=a855f7&ring4Color=9333ea&ring5Color=7c3aed',
    category: 'exclusive',
    xpCost: 5000,
    requiredLevel: 40,
    description: 'Divindade astral',
  },
  {
    id: 'exclusive-6',
    name: 'Eternal',
    url: 'https://api.dicebear.com/9.x/rings/svg?seed=eternal&backgroundColor=422006&ring1Color=fef3c7&ring2Color=fde68a&ring3Color=fcd34d&ring4Color=fbbf24&ring5Color=f59e0b',
    category: 'exclusive',
    xpCost: 7500,
    requiredLevel: 50,
    description: 'Imortalidade dourada',
  },
];

export const allAvatars: Avatar[] = [...defaultAvatars, ...premiumAvatars, ...exclusiveAvatars];

export const getAvatarById = (id: string): Avatar | undefined => {
  return allAvatars.find(avatar => avatar.id === id);
};

export const getCategoryLabel = (category: Avatar['category']): string => {
  const labels: Record<Avatar['category'], string> = {
    default: 'Padrão',
    premium: 'Premium',
    exclusive: 'Exclusivo',
  };
  return labels[category];
};

export const getCategoryColor = (category: Avatar['category']): string => {
  const colors: Record<Avatar['category'], string> = {
    default: 'bg-muted text-muted-foreground',
    premium: 'bg-primary/20 text-primary',
    exclusive: 'bg-gradient-gold text-primary-foreground',
  };
  return colors[category];
};
