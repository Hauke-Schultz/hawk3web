// Game configuration for Hawk Dungeon
// NOTE: Level configurations are now in config/levelConfig.js
import { levelConfig } from './config/levelConfig.js'

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

// Helper function to get level config (now from levelConfig.js)
export const getLevelConfig = (levelNumber) => {
  return levelConfig[levelNumber] || levelConfig[1]
}

// Helper function to get enemy config
export const getEnemyConfig = (enemyType) => {
  return DUNGEON_CONFIG.enemy[enemyType] || DUNGEON_CONFIG.enemy.goblin
}

// Helper function to calculate enemy stats based on progression
export const calculateEnemyStats = (levelNumber, currentKills) => {
  const level = getLevelConfig(levelNumber)
  const baseEnemy = getEnemyConfig(level.enemyType)

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

// Game metadata for UI
export const hawkDungeonConfig = {
  gameId: 'hawkDungeon',
  gameTitle: 'Hawk Dungeon',
  gameDescription: 'Fight through dungeon levels as a brave knight',
  gameIcon: 'hawk-dungeon',
  levels: Object.entries(levelConfig).map(([levelNumber, level]) => ({
    id: parseInt(levelNumber),
    ...level
  }))
}