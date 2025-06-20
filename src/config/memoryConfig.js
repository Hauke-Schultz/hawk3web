export const memoryConfig = {
	// Game metadata
	gameId: 'memory',
	gameTitle: 'Memory Game',
	gameDescription: 'Match pairs of cards and test your memory',
	gameIcon: 'brain',

	// Level configurations
	levels: [
		{
			level: 1,
			pairs: 2,
			timeBonus: 150,
			title: 'Starter',
			description: 'Match 2 pairs - Learn the basics',
			gridCols: 2,
			minHeight: 80
		},
		{
			level: 2,
			pairs: 6,
			timeBonus: 300,
			title: 'Easy',
			description: 'Match 6 pairs - Build your skills',
			gridCols: 3,
			minHeight: 60
		},
		{
			level: 3,
			pairs: 8,
			timeBonus: 400,
			title: 'Medium',
			description: 'Match 8 pairs - Test your memory',
			gridCols: 4,
			minHeight: 60
		},
		{
			level: 4,
			pairs: 10,
			timeBonus: 500,
			title: 'Hard',
			description: 'Match 10 pairs - Challenge yourself',
			gridCols: 4,
			minHeight: 60
		},
		{
			level: 5,
			pairs: 12,
			timeBonus: 600,
			title: 'Expert',
			description: 'Match 12 pairs - Expert level',
			gridCols: 4,
			minHeight: 60
		},
		{
			level: 6,
			pairs: 18,
			timeBonus: 750,
			title: 'Master',
			description: 'Match 18 pairs - Master challenge',
			gridCols: 4,
			minHeight: 60
		}
	],

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

	// Achievement configurations related to memory game
	achievements: [
		{
			id: 'memory_beginner',
			name: 'Memory Beginner',
			description: 'Completed first memory level',
			category: 'gaming',
			icon: 'brain',
			rarity: 'common',
			trigger: { type: 'level_complete', level: 1 }
		},
		{
			id: 'memory_intermediate',
			name: 'Memory Intermediate',
			description: 'Completed level 3',
			category: 'gaming',
			icon: 'brain',
			rarity: 'uncommon',
			trigger: { type: 'level_complete', level: 3 }
		},
		{
			id: 'memory_master',
			name: 'Memory Master',
			description: 'Completed the hardest level',
			category: 'gaming',
			icon: 'brain',
			rarity: 'rare',
			trigger: { type: 'level_complete', level: 6 }
		},
		{
			id: 'perfectionist',
			name: 'Perfectionist',
			description: 'Complete a game with perfect score',
			category: 'special',
			icon: 'trophy',
			rarity: 'legendary',
			trigger: { type: 'perfect_game' }
		}
	]
}

// Helper functions
export const getMemoryLevel = (levelNumber) => {
	return memoryConfig.levels.find(level => level.level === levelNumber) || memoryConfig.levels[0]
}

export const getMaxMemoryLevel = () => {
	return memoryConfig.levels.length
}

export const calculateMaxPossibleScore = (levelConfig, actualTime = 0, actualMoves = 0) => {
	const baseScore = levelConfig.pairs * memoryConfig.scoring.baseScore
	const perfectMoves = levelConfig.pairs
	const moveBonus = perfectMoves * memoryConfig.scoring.moveBonus
	const timeBonus = levelConfig.timeBonus

	return baseScore + moveBonus + timeBonus
}

export const calculateStars = (score, levelConfig) => {
	const maxScore = calculateMaxPossibleScore(levelConfig)
	const percentage = (score / maxScore) * 100

	if (percentage >= memoryConfig.scoring.starThresholds.threeStar) return 3
	if (percentage >= memoryConfig.scoring.starThresholds.twoStar) return 2
	if (percentage >= memoryConfig.scoring.starThresholds.oneStar) return 1
	return 0
}

export const getGridConfig = (pairs) => {
	if (pairs <= 2) return memoryConfig.gridConfigs[2]
	if (pairs <= 6) return memoryConfig.gridConfigs[3]
	return memoryConfig.gridConfigs[4]
}