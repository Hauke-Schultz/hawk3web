import {ref, reactive, watch, computed} from 'vue'
import {
	ACHIEVEMENTS,
	checkAchievementCondition,
	checkCardReadAchievement,
	REWARDS
} from '../config/achievementsConfig.js'
import { calculateLevelStars } from '../config/levelUtils.js'
import {useI18n} from "../../composables/useI18n.js";
const { t } = useI18n()

// Storage key for the main game data
const STORAGE_KEY = 'hawk3_game_data'
const CURRENT_VERSION = '1.1'
const LEVEL_STATE_KEY = 'hawk3_level_states'

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
		lastPlayed: new Date().toISOString().split('T')[0],
		inventory: {
			items: {},
			equipped: {
				avatar: 'avatar/user',
				theme: 'default',
				frame: null
			},
			activeBoosts: [],
			consumables: {}
		}
	},
	notifications: {
		unreadCount: 0,
		items: [],
		lastUpdated: new Date().toISOString()
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
      stars: 0,
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
			stars: 0,
			completedLevels: 0
		},
    numNumMerge: {
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      maxLevel: 1,
      totalMerges: 0,
      levels: {},
      maxCombo: 0,
      stars: 0,
      completedLevels: 0
    }
	},
	currency: {
		transactions: [],
    dailyRewards: {
      lastClaimed: '2023-01-01',
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
		dailyRewardCard: {
			read: false,
			lastShown: null,
			readAt: null,
			lastClaimed: null
		}
	},
	achievements: [],
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
		lastPlayed: new Date().toISOString().split('T')[0],
		inventory: validateInventoryData(player?.inventory)
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
      stars: typeof games?.memory?.stars === 'number' ? games.memory.stars : 0,
			levels: typeof games?.memory?.levels === 'object' ? games.memory.levels : {}
		},
		fruitMerge: {
			highScore: typeof games?.fruitMerge?.highScore === 'number' ? games.fruitMerge.highScore : defaultGames.fruitMerge.highScore,
			totalScore: typeof games?.fruitMerge?.totalScore === 'number' ? games.fruitMerge.totalScore : defaultGames.fruitMerge.totalScore,
			gamesPlayed: typeof games?.fruitMerge?.gamesPlayed === 'number' ? games.fruitMerge.gamesPlayed : defaultGames.fruitMerge.gamesPlayed,
			maxLevel: typeof games?.fruitMerge?.maxLevel === 'number' ? games.fruitMerge.maxLevel : defaultGames.fruitMerge.maxLevel,
			totalMerges: typeof games?.fruitMerge?.totalMerges === 'number' ? games.fruitMerge.totalMerges : defaultGames.fruitMerge.totalMerges,
			maxCombo: typeof games?.fruitMerge?.maxCombo === 'number' ? games.fruitMerge.maxCombo : defaultGames.fruitMerge.maxCombo,
			stars: typeof games?.fruitMerge?.stars === 'number' ? games.fruitMerge.stars : 0,
			completedLevels: typeof games?.fruitMerge?.completedLevels === 'number' ? games.fruitMerge.completedLevels : 0,
			levels: typeof games?.fruitMerge?.levels === 'object' ? games.fruitMerge.levels : {}
		},
    numNumMerge: {
      highScore: typeof games?.numNumMerge?.highScore === 'number' ? games.numNumMerge.highScore : defaultGames.numNumMerge.highScore,
      totalScore: typeof games?.numNumMerge?.totalScore === 'number' ? games.numNumMerge.totalScore : defaultGames.numNumMerge.totalScore,
      gamesPlayed: typeof games?.numNumMerge?.gamesPlayed === 'number' ? games.numNumMerge.gamesPlayed : defaultGames.numNumMerge.gamesPlayed,
      maxLevel: typeof games?.numNumMerge?.maxLevel === 'number' ? games.numNumMerge.maxLevel : defaultGames.numNumMerge.maxLevel,
      totalMerges: typeof games?.numNumMerge?.totalMerges === 'number' ? games.numNumMerge.totalMerges : defaultGames.numNumMerge.totalMerges,
      maxCombo: typeof games?.numNumMerge?.maxCombo === 'number' ? games.numNumMerge.maxCombo : defaultGames.numNumMerge.maxCombo,
      stars: typeof games?.numNumMerge?.stars === 'number' ? games.numNumMerge.stars : 0,
      completedLevels: typeof games?.numNumMerge?.completedLevels === 'number' ? games.numNumMerge.completedLevels : 0,
      levels: typeof games?.numNumMerge?.levels === 'object' ? games.numNumMerge.levels : {}
    }
	}
}

