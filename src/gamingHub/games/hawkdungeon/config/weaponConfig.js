// Weapon configuration for HawkDungeon

export const weaponConfig = {
  sword: {
    name: 'Sword',
    damage: 1,
    range: 1, // Tiles
    cooldown: 0.5, // Seconds
    icon: '⚔️',
    mana: {
      regenInterval: 10, // Seconds between mana regeneration
      chargedAttackCost: 1 // Mana cost for charged attack
    },
    health: {
      regenInterval: 10 // Seconds between health regeneration
    }
  },

  axe: {
    name: 'Axe',
    damage: 2,
    range: 1,
    cooldown: 0.8,
    icon: '🪓',
    mana: {
      regenInterval: 12,
      chargedAttackCost: 2
    },
    health: {
      regenInterval: 8
    }
  },

  spear: {
    name: 'Spear',
    damage: 2,
    range: 2, // Can attack 2 tiles away
    cooldown: 0.6,
    icon: '🗡️',
    mana: {
      regenInterval: 8,
      chargedAttackCost: 1
    },
    health: {
      regenInterval: 12
    }
  },
}

export const ATTACK_COOLDOWN = 0.5 // Default attack cooldown in seconds

export default weaponConfig