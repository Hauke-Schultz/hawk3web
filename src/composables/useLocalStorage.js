import { ref, reactive, watch } from 'vue'

// Storage key for the main game data
const STORAGE_KEY = 'hawk3_game_data'
const CURRENT_VERSION = '1.0'

// Default data structure
const getDefaultData = () => ({
	player: {
		name: 'Hawk',
		avatar: 'user',
		level: 15,
		experience: 750,
		totalScore: 1325,
		gamesPlayed: 12,
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
			bestTime: null,
			averageTime: null
		},
		fruitMerge: {
			highScore: 0,
			gamesPlayed: 0,
			maxLevel: 1,
			totalMerges: 0
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
		name: typeof player?.name === 'string' ? player.name : 'Hawk',
		avatar: typeof player?.avatar === 'string' ? player.avatar : 'user',
		level: typeof player?.level === 'number' ? player.level : 15,
		experience: typeof player?.experience === 'number' ? player.experience : 750,
		totalScore: typeof player?.totalScore === 'number' ? player.totalScore : 1325,
		gamesPlayed: typeof player?.gamesPlayed === 'number' ? player.gamesPlayed : 12,
		createdAt: player?.createdAt || new Date().toISOString().split('T')[0],
		lastPlayed: new Date().toISOString().split('T')[0]
	}
}

const validateSettingsData = (settings) => {
	return {
		theme: ['dark', 'light', 'system'].includes(settings?.theme) ? settings.theme : 'dark',
		soundEnabled: typeof settings?.soundEnabled === 'boolean' ? settings.soundEnabled : true,
		musicEnabled: typeof settings?.musicEnabled === 'boolean' ? settings.musicEnabled : true,
		language: typeof settings?.language === 'string' ? settings.language : 'en'
	}
}

const validateGameData = (games) => {
	const defaultGames = getDefaultData().games
	return {
		memory: {
			highScore: typeof games?.memory?.highScore === 'number' ? games.memory.highScore : defaultGames.memory.highScore,
			gamesPlayed: typeof games?.memory?.gamesPlayed === 'number' ? games.memory.gamesPlayed : defaultGames.memory.gamesPlayed,
			bestTime: typeof games?.memory?.bestTime === 'number' ? games.memory.bestTime : defaultGames.memory.bestTime,
			averageTime: typeof games?.memory?.averageTime === 'number' ? games.memory.averageTime : defaultGames.memory.averageTime
		},
		fruitMerge: {
			highScore: typeof games?.fruitMerge?.highScore === 'number' ? games.fruitMerge.highScore : defaultGames.fruitMerge.highScore,
			gamesPlayed: typeof games?.fruitMerge?.gamesPlayed === 'number' ? games.fruitMerge.gamesPlayed : defaultGames.fruitMerge.gamesPlayed,
			maxLevel: typeof games?.fruitMerge?.maxLevel === 'number' ? games.fruitMerge.maxLevel : defaultGames.fruitMerge.maxLevel,
			totalMerges: typeof games?.fruitMerge?.totalMerges === 'number' ? games.fruitMerge.totalMerges : defaultGames.fruitMerge.totalMerges
		}
	}
}

// Data migration function
const migrateData = (data) => {
	// Handle version migrations here
	if (!data.version || data.version !== CURRENT_VERSION) {
		console.log(`Migrating data from version ${data.version || 'unknown'} to ${CURRENT_VERSION}`)

		// Add any migration logic here for future versions
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
	const gameData = reactive(loadData())

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
		Object.assign(gameData.player, validatePlayerData({ ...gameData.player, ...updates }))
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
			Object.assign(gameData.games[gameName], stats)
			gameData.player.gamesPlayed += 1
		}
	}

	const getGameStats = (gameName) => {
		return gameData.games[gameName] || null
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

		// Game methods
		updateGameStats,
		getGameStats,

		// Achievement methods
		addAchievement,
		hasAchievement,

		// Data management
		saveData,
		exportData,
		importData,
		resetData,
		clearStorage
	}
}