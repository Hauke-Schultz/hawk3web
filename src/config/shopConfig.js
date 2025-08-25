export const SHOP_CATEGORIES = {
  profile: {
    id: 'profile',
    name: 'Profile',
    icon: 'user',
    color: 'primary',
    description: 'Avatar customizations and visual upgrades'
  },
  items: {
    id: 'items',
    name: 'Items',
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
  // Simple Cosmetic Items with Emojis
  {
    id: 'regular_glasses',
    name: 'Smart Glasses',
    description: 'Classic eyeglasses for the intellectual look',
    category: 'profile',
    price: { coins: 1000, diamonds: 0 },
    rarity: 'common',
    icon: '👓',
    type: 'cosmetic',
    purchaseLimit: 1
  },
  {
    id: 'cap',
    name: 'Baseball Cap',
    description: 'Sporty cap for casual gaming',
    category: 'profile',
    price: { coins: 2000, diamonds: 2 },
    rarity: 'common',
    icon: '🧢',
    type: 'cosmetic',
    purchaseLimit: 1
  },
  {
    id: 'sunglasses',
    name: 'Cool Sunglasses',
    description: 'Look cool with stylish sunglasses',
    category: 'profile',
    price: { coins: 4000, diamonds: 4 },
    rarity: 'common',
    icon: '🕶️',
    type: 'cosmetic',
    purchaseLimit: 1
  },
  {
    id: 'tophat',
    name: 'Top Hat',
    description: 'Elegant top hat for distinguished players',
    category: 'profile',
    price: { coins: 10000, diamonds: 20 },
    rarity: 'rare',
    icon: '🎩',
    type: 'cosmetic',
    purchaseLimit: 1
  },
  {
    id: 'car',
    name: 'Cool Car',
    description: 'Show off with your own car',
    category: 'profile',
    price: { coins: 50000, diamonds: 100 },
    rarity: 'epic',
    icon: '🚗',
    type: 'cosmetic',
    purchaseLimit: 1
  },
  {
    id: 'crown',
    name: 'Golden Crown',
    description: 'Royal crown for true champions',
    category: 'profile',
    price: { coins: 85000, diamonds: 250 },
    rarity: 'legendary',
    icon: '👑',
    type: 'cosmetic',
    purchaseLimit: 1
  },

  // Simple Power-ups
  {
    id: 'hammer_powerup',
    name: 'Fruit Hammer',
    description: 'Remove any fruit instantly! Perfect for clearing dangerous situations',
    category: 'items',
    price: { coins: 500, diamonds: 5 },
    rarity: 'common',
    icon: '🔨',
    type: 'consumable',
    purchaseLimit: null,
    uses: 1
  },

  // Simple Utilities
  /*
  {
    id: 'level_skip',
    name: 'Skip Level',
    description: 'Skip any level instantly',
    category: 'utilities',
    price: { coins: 0, diamonds: 10 },
    rarity: 'epic',
    icon: '⏭️',
    type: 'consumable',
    purchaseLimit: null
  }
  */
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