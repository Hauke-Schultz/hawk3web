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
		/*
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
		}, */

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
			category: 'memory',
			icon: 'brain',
			rarity: 'common',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'memory', level: 1 }
		},
		{
			id: 'memory_intermediate',
			name: 'Memory Intermediate',
			description: 'Completed level 3',
			category: 'memory',
			icon: 'brain',
			rarity: 'uncommon',
			rewards: { coins: 150, diamonds: 1 },
			trigger: { type: 'level_complete', game: 'memory', level: 3 }
		},
		{
			id: 'memory_master',
			name: 'Memory Master',
			description: 'Completed the hardest level',
			category: 'memory',
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
			category: 'fruitMerge',
			icon: 'fruit-merge-game',
			rarity: 'common',
			rewards: { coins: 20, diamonds: 1 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 1 }
		},
		{
			id: 'fruitMerge_intermediate',
			name: 'Fruit Merger',
			description: 'Completed FruitMerge Level 3',
			category: 'fruitMerge',
			icon: 'fruit-merge-game',
			rarity: 'uncommon',
			rewards: { coins: 200, diamonds: 2 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 3 }
		},
		{
			id: 'fruitMerge_expert',
			name: 'Merge Expert',
			description: 'Completed FruitMerge Level 5',
			category: 'fruitMerge',
			icon: 'fruit-merge-game',
			rarity: 'epic',
			rewards: { coins: 2000, diamonds: 10 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 5 }
		},
		{
			id: 'fruitMerge_master',
			name: 'Merge Master',
			description: 'Completed the ultimate FruitMerge challenge',
			category: 'fruitMerge',
			icon: 'fruit-merge-game',
			rarity: 'legendary',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 5 }
		},
		{
			id: 'endless_first_play',
			name: 'Endless Explorer',
			description: 'Played your first endless game',
			category: 'fruitMerge',
			icon: 'fruit-merge-game',
			rarity: 'common',
			rewards: { coins: 100, diamonds: 1 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 6 }
		},
		{
			id: 'endless_bronze',
			name: 'Bronze Merger',
			description: 'Earned 1 star in endless mode',
			category: 'fruitMerge',
			icon: 'star',
			rarity: 'uncommon',
			rewards: { coins: 200, diamonds: 2 },
			trigger: { type: 'endless_stars', stars: 1 }
		},
		{
			id: 'endless_silver',
			name: 'Silver Merger',
			description: 'Earned 2 stars in endless mode',
			category: 'fruitMerge',
			icon: 'star-filled',
			rarity: 'rare',
			rewards: { coins: 500, diamonds: 5 },
			trigger: { type: 'endless_stars', stars: 2 }
		},
		{
			id: 'endless_gold',
			name: 'Gold Merger',
			description: 'Earned 3 stars in endless mode',
			category: 'fruitMerge',
			icon: 'trophy',
			rarity: 'epic',
			rewards: { coins: 1000, diamonds: 10 },
			trigger: { type: 'endless_stars', stars: 3 }
		},
		{
			id: 'endless_marathon',
			name: 'Marathon Merger',
			description: 'Played endless mode for 30 minutes',
			category: 'fruitMerge',
			icon: 'trophy',
			rarity: 'epic',
			rewards: { coins: 1500, diamonds: 15 },
			trigger: { type: 'endless_time', minutes: 30 }
		},
		{
			id: 'endless_merge_master',
			name: 'Merge Master',
			description: 'Performed 500 merges in endless mode',
			category: 'fruitMerge',
			icon: 'fruit-merge-game',
			rarity: 'legendary',
			rewards: { coins: 2000, diamonds: 20 },
			trigger: { type: 'endless_merges', count: 500 }
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
			id: 'memory',
			name: 'Memory Game',
			color: 'purple',
			description: 'Achievements for the Memory Game'
		},
		{
			id: 'fruitMerge',
			name: 'Fruit Merge Game',
			color: 'orange',
			description: 'Achievements for the Fruit Merge Game'
		},
		{
			id: 'special',
			name: 'Special',
			color: 'info',
			description: 'Rare and special achievements'
		},
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
		base: { coins: 25, diamonds: 0 },      // Base reward for any completion
		firstTime: { coins: 75, diamonds: 2 }, // Bonus for first-time completion
		stars: {
			1: { coins: 15, diamonds: 0 },      // 1 star bonus
			2: { coins: 35, diamonds: 1 },      // 2 star bonus
			3: { coins: 60, diamonds: 2 }       // 3 star bonus (perfect)
		},
		perfectBonus: 0.5,  // 50% extra coins for 3-star performance
		levelMultiplier: {   // Multiplier based on level difficulty
			easy: 1,      // Levels 1-2
			medium: 1.5,  // Levels 3-4
			hard: 2.5     // Levels 5+
		}
	},
	combos: {
		base: 8, // coins per combo hit
		multiplier: 1.3, // increases per combo level
		diamondThreshold: 8, // diamonds earned at combo 8+
		maxReward: 50 // maximum coins per combo
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