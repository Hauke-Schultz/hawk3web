// Gem configuration for weapon sockets
// Each weapon can have up to 3 gem sockets

export const gemConfig = {
  ruby: {
    name: 'Ruby',
    icon: '💎',
    color: '#dc2626', // Red
    rarity: 'common',
    description: 'Increases weapon damage',
    bonuses: {
      damage: 1 // +1 damage
    }
  },

  sapphire: {
    name: 'Sapphire',
    icon: '💠',
    color: '#2563eb', // Blue
    rarity: 'common',
    description: 'Reduces attack cooldown',
    bonuses: {
      cooldown: -0.1 // -0.1 seconds cooldown
    }
  },

  emerald: {
    name: 'Emerald',
    icon: '💚',
    color: '#16a34a', // Green
    rarity: 'common',
    description: 'Faster health regeneration',
    bonuses: {
      healthRegen: -2 // -2 seconds on health regen interval
    }
  },

  topaz: {
    name: 'Topaz',
    icon: '🔶',
    color: '#f59e0b', // Orange
    rarity: 'uncommon',
    description: 'Faster mana regeneration',
    bonuses: {
      manaRegen: -2 // -2 seconds on mana regen interval
    }
  },

  amethyst: {
    name: 'Amethyst',
    icon: '💜',
    color: '#9333ea', // Purple
    rarity: 'uncommon',
    description: 'Reduces charged attack mana cost',
    bonuses: {
      manaCost: -1 // -1 mana cost for charged attacks
    }
  },

  diamond: {
    name: 'Diamond',
    icon: '💍',
    color: '#f0f9ff', // White/Light blue
    rarity: 'rare',
    description: 'Balanced power boost',
    bonuses: {
      damage: 0.5, // +0.5 damage
      cooldown: -0.05 // -0.05 seconds cooldown
    }
  }
}

// Number of sockets per weapon
export const WEAPON_SOCKET_COUNT = 3

// Gem rarity weights for drops
export const GEM_RARITY_WEIGHTS = {
  common: 60,     // 60% chance
  uncommon: 30,   // 30% chance
  rare: 10        // 10% chance
}

// Helper function to get a random gem based on rarity
export function getRandomGem() {
  const rand = Math.random() * 100
  let rarity = 'common'

  if (rand < GEM_RARITY_WEIGHTS.rare) {
    rarity = 'rare'
  } else if (rand < GEM_RARITY_WEIGHTS.rare + GEM_RARITY_WEIGHTS.uncommon) {
    rarity = 'uncommon'
  }

  // Get all gems of the selected rarity
  const gemsOfRarity = Object.keys(gemConfig).filter(
    key => gemConfig[key].rarity === rarity
  )

  // Return a random gem from that rarity
  const randomIndex = Math.floor(Math.random() * gemsOfRarity.length)
  return gemsOfRarity[randomIndex]
}

// Helper function to calculate total bonuses from gems
export function calculateGemBonuses(gems) {
  const totalBonuses = {
    damage: 0,
    cooldown: 0,
    healthRegen: 0,
    manaRegen: 0,
    manaCost: 0
  }

  if (!gems || gems.length === 0) return totalBonuses

  gems.forEach(gemType => {
    if (!gemType) return // Skip empty sockets

    const gem = gemConfig[gemType]
    if (!gem || !gem.bonuses) return

    // Add each bonus from the gem
    Object.keys(gem.bonuses).forEach(bonusKey => {
      if (totalBonuses.hasOwnProperty(bonusKey)) {
        totalBonuses[bonusKey] += gem.bonuses[bonusKey]
      }
    })
  })

  return totalBonuses
}

export default gemConfig
