import {ref, reactive, watch, computed} from 'vue'
import {
	ACHIEVEMENTS,
	checkAchievementCondition,
	checkCardReadAchievement,
	REWARDS
} from '../config/achievementsConfig.js'
import { MYSTERY_BOX_CONFIG, calculateMysteryBoxReward, getMysteryBoxProgress, canClaimMysteryBox as canClaimMysteryBoxHelper } from '../config/mysteryBoxConfig.js'
import { GIFT_CONFIG, validateGiftRedemption, generateGiftCode, validateGiftCodeFormat, isItemGiftable, calculateGiftExpiration } from '../config/giftConfig.js'
import { SHOP_ITEMS } from '../config/shopConfig.js'
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
		},
    gifts: {
      sentToday: 0,
      receivedToday: 0,
      lastSentDate: '2023-01-01',
      lastReceivedDate: '2023-01-01',
      sentGifts: [], // Array of sent gift codes
      receivedGifts: [], // Array of received gift data
      redeemedCodes: [] // Array of redeemed codes to prevent duplicates
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
    numMerge: {
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
    stackMerge: {
      highScore: 0,
      gamesPlayed: 0,
      totalScore: 0,
      maxLevel: 1,
      totalStacks: 0,
      totalPerfectStacks: 0,
      bestCombo: 0,
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
      counter: 0,
      selectedGame: null,
    },
    mysteryBoxes: {
      lastClaimed: '2023-01-01',
      totalClaimed: 0,
      lastClaimedCounter: 0,
      pendingMysteryBox: null
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
		inventory: validateInventoryData(player?.inventory),
    gifts: validateGiftsData(player?.gifts)
	}
}

const validateGiftsData = (gifts) => {
  if (!gifts || typeof gifts !== 'object') {
    return {
      sentToday: 0,
      receivedToday: 0,
      lastSentDate: '2023-01-01',
      lastReceivedDate: '2023-01-01',
      sentGifts: [],
      receivedGifts: [],
      redeemedCodes: []
    }
  }

  return {
    sentToday: typeof gifts.sentToday === 'number' ? gifts.sentToday : 0,
    receivedToday: typeof gifts.receivedToday === 'number' ? gifts.receivedToday : 0,
    lastSentDate: typeof gifts.lastSentDate === 'string' ? gifts.lastSentDate : '2023-01-01',
    lastReceivedDate: typeof gifts.lastReceivedDate === 'string' ? gifts.lastReceivedDate : '2023-01-01',
    sentGifts: Array.isArray(gifts.sentGifts) ? gifts.sentGifts : [],
    receivedGifts: Array.isArray(gifts.receivedGifts) ? gifts.receivedGifts : [],
    redeemedCodes: Array.isArray(gifts.redeemedCodes) ? gifts.redeemedCodes : []
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
    numMerge: {
      highScore: typeof games?.numMerge?.highScore === 'number' ? games.numMerge.highScore : defaultGames.numMerge.highScore,
      totalScore: typeof games?.numMerge?.totalScore === 'number' ? games.numMerge.totalScore : defaultGames.numMerge.totalScore,
      gamesPlayed: typeof games?.numMerge?.gamesPlayed === 'number' ? games.numMerge.gamesPlayed : defaultGames.numMerge.gamesPlayed,
      maxLevel: typeof games?.numMerge?.maxLevel === 'number' ? games.numMerge.maxLevel : defaultGames.numMerge.maxLevel,
      totalMerges: typeof games?.numMerge?.totalMerges === 'number' ? games.numMerge.totalMerges : defaultGames.numMerge.totalMerges,
      maxCombo: typeof games?.numMerge?.maxCombo === 'number' ? games.numMerge.maxCombo : defaultGames.numMerge.maxCombo,
      stars: typeof games?.numMerge?.stars === 'number' ? games.numMerge.stars : 0,
      completedLevels: typeof games?.numMerge?.completedLevels === 'number' ? games.numMerge.completedLevels : 0,
      levels: typeof games?.numMerge?.levels === 'object' ? games.numMerge.levels : {}
    },
    stackMerge: {
      highScore: typeof games?.stackMerge?.highScore === 'number' ? games.stackMerge.highScore : defaultGames.stackMerge.highScore,
      totalScore: typeof games?.stackMerge?.totalScore === 'number' ? games.stackMerge.totalScore : defaultGames.stackMerge.totalScore,
      gamesPlayed: typeof games?.stackMerge?.gamesPlayed === 'number' ? games.stackMerge.gamesPlayed : defaultGames.stackMerge.gamesPlayed,
      maxLevel: typeof games?.stackMerge?.maxLevel === 'number' ? games.stackMerge.maxLevel : defaultGames.stackMerge.maxLevel,
      totalStacks: typeof games?.stackMerge?.totalStacks === 'number' ? games.stackMerge.totalStacks : defaultGames.stackMerge.totalStacks,
      totalPerfectStacks: typeof games?.stackMerge?.totalPerfectStacks === 'number' ? games.stackMerge.totalPerfectStacks : defaultGames.stackMerge.totalPerfectStacks,
      bestCombo: typeof games?.stackMerge?.bestCombo === 'number' ? games.stackMerge.bestCombo : defaultGames.stackMerge.bestCombo,
      maxCombo: typeof games?.stackMerge?.maxCombo === 'number' ? games.stackMerge.maxCombo : defaultGames.stackMerge.maxCombo,
      stars: typeof games?.stackMerge?.stars === 'number' ? games.stackMerge.stars : 0,
      completedLevels: typeof games?.stackMerge?.completedLevels === 'number' ? games.stackMerge.completedLevels : 0,
      levels: typeof games?.stackMerge?.levels === 'object' ? games.stackMerge.levels : {}
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

    if (data.player?.dailyRewardsCounter !== undefined) {
      if (!data.currency.dailyRewards) {
        data.currency.dailyRewards = { lastClaimed: '2023-01-01', counter: 0 }
      }
      data.currency.dailyRewards.counter = data.player.dailyRewardsCounter
      delete data.player.dailyRewardsCounter
    }

    if (!data.player?.gifts) {
      if (!data.player) data.player = {}
      data.player.gifts = {
        sentToday: 0,
        receivedToday: 0,
        lastSentDate: '2023-01-01',
        lastReceivedDate: '2023-01-01',
        sentGifts: [],
        receivedGifts: [],
        redeemedCodes: []
      }
      console.log('🎁 Gift system data structure added')
    }

    if (!data.currency.mysteryBoxes) {
      data.currency.mysteryBoxes = {
        lastClaimed: '2023-01-01',
        totalClaimed: 0,
        lastClaimedCounter: 0,
        pendingMysteryBox: null
      }
    }

    // Add stackMerge if missing
    if (!data.games?.stackMerge) {
      if (!data.games) data.games = {}
      data.games.stackMerge = {
        highScore: 0,
        gamesPlayed: 0,
        totalScore: 0,
        maxLevel: 1,
        totalStacks: 0,
        totalPerfectStacks: 0,
        bestCombo: 0,
        levels: {},
        maxCombo: 0,
        stars: 0,
        completedLevels: 0
      }
      console.log('🏗️ StackMerge game data structure added')
    }

    // Add pendingMysteryBox if missing
    if (data.currency.mysteryBoxes && data.currency.mysteryBoxes.pendingMysteryBox === undefined) {
      data.currency.mysteryBoxes.pendingMysteryBox = null
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
    const gameIds = ['memory', 'fruitMerge', 'numMerge']

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

    const oldCounter = gameData.currency.dailyRewards.counter
    gameData.currency.dailyRewards.counter += 1
    const newCounter = gameData.currency.dailyRewards.counter

    console.log(`🎁 Daily rewards counter updated: ${oldCounter} → ${newCounter}`)

    // Update daily rewards data
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

    // Check for mystery box unlock
    if (gameData.currency.dailyRewards.counter % 5 === 0) {
      // Create pending mystery box instead of auto-claiming
      const pendingBox = createPendingMysteryBox()
      if (pendingBox) {
        reward.mysteryBoxUnlocked = true
        reward.mysteryBoxNumber = pendingBox.mysteryBoxNumber
        reward.pendingItem = pendingBox.item
      }
    }

    // Force save to ensure data persistence
    saveData()

    setTimeout(() => {
      updateNotificationCount()
    }, 100)

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

  // Mystery Box System
  // Check if there's a pending mystery box to claim
  const hasPendingMysteryBox = () => {
    return gameData.currency.mysteryBoxes?.pendingMysteryBox !== null
  }

// Get pending mystery box data
  const getPendingMysteryBox = () => {
    return gameData.currency.mysteryBoxes?.pendingMysteryBox || null
  }

// Create pending mystery box (when daily reward threshold reached)
  const createPendingMysteryBox = () => {
    if (!canClaimMysteryBox()) {
      console.warn('Cannot create pending mystery box - not eligible')
      return null
    }

    const mysteryBoxNumber = Math.floor(gameData.currency.dailyRewards.counter / MYSTERY_BOX_CONFIG.requiredDailyRewards)
    const reward = calculateMysteryBoxReward(mysteryBoxNumber)

    if (!reward || !reward.item) {
      console.error(`Failed to generate mystery box reward for box ${mysteryBoxNumber}`)
      return null
    }

    // Create pending mystery box
    const pendingBox = {
      mysteryBoxNumber,
      item: reward.item,
      message: reward.message,
      isSpecial: reward.isSpecial,
      createdAt: new Date().toISOString()
    }

    gameData.currency.mysteryBoxes.pendingMysteryBox = pendingBox

    // Update tracking to prevent duplicate creation
    gameData.currency.mysteryBoxes.lastClaimedCounter = gameData.currency.dailyRewards.counter

    console.log(`🎁 Pending Mystery Box created:`, pendingBox)
    saveData()

    return pendingBox
  }

// Claim the pending mystery box
  const claimPendingMysteryBox = () => {
    const pendingBox = getPendingMysteryBox()

    if (!pendingBox) {
      console.warn('No pending mystery box to claim')
      return null
    }

    console.log(`🎁 Claiming pending Mystery Box #${pendingBox.mysteryBoxNumber}:`, pendingBox)

    // Add item to inventory
    addItemToInventory(pendingBox.item.id, 1, {
      type: pendingBox.item.type,
      category: pendingBox.item.category,
      rarity: pendingBox.item.rarity,
      name: pendingBox.item.name,
      description: pendingBox.item.description,
      tier: pendingBox.item.tier,
      mysteryBoxNumber: pendingBox.mysteryBoxNumber,
      claimedAt: new Date().toISOString()
    })

    // Update mystery box tracking
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    gameData.currency.mysteryBoxes.lastClaimed = today
    gameData.currency.mysteryBoxes.totalClaimed += 1

    // Clear pending mystery box
    gameData.currency.mysteryBoxes.pendingMysteryBox = null

    console.log(`🎁 Mystery Box tracking updated:`, {
      lastClaimed: today,
      totalClaimed: gameData.currency.mysteryBoxes.totalClaimed,
      itemReceived: pendingBox.item.name
    })

    // Create transaction record
    const transaction = {
      id: `mystery_box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      type: 'mystery_item',
      source: 'mystery_box',
      description: pendingBox.message,
      amounts: {
        coins: 0,
        diamonds: 0
      },
      balanceAfter: {
        coins: gameData.player.coins,
        diamonds: gameData.player.diamonds
      },
      metadata: {
        rewardType: 'mystery_item',
        mysteryBoxNumber: pendingBox.mysteryBoxNumber,
        isSpecial: pendingBox.isSpecial,
        totalMysteryBoxesClaimed: gameData.currency.mysteryBoxes.totalClaimed,
        itemReceived: {
          id: pendingBox.item.id,
          name: pendingBox.item.name,
          rarity: pendingBox.item.rarity,
          tier: pendingBox.item.tier
        }
      }
    }

    gameData.currency.transactions.push(transaction)

    // Check for mystery box achievements
    checkMysteryBoxAchievements(gameData.currency.mysteryBoxes.totalClaimed)

    // Force save
    saveData()

    console.log(`🎁 Mystery Box #${pendingBox.mysteryBoxNumber} claimed! Item received: ${pendingBox.item.name} ${pendingBox.item.icon}`)

    return {
      item: pendingBox.item,
      transaction,
      totalClaimed: gameData.currency.mysteryBoxes.totalClaimed,
      mysteryBoxNumber: pendingBox.mysteryBoxNumber
    }
  }

  const canClaimMysteryBox = () => {
    if (!gameData.currency.mysteryBoxes) {
      gameData.currency.mysteryBoxes = {
        lastClaimed: '2023-01-01',
        totalClaimed: 0,
        lastClaimedCounter: 0,
        pendingMysteryBox: null
      }
    }

    // If there's already a pending box, can't create another
    if (hasPendingMysteryBox()) {
      return false
    }

    return canClaimMysteryBoxHelper(
        gameData.currency.dailyRewards.counter,
        gameData.currency.mysteryBoxes.lastClaimedCounter
    )
  }

  const getMysteryBoxProgressData = () => {
    const mysteryBoxData = gameData.currency.mysteryBoxes || { lastClaimedCounter: 0 }
    return getMysteryBoxProgress(
        gameData.currency.dailyRewards.counter,
        mysteryBoxData.lastClaimedCounter
    )
  }

  const claimMysteryBox = () => {
    if (!canClaimMysteryBox()) {
      console.warn('Cannot claim mystery box - not ready or already claimed')
      return null
    }

    // Ensure mysteryBoxes object exists
    if (!gameData.currency.mysteryBoxes) {
      gameData.currency.mysteryBoxes = {
        lastClaimed: '2023-01-01',
        totalClaimed: 0,
        lastClaimedCounter: 0
      }
    }

    const mysteryBoxNumber = Math.floor(gameData.currency.dailyRewards.counter / MYSTERY_BOX_CONFIG.requiredDailyRewards)
    const reward = calculateMysteryBoxReward(mysteryBoxNumber)

    if (!reward || !reward.item) {
      console.error(`Failed to generate mystery box reward for box ${mysteryBoxNumber}`)
      return null
    }

    console.log(`🎁 Claiming Mystery Box #${mysteryBoxNumber}:`, reward)

    // Add item to inventory instead of currency
    addItemToInventory(reward.item.id, 1, {
      type: reward.item.type,
      category: reward.item.category,
      rarity: reward.item.rarity,
      name: reward.item.name,
      description: reward.item.description,
      tier: reward.item.tier,
      mysteryBoxNumber: mysteryBoxNumber,
      claimedAt: new Date().toISOString()
    })

    // Update mystery box tracking
    const now = new Date()
    const today = now.toISOString().split('T')[0]

    gameData.currency.mysteryBoxes.lastClaimed = today
    gameData.currency.mysteryBoxes.totalClaimed += 1
    gameData.currency.mysteryBoxes.lastClaimedCounter = gameData.currency.dailyRewards.counter

    console.log(`🎁 Mystery Box tracking updated:`, {
      lastClaimed: today,
      totalClaimed: gameData.currency.mysteryBoxes.totalClaimed,
      lastClaimedCounter: gameData.currency.mysteryBoxes.lastClaimedCounter,
      itemReceived: reward.item.name
    })

    // Create transaction record (for tracking purposes, no currency involved)
    const transaction = {
      id: `mystery_box_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: now.toISOString(),
      type: 'mystery_item',
      source: 'mystery_box',
      description: reward.message,
      amounts: {
        coins: 0,
        diamonds: 0
      },
      balanceAfter: {
        coins: gameData.player.coins,
        diamonds: gameData.player.diamonds
      },
      metadata: {
        rewardType: 'mystery_item',
        mysteryBoxNumber,
        isSpecial: reward.isSpecial,
        totalMysteryBoxesClaimed: gameData.currency.mysteryBoxes.totalClaimed,
        itemReceived: {
          id: reward.item.id,
          name: reward.item.name,
          rarity: reward.item.rarity,
          tier: reward.item.tier
        }
      }
    }

    gameData.currency.transactions.push(transaction)

    // Check for mystery box achievements
    checkMysteryBoxAchievements(gameData.currency.mysteryBoxes.totalClaimed)

    // Force save
    saveData()

    console.log(`🎁 Mystery Box #${mysteryBoxNumber} claimed! Item received: ${reward.item.name} ${reward.item.icon}`)

    return {
      ...reward,
      transaction,
      totalClaimed: gameData.currency.mysteryBoxes.totalClaimed
    }
  }

  const checkMysteryBoxAchievements = (totalMysteryBoxesClaimed) => {
    MYSTERY_BOX_CONFIG.achievementThresholds.forEach(threshold => {
      if (totalMysteryBoxesClaimed >= threshold.count && !hasAchievement(threshold.achievementId)) {
        const achievement = ACHIEVEMENTS.definitions.find(a => a.id === threshold.achievementId)
        if (achievement) {
          const wasAdded = addAchievement(achievement)
          if (wasAdded) {
            console.log(`🏆 Mystery Box Achievement unlocked: ${achievement.name} (${totalMysteryBoxesClaimed} boxes claimed)`)
          }
        }
      }
    })
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

    // Daily Reward Badge
    if (!isCardRead('dailyRewardCard') && canClaimDailyReward()) {
      count += 1
    }

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

  // Gift System Methods
  const canSendGiftToday = () => {
    // Stelle sicher, dass Gift-Daten existieren
    if (!gameData.player.gifts) {
      gameData.player.gifts = validateGiftsData(null)
    }

    const today = new Date().toISOString().split('T')[0]
    const lastSentDate = gameData.player.gifts.lastSentDate

    if (today !== lastSentDate) {
      // Reset daily counter
      gameData.player.gifts.sentToday = 0
      gameData.player.gifts.lastSentDate = today
    }

    return gameData.player.gifts.sentToday < GIFT_CONFIG.maxSentPerDay
  }

  const canReceiveGiftToday = () => {
    // Stelle sicher, dass Gift-Daten existieren
    if (!gameData.player.gifts) {
      gameData.player.gifts = validateGiftsData(null)
    }

    const today = new Date().toISOString().split('T')[0]
    const lastReceivedDate = gameData.player.gifts.lastReceivedDate

    if (today !== lastReceivedDate) {
      // Reset daily counter
      gameData.player.gifts.receivedToday = 0
      gameData.player.gifts.lastReceivedDate = today
    }

    return gameData.player.gifts.receivedToday < GIFT_CONFIG.maxReceivedPerDay
  }

  const getGiftableItems = () => {
    const ownedItems = Object.keys(gameData.player.inventory.items || {})

    return ownedItems.filter(itemId => {
      const inventoryItem = gameData.player.inventory.items[itemId]
      if (!inventoryItem || inventoryItem.quantity <= 0) return false

      // Find item details from shop
      const shopItem = SHOP_ITEMS.find(item => item.id === itemId)
      if (!shopItem) return false

      return isItemGiftable(itemId, shopItem.category, shopItem.type)
    })
  }

  const createGift = (itemId) => {
    // Ensure gift data exists
    if (!gameData.player.gifts) {
      gameData.player.gifts = validateGiftsData(null)
    }

    if (!canSendGiftToday()) {
      return {
        success: false,
        error: 'daily_limit_reached'
      }
    }

    // Check if player owns the item
    if (!hasInventoryItem(itemId)) {
      return {
        success: false,
        error: 'item_not_owned'
      }
    }

    // Get item details - check both shop and mystery items
    let shopItem = SHOP_ITEMS.find(item => item.id === itemId)

    if (!shopItem) {
      // Check mystery items too
      const { MYSTERY_ITEMS } = require('../config/mysteryBoxConfig.js')
      shopItem = MYSTERY_ITEMS.find(item => item.id === itemId)
    }

    if (!shopItem) {
      return {
        success: false,
        error: 'item_not_found'
      }
    }

    // Check if item can be gifted
    if (!isItemGiftable(itemId, shopItem.category, shopItem.type)) {
      return {
        success: false,
        error: 'item_not_giftable'
      }
    }

    // Generate gift code with player name and item
    const giftCode = generateGiftCode(gameData.player.name, itemId)
    const now = new Date().toISOString()

    // Create gift data
    const giftData = {
      code: giftCode,
      itemId: itemId,
      itemName: shopItem.name,
      itemIcon: shopItem.icon,
      itemRarity: shopItem.rarity,
      senderName: gameData.player.name,
      createdAt: now,
      expiresAt: calculateGiftExpiration(),
      redeemed: false,
      received: false,
      receivedAt: null,
      sentDate: now.split('T')[0]
    }

    // Add to sent gifts
    gameData.player.gifts.sentGifts.push(giftData)
    gameData.player.gifts.sentToday += 1

    console.log(`🎁 Gift created: ${shopItem.name} with code ${giftCode}`)

    return {
      success: true,
      gift: giftData
    }
  }

  const markGiftAsReceived = (giftCode) => {
    if (!gameData.player.gifts) {
      gameData.player.gifts = validateGiftsData(null)
    }

    const gift = gameData.player.gifts.sentGifts.find(g => g.code === giftCode)
    if (gift) {
      gift.received = true
      gift.receivedAt = new Date().toISOString()

      // Remove item from inventory since it was gifted away
      const itemId = gift.itemId
      if (gameData.player.inventory.items[itemId]) {
        const success = removeItemFromInventory(itemId, 1)

        if (success) {
          console.log(`🎁 Item ${itemId} removed from inventory after gift was received`)
        } else {
          console.warn(`⚠️ Could not remove item ${itemId} from inventory`)
        }
      }

      saveData()
      return true
    }
    return false
  }

  const unmarkGiftAsReceived = (giftCode) => {
    if (!gameData.player.gifts) {
      gameData.player.gifts = validateGiftsData(null)
    }

    const gift = gameData.player.gifts.sentGifts.find(g => g.code === giftCode)
    if (gift) {
      gift.received = false
      gift.receivedAt = null

      // Add item back to inventory since gift was marked as not received
      const itemId = gift.itemId

      // Get item details from shop or mystery items
      let shopItem = SHOP_ITEMS.find(item => item.id === itemId)

      if (!shopItem) {
        const { MYSTERY_ITEMS } = require('../config/mysteryBoxConfig.js')
        shopItem = MYSTERY_ITEMS.find(item => item.id === itemId)
      }

      if (shopItem) {
        addItemToInventory(itemId, 1, {
          type: shopItem.type,
          category: shopItem.category,
          rarity: shopItem.rarity,
          name: shopItem.name,
          description: shopItem.description,
          returnedFromGift: true,
          returnedAt: new Date().toISOString()
        })

        console.log(`🎁 Item ${itemId} returned to inventory after unmarking gift as received`)
      } else {
        console.warn(`⚠️ Could not find item details for ${itemId}`)
      }

      saveData()
      return true
    }
    return false
  }

  const redeemGift = (giftCode) => {
    // Ensure gift data exists
    if (!gameData.player.gifts) {
      gameData.player.gifts = validateGiftsData(null)
    }

    const normalizedCode = giftCode.toUpperCase().trim()

    if (!normalizedCode || !validateGiftCodeFormat(normalizedCode)) {
      return {
        success: false,
        error: 'invalid_code_format'
      }
    }

    // Check if already redeemed
    if (gameData.player.gifts.redeemedCodes.includes(normalizedCode)) {
      return {
        success: false,
        error: 'already_redeemed'
      }
    }

    if (!canReceiveGiftToday()) {
      return {
        success: false,
        error: 'daily_receive_limit'
      }
    }

    // Validate gift redemption with redeemed codes
    const validation = validateGiftRedemption(
        normalizedCode,
        gameData.player.name,
        gameData.player.gifts.receivedToday,
        [],
        gameData.player.gifts.redeemedCodes
    )

    if (!validation.valid) {
      return {
        success: false,
        error: validation.error
      }
    }

    const { gift } = validation

    // Find the actual item details - check both regular shop and mystery items
    let shopItem = SHOP_ITEMS.find(item => item.id === gift.itemId)

    // If not found in shop items, it might be a mystery item
    if (!shopItem) {
      // Import MYSTERY_ITEMS for validation
      const { MYSTERY_ITEMS } = require('../config/mysteryBoxConfig.js')
      shopItem = MYSTERY_ITEMS.find(item => item.id === gift.itemId)
    }

    if (!shopItem) {
      return {
        success: false,
        error: 'item_not_found'
      }
    }

    // Add item to inventory with gift metadata
    const isAlreadyOwned = gameData.player.inventory.items[gift.itemId]

    if (isAlreadyOwned) {
      // Item already exists - just increment quantity
      gameData.player.inventory.items[gift.itemId].quantity += 1

      // Add gift metadata to existing item
      if (!gameData.player.inventory.items[gift.itemId].giftsReceived) {
        gameData.player.inventory.items[gift.itemId].giftsReceived = []
      }

      gameData.player.inventory.items[gift.itemId].giftsReceived.push({
        giftFrom: gift.senderName,
        giftCode: normalizedCode,
        receivedAt: new Date().toISOString()
      })

      console.log(`🎁 Gift added to existing item: ${shopItem.name} (quantity: ${gameData.player.inventory.items[gift.itemId].quantity})`)
    } else {
      // Add new item to inventory with gift metadata
      addItemToInventory(gift.itemId, 1, {
        type: shopItem.type,
        category: shopItem.category,
        rarity: shopItem.rarity,
        name: shopItem.name,
        description: shopItem.description,
        isGift: true,
        giftFrom: gift.senderName,
        giftCode: normalizedCode,
        receivedAt: new Date().toISOString(),
        giftsReceived: [{
          giftFrom: gift.senderName,
          giftCode: normalizedCode,
          receivedAt: new Date().toISOString()
        }]
      })
    }

    // Track as received
    gameData.player.gifts.receivedGifts.push({
      ...gift,
      itemName: shopItem.name,
      itemIcon: shopItem.icon,
      itemRarity: shopItem.rarity,
      code: normalizedCode,
      receivedAt: new Date().toISOString()
    })

    gameData.player.gifts.redeemedCodes.push(normalizedCode)
    gameData.player.gifts.receivedToday += 1

    console.log(`🎁 Gift redeemed: ${shopItem.name} from ${gift.senderName}`)

    return {
      success: true,
      gift: {
        ...gift,
        itemName: shopItem.name,
        itemIcon: shopItem.icon,
        itemRarity: shopItem.rarity
      }
    }
  }

  // Update StackMerge level statistics
  const updateStackMergeLevel = (levelNumber, stats) => {
    if (!gameData.games.stackMerge.levels[levelNumber]) {
      gameData.games.stackMerge.levels[levelNumber] = {
        completed: false,
        stars: 0,
        bestHeight: 0,
        bestScore: 0,
        perfectPercent: 0
      }
    }

    const level = gameData.games.stackMerge.levels[levelNumber]
    const wasCompleted = level.completed

    // Update level statistics
    if (stats.completed !== undefined) level.completed = stats.completed
    if (stats.stars !== undefined && stats.stars > level.stars) {
      level.stars = stats.stars
    }
    if (stats.height !== undefined && stats.height > level.bestHeight) {
      level.bestHeight = stats.height
    }
    if (stats.score !== undefined && stats.score > level.bestScore) {
      level.bestScore = stats.score
    }
    if (stats.perfectPercent !== undefined && stats.perfectPercent > level.perfectPercent) {
      level.perfectPercent = stats.perfectPercent
    }

    // Calculate total stars
    gameData.games.stackMerge.totalStars = Object.values(gameData.games.stackMerge.levels)
        .reduce((sum, lvl) => sum + (lvl.stars || 0), 0)

    // Update global stats
    if (stats.totalStacks) gameData.games.stackMerge.totalStacks += stats.totalStacks
    if (stats.perfectStacks) gameData.games.stackMerge.totalPerfectStacks += stats.perfectStacks
    if (stats.combo && stats.combo > gameData.games.stackMerge.bestCombo) {
      gameData.games.stackMerge.bestCombo = stats.combo
    }
    if (stats.score && stats.score > gameData.games.stackMerge.highScore) {
      gameData.games.stackMerge.highScore = stats.score
    }

    // Check for first completion achievement
    if (stats.completed && !wasCompleted) {
      checkAutoAchievements()
    }
  }

  // Save StackMerge game state
  const saveStackMergeState = (state) => {
    gameData.games.stackMerge.saveState = state
  }

  // Clear StackMerge save state
  const clearStackMergeState = () => {
    gameData.games.stackMerge.saveState = null
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

    // Mystery Box methods
    getMysteryBoxProgressData,
    canClaimMysteryBox,
    hasPendingMysteryBox,
    getPendingMysteryBox,
    createPendingMysteryBox,
    claimPendingMysteryBox,
    checkMysteryBoxAchievements,

    // Gift System methods
    canSendGiftToday,
    canReceiveGiftToday,
    getGiftableItems,
    createGift,
    redeemGift,
    markGiftAsReceived,
    unmarkGiftAsReceived,

    updateStackMergeLevel,
    saveStackMergeState,
    clearStackMergeState,

		// Data management
		saveData,
		exportData,
		importData,
		resetData,
		clearStorage
	}
}