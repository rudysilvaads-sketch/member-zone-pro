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

// Default avatars - Free for all users
export const defaultAvatars: Avatar[] = [
  {
    id: 'default-1',
    name: 'Astronauta',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=astronaut&backgroundColor=0ea5e9',
    category: 'default',
    xpCost: 0,
    description: 'Explorador do cosmos',
  },
  {
    id: 'default-2',
    name: 'Robô',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=robot&backgroundColor=8b5cf6',
    category: 'default',
    xpCost: 0,
    description: 'Assistente mecânico',
  },
  {
    id: 'default-3',
    name: 'Ninja',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=ninja&backgroundColor=ef4444',
    category: 'default',
    xpCost: 0,
    description: 'Guerreiro das sombras',
  },
  {
    id: 'default-4',
    name: 'Mago',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=wizard&backgroundColor=a855f7',
    category: 'default',
    xpCost: 0,
    description: 'Mestre dos feitiços',
  },
  {
    id: 'default-5',
    name: 'Guerreiro',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=warrior&backgroundColor=f59e0b',
    category: 'default',
    xpCost: 0,
    description: 'Defensor corajoso',
  },
  {
    id: 'default-6',
    name: 'Cientista',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=scientist&backgroundColor=22c55e',
    category: 'default',
    xpCost: 0,
    description: 'Mente brilhante',
  },
];

// Premium avatars - Require XP to unlock
export const premiumAvatars: Avatar[] = [
  {
    id: 'premium-1',
    name: 'Fênix',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=phoenix&backgroundColor=dc2626&backgroundType=gradientLinear&backgroundRotation=45',
    category: 'premium',
    xpCost: 500,
    requiredLevel: 5,
    description: 'Renascido das cinzas',
  },
  {
    id: 'premium-2',
    name: 'Dragão',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=dragon&backgroundColor=059669&backgroundType=gradientLinear&backgroundRotation=135',
    category: 'premium',
    xpCost: 750,
    requiredLevel: 8,
    description: 'Guardião ancestral',
  },
  {
    id: 'premium-3',
    name: 'Samurai',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=samurai&backgroundColor=7c3aed&backgroundType=gradientLinear&backgroundRotation=90',
    category: 'premium',
    xpCost: 1000,
    requiredLevel: 10,
    description: 'Honra e disciplina',
  },
  {
    id: 'premium-4',
    name: 'Cyber',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=cyber&backgroundColor=0891b2&backgroundType=gradientLinear&backgroundRotation=180',
    category: 'premium',
    xpCost: 1200,
    requiredLevel: 12,
    description: 'Futuro digital',
  },
  {
    id: 'premium-5',
    name: 'Viking',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=viking&backgroundColor=854d0e&backgroundType=gradientLinear&backgroundRotation=45',
    category: 'premium',
    xpCost: 1500,
    requiredLevel: 15,
    description: 'Conquistador nórdico',
  },
  {
    id: 'premium-6',
    name: 'Mística',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=mystic&backgroundColor=be185d&backgroundType=gradientLinear&backgroundRotation=270',
    category: 'premium',
    xpCost: 1800,
    requiredLevel: 18,
    description: 'Poder oculto',
  },
];

// Exclusive avatars - High XP and level requirements
export const exclusiveAvatars: Avatar[] = [
  {
    id: 'exclusive-1',
    name: 'Lendário',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=legendary&backgroundColor=eab308&backgroundType=gradientLinear&backgroundRotation=45',
    category: 'exclusive',
    xpCost: 3000,
    requiredLevel: 25,
    description: 'Status lendário',
  },
  {
    id: 'exclusive-2',
    name: 'Imperador',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=emperor&backgroundColor=b91c1c&backgroundType=gradientLinear&backgroundRotation=135',
    category: 'exclusive',
    xpCost: 4000,
    requiredLevel: 30,
    description: 'Governante supremo',
  },
  {
    id: 'exclusive-3',
    name: 'Divino',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=divine&backgroundColor=c084fc&backgroundType=gradientLinear&backgroundRotation=90',
    category: 'exclusive',
    xpCost: 5000,
    requiredLevel: 35,
    description: 'Poder divino',
  },
  {
    id: 'exclusive-4',
    name: 'Eterno',
    url: 'https://api.dicebear.com/9.x/bottts-neutral/svg?seed=eternal&backgroundColor=14b8a6&backgroundType=gradientLinear&backgroundRotation=180',
    category: 'exclusive',
    xpCost: 7500,
    requiredLevel: 50,
    description: 'Além do tempo',
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
