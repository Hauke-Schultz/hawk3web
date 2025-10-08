export const STACK_CONFIG = {
  // Canvas settings
  canvas: {
    baseWidth: 375,
    baseHeight: 667,
    blockStartY: 100, // Starting Y position for first block
    blockHeight: 40,  // Height of each block
    baseBlockWidth: 200, // Starting width of blocks
    minBlockWidth: 60  // Minimum block width after trimming
  },

  // Movement settings
  movement: {
    baseSpeed: 2,      // Base horizontal speed
    baseDistance: 150, // Base horizontal movement distance
    direction: 1       // 1 = right, -1 = left
  },

  // Gameplay constants
  gameplay: {
    perfectThreshold: 5,      // Pixel tolerance for "perfect" stack
    gameOverHeight: 600,      // Height at which to show game over warning
    comboMultiplier: 0.5,     // Score multiplier per combo level
    baseScore: 10,            // Base score per successful stack
    perfectBonus: 5           // Extra score for perfect stack
  },

  // Star rating thresholds (based on perfect stack percentage)
  starThresholds: {
    oneStar: 0,    // 0%+ perfect stacks
    twoStars: 60,  // 60%+ perfect stacks
    threeStars: 80 // 80%+ perfect stacks
  },

  // Level configurations
  levels: {
    1: {
      name: 'Level 1',
      targetHeight: 10,       // Stack 10 blocks to complete
      speedMultiplier: 1.0,   // Normal speed
      difficulty: 'easy'
    },
    2: {
      name: 'Level 2',
      targetHeight: 15,
      speedMultiplier: 1.2,
      difficulty: 'easy'
    },
    3: {
      name: 'Level 3',
      targetHeight: 20,
      speedMultiplier: 1.4,
      difficulty: 'medium'
    },
    4: {
      name: 'Level 4',
      targetHeight: 25,
      speedMultiplier: 1.6,
      difficulty: 'medium'
    },
    5: {
      name: 'Level 5',
      targetHeight: 30,
      speedMultiplier: 1.8,
      difficulty: 'hard'
    },
    6: {
      name: 'Level 6',
      targetHeight: Infinity,  // Endless mode
      speedMultiplier: 2.0,
      difficulty: 'endless',
      milestoneRewards: [10, 20, 30, 40, 50] // Reward at these heights
    }
  },

  // Block color progression
  colors: [
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#14B8A6', // Teal
    '#06B6D4', // Cyan
    '#0EA5E9', // Sky
    '#3B82F6', // Blue
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#A855F7', // Purple
    '#D946EF', // Fuchsia
    '#EC4899'  // Pink
  ],

  // Difficulty progression settings
  progression: {
    speedIncrease: 0.05,      // Speed increase per block
    maxSpeed: 6,              // Maximum speed cap
    widthDecrease: 2,         // Width decrease per milestone (optional)
    minWidth: 60,             // Minimum block width
    milestoneInterval: 10     // Apply difficulty increase every X blocks
  },

  // Endless mode specific settings
  endless: {
    startSpeed: 2.0,
    speedIncreaseRate: 0.03,  // Speed increase per block in endless
    milestoneBonus: 50,       // Bonus score at milestones
    heightWarning: 30         // Show warning after this height
  }
}

// Helper function to get level config
export const getLevelConfig = (levelNumber) => {
  return STACK_CONFIG.levels[levelNumber] || STACK_CONFIG.levels[1]
}

// Helper function to get color for current height
export const getColorForHeight = (height) => {
  const colorIndex = (height - 1) % STACK_CONFIG.colors.length
  return STACK_CONFIG.colors[colorIndex]
}

// Helper function to calculate speed for current block
export const calculateSpeed = (levelNumber, currentHeight) => {
  const levelConfig = getLevelConfig(levelNumber)
  const baseSpeed = STACK_CONFIG.movement.baseSpeed * levelConfig.speedMultiplier

  // Progressive speed increase
  const progressionBonus = Math.floor(currentHeight / STACK_CONFIG.progression.milestoneInterval)
      * STACK_CONFIG.progression.speedIncrease

  const finalSpeed = baseSpeed + progressionBonus
  return Math.min(finalSpeed, STACK_CONFIG.progression.maxSpeed)
}

// Helper function to calculate score
export const calculateScore = (isPerfect, comboLevel) => {
  const baseScore = STACK_CONFIG.gameplay.baseScore
  const perfectBonus = isPerfect ? STACK_CONFIG.gameplay.perfectBonus : 0
  const comboBonus = Math.floor(baseScore * comboLevel * STACK_CONFIG.gameplay.comboMultiplier)

  return baseScore + perfectBonus + comboBonus
}

// Helper function to determine star rating
export const getStarRating = (perfectPercent) => {
  if (perfectPercent >= STACK_CONFIG.starThresholds.threeStars) return 3
  if (perfectPercent >= STACK_CONFIG.starThresholds.twoStars) return 2
  return 1
}

export const stackMergeConfig = {
  gameId: 'stackMerge',
  gameTitle: 'StackMerge',
  gameDescription: 'Stack blocks to build the tallest tower!',
  gameIcon: 'stack',
  levels: Object.entries(STACK_CONFIG.levels).map(([levelNumber, level]) => ({
    level: parseInt(levelNumber),
    ...level
  }))
}