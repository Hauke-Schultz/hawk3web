// Weapon configuration for HawkDungeon

export const weaponConfig = {
  sword: {
    name: 'Sword',
    damage: 1,
    range: 1, // Tiles
    cooldown: 0.5, // Seconds
    icon: '⚔️',
    mana: {
      regenInterval: 15, // Seconds between mana regeneration
      chargedAttackCost: 1 // Mana cost for charged attack
    },
    health: {
      regenInterval: 15 // Seconds between health regeneration
    }
  },

  axe: {
    name: 'Axe',
    damage: 2,
    range: 1,
    cooldown: 0.5,
    icon: '🪓',
    mana: {
      regenInterval: 15,
      chargedAttackCost: 1
    },
    health: {
      regenInterval: 15
    }
  }
}

export const ATTACK_COOLDOWN = 0.5 // Default attack cooldown in seconds

export default weaponConfig