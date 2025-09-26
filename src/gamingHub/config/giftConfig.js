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
export const generateGiftCode = (playerName, itemId) => {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 6).toUpperCase()
  const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '')

  // Simple format: HAWK3-PLAYERNAME-ITEMID-DATE-RANDOM
  return `${GIFT_CONFIG.codePrefix}-${playerName.substring(0, 8).toUpperCase()}-${itemId.toUpperCase()}-${dateStr}-${random}`
}


// Add new decode function
export const decodeGiftCode = (giftCode) => {
  try {
    const parts = giftCode.toUpperCase().split('-')
    if (parts.length !== 5 || parts[0] !== GIFT_CONFIG.codePrefix) {
      return null
    }

    const [prefix, senderName, itemId, sentDate, random] = parts

    // Convert date back to ISO format
    const year = sentDate.substring(0, 4)
    const month = sentDate.substring(4, 6)
    const day = sentDate.substring(6, 8)
    const dateISO = `${year}-${month}-${day}`

    return {
      senderName: senderName,
      itemId: itemId.toLowerCase(),
      sentDate: dateISO,
      isValid: true
    }
  } catch (error) {
    console.error('Gift code decode error:', error)
    return null
  }
}

// Validate gift code format
export const validateGiftCodeFormat = (code) => {
  if (!code || typeof code !== 'string') return false
  const pattern = new RegExp(`^${GIFT_CONFIG.codePrefix}-[A-Z0-9]+-[A-Z0-9_]+-[0-9]{8}-[A-Z0-9]+$`)
  return pattern.test(code.toUpperCase())
}

export const validateGiftRedemption = (giftCode, currentPlayerName, receivedToday, ownedItems, redeemedCodes) => {
  const decoded = decodeGiftCode(giftCode)

  if (!decoded || !decoded.isValid) {
    return { valid: false, error: 'invalid_code' }
  }

  // Check if already redeemed
  if (redeemedCodes.includes(giftCode.toUpperCase())) {
    return { valid: false, error: 'already_redeemed' }
  }

  // Check if player is trying to redeem their own gift
  if (decoded.senderName.toUpperCase() === currentPlayerName.toUpperCase()) {
    return { valid: false, error: 'own_gift' }
  }

  // Check daily limit
  if (receivedToday >= GIFT_CONFIG.maxReceivedPerDay) {
    return { valid: false, error: 'daily_limit_reached' }
  }

  // Check if item already owned (for non-stackable items)
  if (ownedItems.includes(decoded.itemId)) {
    return { valid: false, error: 'already_owned' }
  }

  // Check expiration (7 days)
  const sentDate = new Date(decoded.sentDate)
  const now = new Date()
  const daysDiff = Math.floor((now - sentDate) / (1000 * 60 * 60 * 24))

  if (daysDiff > GIFT_CONFIG.giftCodeExpirationDays) {
    return { valid: false, error: 'expired' }
  }

  return {
    valid: true,
    gift: {
      senderName: decoded.senderName,
      itemId: decoded.itemId,
      sentDate: decoded.sentDate
    }
  }
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