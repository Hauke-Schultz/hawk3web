import {ref, reactive, watch, computed} from 'vue'
import {
	ACHIEVEMENTS,
	checkAchievementCondition,
	checkCardReadAchievement,
	REWARDS
} from '../config/achievementsConfig.js'
import { calculateLevelStars } from '../config/levelUtils.js'
import {useI18n} from "./useI18n.js";
const { t } = useI18n()

// Storage key for the main game data
const STORAGE_KEY = 'hawk3_game_data'
const CURRENT_VERSION = '1.1'

// Default data structure
const getDefaultData = () => ({
	player: {
		name: 'Player',
		avatar: 'avatar/user',
		level: 0,
		experience: 0,
		totalScore: 0,
		gamesPlayed: 0,
		coins: 0,
		diamonds: 0,
		createdAt: new Date().toISOString().split('T')[0],
		lastPlayed: new Date().toISOString().split('T')[0]
	},
	settings: {
		theme: 'dark',
		soundEnabled: true,
		musicEnabled: true,
		language: 'en',
		fontSize: 'medium'
	},
	games: {
		memory: {
			highScore: 0,
			gamesPlayed: 0,
			totalScore: 0,
			bestTime: null,
			averageTime: null,
			maxCombo: 0,
			levels: {}
		},
		fruitMerge: {
			highScore: 0,
			gamesPlayed: 0,
			totalScore: 0,
			maxLevel: 1,
			totalMerges: 0,
			levels: {},
			maxCombo: 0,
			starsEarned: 0,
			completedLevels: 0,
			totalCoinsEarned: 0,
			totalDiamondsEarned: 0
		}
	},
	currency: {
		transactions: [],
		dailyRewards: {
			lastClaimed: '2023-01-01',
			streak: 0,
			nextRewardCoins: 50,
			nextRewardDiamonds: 1
		},
		milestones: {
			achievementCategories: {
				general: { completed: 0, total: 0, rewardClaimed: false },
				gaming: { completed: 0, total: 0, rewardClaimed: false },
				progress: { completed: 0, total: 0, rewardClaimed: false },
				special: { completed: 0, total: 0, rewardClaimed: false }
			}
		},
		statistics: {
			totalEarned: { coins: 0, diamonds: 0 },
			totalSpent: { coins: 0, diamonds: 0 },
			largestSingleReward: { coins: 0, diamonds: 0, source: '' },
			favoriteEarningMethod: '',
			earningMethods: {
				achievements: { coins: 0, diamonds: 0 },
				levelCompletion: { coins: 0, diamonds: 0 },
				dailyRewards: { coins: 0, diamonds: 0 },
				perfectGames: { coins: 0, diamonds: 0 },
				combos: { coins: 0, diamonds: 0 }
			}
		}
	},
	cardStates: {
		welcomeCard: {
			read: false,
			lastShown: null,
			readAt: null
		},
		dailyRewardCard: {
			read: false,
			lastShown: null,
			readAt: null,
			lastClaimed: null
		}
	},
	achievements: [
		{
			id: 'welcome',
			name: 'Welcome to Hawk3',
			description: 'Started your gaming journey',
			earned: true,
			earnedAt: new Date().toISOString()
		}
	],
	version: CURRENT_VERSION
})

// Validation functions
const validatePlayerData = (player) => {
	return {
		name: typeof player?.name === 'string' ? player.name : 'Player',
		avatar: typeof player?.avatar === 'string' ? player.avatar : 'avatar/user',
		level: typeof player?.level === 'number' ? player.level : 0,
		experience: typeof player?.experience === 'number' ? player.experience : 0,
		totalScore: typeof player?.totalScore === 'number' ? player.totalScore : 0,
		gamesPlayed: typeof player?.gamesPlayed === 'number' ? player.gamesPlayed : 0,
		coins: typeof player?.coins === 'number' ? player.coins : 0,
		diamonds: typeof player?.diamonds === 'number' ? player.diamonds : 0,
		createdAt: player?.createdAt || new Date().toISOString().split('T')[0],
		lastPlayed: new Date().toISOString().split('T')[0]
	}
}

const validateSettingsData = (settings) => {
	return {
		theme: ['dark', 'light', 'system'].includes(settings?.theme) ? settings.theme : 'dark',
		soundEnabled: typeof settings?.soundEnabled === 'boolean' ? settings.soundEnabled : true,
		musicEnabled: typeof settings?.musicEnabled === 'boolean' ? settings.musicEnabled : true,
		language: ['en', 'de'].includes(settings?.language) ? settings.language : 'en',
		fontSize: ['small', 'medium', 'large'].includes(settings?.fontSize) ? settings.fontSize : 'small'
	}
}

