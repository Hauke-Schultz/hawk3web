// Monster configuration for HawkDungeon

export const monsterConfig = {
  goblin: {
    type: 'goblin',
    width: 16,
    height: 32,
    health: 2,
    damage: 1,
    moveSpeed: 1, // Tiles per second
    lootCoins: 5,
    lootDropChance: {
      heart: 0.3, // 30% chance
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
    lootCoins: 100,
    lootDropChance: {
      heart: 0.8, // 80% chance
      manaPotion: 0.5 // 50% chance
    }
  }
}

export default monsterConfig