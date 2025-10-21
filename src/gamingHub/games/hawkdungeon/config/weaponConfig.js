// Weapon configuration for HawkDungeon

export const weaponConfig = {
  sword: {
    name: 'Sword',
    damage: 1,
    range: 1, // Tiles
    cooldown: 0.5, // Seconds
    icon: '⚔️'
  },

  axe: {
    name: 'Axe',
    damage: 2,
    range: 1,
    cooldown: 0.5,
    icon: '🪓'
  }
}

export const ATTACK_COOLDOWN = 0.5 // Default attack cooldown in seconds

export default weaponConfig