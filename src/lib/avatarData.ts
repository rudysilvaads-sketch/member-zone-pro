// Avatar system with free defaults and premium options
// Using character-style avatars similar to Discord/gaming profiles

export interface Avatar {
  id: string;
  name: string;
  url: string;
  category: 'default' | 'premium' | 'exclusive';
  xpCost: number;
  requiredLevel?: number;
  description?: string;
}

// Default avatars - Free for all users (adventurer style - game characters)
export const defaultAvatars: Avatar[] = [
  {
    id: 'default-1',
    name: 'Alex',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    category: 'default',
    xpCost: 0,
    description: 'Aventureiro iniciante',
  },
  {
    id: 'default-2',
    name: 'Jordan',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jordan&backgroundColor=c0aede',
    category: 'default',
    xpCost: 0,
    description: 'Espírito livre',
  },
  {
    id: 'default-3',
    name: 'Morgan',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Morgan&backgroundColor=ffd5dc',
    category: 'default',
    xpCost: 0,
    description: 'Coração gentil',
  },
  {
    id: 'default-4',
    name: 'Riley',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Riley&backgroundColor=d1f4d9',
    category: 'default',
    xpCost: 0,
    description: 'Natureza calma',
  },
  {
    id: 'default-5',
    name: 'Casey',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Casey&backgroundColor=ffdfba',
    category: 'default',
    xpCost: 0,
    description: 'Energia vibrante',
  },
  {
    id: 'default-6',
    name: 'Taylor',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Taylor&backgroundColor=bae1ff',
    category: 'default',
    xpCost: 0,
    description: 'Mente criativa',
  },
  {
    id: 'default-7',
    name: 'Jamie',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jamie&backgroundColor=e2d1f9',
    category: 'default',
    xpCost: 0,
    description: 'Alma curiosa',
  },
  {
    id: 'default-8',
    name: 'Drew',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Drew&backgroundColor=ffc8dd',
    category: 'default',
    xpCost: 0,
    description: 'Sonhador nato',
  },
];

// Premium avatars - Require XP to unlock (lorelei style - artistic portraits)
export const premiumAvatars: Avatar[] = [
  {
    id: 'premium-1',
    name: 'Phoenix',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Phoenix&backgroundColor=fef3c7',
    category: 'premium',
    xpCost: 500,
    requiredLevel: 5,
    description: 'Renascimento ardente',
  },
  {
    id: 'premium-2',
    name: 'Shadow',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Shadow&backgroundColor=1e293b',
    category: 'premium',
    xpCost: 600,
    requiredLevel: 6,
    description: 'Mistério noturno',
  },
  {
    id: 'premium-3',
    name: 'Blaze',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Blaze&backgroundColor=fecaca',
    category: 'premium',
    xpCost: 750,
    requiredLevel: 8,
    description: 'Chama interior',
  },
  {
    id: 'premium-4',
    name: 'Frost',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Frost&backgroundColor=cffafe',
    category: 'premium',
    xpCost: 900,
    requiredLevel: 10,
    description: 'Calma glacial',
  },
  {
    id: 'premium-5',
    name: 'Storm',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Storm&backgroundColor=ddd6fe',
    category: 'premium',
    xpCost: 1000,
    requiredLevel: 12,
    description: 'Força tempestuosa',
  },
  {
    id: 'premium-6',
    name: 'Sage',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Sage&backgroundColor=d9f99d',
    category: 'premium',
    xpCost: 1200,
    requiredLevel: 14,
    description: 'Sabedoria ancestral',
  },
  {
    id: 'premium-7',
    name: 'Raven',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Raven&backgroundColor=334155',
    category: 'premium',
    xpCost: 1400,
    requiredLevel: 16,
    description: 'Observador sombrio',
  },
  {
    id: 'premium-8',
    name: 'Aurora',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aurora&backgroundColor=fbcfe8',
    category: 'premium',
    xpCost: 1600,
    requiredLevel: 18,
    description: 'Luz do amanhecer',
  },
  {
    id: 'premium-9',
    name: 'Viper',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Viper&backgroundColor=bbf7d0',
    category: 'premium',
    xpCost: 1800,
    requiredLevel: 20,
    description: 'Agilidade mortal',
  },
];

// Exclusive avatars - High XP and level requirements (notionists style - premium look)
export const exclusiveAvatars: Avatar[] = [
  {
    id: 'exclusive-1',
    name: 'Overlord',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Overlord&backgroundColor=fef9c3',
    category: 'exclusive',
    xpCost: 2500,
    requiredLevel: 25,
    description: 'Comandante supremo',
  },
  {
    id: 'exclusive-2',
    name: 'Specter',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Specter&backgroundColor=e0e7ff',
    category: 'exclusive',
    xpCost: 3000,
    requiredLevel: 28,
    description: 'Presença fantasmagórica',
  },
  {
    id: 'exclusive-3',
    name: 'Titan',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Titan&backgroundColor=fed7aa',
    category: 'exclusive',
    xpCost: 3500,
    requiredLevel: 32,
    description: 'Força colossal',
  },
  {
    id: 'exclusive-4',
    name: 'Mystic',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Mystic&backgroundColor=f5d0fe',
    category: 'exclusive',
    xpCost: 4000,
    requiredLevel: 35,
    description: 'Poder arcano',
  },
  {
    id: 'exclusive-5',
    name: 'Legend',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Legend&backgroundColor=fde047',
    category: 'exclusive',
    xpCost: 5000,
    requiredLevel: 40,
    description: 'Status lendário',
  },
  {
    id: 'exclusive-6',
    name: 'Immortal',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Immortal&backgroundColor=fcd34d',
    category: 'exclusive',
    xpCost: 7500,
    requiredLevel: 50,
    description: 'Eternamente glorioso',
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
