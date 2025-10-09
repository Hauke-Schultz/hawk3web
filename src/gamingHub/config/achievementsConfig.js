// Central achievement configuration
export const ACHIEVEMENTS = {
	// All possible achievements with their definitions
	definitions: [
		// General achievements
		{
			id: 'first_game',
			name: 'First Game',
			description: 'Played your first game',
			category: 'general',
			icon: 'play',
			rarity: 'common',
			rewards: { coins: 100, diamonds: 1 },
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
			rewards: { coins: 1000, diamonds: 10 },
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
			rewards: { coins: 150, diamonds: 0 },
			trigger: { type: 'level_complete', game: 'memory', level: 1 }
		},
		{
			id: 'memory_intermediate',
			name: 'Memory Intermediate',
			description: 'Completed level 3',
			category: 'memory',
			icon: 'brain',
			rarity: 'uncommon',
			rewards: { coins: 500, diamonds: 1 },
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

		// HawkFruit specific achievements
		{
			id: 'hawkFruit_beginner',
			name: 'Fruit Beginner',
			description: 'Completed first hawkFruit level',
			category: 'hawkFruit',
			icon: 'fruit-merge-game',
			rarity: 'common',
			rewards: { coins: 100, diamonds: 1 },
			trigger: { type: 'level_complete', game: 'hawkFruit', level: 1 }
		},
		{
			id: 'hawkFruit_intermediate',
			name: 'Hawk Fruitr',
			description: 'Completed HawkFruit Level 3',
			category: 'hawkFruit',
			icon: 'fruit-merge-game',
			rarity: 'uncommon',
			rewards: { coins: 200, diamonds: 2 },
			trigger: { type: 'level_complete', game: 'hawkFruit', level: 3 }
		},
		{
			id: 'hawkFruit_expert',
			name: 'Merge Expert',
			description: 'Completed HawkFruit Level 5',
			category: 'hawkFruit',
			icon: 'fruit-merge-game',
			rarity: 'epic',
			rewards: { coins: 2000, diamonds: 10 },
			trigger: { type: 'level_complete', game: 'hawkFruit', level: 5 }
		},
		{
			id: 'hawkFruit_master',
			name: 'Merge Master',
			description: 'Completed the ultimate HawkFruit challenge',
			category: 'hawkFruit',
			icon: 'fruit-merge-game',
			rarity: 'legendary',
			rewards: { coins: 5000, diamonds: 20 },
			trigger: { type: 'level_complete', game: 'hawkFruit', level: 5 }
		},
		{
			id: 'endless_first_play',
			name: 'Endless Explorer',
			description: 'Played your first endless game',
			category: 'hawkFruit',
			icon: 'fruit-merge-game',
			rarity: 'common',
			rewards: { coins: 1000, diamonds: 10 },
			trigger: { type: 'level_complete', game: 'hawkFruit', level: 6 }
		},
		{
			id: 'endless_bronze',
			name: 'Bronze Merger',
			description: 'Earned 1 star in endless mode',
			category: 'hawkFruit',
			icon: 'star',
			rarity: 'uncommon',
			rewards: { coins: 200, diamonds: 2 },
			trigger: { type: 'endless_stars', stars: 1 }
		},
		{
			id: 'endless_silver',
			name: 'Silver Merger',
			description: 'Earned 2 stars in endless mode',
			category: 'hawkFruit',
			icon: 'star-filled',
			rarity: 'rare',
			rewards: { coins: 500, diamonds: 5 },
			trigger: { type: 'endless_stars', stars: 2 }
		},
		{
			id: 'endless_gold',
			name: 'Gold Merger',
			description: 'Earned 3 stars in endless mode',
			category: 'hawkFruit',
			icon: 'trophy',
			rarity: 'epic',
			rewards: { coins: 1000, diamonds: 10 },
			trigger: { type: 'endless_stars', stars: 3 }
		},
		{
			id: 'score_2000',
			name: 'Score Beginner',
			description: 'Reached 2,000 points in a single game',
			category: 'hawkFruit',
			icon: 'star',
			rarity: 'common',
			rewards: { coins: 200, diamonds: 1 },
			trigger: { type: 'score_reach', score: 2000 }
		},
		{
			id: 'score_5000',
			name: 'Score Achiever',
			description: 'Reached 5,000 points in a single game',
			category: 'hawkFruit',
			icon: 'star',
			rarity: 'common',
			rewards: { coins: 1000, diamonds: 5 },
			trigger: { type: 'score_reach', score: 5000 }
		},
		{
			id: 'score_15000',
			name: 'Score Expert',
			description: 'Reached 15,000 points in a single game',
			category: 'hawkFruit',
			icon: 'star-filled',
			rarity: 'uncommon',
			rewards: { coins: 3000, diamonds: 10 },
			trigger: { type: 'score_reach', score: 15000 }
		},
		{
			id: 'score_35000',
			name: 'Score Master',
			description: 'Reached 35,000 points in a single game',
			category: 'hawkFruit',
			icon: 'trophy',
			rarity: 'rare',
			rewards: { coins: 7500, diamonds: 17 },
			trigger: { type: 'score_reach', score: 35000 }
		},
		{
			id: 'time_300',
			name: 'Time Master',
			description: 'Played for 5 minutes',
			category: 'hawkFruit',
			icon: 'clock',
			rarity: 'common',
			rewards: { coins: 500, diamonds: 5 },
			trigger: { type: 'time_played', seconds: 300 }
		},
		{
			id: 'time_600',
			name: 'Time Expert',
			description: 'Played for 10 minutes',
			category: 'hawkFruit',
			icon: 'clock',
			rarity: 'uncommon',
			rewards: { coins: 1000, diamonds: 10 },
			trigger: { type: 'time_played', seconds: 600 }
		},
		{
			id: 'time_1200',
			name: 'Time Champion',
			description: 'Played for 20 minutes',
			category: 'hawkFruit',
			icon: 'clock',
			rarity: 'rare',
			rewards: { coins: 2000, diamonds: 20 },
			trigger: { type: 'time_played', seconds: 1200 }
		},


    // Num Merge specific achievements
    {
      id: 'num_beginner',
      name: 'Number Beginner',
      description: 'Completed first Num level',
      category: 'numMerge',
      icon: 'num-merge-game',
      rarity: 'common',
      rewards: { coins: 150, diamonds: 1 },
      trigger: { type: 'level_complete', game: 'numMerge', level: 1 }
    },
    {
      id: 'num_intermediate',
      name: 'Number Crusher',
      description: 'Completed Num Level 3',
      category: 'numMerge',
      icon: 'num-merge-game',
      rarity: 'uncommon',
      rewards: { coins: 500, diamonds: 2 },
      trigger: { type: 'level_complete', game: 'numMerge', level: 3 }
    },
    {
      id: 'num_expert',
      name: 'Number Expert',
      description: 'Completed Num Level 5',
      category: 'numMerge',
      icon: 'num-merge-game',
      rarity: 'epic',
      rewards: { coins: 1500, diamonds: 8 },
      trigger: { type: 'level_complete', game: 'numMerge', level: 5 }
    },
    {
      id: 'num_master',
      name: 'Number Master',
      description: 'Mastered all Num challenges',
      category: 'numMerge',
      icon: 'num-merge-game',
      rarity: 'legendary',
      rewards: { coins: 3000, diamonds: 15 },
      trigger: { type: 'level_complete', game: 'numMerge', level: 6 }
    },

    // Number milestone achievements
    {
      id: 'reach_128',
      name: 'Triple Digit',
      description: 'Reached number 128',
      category: 'numMerge',
      icon: 'star',
      rarity: 'common',
      rewards: { coins: 300, diamonds: 1 },
      trigger: { type: 'number_reach', game: 'numMerge', number: 128 }
    },
    {
      id: 'reach_256',
      name: 'Power of Two',
      description: 'Reached number 256',
      category: 'numMerge',
      icon: 'star',
      rarity: 'uncommon',
      rewards: { coins: 600, diamonds: 3 },
      trigger: { type: 'number_reach', game: 'numMerge', number: 256 }
    },
    {
      id: 'reach_512',
      name: 'Half Thousand',
      description: 'Reached number 512',
      category: 'numMerge',
      icon: 'star-filled',
      rarity: 'uncommon',
      rewards: { coins: 1000, diamonds: 5 },
      trigger: { type: 'number_reach', game: 'numMerge', number: 512 }
    },
    {
      id: 'reach_1024',
      name: 'Kilobyte Master',
      description: 'Reached number 1024',
      category: 'numMerge',
      icon: 'star-filled',
      rarity: 'rare',
      rewards: { coins: 2000, diamonds: 8 },
      trigger: { type: 'number_reach', game: 'numMerge', number: 1024 }
    },
    {
      id: 'reach_2048',
      name: 'The Ultimate Goal',
      description: 'Reached the legendary 2048!',
      category: 'numMerge',
      icon: 'trophy',
      rarity: 'epic',
      rewards: { coins: 4000, diamonds: 15 },
      trigger: { type: 'number_reach', game: 'numMerge', number: 2048 }
    },
    {
      id: 'reach_4096',
      name: 'Beyond Limits',
      description: 'Reached number 4096 - Amazing!',
      category: 'numMerge',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 8000, diamonds: 25 },
      trigger: { type: 'number_reach', game: 'numMerge', number: 4096 }
    },

    // StackMerge specific achievements
    {
      id: 'stackMerge_beginner',
      name: 'Stack Beginner',
      description: 'Completed first StackMerge level',
      category: 'stackMerge',
      icon: 'stack',
      rarity: 'common',
      rewards: { coins: 150, diamonds: 1 },
      trigger: { type: 'level_complete', game: 'stackMerge', level: 1 }
    },
    {
      id: 'stackMerge_intermediate',
      name: 'Stack Builder',
      description: 'Completed StackMerge Level 3',
      category: 'stackMerge',
      icon: 'stack',
      rarity: 'uncommon',
      rewards: { coins: 500, diamonds: 2 },
      trigger: { type: 'level_complete', game: 'stackMerge', level: 3 }
    },
    {
      id: 'stackMerge_expert',
      name: 'Stack Expert',
      description: 'Completed StackMerge Level 5',
      category: 'stackMerge',
      icon: 'stack',
      rarity: 'epic',
      rewards: { coins: 1500, diamonds: 8 },
      trigger: { type: 'level_complete', game: 'stackMerge', level: 5 }
    },
    {
      id: 'stackMerge_master',
      name: 'Stack Master',
      description: 'Completed the ultimate StackMerge challenge',
      category: 'stackMerge',
      icon: 'stack',
      rarity: 'legendary',
      rewards: { coins: 3000, diamonds: 15 },
      trigger: { type: 'level_complete', game: 'stackMerge', level: 6 }
    },

    // Total stacks achievements
    {
      id: 'total_stacks_20',
      name: 'Stack Collector',
      description: 'Stacked 20 blocks in total',
      category: 'stackMerge',
      icon: 'arrow-up',
      rarity: 'common',
      rewards: { coins: 200, diamonds: 1 },
      trigger: { type: 'auto', condition: 'totalStacks >= 20' }
    },
    {
      id: 'total_stacks_50',
      name: 'Stack Enthusiast',
      description: 'Stacked 50 blocks in total',
      category: 'stackMerge',
      icon: 'arrow-up',
      rarity: 'uncommon',
      rewards: { coins: 500, diamonds: 3 },
      trigger: { type: 'auto', condition: 'totalStacks >= 50' }
    },
    {
      id: 'total_stacks_80',
      name: 'Stack Champion',
      description: 'Stacked 80 blocks in total',
      category: 'stackMerge',
      icon: 'trophy',
      rarity: 'rare',
      rewards: { coins: 1000, diamonds: 5 },
      trigger: { type: 'auto', condition: 'totalStacks >= 80' }
    },

    // Perfect stacks combo achievement
    {
      id: 'perfect_combo_10',
      name: 'Precision Master',
      description: 'Get 10 perfect stacks in a row',
      category: 'stackMerge',
      icon: 'star-filled',
      rarity: 'epic',
      rewards: { coins: 2000, diamonds: 10 },
      trigger: { type: 'combo', combo: 10 }
    },

    // Endless mode achievement
    {
      id: 'endless_height_90',
      name: 'Sky Scraper',
      description: 'Reach height 90 in endless mode',
      category: 'stackMerge',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 5000, diamonds: 20 },
      trigger: { type: 'endless_height', height: 90 }
    },

    // Perfectionist achievement
    {
      id: 'stackMerge_perfectionist',
      name: 'Stack Perfectionist',
      description: 'Complete all StackMerge levels with 3 stars',
      category: 'stackMerge',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 3500, diamonds: 25 },
      trigger: { type: 'perfect_all_levels', game: 'stackMerge' }
    },

    // Mystery Box Achievements
    {
      id: 'mystery_box_first',
      name: 'Mystery Explorer',
      description: 'Unlocked your first Mystery Box',
      category: 'special',
      icon: 'star-filled',
      rarity: 'uncommon',
      rewards: { coins: 1000, diamonds: 5 },
      trigger: { type: 'mystery_box_count', count: 1 }
    },
    {
      id: 'mystery_box_collector',
      name: 'Mystery Collector',
      description: 'Unlocked 5 Mystery Boxes',
      category: 'special',
      icon: 'trophy',
      rarity: 'rare',
      rewards: { coins: 2500, diamonds: 15 },
      trigger: { type: 'mystery_box_count', count: 5 }
    },
    {
      id: 'mystery_box_master',
      name: 'Mystery Master',
      description: 'Unlocked 10 Mystery Boxes',
      category: 'special',
      icon: 'trophy',
      rarity: 'epic',
      rewards: { coins: 5000, diamonds: 25 },
      trigger: { type: 'mystery_box_count', count: 10 }
    },
    {
      id: 'daily_streak_7',
      name: 'Week Warrior',
      description: 'Claimed daily rewards for 7 consecutive days',
      category: 'special',
      icon: 'completion-badge',
      rarity: 'rare',
      rewards: { coins: 1500, diamonds: 10 },
      trigger: { type: 'daily_streak', days: 7 }
    },
    {
      id: 'daily_streak_30',
      name: 'Monthly Champion',
      description: 'Claimed daily rewards for 30 consecutive days',
      category: 'special',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 7500, diamonds: 35 },
      trigger: { type: 'daily_streak', days: 30 }
    },

    // Special achievements
    {
      id: 'memory_perfectionist',
      name: 'Memory Perfectionist',
      description: 'Complete all Memory levels with 3 stars',
      category: 'memory',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 2500, diamonds: 15 },
      trigger: { type: 'perfect_all_levels', game: 'memory' }
    },
    {
      id: 'hawkFruit_perfectionist',
      name: 'Hawk Fruit Perfectionist',
      description: 'Complete all Hawk Fruit levels with 3 stars',
      category: 'hawkFruit',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 3000, diamonds: 20 },
      trigger: { type: 'perfect_all_levels', game: 'hawkFruit' }
    },
    {
      id: 'numMerge_perfectionist',
      name: 'Num Merge Perfectionist',
      description: 'Complete all Num Merge levels with 3 stars',
      category: 'numMerge',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 2800, diamonds: 18 },
      trigger: { type: 'perfect_all_levels', game: 'numMerge' }
    },
    {
      id: 'ultimate_perfectionist',
      name: 'Ultimate Perfectionist',
      description: 'Complete ALL game levels with perfect 3-star scores',
      category: 'special',
      icon: 'trophy',
      rarity: 'legendary',
      rewards: { coins: 10000, diamonds: 50 },
      trigger: { type: 'perfect_all_games' }
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
			id: 'memory',
			name: 'Memory Game',
			color: 'purple',
			description: 'Achievements for the Memory Game'
		},
		{
			id: 'hawkFruit',
			name: 'Hawk Fruit Game',
			color: 'orange',
			description: 'Achievements for the Hawk Fruit Game'
		},
    {
      id: 'numMerge',
      name: 'Num Merge Game',
      color: 'warning',
      description: 'Achievements for the Num Merge Game'
    },
    {
      id: 'stackMerge',
      name: 'Stack Merge Game',
      color: 'danger',
      description: 'Achievements for the Stack Merge Game'
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
		consecutiveMultiplier: 2,
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