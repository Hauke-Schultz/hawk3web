// Memory Game Level Configurations
export const MEMORY_LEVELS = {
	1: {
		pairs: 2,
		timeBonus: 150,
		title: 'Starter',
		description: 'Match 2 pairs - Learn the basics',
		gridCols: 2,
		minHeight: 80,
		starThresholds: {
			1: { moves: 4 },
			2: { moves: 3 },
			3: { moves: 2 }
		}
	},
	2: {
		pairs: 6,
		timeBonus: 300,
		title: 'Easy',
		description: 'Match 6 pairs - Build your skills',
		gridCols: 3,
		minHeight: 60,
		starThresholds: {
			1: { moves: 20 },
			2: { moves: 16 },
			3: { moves: 12 }
		}
	},
	3: {
		pairs: 8,
		timeBonus: 400,
		title: 'Medium',
		description: 'Match 8 pairs - Test your memory',
		gridCols: 4,
		minHeight: 60,
		starThresholds: {
			1: { moves: 24 },
			2: { moves: 20 },
			3: { moves: 16 }
		}
	},
	4: {
		pairs: 10,
		timeBonus: 500,
		title: 'Hard',
		description: 'Match 10 pairs - Challenge yourself',
		gridCols: 4,
		minHeight: 60,
		starThresholds: {
			1: { moves: 32 },
			2: { moves: 28 },
			3: { moves: 24 }
		}
	},
	5: {
		pairs: 12,
		timeBonus: 600,
		title: 'Expert',
		description: 'Match 12 pairs - Expert level',
		gridCols: 4,
		minHeight: 60,
		starThresholds: {
			1: { moves: 42 },
			2: { moves: 36 },
			3: { moves: 30 }
		}
	},
	6: {
		pairs: 18,
		timeBonus: 750,
		title: 'Master',
		description: 'Match 18 pairs - Master challenge',
		gridCols: 4,
		minHeight: 60,
		starThresholds: {
			1: { moves: 72 },
			2: { moves: 62 },
			3: { moves: 52 }
		}
	}
}

export const memoryConfig = {
	// Game metadata
	gameId: 'memory',
	gameTitle: 'Memory Game',
	gameDescription: 'Match pairs of cards and test your memory',
	gameIcon: 'brain',

	// Level configurations (converted to array for backward compatibility)
	levels: Object.values(MEMORY_LEVELS).map((level, index) => ({
		level: index + 1,
		...level
	})),

	// Card symbols for the memory game
	cardSymbols: [
		'🎮', '🏆', '⭐', '🎯', '🚀', '💎',
		'🔥', '⚡', '🎨', '🎵', '🌟', '💫',
		'🎪', '🎭', '🎺', '🎸', '🎤', '🎲',
		'🏅', '🎖️', '🏆', '👑', '💰', '🎁'
	],

	// Scoring system
	scoring: {
		baseScore: 100, // Points per match
		moveBonus: 10,  // Bonus points for efficient moves
		perfectMoveMultiplier: 2, // Multiplier for perfect games

		// Star rating thresholds (percentage of max possible score)
		starThresholds: {
			threeStar: 90,  // 90%+ for 3 stars
			twoStar: 70,    // 70%+ for 2 stars
			oneStar: 1      // Just completion for 1 star
		}
	},

	// Game settings
	settings: {
		flipDuration: 1000,     // Time cards stay flipped for comparison (ms)
		maxFlippedCards: 2,     // Maximum cards that can be flipped at once
		autoLockTimeout: 10000, // Auto-lock delete button after 10 seconds
	},

	// Grid configurations
	gridConfigs: {
		2: { cols: 2 },
		3: { cols: 3 },
		4: { cols: 4 }
	},
}

// Helper functions
export const getMemoryLevel = (levelNumber) => {
	return MEMORY_LEVELS[levelNumber] || MEMORY_LEVELS[1]
}

export const calculateMaxPossibleScore = (levelConfig, actualTime = 0, actualMoves = 0) => {
	const baseScore = levelConfig.pairs * memoryConfig.scoring.baseScore
	const perfectMoves = levelConfig.pairs
	const moveBonus = perfectMoves * memoryConfig.scoring.moveBonus
	const timeBonus = levelConfig.timeBonus

	return baseScore + moveBonus + timeBonus
}

export const calculateStars = (score, time, moves, levelNumber) => {
	const levelConfig = MEMORY_LEVELS[levelNumber]
	if (!levelConfig) return 0

	const thresholds = levelConfig.starThresholds

	// Check for 3 stars first (most demanding)
	if (score >= thresholds[3].score &&
		time <= thresholds[3].time &&
		moves <= thresholds[3].moves) {
		return 3
	}

	// Check for 2 stars
	if (score >= thresholds[2].score &&
		time <= thresholds[2].time &&
		moves <= thresholds[2].moves) {
		return 2
	}

	// Check for 1 star (basic completion)
	if (score >= thresholds[1].score) {
		return 1
	}

	return 0
}

export const getGridConfig = (pairs) => {
	if (pairs <= 2) return memoryConfig.gridConfigs[2]
	if (pairs <= 6) return memoryConfig.gridConfigs[3]
	return memoryConfig.gridConfigs[4]
}