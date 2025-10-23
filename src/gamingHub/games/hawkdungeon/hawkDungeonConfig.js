// Game configuration for Hawk Dungeon
export const DUNGEON_CONFIG = {
  // Canvas settings
  canvas: {
    baseWidth: 375,
    baseHeight: 667,
    playerStartY: 500,
    playerSize: 40,
    enemySize: 40
  },

  // Player settings
  player: {
    baseHealth: 100,
    baseDamage: 10,
    attackCooldown: 500, // milliseconds
    moveSpeed: 5
  },

  // Enemy settings
  enemy: {
    goblin: {
      health: 30,
      damage: 5,
      moveSpeed: 2,
      attackRange: 50,
      attackCooldown: 1000,
      scoreValue: 10
    },
    boss: {
      health: 500,
      damage: 20,
      moveSpeed: 1.5,
      attackRange: 60,
      attackCooldown: 800,
      scoreValue: 1000
    }
  },

  // Gameplay constants
  gameplay: {
    spawnPadding: 50,        // Minimum distance from player when spawning
    maxSpawnAttempts: 10,    // Max attempts to find valid spawn position
    baseScore: 10,           // Base score per kill
    killComboTime: 3000,     // Time window for kill combo (ms)
    comboMultiplier: 0.5     // Score multiplier per combo level
  },

  // Star rating thresholds (based on kills without taking damage)
  starThresholds: {
    oneStar: 0,      // Complete the level
    twoStars: 50,    // Complete with 50%+ health remaining
    threeStars: 80   // Complete with 80%+ health remaining
  },

  // Level configurations
  levels: {
    1: {
      name: 'Level 1',
      description: 'First steps into the dungeon',
      enemyType: 'goblin',
      spawnRate: 5,
      maxEnemies: 5,
      killGoal: 5,
      difficulty: 'easy',
      rewards: {
        coins: 100,
        exp: 50
      }
    },
    2: {
      name: 'Level 2',
      description: 'Deeper into darkness',
      enemyType: 'goblin',
      spawnRate: 4,
      maxEnemies: 8,
      killGoal: 75,
      difficulty: 'medium',
      rewards: {
        coins: 150,
        exp: 75
      }
    },
    3: {
      name: 'Level 3',
      description: 'The goblin horde',
      enemyType: 'goblin',
      spawnRate: 3,
      maxEnemies: 12,
      killGoal: 100,
      difficulty: 'medium',
      rewards: {
        coins: 200,
        exp: 100
      }
    },
    4: {
      name: 'Boss Fight',
      description: 'Face the Orc Warrior',
      enemyType: 'boss',
      spawnRate: 2,
      maxEnemies: 15,
      killGoal: 1,
      hasBoss: true,
      difficulty: 'boss',
      rewards: {
        coins: 500,
        exp: 250
      }
    },
    5: {
      name: 'Level 5',
      description: 'Veteran challenge',
      enemyType: 'goblin',
      spawnRate: 1,
      maxEnemies: 20,
      killGoal: 150,
      difficulty: 'hard',
      rewards: {
        coins: 300,
        exp: 150
      }
    },
    6: {
      name: 'Endless Mode',
      description: 'Survive as long as you can',
      enemyType: 'goblin',
      spawnRate: 1,
      maxEnemies: 999,
      killGoal: Infinity,
      endless: true,
      difficulty: 'endless',
      milestoneRewards: [50, 100, 150, 200, 250, 300], // Rewards at these kill counts
      starSystem: {
        maxKills: 300,
        progressPerKill: 1
      },
      rewards: {
        coins: 0, // Dynamic based on performance
        exp: 0    // Dynamic based on performance
      }
    }
  },

  // Difficulty progression settings
  progression: {
    healthIncrease: 5,        // Enemy health increase per milestone
    damageIncrease: 1,        // Enemy damage increase per milestone
    spawnRateDecrease: 0.1,   // Spawn rate decrease (faster spawns)
    milestoneInterval: 50     // Apply difficulty increase every X kills
  },

  // Endless mode specific settings
  endless: {
    startDifficulty: 1.5,
    difficultyIncreaseRate: 0.05, // Difficulty increase per kill
    milestoneBonus: 100,          // Bonus score at milestones
    healthWarning: 30             // Show warning below this health %
  }
}

// Helper function to get level config
export const getLevelConfig = (levelNumber) => {
  return DUNGEON_CONFIG.levels[levelNumber] || DUNGEON_CONFIG.levels[1]
}

// Helper function to get enemy config
export const getEnemyConfig = (enemyType) => {
  return DUNGEON_CONFIG.enemy[enemyType] || DUNGEON_CONFIG.enemy.goblin
}

// Helper function to calculate enemy stats based on progression
export const calculateEnemyStats = (levelNumber, currentKills) => {
  const levelConfig = getLevelConfig(levelNumber)
  const baseEnemy = getEnemyConfig(levelConfig.enemyType)

  const progressionBonus = Math.floor(currentKills / DUNGEON_CONFIG.progression.milestoneInterval)

  return {
    health: baseEnemy.health + (progressionBonus * DUNGEON_CONFIG.progression.healthIncrease),
    damage: baseEnemy.damage + (progressionBonus * DUNGEON_CONFIG.progression.damageIncrease),
    moveSpeed: baseEnemy.moveSpeed,
    attackRange: baseEnemy.attackRange,
    attackCooldown: baseEnemy.attackCooldown,
    scoreValue: baseEnemy.scoreValue
  }
}

// Helper function to calculate score
export const calculateScore = (enemyType, comboLevel) => {
  const baseScore = getEnemyConfig(enemyType).scoreValue
  const comboBonus = Math.floor(baseScore * comboLevel * DUNGEON_CONFIG.gameplay.comboMultiplier)

  return baseScore + comboBonus
}

// Helper function to determine star rating based on health remaining
export const getStarRating = (healthPercent) => {
  if (healthPercent >= DUNGEON_CONFIG.starThresholds.threeStars) return 3
  if (healthPercent >= DUNGEON_CONFIG.starThresholds.twoStars) return 2
  return 1
}

export const hawkDungeonConfig = {
  gameId: 'hawkDungeon',
  gameTitle: 'Hawk Dungeon',
  gameDescription: 'Fight through dungeon levels as a brave knight',
  gameIcon: 'hawk-dungeon',
  levels: Object.entries(DUNGEON_CONFIG.levels).map(([levelNumber, level]) => ({
    id: parseInt(levelNumber),
    ...level
  }))
}