// Level configuration for HawkDungeon

export const levelConfig = {
  1: {
    level: 1,
    enemyType: 'goblin',
    spawnRate: 5, // Seconds between spawns
    maxEnemies: 5,
    killGoal: 50,
    hasBoss: false,
    timeLimit: 120 // 2 minutes
  },

  2: {
    level: 2,
    enemyType: 'goblin',
    spawnRate: 4,
    maxEnemies: 8,
    killGoal: 75,
    hasBoss: false,
    timeLimit: 120
  },

  3: {
    level: 3,
    enemyType: 'goblin',
    spawnRate: 3,
    maxEnemies: 12,
    killGoal: 100,
    hasBoss: false,
    timeLimit: 150 // 2:30
  },

  4: {
    level: 4,
    enemyType: 'goblin',
    spawnRate: 2,
    maxEnemies: 15,
    killGoal: 1, // Just defeat the boss
    hasBoss: true,
    bossHealth: 15,
    timeLimit: 180 // 3 minutes
  },

  5: {
    level: 5,
    enemyType: 'goblin',
    spawnRate: 1,
    maxEnemies: 20,
    killGoal: 150,
    hasBoss: false,
    timeLimit: 180
  },

  6: {
    level: 6,
    enemyType: 'goblin',
    spawnRate: 1, // Scaling spawn rate
    maxEnemies: 999, // Unlimited
    killGoal: 999999, // Endless mode
    hasBoss: false,
    timeLimit: null, // No time limit
    endless: true,
    difficultyScaling: {
      spawnRateDecrease: 0.1, // Decrease by 0.1s every interval
      healthIncrease: 0.1, // +10% health every interval
      damageIncrease: 0.1, // +10% damage every interval
      scalingInterval: 30 // Scale every 30 seconds
    }
  }
}

export default levelConfig