const validateInventoryData = (inventory) => {
	if (!inventory || typeof inventory !== 'object') {
		return getDefaultData().player.inventory
	}

	return {
		items: typeof inventory.items === 'object' ? inventory.items : {},
		equipped: {
			avatar: typeof inventory.equipped?.avatar === 'string' ? inventory.equipped.avatar : 'avatar/user',
			theme: typeof inventory.equipped?.theme === 'string' ? inventory.equipped.theme : 'default',
			frame: inventory.equipped?.frame || null
		},
		activeBoosts: Array.isArray(inventory.activeBoosts) ? inventory.activeBoosts : [],
		consumables: typeof inventory.consumables === 'object' ? inventory.consumables : {}
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

const validateNotificationsData = (notifications) => {
	if (!notifications || typeof notifications !== 'object') {
		return {
			unreadCount: 0,
			items: [],
			lastUpdated: new Date().toISOString()
		}
	}

	return {
		unreadCount: typeof notifications.unreadCount === 'number' ? notifications.unreadCount : 0,
		items: Array.isArray(notifications.items) ? notifications.items : [],
		lastUpdated: notifications.lastUpdated || new Date().toISOString()
	}
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
			}
		}

		if (!data.player?.coins && data.player?.coins !== 0) {
			data.player.coins = 0
			data.player.diamonds = 0
		}

		if (!data.notifications) {
			data.notifications = getDefaultData().notifications
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

				// Automatische Bereinigung alter Level-States
				setTimeout(() => {
					cleanupOldLevelStates()
				}, 1000)

				return {
					player: validatePlayerData(migrated.player),
					currency: migrated.currency || getDefaultData().currency,
					settings: validateSettingsData(migrated.settings),
					games: validateGameData(migrated.games),
					cardStates: validateCardStates(migrated.cardStates),
					achievements: Array.isArray(migrated.achievements) ? migrated.achievements : getDefaultData().achievements,
					notifications: validateNotificationsData(migrated.notifications),
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
		console.log('Updating player data:', updates, gameData.player, newPlayerData)
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

		// Update stars (recalculate based on latest stats)
		if (levelStats.stars > level.stars) {
			level.stars = levelStats.stars
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
				level.bestMoves = levelStats.moves
				hasImprovement = true
			}
		}

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
					stars: levelStats.stars,
					performanceScore: currentPerformance,
					achievedAt: new Date().toISOString()
				}
				hasImprovement = true
			}
		}

    const perfectAchievements = checkPerfectScoreAchievements()
    perfectAchievements.forEach(achievement => {
      const wasAdded = addAchievement(achievement)
      if (wasAdded) {
        console.log(`🏆 Perfect Score Achievement unlocked: ${achievement.name}`)
      }
    })

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

			updateNotificationCount()
		}
	}


