// Game configuration for Hawk Dungeon
export const hawkDungeonConfig = {
  gameIcon: 'sword',
  gameTitle: 'Hawk Dungeon',
  gameDescription: 'Fight through dungeon levels as a brave knight',

  levels: [
    {
      id: 1,
      name: 'Level 1',
      description: 'First steps into the dungeon',
      unlocked: true,
      enemyType: 'goblin',
      spawnRate: 5,
      maxEnemies: 5,
      killGoal: 50,
      rewards: {
        coins: 100,
        exp: 50
      }
    },
    {
      id: 2,
      name: 'Level 2',
      description: 'Deeper into darkness',
      unlocked: false,
      enemyType: 'goblin',
      spawnRate: 4,
      maxEnemies: 8,
      killGoal: 75,
      rewards: {
        coins: 150,
        exp: 75
      }
    },
    {
      id: 3,
      name: 'Level 3',
      description: 'The goblin horde',
      unlocked: false,
      enemyType: 'goblin',
      spawnRate: 3,
      maxEnemies: 12,
      killGoal: 100,
      rewards: {
        coins: 200,
        exp: 100
      }
    },
    {
      id: 4,
      name: 'Boss Fight',
      description: 'Face the Orc Warrior',
      unlocked: false,
      enemyType: 'boss',
      spawnRate: 2,
      maxEnemies: 15,
      killGoal: 1,
      hasBoss: true,
      rewards: {
        coins: 500,
        exp: 250
      }
    },
    {
      id: 5,
      name: 'Level 5',
      description: 'Veteran challenge',
      unlocked: false,
      enemyType: 'goblin',
      spawnRate: 1,
      maxEnemies: 20,
      killGoal: 150,
      rewards: {
        coins: 300,
        exp: 150
      }
    },
    {
      id: 6,
      name: 'Endless Mode',
      description: 'Survive as long as you can',
      unlocked: false,
      enemyType: 'goblin',
      spawnRate: 1,
      maxEnemies: 999,
      killGoal: 999999,
      endless: true,
      rewards: {
        coins: 0, // Dynamic based on performance
        exp: 0    // Dynamic based on performance
      }
    }
  ]
}

export default hawkDungeonConfig