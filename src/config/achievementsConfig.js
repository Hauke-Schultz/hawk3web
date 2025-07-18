// Central achievement configuration
export const ACHIEVEMENTS = {
	// All possible achievements with their definitions
	definitions: [
		// General achievements
		{
			id: 'welcome_card_read',
			name: 'Welcome to Hawk3',
			description: 'Started your gaming journey',
			category: 'general',
			icon: 'user',
			rarity: 'common',
			rewards: { coins: 100, diamonds: 1 },
			trigger: { type: 'card_read', cardType: 'welcomeCard' }
		},
		{
			id: 'first_game',
			name: 'First Game',
			description: 'Played your first game',
			category: 'gaming',
			icon: 'play',
			rarity: 'common',
			rewards: { coins: 17, diamonds: 0 },
			trigger: { type: 'auto', condition: 'gamesPlayed >= 1' }
		},

		// Level-based achievements
		{
			id: 'level_5',
			name: 'Rising Star',
			description: 'Reached level 5',
			category: 'progress',
			icon: 'trophy',
			rarity: 'common',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'auto', condition: 'level >= 5' }
		},
		{
			id: 'level_10',
			name: 'Dedicated Player',
			description: 'Reached level 10',
			category: 'progress',
			icon: 'trophy',
			rarity: 'uncommon',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'auto', condition: 'level >= 10' }
		},
		{
			id: 'level_15',
			name: 'Gaming Expert',
			description: 'Reached level 15',
			category: 'progress',
			icon: 'trophy',
			rarity: 'rare',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'auto', condition: 'level >= 15' }
		},

		// Score-based achievements
		{
			id: 'score_1000',
			name: 'Score Hunter',
			description: 'Earned 1000 total points',
			category: 'gaming',
			icon: 'trophy',
			rarity: 'uncommon',
			rewards: { coins: 150, diamonds: 1 },
			trigger: { type: 'auto', condition: 'totalScore >= 1000' }
		},

		// Games played achievements
		{
			id: 'games_10',
			name: 'Game Enthusiast',
			description: 'Played 10 games',
			category: 'gaming',
			icon: 'play',
			rarity: 'uncommon',
			rewards: { coins: 10, diamonds: 10 },
			trigger: { type: 'auto', condition: 'gamesPlayed >= 10' }
		},

		// Memory Game specific achievements
		{
			id: 'memory_beginner',
			name: 'Memory Beginner',
			description: 'Completed first memory level',
			category: 'gaming',
			icon: 'brain',
			rarity: 'common',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'memory', level: 1 }
		},
		{
			id: 'memory_intermediate',
			name: 'Memory Intermediate',
			description: 'Completed level 3',
			category: 'gaming',
			icon: 'brain',
			rarity: 'uncommon',
			rewards: { coins: 150, diamonds: 1 },
			trigger: { type: 'level_complete', game: 'memory', level: 3 }
		},
		{
			id: 'memory_master',
			name: 'Memory Master',
			description: 'Completed the hardest level',
			category: 'gaming',
			icon: 'brain',
			rarity: 'rare',
			rewards: { coins: 1500, diamonds: 10 },
			trigger: { type: 'level_complete', game: 'memory', level: 6 }
		},

		// FruitMerge specific achievements
		{
			id: 'fruitMerge_beginner',
			name: 'Fruit Beginner',
			description: 'Completed first fruitMerge level',
			category: 'gaming',
			icon: 'fruit-merge-game',
			rarity: 'common',
			rewards: { coins: 20, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 1 }
		},
		{
			id: 'fruitMerge_intermediate',
			name: 'Fruit Merger',
			description: 'Completed FruitMerge Level 3',
			category: 'gaming',
			icon: 'fruit-merge-game',
			rarity: 'uncommon',
			rewards: { coins: 200, diamonds: 2 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 3 }
		},
		{
			id: 'fruitMerge_expert',
			name: 'Merge Expert',
			description: 'Completed FruitMerge Level 5',
			category: 'gaming',
			icon: 'fruit-merge-game',
			rarity: 'epic',
			rewards: { coins: 2000, diamonds: 10 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 5 }
		},
		{
			id: 'fruitMerge_master',
			name: 'Merge Master',
			description: 'Completed the ultimate FruitMerge challenge',
			category: 'special',
			icon: 'fruit-merge-game',
			rarity: 'legendary',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 5 }
		},

		// Special achievements
		{
			id: 'perfectionist',
			name: 'Perfectionist',
			description: 'Complete a game with perfect score',
			category: 'special',
			icon: 'trophy',
			rarity: 'legendary',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'perfect_game' }
		},
	],

	// Achievement categories
	categories: [
		{
			id: 'general',
			name: 'General',
			color: 'primary',
			description: 'Basic achievements for getting started'
		},
		{
			id: 'gaming',
			name: 'Gaming',
			color: 'success',
			description: 'Achievements related to playing games'
		},
		{
			id: 'progress',
			name: 'Progress',
			color: 'warning',
			description: 'Level and progression achievements'
		},
		{
			id: 'special',
			name: 'Special',
			color: 'info',
			description: 'Rare and special achievements'
		}
	],

	// Rarity definitions
	rarities: {
		common: {
			name: 'Common',
			color: '#6B7280',
			multiplier: 1
		},
		uncommon: {
			name: 'Uncommon',
			color: '#10B981',
			multiplier: 1.5
		},
		rare: {
			name: 'Rare',
			color: '#4F46E5',
			multiplier: 2
		},
		epic: {
			name: 'Epic',
			color: '#F59E0B',
			multiplier: 3
		},
		legendary: {
			name: 'Legendary',
			color: 'linear-gradient(45deg, #ff6b6b, #ffd93d)',
			multiplier: 5
		}
	}
}

