import { ref, reactive, watch } from 'vue'
import { achievementsConfig, getAchievementById, checkAchievementCondition } from '../config/achievementsConfig.js'
import { calculateLevelStars } from "../config/memoryConfig.js";

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
		createdAt: new Date().toISOString().split('T')[0],
		lastPlayed: new Date().toISOString().split('T')[0]
	},
	settings: {
		theme: 'dark',
		soundEnabled: true,
		musicEnabled: true,
		language: 'en'
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
			levels: {}
		}
	},
	cardStates: {
		welcomeCard: {
			read: false,
			lastShown: null,
			readAt: null
		},

		// Future card types can be added here
		// trophyCard: { read: false, lastShown: null, readAt: null},
		// notificationCard: { read: false, lastShown: null, readAt: null },
		// promotionCard: { read: false, lastShown: null, readAt: null }
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
		createdAt: player?.createdAt || new Date().toISOString().split('T')[0],
		lastPlayed: new Date().toISOString().split('T')[0]
	}
}

const validateSettingsData = (settings) => {
	return {
		theme: ['dark', 'light', 'system'].includes(settings?.theme) ? settings.theme : 'dark',
		soundEnabled: typeof settings?.soundEnabled === 'boolean' ? settings.soundEnabled : true,
		musicEnabled: typeof settings?.musicEnabled === 'boolean' ? settings.musicEnabled : true,
		language: ['en', 'de'].includes(settings?.language) ? settings.language : 'en'
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
	checkAutoAchievements()

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
			if (stats.maxCombo && (!gameData.games[gameName].maxCombo || stats.maxCombo > gameData.games[gameName].maxCombo)) {
				gameData.games[gameName].maxCombo = stats.maxCombo
			}

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
				stars: 0,
				attempts: 0,
				bestPerformance: null
			}
		}

		const level = gameData.games[gameName].levels[levelNumber]

		// Update attempts
		level.attempts += 1

		// Update completion status
		if (levelStats.completed && !level.completed) {
			level.completed = true
		}

		// Update high score
		if (levelStats.score > level.highScore) {
			level.highScore = levelStats.score
		}

		// Update best time (only if level was completed)
		if (levelStats.completed && levelStats.time) {
			if (!level.bestTime || levelStats.time < level.bestTime) {
				level.bestTime = levelStats.time
			}
		}

		// Update best performance (overall best combination of score, time, moves)
		if (levelStats.completed) {
			const currentPerformance = calculatePerformanceScore(levelStats)
			const bestPerformance = level.bestPerformance ?
				calculatePerformanceScore(level.bestPerformance) : 0

			if (currentPerformance > bestPerformance) {
				level.bestPerformance = {
					score: levelStats.score,
					time: levelStats.time,
					moves: levelStats.moves,
					performanceScore: currentPerformance
				}
			}
		}

		// Calculate and update stars
		level.stars = calculateLevelStars(levelStats, level)

		// Save data
		saveData()

		return true
	}

// Calculate performance score for star rating
	const calculatePerformanceScore = (stats) => {
		if (!stats.score || !stats.time || !stats.moves) return 0

		// Higher score is better, lower time is better, fewer moves is better
		// Normalize values to create a performance score
		const scoreWeight = stats.score * 0.6
		const timeWeight = (300 - Math.min(stats.time, 300)) * 0.3 // Max 5 minutes
		const moveWeight = (50 - Math.min(stats.moves, 50)) * 0.1 // Max 50 moves penalty

		return scoreWeight + timeWeight + moveWeight
	}

	const getLevelStats = (gameName, levelNumber) => {
		return gameData.games[gameName]?.levels?.[levelNumber] || null
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
			return true // New achievement
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
		const autoAchievements = achievementsConfig.definitions.filter(
			achievement => achievement.trigger.type === 'auto'
		)

		autoAchievements.forEach(achievement => {
			// Check if already earned
			const alreadyEarned = gameData.achievements.some(a => a.id === achievement.id && a.earned)
			if (alreadyEarned) return

			// Check if condition is met
			if (checkAchievementCondition(achievement, gameData.player)) {
				gameData.achievements.push({
					id: achievement.id,
					name: achievement.name,
					description: achievement.description,
					earned: true,
					earnedAt: new Date().toISOString()
				})
			}
		})
	}

	const checkGameLevelAchievements = (gameName, levelNumber) => {
		const levelAchievements = achievementsConfig.definitions.filter(
			achievement =>
				achievement.trigger.type === 'level_complete' &&
				achievement.trigger.game === gameName &&
				achievement.trigger.level === levelNumber
		)

		levelAchievements.forEach(achievement => {
			const alreadyEarned = gameData.achievements.some(a => a.id === achievement.id && a.earned)
			if (!alreadyEarned) {
				addAchievement(achievement)
			}
		})
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

	// Return all reactive data and methods
	return {
		// Reactive data
		gameData,

		// Player methods
		updatePlayer,
		addExperience,
		addScore,

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