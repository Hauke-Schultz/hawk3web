// Central achievement configuration
export const achievementsConfig = {
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
			rewards: { coins: 15, diamonds: 0 },
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
			rewards: { coins: 15, diamonds: 0 },
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
			rewards: { coins: 15, diamonds: 0 },
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
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'memory', level: 3 }
		},
		{
			id: 'memory_master',
			name: 'Memory Master',
			description: 'Completed the hardest level',
			category: 'gaming',
			icon: 'brain',
			rarity: 'rare',
			rewards: { coins: 15, diamonds: 0 },
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
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 1 }
		},
		{
			id: 'fruitMerge_intermediate',
			name: 'Fruit Merger',
			description: 'Completed FruitMerge Level 3',
			category: 'gaming',
			icon: 'fruit-merge-game',
			rarity: 'uncommon',
			rewards: { coins: 15, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'fruitMerge', level: 3 }
		},
		{
			id: 'fruitMerge_expert',
			name: 'Merge Expert',
			description: 'Completed FruitMerge Level 5',
			category: 'gaming',
			icon: 'fruit-merge-game',
			rarity: 'epic',
			rewards: { coins: 15, diamonds: 0 },
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

// Helper functions
export const getAchievementById = (id) => {
	return achievementsConfig.definitions.find(achievement => achievement.id === id)
}

export const getAchievementsByCategory = (category) => {
	return achievementsConfig.definitions.filter(achievement => achievement.category === category)
}

export const getAchievementsByRarity = (rarity) => {
	return achievementsConfig.definitions.filter(achievement => achievement.rarity === rarity)
}

export const getAchievementsByTrigger = (triggerType) => {
	return achievementsConfig.definitions.filter(achievement => achievement.trigger.type === triggerType)
}

export const getTranslatedAchievement = (achievement, t) => {
	return {
		...achievement,
		name: t(`achievements.definitions.${achievement.id}.name`),
		description: t(`achievements.definitions.${achievement.id}.description`)
	}
}

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

export const getAchievementReward = (achievement) => {
	if (achievement.rewards) {
		return achievement.rewards
	}

	const rarityRewards = {
		common: { coins: 15, diamonds: 0 },
		uncommon: { coins: 35, diamonds: 1 },
		rare: { coins: 75, diamonds: 3 },
		epic: { coins: 150, diamonds: 8 },
		legendary: { coins: 300, diamonds: 20 }
	}

	return rarityRewards[achievement.rarity] || rarityRewards.common
}

export const calculateTotalAchievementValue = (achievements) => {
	return achievements.reduce((total, achievement) => {
		const reward = getAchievementReward(achievement)
		total.coins += reward.coins
		total.diamonds += reward.diamonds
		return total
	}, { coins: 0, diamonds: 0 })
}

export const getAchievementsByValue = (achievements, sortBy = 'coins') => {
	return [...achievements].sort((a, b) => {
		const rewardA = getAchievementReward(a)
		const rewardB = getAchievementReward(b)
		return rewardB[sortBy] - rewardA[sortBy]
	})
}

export const checkCardReadAchievement = (cardType, gameData) => {
	const cardAchievements = achievementsConfig.definitions.filter(
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