export const REWARDS = {
	levelCompletion: {
		base: { coins: 20, diamonds: 0 },      // Base reward for any completion
		firstTime: { coins: 50, diamonds: 2 }, // Bonus for first-time completion
		stars: {
			1: { coins: 10, diamonds: 0 },      // 1 star bonus
			2: { coins: 30, diamonds: 1 },      // 2 star bonus
			3: { coins: 75, diamonds: 3 }       // 3 star bonus (perfect)
		},
		perfectBonus: 0.5,  // 50% extra coins for 3-star performance
		levelMultiplier: {   // Multiplier based on level difficulty
			easy: 1,      // Levels 1-3
			medium: 1.5,  // Levels 4-6
			hard: 2       // Levels 7+
		}
	},
	combos: {
		base: 5, // coins per combo hit
		multiplier: 1.2, // increases per combo level
		diamondThreshold: 10 // diamonds earned at combo 10+
	},
	dailyRewards: {
		base: { coins: 50, diamonds: 1 },
		streakMultiplier: 1.1, // increases with streak
		maxStreak: 7
	}
}

// Helper functions
export const checkAchievementCondition = (achievement, playerData) => {
	if (achievement.trigger.type === 'auto') {
		const condition = achievement.trigger.condition

		// Parse and evaluate condition
		if (condition === 'default') return true

		// Replace placeholders with actual values
		const evaluatedCondition = condition
			.replace('gamesPlayed', playerData.gamesPlayed)
			.replace('level', playerData.level)
			.replace('totalScore', playerData.totalScore)

		try {
			return eval(evaluatedCondition)
		} catch (error) {
			console.warn(`Error evaluating achievement condition: ${condition}`, error)
			return false
		}
	}

	return false
}

export const checkCardReadAchievement = (cardType, gameData) => {
	const cardAchievements = ACHIEVEMENTS.definitions.filter(
		achievement =>
			achievement.trigger.type === 'card_read' &&
			achievement.trigger.cardType === cardType
	)

	return cardAchievements.filter(achievement => {
		// Check if already earned
		const alreadyEarned = gameData.achievements.some(a => a.id === achievement.id && a.earned)
		return !alreadyEarned
	})
}