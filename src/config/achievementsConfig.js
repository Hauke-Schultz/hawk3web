// Central achievement configuration
export const achievementsConfig = {
	// All possible achievements with their definitions
	definitions: [
		// General achievements
		{
			id: 'welcome',
			name: 'Welcome to Hawk3',
			description: 'Started your gaming journey',
			category: 'general',
			icon: 'user',
			rarity: 'common',
			trigger: { type: 'auto', condition: 'default' }
		},
		{
			id: 'first_game',
			name: 'First Game',
			description: 'Played your first game',
			category: 'gaming',
			icon: 'play',
			rarity: 'common',
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
			trigger: { type: 'auto', condition: 'level >= 5' }
		},
		{
			id: 'level_10',
			name: 'Dedicated Player',
			description: 'Reached level 10',
			category: 'progress',
			icon: 'trophy',
			rarity: 'uncommon',
			trigger: { type: 'auto', condition: 'level >= 10' }
		},
		{
			id: 'level_15',
			name: 'Gaming Expert',
			description: 'Reached level 15',
			category: 'progress',
			icon: 'trophy',
			rarity: 'rare',
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
			trigger: { type: 'level_complete', game: 'memory', level: 1 }
		},
		{
			id: 'memory_intermediate',
			name: 'Memory Intermediate',
			description: 'Completed level 3',
			category: 'gaming',
			icon: 'brain',
			rarity: 'uncommon',
			trigger: { type: 'level_complete', game: 'memory', level: 3 }
		},
		{
			id: 'memory_master',
			name: 'Memory Master',
			description: 'Completed the hardest level',
			category: 'gaming',
			icon: 'brain',
			rarity: 'rare',
			trigger: { type: 'level_complete', game: 'memory', level: 6 }
		},

		// Special achievements
		{
			id: 'perfectionist',
			name: 'Perfectionist',
			description: 'Complete a game with perfect score',
			category: 'special',
			icon: 'trophy',
			rarity: 'legendary',
			trigger: { type: 'perfect_game' }
		}
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