// Avatar system with free defaults and premium options
// Multiple styles: adventurer, lorelei, notionists, pixel-art, big-ears, fun-emoji

export interface Avatar {
  id: string;
  name: string;
  url: string;
  category: 'default' | 'premium' | 'exclusive';
  xpCost: number;
  requiredLevel?: number;
  description?: string;
  style?: string;
}

// Default avatars - Free for all users (mixed styles)
export const defaultAvatars: Avatar[] = [
  // Adventurer style (cartoon characters)
  {
    id: 'default-1',
    name: 'Alex',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Alex&backgroundColor=b6e3f4',
    category: 'default',
    xpCost: 0,
    description: 'Aventureiro iniciante',
    style: 'Cartoon',
  },
  {
    id: 'default-2',
    name: 'Jordan',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Jordan&backgroundColor=c0aede',
    category: 'default',
    xpCost: 0,
    description: 'Espírito livre',
    style: 'Cartoon',
  },
  {
    id: 'default-3',
    name: 'Morgan',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Morgan&backgroundColor=ffd5dc',
    category: 'default',
    xpCost: 0,
    description: 'Coração gentil',
    style: 'Cartoon',
  },
  {
    id: 'default-4',
    name: 'Riley',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Riley&backgroundColor=d1f4d9',
    category: 'default',
    xpCost: 0,
    description: 'Natureza calma',
    style: 'Cartoon',
  },
  // Pixel Art style
  {
    id: 'default-5',
    name: 'Pixel Hero',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=hero&backgroundColor=c084fc',
    category: 'default',
    xpCost: 0,
    description: 'Herói retrô',
    style: 'Pixel Art',
  },
  {
    id: 'default-6',
    name: 'Pixel Mage',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=mage&backgroundColor=60a5fa',
    category: 'default',
    xpCost: 0,
    description: 'Mago 8-bit',
    style: 'Pixel Art',
  },
  // Big Ears style (cute anime-like)
  {
    id: 'default-7',
    name: 'Luna',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Luna&backgroundColor=fecaca',
    category: 'default',
    xpCost: 0,
    description: 'Doce e gentil',
    style: 'Anime',
  },
  {
    id: 'default-8',
    name: 'Kai',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Kai&backgroundColor=bfdbfe',
    category: 'default',
    xpCost: 0,
    description: 'Espírito brincalhão',
    style: 'Anime',
  },
  // Fun Emoji style
  {
    id: 'default-9',
    name: 'Sunny',
    url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Sunny&backgroundColor=fef08a',
    category: 'default',
    xpCost: 0,
    description: 'Sempre sorrindo',
    style: 'Emoji',
  },
  {
    id: 'default-10',
    name: 'Cool',
    url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Cool&backgroundColor=a5f3fc',
    category: 'default',
    xpCost: 0,
    description: 'Descolado e tranquilo',
    style: 'Emoji',
  },
];

// Premium avatars - Require XP to unlock (mixed premium styles)
export const premiumAvatars: Avatar[] = [
  // Lorelei style (artistic portraits)
  {
    id: 'premium-1',
    name: 'Phoenix',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Phoenix&backgroundColor=fef3c7',
    category: 'premium',
    xpCost: 500,
    requiredLevel: 5,
    description: 'Renascimento ardente',
    style: 'Artístico',
  },
  {
    id: 'premium-2',
    name: 'Shadow',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Shadow&backgroundColor=1e293b',
    category: 'premium',
    xpCost: 600,
    requiredLevel: 6,
    description: 'Mistério noturno',
    style: 'Artístico',
  },
  {
    id: 'premium-3',
    name: 'Aurora',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Aurora&backgroundColor=fbcfe8',
    category: 'premium',
    xpCost: 700,
    requiredLevel: 7,
    description: 'Luz do amanhecer',
    style: 'Artístico',
  },
  // Pixel Art Premium
  {
    id: 'premium-4',
    name: 'Pixel Knight',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=knight&backgroundColor=fbbf24&hair=short01,short02,short03',
    category: 'premium',
    xpCost: 800,
    requiredLevel: 8,
    description: 'Cavaleiro pixelado',
    style: 'Pixel Art',
  },
  {
    id: 'premium-5',
    name: 'Pixel Ninja',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=ninja&backgroundColor=1f2937',
    category: 'premium',
    xpCost: 900,
    requiredLevel: 9,
    description: 'Ninja das sombras',
    style: 'Pixel Art',
  },
  {
    id: 'premium-6',
    name: 'Pixel Wizard',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=wizard&backgroundColor=7c3aed',
    category: 'premium',
    xpCost: 1000,
    requiredLevel: 10,
    description: 'Mago arcano',
    style: 'Pixel Art',
  },
  // Big Ears Premium (anime style)
  {
    id: 'premium-7',
    name: 'Sakura',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Sakura&backgroundColor=fda4af',
    category: 'premium',
    xpCost: 1100,
    requiredLevel: 11,
    description: 'Flor de cerejeira',
    style: 'Anime',
  },
  {
    id: 'premium-8',
    name: 'Ryu',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Ryu&backgroundColor=6ee7b7',
    category: 'premium',
    xpCost: 1200,
    requiredLevel: 12,
    description: 'Espírito do dragão',
    style: 'Anime',
  },
  {
    id: 'premium-9',
    name: 'Yuki',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Yuki&backgroundColor=a5b4fc',
    category: 'premium',
    xpCost: 1300,
    requiredLevel: 13,
    description: 'Neve serena',
    style: 'Anime',
  },
  // Adventurer Premium
  {
    id: 'premium-10',
    name: 'Blaze',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Blaze&backgroundColor=f97316',
    category: 'premium',
    xpCost: 1400,
    requiredLevel: 14,
    description: 'Chama interior',
    style: 'Cartoon',
  },
  {
    id: 'premium-11',
    name: 'Storm',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Storm&backgroundColor=6366f1',
    category: 'premium',
    xpCost: 1500,
    requiredLevel: 15,
    description: 'Força tempestuosa',
    style: 'Cartoon',
  },
  {
    id: 'premium-12',
    name: 'Frost',
    url: 'https://api.dicebear.com/9.x/adventurer/svg?seed=Frost&backgroundColor=22d3ee',
    category: 'premium',
    xpCost: 1600,
    requiredLevel: 16,
    description: 'Calma glacial',
    style: 'Cartoon',
  },
  // Fun Emoji Premium
  {
    id: 'premium-13',
    name: 'Fire',
    url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Fire&backgroundColor=fca5a5',
    category: 'premium',
    xpCost: 1700,
    requiredLevel: 17,
    description: 'Em chamas!',
    style: 'Emoji',
  },
  {
    id: 'premium-14',
    name: 'Star',
    url: 'https://api.dicebear.com/9.x/fun-emoji/svg?seed=Star&backgroundColor=fde047',
    category: 'premium',
    xpCost: 1800,
    requiredLevel: 18,
    description: 'Brilho estelar',
    style: 'Emoji',
  },
];