// Inventory management methods
	const addItemToInventory = (itemId, quantity = 1, itemData = {}) => {
		if (!gameData.player.inventory.items[itemId]) {
			gameData.player.inventory.items[itemId] = {
				id: itemId,
				quantity: 0,
				purchasedAt: new Date().toISOString(),
				...itemData
			}
		}
		gameData.player.inventory.items[itemId].quantity += quantity
		saveData()
	}

	const removeItemFromInventory = (itemId, quantity = 1) => {
		const item = gameData.player.inventory.items[itemId]
		if (item && item.quantity > 0) {
			item.quantity -= quantity
			if (item.quantity <= 0) {
				delete gameData.player.inventory.items[itemId]
			}
			saveData()
			return true
		}
		return false
	}

	const hasInventoryItem = (itemId) => {
		return !!gameData.player.inventory.items[itemId]
	}

	const getInventoryItemQuantity = (itemId) => {
		return gameData.player.inventory.items[itemId]?.quantity || 0
	}

	const equipItem = (itemId, slot) => {
		if (hasInventoryItem(itemId)) {
			gameData.player.inventory.equipped[slot] = itemId

			// Update player data accordingly
			if (slot === 'avatar') {
				updatePlayer({ avatar: itemId })
			}

			saveData()
			return true
		}
		return false
	}

	const getEquippedItem = (slot) => {
		return gameData.player.inventory.equipped[slot]
	}

	const activateBoost = (itemId, boostData) => {
		if (removeItemFromInventory(itemId, 1)) {
			const boost = {
				id: itemId,
				...boostData,
				activatedAt: Date.now(),
				expiresAt: Date.now() + (boostData.duration * 1000)
			}
			gameData.player.inventory.activeBoosts.push(boost)
			saveData()
			return true
		}
		return false
	}

	const updateActiveBoosts = () => {
		const now = Date.now()
		const initialLength = gameData.player.inventory.activeBoosts.length
		gameData.player.inventory.activeBoosts = gameData.player.inventory.activeBoosts.filter(
				boost => boost.expiresAt > now
		)

		if (gameData.player.inventory.activeBoosts.length !== initialLength) {
			saveData()
		}
	}

	const getActiveBoost = (type) => {
		updateActiveBoosts()
		return gameData.player.inventory.activeBoosts.find(boost => boost.type === type)
	}

	const buyItem = (item) => {
		// Check if player can afford the item
		const canAffordCoins = gameData.player.coins >= item.price.coins
		const canAffordDiamonds = gameData.player.diamonds >= item.price.diamonds

		if (!canAffordCoins || !canAffordDiamonds) {
			return {
				success: false,
				error: 'insufficient_funds'
			}
		}

		// Check purchase limit
		if (item.purchaseLimit === 1 && hasInventoryItem(item.id)) {
			return {
				success: false,
				error: 'already_owned'
			}
		}

		const oldCoins = gameData.player.coins
		const oldDiamonds = gameData.player.diamonds

		// Deduct currency with reactive assignment
		gameData.player = {
			...gameData.player,
			coins: oldCoins - item.price.coins,
			diamonds: oldDiamonds - item.price.diamonds
		}

		// Add item to inventory
		addItemToInventory(item.id, 1, {
			type: item.type,
			category: item.category,
			rarity: item.rarity,
			name: item.name
		})

		// Record transaction
		if (!gameData.currency) {
			gameData.currency = getDefaultData().currency
		}

		const transaction = {
			id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			timestamp: new Date().toISOString(),
			type: 'spend',
			source: 'shop_purchase',
			description: `Purchased: ${item.name}`,
			amounts: {
				coins: -item.price.coins,
				diamonds: -item.price.diamonds
			},
			balanceAfter: {
				coins: gameData.player.coins,
				diamonds: gameData.player.diamonds
			},
			metadata: {
				itemId: item.id,
				itemName: item.name,
				category: item.category,
				rarity: item.rarity
			}
		}

		gameData.currency.transactions.push(transaction)
		saveData()

		console.log(`🛒 Item purchased: ${item.name} for ${item.price.coins} coins, ${item.price.diamonds} diamonds`)

		return {
			success: true,
			item: item,
			transaction: transaction
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

  const checkPerfectScoreAchievements = () => {
    const achievements = []

    // Check individual game perfectionist achievements
    const gameIds = ['memory', 'fruitMerge', 'numNumMerge']

    gameIds.forEach(gameId => {
      const achievementId = `${gameId}_perfectionist`
      const alreadyEarned = gameData.achievements.some(a => a.id === achievementId && a.earned)

      if (!alreadyEarned && isPerfectGame(gameId)) {
        const achievement = ACHIEVEMENTS.definitions.find(a => a.id === achievementId)
        if (achievement) {
          achievements.push(achievement)
        }
      }
    })

    // Check ultimate perfectionist
    if (!gameData.achievements.some(a => a.id === 'ultimate_perfectionist' && a.earned)) {
      if (gameIds.every(gameId => isPerfectGame(gameId))) {
        const ultimateAchievement = ACHIEVEMENTS.definitions.find(a => a.id === 'ultimate_perfectionist')
        if (ultimateAchievement) {
          achievements.push(ultimateAchievement)
        }
      }
    }

    return achievements
  }

  const isPerfectGame = (gameId) => {
    const gameStats = gameData.games[gameId]
    if (!gameStats || !gameStats.levels) return false

    // Check if all levels completed with 3 stars (excluding endless levels)
    const levels = Object.keys(gameStats.levels)
    if (levels.length === 0) return false

    // For each game, check levels 1-5 (level 6 is endless)
    const regularLevels = levels.filter(level => parseInt(level) <= 5)
    if (regularLevels.length < 5) return false

    return regularLevels.every(level => {
      const levelStats = gameStats.levels[level]
      return levelStats && levelStats.completed && levelStats.stars === 3
    })
  }

  const canClaimDailyReward = () => {
    const lastClaimed = gameData.currency.dailyRewards.lastClaimed
    if (!lastClaimed) return true
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    return today !== lastClaimed
  }

  const claimDailyReward = (minigameReward = null) => {
    if (!canClaimDailyReward()) return null

    const now = new Date()
    const today = now.toISOString().split('T')[0] // YYYY-MM-DD format

    let reward
    if (minigameReward) {
      reward = {
        coins: minigameReward.coins,
        diamonds: minigameReward.diamonds,
        source: 'minigame',
        claimedAt: now.toISOString(),
        claimedDate: today
      }
    } else {
      const baseReward = REWARDS.dailyRewards.base
      reward = {
        coins: baseReward.coins,
        diamonds: baseReward.diamonds,
        source: 'direct',
        claimedAt: now.toISOString(),
        claimedDate: today
      }
    }

    console.log('Daily reward to be claimed:', reward, minigameReward)

    // Update player currency
    gameData.player.coins += reward.coins
    gameData.player.diamonds += reward.diamonds

    // Update daily rewards data - nur das Datum speichern
    gameData.currency.dailyRewards.lastClaimed = today

    // Add transaction record
    const transaction = {
      id: `daily_minigame_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      type: 'earn',
      source: 'daily_minigame',
      description: t('daily_rewards.minigame_reward'),
      amounts: {
        coins: reward.coins,
        diamonds: reward.diamonds
      },
      balanceAfter: {
        coins: gameData.player.coins,
        diamonds: gameData.player.diamonds
      },
      metadata: {
        rewardType: 'daily_minigame',
        gameResult: 'reward_claimed',
        rewardAmount: reward,
        source: reward.source
      }
    }

    gameData.currency.transactions.push(transaction)

    console.log(`🎁 Daily reward claimed! Date: ${today}, Source: ${reward.source}, Coins: +${reward.coins}, Diamonds: +${reward.diamonds}`)

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
		localStorage.removeItem(LEVEL_STATE_KEY)
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

	const saveLevelState = (gameId, levelNumber, stateData) => {
		try {
			// Lade existierende Level-States
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')

			// Struktur: { gameId: { levelNumber: stateData } }
			if (!existingStates[gameId]) {
				existingStates[gameId] = {}
			}

			// Speichere den aktuellen State mit Timestamp
			existingStates[gameId][levelNumber] = {
				...stateData,
				savedAt: new Date().toISOString(),
				gameId,
				levelNumber
			}

			localStorage.setItem(LEVEL_STATE_KEY, JSON.stringify(existingStates))

			return true
		} catch (error) {
			console.error('Error saving level state:', error)
			return false
		}
	}

	const loadLevelState = (gameId, levelNumber) => {
		try {
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')
			const levelState = existingStates[gameId]?.[levelNumber]

			if (levelState) {
				console.log(`📂 Level state loaded for ${gameId} level ${levelNumber}`)
				return levelState
			}

			return null
		} catch (error) {
			console.error('Error loading level state:', error)
			return null
		}
	}

	const clearLevelState = (gameId, levelNumber) => {
		try {
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')

			if (existingStates[gameId]?.[levelNumber]) {
				delete existingStates[gameId][levelNumber]

				// Wenn keine Level mehr für das Spiel existieren, lösche das Spiel komplett
				if (Object.keys(existingStates[gameId]).length === 0) {
					delete existingStates[gameId]
				}

				localStorage.setItem(LEVEL_STATE_KEY, JSON.stringify(existingStates))
				console.log(`🗑️ Level state cleared for ${gameId} level ${levelNumber}`)
				return true
			}

			return false
		} catch (error) {
			console.error('Error clearing level state:', error)
			return false
		}
	}

	const hasLevelState = (gameId, levelNumber) => {
		try {
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')
			const hasState = !!existingStates[gameId]?.[levelNumber]

			if (hasState) {
				console.log(`🔍 Level state exists for ${gameId} level ${levelNumber}`)
			}

			return hasState
		} catch (error) {
			console.error('Error checking level state:', error)
			return false
		}
	}

	// Hilfsfunktion: Alle gespeicherten Level-States für ein Spiel abrufen
	const getAllLevelStates = (gameId) => {
		try {
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')
			return existingStates[gameId] || {}
		} catch (error) {
			console.error('Error getting all level states:', error)
			return {}
		}
	}
	const getLastPlayedLevel = (gameId) => {
		try {
			// Get all level states for the game
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')
			const gameLevels = existingStates[gameId] || {}

			if (Object.keys(gameLevels).length === 0) {
				console.log(`No saved states found for ${gameId}`)
				return null
			}

			// Find the level with the most recent savedAt timestamp
			let lastPlayedLevel = null
			let mostRecentDate = null

			Object.entries(gameLevels).forEach(([levelNumber, levelData]) => {
				if (levelData.savedAt) {
					const savedDate = new Date(levelData.savedAt)

					if (!mostRecentDate || savedDate > mostRecentDate) {
						mostRecentDate = savedDate
						lastPlayedLevel = parseInt(levelNumber)
					}
				}
			})

			if (lastPlayedLevel) {
				console.log(`Last played level for ${gameId}: Level ${lastPlayedLevel} (saved: ${mostRecentDate.toLocaleString()})`)
				return {
					level: lastPlayedLevel,
					savedAt: mostRecentDate.toISOString(),
					gameId: gameId
				}
			}

			return null
		} catch (error) {
			console.error('Error getting last played level:', error)
			return null
		}
	}

	const getMostRecentGameActivity = () => {
		try {
			const games = ['memory', 'fruitMerge']
			let mostRecentActivity = null

			games.forEach(gameId => {
				const lastPlayed = getLastPlayedLevel(gameId)
				if (lastPlayed) {
					const savedDate = new Date(lastPlayed.savedAt)

					if (!mostRecentActivity || savedDate > new Date(mostRecentActivity.savedAt)) {
						mostRecentActivity = lastPlayed
					}
				}
			})

			return mostRecentActivity
		} catch (error) {
			console.error('Error getting most recent game activity:', error)
			return null
		}
	}

	const getRecentLevelsForGame = (gameId, limit = 3) => {
		try {
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')
			const gameLevels = existingStates[gameId] || {}

			// Convert to array and sort by savedAt date (most recent first)
			const levelsWithDates = Object.entries(gameLevels)
					.filter(([_, levelData]) => levelData.savedAt)
					.map(([levelNumber, levelData]) => ({
						level: parseInt(levelNumber),
						savedAt: new Date(levelData.savedAt),
						gameId: gameId
					}))
					.sort((a, b) => b.savedAt - a.savedAt)
					.slice(0, limit)

			return levelsWithDates
		} catch (error) {
			console.error('Error getting recent levels:', error)
			return []
		}
	}

	// Hilfsfunktion: Alte Level-States bereinigen (älter als 7 Tage)
	const cleanupOldLevelStates = () => {
		try {
			const existingStates = JSON.parse(localStorage.getItem(LEVEL_STATE_KEY) || '{}')
			const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
			let hasChanges = false

			Object.keys(existingStates).forEach(gameId => {
				Object.keys(existingStates[gameId]).forEach(levelNumber => {
					const stateData = existingStates[gameId][levelNumber]
					const savedAt = new Date(stateData.savedAt)

					if (savedAt < sevenDaysAgo) {
						delete existingStates[gameId][levelNumber]
						hasChanges = true
						console.log(`🧹 Cleaned up old level state: ${gameId} level ${levelNumber}`)
					}
				})

				// Lösche leere Game-Objekte
				if (Object.keys(existingStates[gameId]).length === 0) {
					delete existingStates[gameId]
					hasChanges = true
				}
			})

			if (hasChanges) {
				localStorage.setItem(LEVEL_STATE_KEY, JSON.stringify(existingStates))
				console.log('🧹 Old level states cleanup completed')
			}
		} catch (error) {
			console.error('Error during level states cleanup:', error)
		}
	}

	const getAllRecentLevels = (limit = 10) => {
		try {
			const games = ['memory', 'fruitMerge']
			let allLevels = []

			games.forEach(gameId => {
				const gameLevels = getRecentLevelsForGame(gameId, limit)
				allLevels = allLevels.concat(gameLevels)
			})

			return allLevels
					.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
					.slice(0, limit)
		} catch (error) {
			console.error('Error getting all recent levels:', error)
			return []
		}
	}

	const getUnreadNotificationCount = () => {
		if (!gameData.notifications) {
			gameData.notifications = getDefaultData().notifications
		}
		return gameData.notifications.unreadCount || 0
	}

	const updateNotificationCount = () => {
		// Ensure notifications object exists
		if (!gameData.notifications) {
			gameData.notifications = getDefaultData().notifications
		}

		let count = 0

		// Check for unread daily reward card
		if (!isCardRead('dailyRewardCard') && canClaimDailyReward()) {
			count += 1
		}

		// Update the notification count
		gameData.notifications.unreadCount = count
		gameData.notifications.lastUpdated = new Date().toISOString()

		return count
	}

	const addNotification = (notification) => {
		if (!gameData.notifications) {
			gameData.notifications = getDefaultData().notifications
		}

		const newNotification = {
			id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
			type: notification.type || 'info',
			title: notification.title,
			message: notification.message,
			read: false,
			createdAt: new Date().toISOString(),
			...notification
		}

		gameData.notifications.items.unshift(newNotification)

		console.log('addNotification updateNotificationCount');
		updateNotificationCount()

		return newNotification
	}

	const markNotificationAsRead = (notificationId) => {
		if (!gameData.notifications) {
			gameData.notifications = getDefaultData().notifications
			return
		}

		const notification = gameData.notifications.items.find(n => n.id === notificationId)
		if (notification) {
			notification.read = true

			console.log('markNotificationAsRead updateNotificationCount');
			updateNotificationCount()
		}
	}

	const clearAllNotifications = () => {
		if (!gameData.notifications) {
			gameData.notifications = getDefaultData().notifications
			return
		}

		gameData.notifications.items = []

		console.log('clearAllNotifications updateNotificationCount');
		updateNotificationCount()
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

		// Inventory methods
		addItemToInventory,
		removeItemFromInventory,
		hasInventoryItem,
		getInventoryItemQuantity,
		equipItem,
		getEquippedItem,
		activateBoost,
		updateActiveBoosts,
		getActiveBoost,
		buyItem,

		// Level State Management
		saveLevelState,
		loadLevelState,
		clearLevelState,
		hasLevelState,
		getAllLevelStates,
		getLastPlayedLevel,
		getMostRecentGameActivity,
		getRecentLevelsForGame,
		cleanupOldLevelStates,
		getAllRecentLevels,

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

		// Notification methods
		updateNotificationCount,
		addNotification,
		markNotificationAsRead,
		clearAllNotifications,
		getUnreadNotificationCount,

		// Data management
		saveData,
		exportData,
		importData,
		resetData,
		clearStorage
	}
}