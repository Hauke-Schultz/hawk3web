// Monster configuration for HawkDungeon

export const monsterConfig = {
  goblin: {
    type: 'goblin',
    width: 16,
    height: 24,
    health: 2,
    damage: 1,
    moveSpeed: 0.5, // Tiles per second
    attackCheckInterval: 0.5, // Check every 500ms if monster should attack
    attackChance: 0.2, // 20% chance to attack on each check
    lootCoins: 5,
    lootDropChance: {
      heart: 0.9, // 30% chance
      manaPotion: 0.1 // 10% chance
    }
  },

  boss: {
    type: 'boss',
    width: 32,
    height: 32,
    health: 15,
    damage: 3,
    moveSpeed: 0.5, // Slower than goblins
    attackCheckInterval: 0.5, // Check every 500ms if monster should attack
    attackChance: 0.6, // 60% chance to attack on each check (more aggressive)
    lootCoins: 100,
    lootDropChance: {
      heart: 0.8, // 80% chance
      manaPotion: 0.5 // 50% chance
    }
  }
}

export default monsterConfig