// Exclusive avatars - High XP and level requirements (premium styles)
export const exclusiveAvatars: Avatar[] = [
  // Notionists Exclusive (professional look)
  {
    id: 'exclusive-1',
    name: 'Overlord',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Overlord&backgroundColor=fef9c3',
    category: 'exclusive',
    xpCost: 2500,
    requiredLevel: 25,
    description: 'Comandante supremo',
    style: 'Profissional',
  },
  {
    id: 'exclusive-2',
    name: 'Phantom',
    url: 'https://api.dicebear.com/9.x/notionists/svg?seed=Phantom&backgroundColor=e0e7ff',
    category: 'exclusive',
    xpCost: 3000,
    requiredLevel: 28,
    description: 'Presença etérea',
    style: 'Profissional',
  },
  // Pixel Art Exclusive (rare retro)
  {
    id: 'exclusive-3',
    name: 'Pixel King',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=king&backgroundColor=eab308&accessories=variant01,variant02,variant03',
    category: 'exclusive',
    xpCost: 3500,
    requiredLevel: 32,
    description: 'Rei do reino pixelado',
    style: 'Pixel Art',
  },
  {
    id: 'exclusive-4',
    name: 'Pixel Dragon',
    url: 'https://api.dicebear.com/9.x/pixel-art/svg?seed=dragon&backgroundColor=dc2626',
    category: 'exclusive',
    xpCost: 4000,
    requiredLevel: 35,
    description: 'Dragão lendário',
    style: 'Pixel Art',
  },
  // Big Ears Exclusive (rare anime)
  {
    id: 'exclusive-5',
    name: 'Hikari',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Hikari&backgroundColor=fcd34d',
    category: 'exclusive',
    xpCost: 4500,
    requiredLevel: 38,
    description: 'Luz divina',
    style: 'Anime',
  },
  {
    id: 'exclusive-6',
    name: 'Kage',
    url: 'https://api.dicebear.com/9.x/big-ears/svg?seed=Kage&backgroundColor=0f172a',
    category: 'exclusive',
    xpCost: 5000,
    requiredLevel: 40,
    description: 'Mestre das sombras',
    style: 'Anime',
  },
  // Lorelei Exclusive (rare artistic)
  {
    id: 'exclusive-7',
    name: 'Celestial',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Celestial&backgroundColor=c4b5fd',
    category: 'exclusive',
    xpCost: 6000,
    requiredLevel: 45,
    description: 'Ser divino',
    style: 'Artístico',
  },
  {
    id: 'exclusive-8',
    name: 'Eternal',
    url: 'https://api.dicebear.com/9.x/lorelei/svg?seed=Eternal&backgroundColor=fcd34d',
    category: 'exclusive',
    xpCost: 7500,
    requiredLevel: 50,
    description: 'Imortalidade dourada',
    style: 'Artístico',
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

export const getStyleLabel = (style?: string): string => {
  return style || 'Padrão';
};