const validateGameData = (games) => {
	const defaultGames = getDefaultData().games
	return {
		memory: {
			highScore: typeof games?.memory?.highScore === 'number' ? games.memory.highScore : defaultGames.memory.highScore,
			totalScore: typeof games?.memory?.totalScore === 'number' ? games.memory.totalScore : defaultGames.memory.totalScore,
			gamesPlayed: typeof games?.memory?.gamesPlayed === 'number' ? games.memory.gamesPlayed : defaultGames.memory.gamesPlayed,
			bestTime: typeof games?.memory?.bestTime === 'number' ? games.memory.bestTime : defaultGames.memory.bestTime,
			averageTime: typeof games?.memory?.averageTime === 'number' ? games.memory.averageTime : defaultGames.memory.averageTime,
			maxCombo: typeof games?.memory?.maxCombo === 'number' ? games.memory.maxCombo : defaultGames.memory.maxCombo,
			levels: typeof games?.memory?.levels === 'object' ? games.memory.levels : {}
		},
		fruitMerge: {
			highScore: typeof games?.fruitMerge?.highScore === 'number' ? games.fruitMerge.highScore : defaultGames.fruitMerge.highScore,
			totalScore: typeof games?.fruitMerge?.totalScore === 'number' ? games.fruitMerge.totalScore : defaultGames.fruitMerge.totalScore,
			gamesPlayed: typeof games?.fruitMerge?.gamesPlayed === 'number' ? games.fruitMerge.gamesPlayed : defaultGames.fruitMerge.gamesPlayed,
			maxLevel: typeof games?.fruitMerge?.maxLevel === 'number' ? games.fruitMerge.maxLevel : defaultGames.fruitMerge.maxLevel,
			totalMerges: typeof games?.fruitMerge?.totalMerges === 'number' ? games.fruitMerge.totalMerges : defaultGames.fruitMerge.totalMerges,
			maxCombo: typeof games?.fruitMerge?.maxCombo === 'number' ? games.fruitMerge.maxCombo : defaultGames.fruitMerge.maxCombo,
			starsEarned: typeof games?.fruitMerge?.starsEarned === 'number' ? games.fruitMerge.starsEarned : 0,
			completedLevels: typeof games?.fruitMerge?.completedLevels === 'number' ? games.fruitMerge.completedLevels : 0,
			totalCoinsEarned: typeof games?.fruitMerge?.totalCoinsEarned === 'number' ? games.fruitMerge.totalCoinsEarned : 0,
			totalDiamondsEarned: typeof games?.fruitMerge?.totalDiamondsEarned === 'number' ? games.fruitMerge.totalDiamondsEarned : 0,
			levels: typeof games?.fruitMerge?.levels === 'object' ? games.fruitMerge.levels : {}
		}
	}
}

const validateCardStates = (cardStates) => {
	const defaultCards = getDefaultData().cardStates
	const validated = {}

	// Validate each card type
	for (const [cardType, defaultState] of Object.entries(defaultCards)) {
		validated[cardType] = {
			read: typeof cardStates?.[cardType]?.read === 'boolean' ? cardStates[cardType].read : defaultState.read,
			lastShown: cardStates?.[cardType]?.lastShown || defaultState.lastShown,
			readAt: cardStates?.[cardType]?.readAt || defaultState.readAt
		}
	}

	return validated
}

// Data migration function
const migrateData = (data) => {
	// Handle version migrations here
	if (!data.version || data.version !== CURRENT_VERSION) {
		console.log(`Migrating data from version ${data.version || 'unknown'} to ${CURRENT_VERSION}`)

		if (!data.settings?.language) {
			data.settings = data.settings || {}
			data.settings.language = 'en'
		}

		if (!data.currency) {
			data.currency = getDefaultData().currency
		}

		if (!data.currency.dailyRewards) {
			data.currency.dailyRewards = {
				lastClaimed: '2023-01-01',
				streak: 0,
				nextRewardCoins: 50,
				nextRewardDiamonds: 1
			}
		}

		if (!data.player?.coins && data.player?.coins !== 0) {
			data.player.coins = 0
			data.player.diamonds = 0
		}

		data.version = CURRENT_VERSION
	}

	return data
}

