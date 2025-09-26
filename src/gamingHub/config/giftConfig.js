export const GIFT_CONFIG = {
  // Daily limits
  maxSentPerDay: 1,
  maxReceivedPerDay: 1,

  // Code generation
  codeLength: 8,
  codePrefix: 'HAWK3',

  // Expiration
  giftCodeExpirationDays: 7, // 7 days to redeem

  // Categories that can be gifted
  allowedCategories: ['gifts', 'profile'],
  allowedTypes: ['cosmetic'],

  // Excluded items (items that cannot be gifted)
  excludedItems: [
    'hammer_powerup',
    'undo_move',
  ]
}

// Gift-specific items (cosmetics that can be gifted)
export const GIFTABLE_ITEMS = [
  // Profile Items (existing)
  'regular_glasses',
  'cap',
  'sunglasses',
  'tophat',
  'car',
  'crown',

  // Gift-spezifische Items
  'friendship_ring',
  'friendship_bracelet',
  'love_letter',
  'birthday_cake',
  'party_hat',
  'champagne_bottle',
  'four_leaf_clover',
  'lucky_coin',
  'crystal_ball',
  'red_rose',
  'bouquet_flowers',
  'butterfly',
  'diamond_gem',
  'golden_star',
  'treasure_chest',
  'teddy_bear',
  'rainbow',
  'shooting_star'
]

// Generate unique gift code
export const generateGiftCode = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 6)
  const uniqueId = Math.random().toString(36).substring(2, 4)

  return `${GIFT_CONFIG.codePrefix}-${timestamp}-${random}-${uniqueId}`.toUpperCase()
}

// Validate gift code format
export const validateGiftCodeFormat = (code) => {
  if (!code || typeof code !== 'string') return false

  const pattern = new RegExp(`^${GIFT_CONFIG.codePrefix}-[A-Z0-9]+-[A-Z0-9]+-[A-Z0-9]+$`)
  return pattern.test(code.toUpperCase())
}

// Check if item can be gifted
export const isItemGiftable = (itemId, itemCategory, itemType) => {
  if (GIFT_CONFIG.excludedItems.includes(itemId)) return false
  if (!GIFT_CONFIG.allowedCategories.includes(itemCategory)) return false
  if (!GIFT_CONFIG.allowedTypes.includes(itemType)) return false

  return GIFTABLE_ITEMS.includes(itemId)
}

// Calculate gift code expiration
export const calculateGiftExpiration = () => {
  const now = new Date()
  const expirationDate = new Date(now.getTime() + (GIFT_CONFIG.giftCodeExpirationDays * 24 * 60 * 60 * 1000))
  return expirationDate.toISOString()
}