// Shop categories and items configuration
export const SHOP_CATEGORIES = {
  cosmetics: {
    id: 'cosmetics',
    name: 'Cosmetics',
    icon: 'user',
    color: 'primary',
    description: 'Avatar customizations and visual upgrades'
  },
  powerups: {
    id: 'powerups',
    name: 'Power-ups',
    icon: 'star',
    color: 'warning',
    description: 'Game enhancements and bonuses'
  },
  utilities: {
    id: 'utilities',
    name: 'Utilities',
    icon: 'settings',
    color: 'info',
    description: 'Helpful tools and features'
  }
}

export const SHOP_ITEMS = [
  // Cosmetic Items
  {
    id: 'premium_avatar_set_1',
    name: 'Golden Avatar Pack',
    description: 'Exclusive golden-themed avatar collection',
    category: 'cosmetics',
    price: { coins: 1000, diamonds: 0 },
    rarity: 'rare',
    icon: 'avatar/cap',
    preview: 'avatar/cap',
    type: 'avatar_pack',
    contents: ['avatar/golden_warrior', 'avatar/golden_mage'],
    purchaseLimit: 1
  },
  {
    id: 'exclusive_frame_set',
    name: 'Diamond Frame Collection',
    description: 'Shiny diamond frames for your profile',
    category: 'cosmetics',
    price: { coins: 2500, diamonds: 5 },
    rarity: 'epic',
    icon: 'trophy',
    type: 'profile_frame',
    contents: ['frame_diamond_basic', 'frame_diamond_advanced'],
    purchaseLimit: 1
  },
  {
    id: 'theme_sunset',
    name: 'Sunset Theme',
    description: 'Beautiful sunset color theme',
    category: 'cosmetics',
    price: { coins: 800, diamonds: 0 },
    rarity: 'uncommon',
    icon: 'settings',
    type: 'theme',
    themeData: {
      primary: '#FF6B35',
      secondary: '#F7931E',
      accent: '#FFE66D'
    },
    purchaseLimit: 1
  },

  // Power-ups
  {
    id: 'double_coins_1hour',
    name: '2x Coins (1 Hour)',
    description: 'Double coin rewards for 1 hour',
    category: 'powerups',
    price: { coins: 500, diamonds: 0 },
    rarity: 'common',
    icon: 'star',
    type: 'boost',
    effect: { type: 'coin_multiplier', value: 2, duration: 3600 },
    purchaseLimit: null // unlimited
  },
  {
    id: 'extra_lives_5',
    name: '5 Extra Lives',
    description: 'Get 5 additional attempts for challenging levels',
    category: 'powerups',
    price: { coins: 300, diamonds: 0 },
    rarity: 'common',
    icon: 'heart',
    type: 'consumable',
    effect: { type: 'extra_lives', value: 5 },
    purchaseLimit: null
  },

  // Utilities
  {
    id: 'level_skip_token',
    name: 'Level Skip Token',
    description: 'Skip any level instantly',
    category: 'utilities',
    price: { coins: 0, diamonds: 10 },
    rarity: 'epic',
    icon: 'arrow-right',
    type: 'consumable',
    effect: { type: 'level_skip' },
    purchaseLimit: null
  }
]

export const RARITY_CONFIG = {
  common: {
    name: 'Common',
    color: '#6B7280',
    borderColor: '#9CA3AF'
  },
  uncommon: {
    name: 'Uncommon',
    color: '#10B981',
    borderColor: '#34D399'
  },
  rare: {
    name: 'Rare',
    color: '#3B82F6',
    borderColor: '#60A5FA'
  },
  epic: {
    name: 'Epic',
    color: '#8B5CF6',
    borderColor: '#A78BFA'
  },
  legendary: {
    name: 'Legendary',
    color: '#F59E0B',
    borderColor: '#FBBF24'
  }
}

export const shopConfig = {
  categories: Object.values(SHOP_CATEGORIES),
  items: SHOP_ITEMS,
  rarities: RARITY_CONFIG
}