// Main composable function
export function useLocalStorage() {
	// Load initial data from localStorage
	const loadData = () => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY)
			if (stored) {
				const parsed = JSON.parse(stored)
				const migrated = migrateData(parsed)

				return {
					player: validatePlayerData(migrated.player),
					currency: migrated.currency || getDefaultData().currency,
					settings: validateSettingsData(migrated.settings),
					games: validateGameData(migrated.games),
					cardStates: validateCardStates(migrated.cardStates),
					achievements: Array.isArray(migrated.achievements) ? migrated.achievements : getDefaultData().achievements,
					version: CURRENT_VERSION
				}
			}
		} catch (error) {
			console.warn('Error loading data from localStorage:', error)
		}

		return getDefaultData()
	}

	// Reactive data
	const gameData = reactive({})
	Object.assign(gameData, loadData())
	//checkAutoAchievements()

	// Save data to localStorage
	const saveData = () => {
		try {
			gameData.player.lastPlayed = new Date().toISOString().split('T')[0]
			localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData))
		} catch (error) {
			console.error('Error saving data to localStorage:', error)
		}
	}

	// Auto-save when data changes
	watch(
		() => gameData,
		() => {
			saveData()
		},
		{ deep: true }
	)

	// Player methods
	const updatePlayer = (updates) => {
		const newPlayerData = { ...gameData.player, ...updates }
		console.log('XXXX Updating player data:', updates, gameData.player, newPlayerData)
		Object.assign(gameData.player, validatePlayerData(newPlayerData))
		saveData()
	}

	const addExperience = (amount) => {
		gameData.player.experience += amount
		// Level up logic (every 1000 XP = 1 level)
		const newLevel = Math.floor(gameData.player.experience / 1000) + 1
		if (newLevel > gameData.player.level) {
			gameData.player.level = newLevel
			return true // Level up occurred
		}
		return false
	}

	const addScore = (points) => {
		gameData.player.totalScore += points
	}

	// Settings methods
	const updateSettings = (updates) => {
		Object.assign(gameData.settings, validateSettingsData({ ...gameData.settings, ...updates }))
	}

	// Game data methods
	const updateGameStats = (gameName, stats) => {
		if (gameData.games[gameName]) {
			// Track max combo if provided
			// if (stats.maxCombo && (!gameData.games[gameName].maxCombo || stats.maxCombo > gameData.games[gameName].maxCombo)) {
			// 	gameData.games[gameName].maxCombo = stats.maxCombo
			// }

			Object.assign(gameData.games[gameName], stats)
			gameData.player.gamesPlayed += 1
		}
	}

	const getGameStats = (gameName) => {
		return gameData.games[gameName] || null
	}

	// Level management methods
	const updateLevelStats = (gameName, levelNumber, levelStats) => {
		if (!gameData.games[gameName]) return false

		console.log(`XXX Updating stats for ${gameName} level ${levelNumber}`, gameData.games[gameName].levels)
		// Initialize levels object if it doesn't exist
		if (!gameData.games[gameName].levels) {
			gameData.games[gameName].levels = {}
		}

		// Initialize level if it doesn't exist
		if (!gameData.games[gameName].levels[levelNumber]) {
			gameData.games[gameName].levels[levelNumber] = {
				completed: false,
				highScore: 0,
				bestTime: null,
				bestMoves: null,
				stars: 0,
				attempts: 0,
				bestPerformance: null
			}
		}

		const level = gameData.games[gameName].levels[levelNumber]
		let hasImprovement = false

		// Update attempts
		level.attempts += 1

		// Update completion status (only if newly completed)
		if (levelStats.completed && !level.completed) {
			level.completed = true
			hasImprovement = true
		}

		// Update high score (only if better)
		if (levelStats.score && levelStats.score > level.highScore) {
			level.highScore = levelStats.score
			hasImprovement = true
		}

		// Update best time (only if better and level completed)
		if (levelStats.completed && levelStats.time) {
			if (!level.bestTime || levelStats.time < level.bestTime) {
				level.bestTime = levelStats.time
				hasImprovement = true
			}
		}

		// Update best moves (only if better and level completed)
		if (levelStats.completed && levelStats.moves) {
			if (!level.bestMoves || levelStats.moves < level.bestMoves) {
				const previousMoves = level.bestMoves
				level.bestMoves = levelStats.moves
				hasImprovement = true
			}
		}

		// Calculate stars based on current performance (using best stats)
		const currentBestStats = {
			score: level.highScore,
			time: level.bestTime,
			moves: level.bestMoves,
			completed: level.completed
		}

		// Calculate new stars and update if better
		const newStars = calculateLevelStars(currentBestStats, level)
		if (newStars > level.stars) {
			level.stars = newStars
			hasImprovement = true
		}
		console.log(`XXX star for level ${levelNumber}: level.stars: ${level.stars}, newStars: ${newStars}`)

		// Update best performance (comprehensive best combination)
		if (levelStats.completed) {
			const currentPerformance = calculatePerformanceScore(levelStats)
			const bestPerformance = level.bestPerformance ?
				calculatePerformanceScore(level.bestPerformance) : 0

			if (currentPerformance > bestPerformance) {
				level.bestPerformance = {
					score: levelStats.score,
					time: levelStats.time,
					moves: levelStats.moves,
					performanceScore: currentPerformance,
					achievedAt: new Date().toISOString()
				}
				hasImprovement = true
				console.log(`XXX New best performance for level ${levelNumber}: ${currentPerformance.toFixed(2)}`)
			}
		}

		// Save data only if there was an improvement
		if (hasImprovement) {
			saveData()
			console.log(`XXX Level ${levelNumber} stats updated with improvements:`, {
				highScore: level.highScore,
				bestTime: level.bestTime,
				bestMoves: level.bestMoves,
				stars: level.stars,
				attempts: level.attempts
			})
		} else {
			console.log(`XXX No improvements for level ${levelNumber} this time`)
		}

		return hasImprovement
	}

	// Calculate performance score for star rating
	const calculatePerformanceScore = (stats) => {
		if (!stats.score || !stats.completed) return 0

		// Base score component (60% weight)
		const scoreWeight = stats.score * 0.6

		// Time component (25% weight) - better time = higher score
		let timeWeight = 0
		if (stats.time) {
			const timeBonus = Math.max(0, 600 - Math.min(stats.time, 600)) // Max 10 minutes
			timeWeight = timeBonus * 0.25
		}

		// Moves component (15% weight) - fewer moves = higher score
		let moveWeight = 0
		if (stats.moves) {
			const moveBonus = Math.max(0, 100 - Math.min(stats.moves, 100)) // Max 100 moves penalty
			moveWeight = moveBonus * 0.15
		}

		return scoreWeight + timeWeight + moveWeight
	}

	const getLevelStats = (gameName, levelNumber) => {
		const levelStats = gameData.games[gameName]?.levels?.[levelNumber]

		if (!levelStats) return null

		// Return stats with computed improvements
		return {
			...levelStats,
			hasPersonalBest: {
				score: levelStats.highScore > 0,
				time: levelStats.bestTime !== null,
				moves: levelStats.bestMoves !== null,
				stars: levelStats.stars > 0
			},
			improvementPotential: {
				canImproveScore: true, // Always possible
				canImproveTime: levelStats.completed,
				canImproveMoves: levelStats.completed,
				canImproveStars: levelStats.stars < 3
			}
		}
	}

	const isLevelUnlocked = (gameName, levelNumber) => {
		// Level 1 is always unlocked
		if (levelNumber === 1) return true

		// Other levels require previous level completion
		const previousLevel = gameData.games[gameName]?.levels?.[levelNumber - 1]
		return previousLevel?.completed || false
	}

	const getGameProgress = (gameName) => {
		const game = gameData.games[gameName]
		if (!game || !game.levels) return { completed: 0, total: 0, stars: 0 }

		const levels = Object.values(game.levels)
		const completed = levels.filter(level => level.completed).length
		const total = levels.length
		const stars = levels.reduce((sum, level) => sum + (level.stars || 0), 0)

		return { completed, total, stars, maxStars: total * 3 }
	}

	// Achievement methods
	const addAchievement = (achievement) => {
		const exists = gameData.achievements.some(a => a.id === achievement.id)
		if (!exists) {

			gameData.achievements.push({
				...achievement,
				earned: true,
				earnedAt: new Date().toISOString()
			})

			const reward = achievement.rewards
			if (reward && (reward.coins > 0 || reward.diamonds > 0)) {
				gameData.player.coins = (gameData.player.coins || 0) + reward.coins
				gameData.player.diamonds = (gameData.player.diamonds || 0) + reward.diamonds

				if (!gameData.currency) {
					gameData.currency = getDefaultData().currency
				}

				const transaction = {
					id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
					timestamp: new Date().toISOString(),
					type: 'earn',
					source: 'achievement',
					description: `Achievement: ${achievement.name || achievement.id}`,
					amounts: {
						coins: reward.coins,
						diamonds: reward.diamonds
					},
					balanceAfter: {
						coins: gameData.player.coins,
						diamonds: gameData.player.diamonds
					},
					metadata: { achievementId: achievement.id, rarity: achievement.rarity }
				}

				gameData.currency.transactions.push(transaction)

				console.log(`🏆 Achievement unlocked: ${achievement.name} (+${reward.coins} coins, +${reward.diamonds} diamonds)`)
			}

			return true
		}
		return false
	}

	const hasAchievement = (achievementId) => {
		return gameData.achievements.some(a => a.id === achievementId && a.earned)
	}

	// Card state methods
	const markCardAsRead = (cardType) => {
		if (gameData.cardStates[cardType]) {
			gameData.cardStates[cardType].read = true
			gameData.cardStates[cardType].readAt = new Date().toISOString()

			if (cardType === 'dailyRewardCard') {
				gameData.cardStates[cardType].lastClaimed = new Date().toISOString()
			}

			const cardAchievements = checkCardReadAchievement(cardType, gameData)

			cardAchievements.forEach(achievement => {
				const wasAdded = addAchievement(achievement)
				if (wasAdded) {
					console.log(`🎉 Card read achievement unlocked: ${achievement.name}`)
				}
			})
		}
	}
	
	const markCardAsShown = (cardType) => {
		if (gameData.cardStates[cardType]) {
			gameData.cardStates[cardType].lastShown = new Date().toISOString()
		}
	}

	const resetCardState = (cardType) => {
		if (gameData.cardStates[cardType]) {
			gameData.cardStates[cardType].read = false
			gameData.cardStates[cardType].readAt = null
			gameData.cardStates[cardType].lastShown = null
		}
	}

	const isCardRead = (cardType) => {
		return gameData.cardStates[cardType]?.read || false
	}

	const getCardState = (cardType) => {
		return gameData.cardStates[cardType] || { read: false, lastShown: null, readAt: null }
	}

	// Data management methods
	const exportData = () => {
		return JSON.stringify(gameData, null, 2)
	}

	const importData = (jsonData) => {
		try {
			const imported = JSON.parse(jsonData)
			const migrated = migrateData(imported)

			gameData.player = validatePlayerData(migrated.player)
			gameData.settings = validateSettingsData(migrated.settings)
			gameData.games = validateGameData(migrated.games)
			gameData.achievements = Array.isArray(migrated.achievements) ? migrated.achievements : []
			gameData.version = CURRENT_VERSION

			saveData()
			return true
		} catch (error) {
			console.error('Error importing data:', error)
			return false
		}
	}

	const resetData = () => {
		const defaultData = getDefaultData()
		Object.assign(gameData, defaultData)
		saveData()
	}

	function checkAutoAchievements() {
		const autoAchievements = ACHIEVEMENTS.definitions.filter(
			achievement => achievement.trigger.type === 'auto'
		)

		let newAchievements = 0
		autoAchievements.forEach(achievement => {
			// Check if already earned
			const alreadyEarned = gameData.achievements.some(a => a.id === achievement.id && a.earned)
			if (alreadyEarned) return

			// Check if condition is met
			if (checkAchievementCondition(achievement, gameData.player)) {
				const wasAdded = addAchievement(achievement)
				if (wasAdded) {
					newAchievements++
				}
			}
		})

		if (newAchievements > 0) {
			console.log(`🎉 ${newAchievements} new achievements unlocked with rewards!`)
		}
	}

	const checkGameLevelAchievements = (gameName, levelNumber) => {
		const levelAchievements = ACHIEVEMENTS.definitions.filter(
			achievement =>
				achievement.trigger.type === 'level_complete' &&
				achievement.trigger.game === gameName &&
				achievement.trigger.level === levelNumber
		)

		let newAchievements = 0
		levelAchievements.forEach(achievement => {
			const alreadyEarned = gameData.achievements.some(a => a.id === achievement.id && a.earned)
			if (!alreadyEarned) {
				const wasAdded = addAchievement(achievement)
				if (wasAdded) {
					newAchievements++
				}
			}
		})

		if (newAchievements > 0) {
			console.log(`🏆 Level ${levelNumber} completion: ${newAchievements} achievements unlocked!`)
		}
	}

	const canClaimDailyReward = () => {
		const lastClaimed = gameData.currency.dailyRewards.lastClaimed
		if (!lastClaimed) return true

		const now = new Date()
		const lastClaimedDate = new Date(lastClaimed)
		const daysDiff = Math.floor((now - lastClaimedDate) / (1000 * 60 * 60 * 24))
		const cardRead = gameData.cardStates.dailyRewardCard?.read || false

		return daysDiff >= 1 && !cardRead
	}

	const claimDailyReward = () => {
		if (!canClaimDailyReward()) return null

		const now = new Date()
		const lastClaimed = gameData.currency.dailyRewards.lastClaimed
		const currentStreak = gameData.currency.dailyRewards.streak || 0

		// Check if streak continues (claimed yesterday) or resets
		let newStreak = 1
		if (lastClaimed) {
			const daysDiff = Math.floor((now - new Date(lastClaimed)) / (1000 * 60 * 60 * 24))
			if (daysDiff === 1) {
				newStreak = Math.min(currentStreak + 1, REWARDS.dailyRewards.maxStreak)
			}
		}

		// Calculate reward based on streak
		const baseReward = REWARDS.dailyRewards.base
		const streakMultiplier = Math.pow(REWARDS.dailyRewards.streakMultiplier, newStreak - 1)

		const reward = {
			coins: Math.floor(baseReward.coins * streakMultiplier),
			diamonds: baseReward.diamonds + Math.floor(newStreak / 3), // Extra diamond every 3 days
			streak: newStreak,
			claimedAt: now.toISOString()
		}

		// Update player currency
		gameData.player.coins += reward.coins
		gameData.player.diamonds += reward.diamonds

		// Update daily rewards data
		gameData.currency.dailyRewards.lastClaimed = now.toISOString().split('T')[0]
		gameData.currency.dailyRewards.streak = newStreak

		// Update next reward preview
		const nextStreakMultiplier = Math.pow(REWARDS.dailyRewards.streakMultiplier, newStreak)
		gameData.currency.dailyRewards.nextRewardCoins = Math.floor(baseReward.coins * nextStreakMultiplier)
		gameData.currency.dailyRewards.nextRewardDiamonds = baseReward.diamonds + Math.floor((newStreak + 1) / 3)

		// Add transaction record
		const transaction = {
			id: `daily_${Date.now()}`,
			timestamp: now.toISOString(),
			type: 'earn',
			source: 'daily_reward',
			description: t('currency.daily_reward'),
			amounts: {
				coins: reward.coins,
				diamonds: reward.diamonds
			},
			balanceAfter: {
				coins: gameData.player.coins,
				diamonds: gameData.player.diamonds
			},
			metadata: {
				streak: newStreak,
				streakMultiplier: streakMultiplier.toFixed(2)
			}
		}

		gameData.currency.transactions.push(transaction)

		console.log(`🎁 Daily reward claimed! Streak: ${newStreak}, Coins: +${reward.coins}, Diamonds: +${reward.diamonds}`)

		return reward
	}

	// Language methods
	const updateLanguage = (language) => {
		if (['en', 'de'].includes(language)) {
			updateSettings({ language })
			return true
		}
		return false
	}

	const getCurrentLanguage = () => {
		return gameData.settings.language
	}

	const clearStorage = () => {
		localStorage.removeItem(STORAGE_KEY)
		const defaultData = getDefaultData()
		Object.assign(gameData, defaultData)
	}

	const formatCurrency = (amount, type = 'coins') => {
		if (amount >= 1000000) {
			return `${(amount / 1000000).toFixed(1)}M`
		} else if (amount >= 1000) {
			return `${(amount / 1000).toFixed(1)}K`
		}
		return amount.toString()
	}

	// Return all reactive data and methods
	return {
		// Reactive data
		gameData,

		// Utility functions
		formatCurrency,

		// Player methods
		updatePlayer,
		addExperience,
		addScore,

		canClaimDailyReward,
		claimDailyReward,

		// Settings methods
		updateSettings,

		// Language methods
		updateLanguage,
		getCurrentLanguage,

		// Game methods
		updateGameStats,
		getGameStats,

		// Level management methods
		updateLevelStats,
		getLevelStats,
		isLevelUnlocked,
		getGameProgress,

		// Achievement methods
		addAchievement,
		hasAchievement,
		checkAutoAchievements,
		checkGameLevelAchievements,

		// Card state methods
		markCardAsRead,
		markCardAsShown,
		resetCardState,
		isCardRead,
		getCardState,

		// Data management
		saveData,
		exportData,
		importData,
		resetData,
		clearStorage
	}
}