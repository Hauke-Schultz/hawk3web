import { computed, ref } from 'vue'
import { useLocalStorage } from './useLocalStorage.js'
import { achievementsConfig } from '../config/achievementsConfig.js'

// Currency reward configuration based on rarity
const CURRENCY_REWARDS = {
    achievements: {
        common: { coins: 15, diamonds: 0 },
        uncommon: { coins: 35, diamonds: 1 },
        rare: { coins: 75, diamonds: 3 },
        epic: { coins: 150, diamonds: 8 },
        legendary: { coins: 300, diamonds: 20 }
    },
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

/**
 * Currency Management System for Hawk3
 * Handles coins, diamonds, transactions, and rewards
 */
export function useCurrencySystem() {
    const { gameData, updatePlayer, saveData } = useLocalStorage()

    // Reactive currency values
    const coins = computed(() => gameData.player.coins || 0)
    const diamonds = computed(() => gameData.player.diamonds || 0)
    const totalCoinsEarned = computed(() => gameData.player.totalCoinsEarned || 0)
    const totalDiamondsEarned = computed(() => gameData.player.totalDiamondsEarned || 0)

    // Currency statistics
    const currencyStats = computed(() => gameData.currency?.statistics || {})
    const transactions = computed(() => gameData.currency?.transactions || [])

    // Recent transactions (last 10)
    const recentTransactions = computed(() =>
        transactions.value.slice(-10).reverse()
    )

    // Daily rewards status
    const dailyRewards = computed(() => gameData.currency?.dailyRewards || {})
    const canClaimDailyReward = computed(() => {
        const lastClaimed = dailyRewards.value.lastClaimed
        if (!lastClaimed) return true

        const today = new Date().toISOString().split('T')[0]
        return lastClaimed !== today
    })

    /**
     * Add currency to player account
     * @param {number} coinAmount - Amount of coins to add
     * @param {number} diamondAmount - Amount of diamonds to add
     * @param {string} source - Source of the currency (achievement, level, etc.)
     * @param {string} description - Description of the transaction
     * @param {object} metadata - Additional metadata for the transaction
     */
    const addCurrency = (coinAmount = 0, diamondAmount = 0, source = 'unknown', description = '', metadata = {}) => {
        if (coinAmount === 0 && diamondAmount === 0) return

        // Update player currency
        const newCoins = coins.value + coinAmount
        const newDiamonds = diamonds.value + diamondAmount
        const newTotalCoinsEarned = totalCoinsEarned.value + coinAmount
        const newTotalDiamondsEarned = totalDiamondsEarned.value + diamondAmount

        gameData.player.coins = newCoins
        gameData.player.diamonds = newDiamonds
        gameData.player.totalCoinsEarned = newTotalCoinsEarned
        gameData.player.totalDiamondsEarned = newTotalDiamondsEarned

        // Create transaction record
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'earn',
            source,
            description,
            amounts: {
                coins: coinAmount,
                diamonds: diamondAmount
            },
            balanceAfter: {
                coins: newCoins,
                diamonds: newDiamonds
            },
            metadata
        }

        // Update currency data structure
        if (!gameData.currency) {
            gameData.currency = {
                transactions: [],
                dailyRewards: { lastClaimed: null, streak: 0, nextRewardCoins: 50, nextRewardDiamonds: 1 },
                milestones: { achievementCategories: {} },
                statistics: { totalEarned: { coins: 0, diamonds: 0 }, earningMethods: {} }
            }
        }

        // Add transaction
        gameData.currency.transactions.push(transaction)

        // Update statistics
        updateCurrencyStatistics(source, coinAmount, diamondAmount)

        console.log(`💰 Currency earned: +${coinAmount} coins, +${diamondAmount} diamonds from ${source}`)

        return transaction
    }

    /**
     * Spend currency (for future shop system)
     * @param {number} coinAmount - Amount of coins to spend
     * @param {number} diamondAmount - Amount of diamonds to spend
     * @param {string} purpose - What the currency was spent on
     * @param {string} description - Description of the purchase
     */
    const spendCurrency = (coinAmount = 0, diamondAmount = 0, purpose = 'purchase', description = '') => {
        // Check if player has enough currency
        if (coins.value < coinAmount || diamonds.value < diamondAmount) {
            console.warn('Insufficient currency for purchase')
            return false
        }

        // Update player currency
        const newCoins = coins.value - coinAmount
        const newDiamonds = diamonds.value - diamondAmount

        updatePlayer({
            coins: newCoins,
            diamonds: newDiamonds
        })

        // Create transaction record
        const transaction = {
            id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            type: 'spend',
            source: purpose,
            description,
            amounts: {
                coins: -coinAmount,
                diamonds: -diamondAmount
            },
            balanceAfter: {
                coins: newCoins,
                diamonds: newDiamonds
            }
        }

        gameData.currency.transactions.push(transaction)

        // Update spending statistics
        if (!gameData.currency.statistics.totalSpent) {
            gameData.currency.statistics.totalSpent = { coins: 0, diamonds: 0 }
        }
        gameData.currency.statistics.totalSpent.coins += coinAmount
        gameData.currency.statistics.totalSpent.diamonds += diamondAmount

        console.log(`💸 Currency spent: -${coinAmount} coins, -${diamondAmount} diamonds for ${purpose}`)

        return transaction
    }

    /**
     * Update currency earning statistics
     */
    const updateCurrencyStatistics = (source, coinAmount, diamondAmount) => {
        if (!gameData.currency.statistics) {
            gameData.currency.statistics = {
                totalEarned: { coins: 0, diamonds: 0 },
                earningMethods: {}
            }
        }

        const stats = gameData.currency.statistics

        // Update total earned
        stats.totalEarned.coins += coinAmount
        stats.totalEarned.diamonds += diamondAmount

        // Update earning methods
        if (!stats.earningMethods[source]) {
            stats.earningMethods[source] = { coins: 0, diamonds: 0 }
        }
        stats.earningMethods[source].coins += coinAmount
        stats.earningMethods[source].diamonds += diamondAmount

        // Update largest single reward
        const totalRewardValue = coinAmount + (diamondAmount * 50) // Diamonds worth 50 coins for comparison
        const currentLargestValue = (stats.largestSingleReward?.coins || 0) + ((stats.largestSingleReward?.diamonds || 0) * 50)

        if (totalRewardValue > currentLargestValue) {
            stats.largestSingleReward = {
                coins: coinAmount,
                diamonds: diamondAmount,
                source: source
            }
        }
    }

    /**
     * Reward currency for achievement completion
     * @param {object} achievement - The achievement object
     */
    const rewardAchievement = (achievement) => {
        const rarity = achievement.rarity || 'common'
        const reward = CURRENCY_REWARDS.achievements[rarity]

        if (!reward) {
            console.warn(`Unknown achievement rarity: ${rarity}`)
            return
        }

        return addCurrency(
            reward.coins,
            reward.diamonds,
            'achievement',
            `Achievement: ${achievement.name || achievement.id}`,
            { achievementId: achievement.id, rarity }
        )
    }

    /**
     * Reward currency for level completion
     * @param {string} gameId - The game identifier ('memory' or 'fruitMerge')
     * @param {number} level - The level number
     * @param {number} stars - Stars earned (1-3)
     * @param {boolean} firstTime - Whether this is the first time completing the level
     * @param {number} score - Final score achieved
     * @param {number} moves - Moves used
     */
    const rewardLevelCompletion = (gameId, level, stars = 1, firstTime = false, score = 0, moves = 0) => {
        let totalCoins = 0
        let totalDiamonds = 0

        // Base completion reward
        const baseReward = CURRENCY_REWARDS.levelCompletion.base || { coins: 20, diamonds: 0 }
        totalCoins += baseReward.coins
        totalDiamonds += baseReward.diamonds

        // First time completion bonus
        if (firstTime) {
            totalCoins += CURRENCY_REWARDS.levelCompletion.firstTime.coins
            totalDiamonds += CURRENCY_REWARDS.levelCompletion.firstTime.diamonds
        }

        // Star-based rewards
        const starReward = CURRENCY_REWARDS.levelCompletion.stars[stars]
        if (starReward) {
            totalCoins += starReward.coins
            totalDiamonds += starReward.diamonds
        }

        // Level difficulty multiplier
        const levelMultiplier = Math.max(1, Math.floor(level / 3))
        totalCoins = Math.round(totalCoins * levelMultiplier)

        // Perfect performance bonus (3 stars)
        if (stars === 3) {
            totalCoins += Math.round(totalCoins * 0.5) // 50% bonus for perfect
            totalDiamonds += 1
        }

        return addCurrency(
            totalCoins,
            totalDiamonds,
            'levelCompletion',
            `${gameId} Level ${level} - ${stars} star${stars !== 1 ? 's' : ''}${firstTime ? ' (First Time!)' : ''}`,
            { gameId, level, stars, firstTime, score, moves, baseReward: baseReward.coins }
        )
    }

    /**
     * Reward currency for combo achievements
     * @param {number} comboCount - The combo count achieved
     * @param {string} gameId - The game where combo was achieved
     */
    const rewardCombo = (comboCount, gameId = 'unknown') => {
        if (comboCount < 2) return // No reward for combos less than 2

        const baseReward = CURRENCY_REWARDS.combos.base
        const multiplier = Math.pow(CURRENCY_REWARDS.combos.multiplier, comboCount - 2)
        const coinReward = Math.round(baseReward * multiplier)

        // Diamonds for high combos
        const diamondReward = comboCount >= CURRENCY_REWARDS.combos.diamondThreshold ?
            Math.floor(comboCount / 5) : 0

        return addCurrency(
            coinReward,
            diamondReward,
            'combo',
            `${comboCount}x Combo in ${gameId}`,
            { comboCount, gameId }
        )
    }

    /**
     * Claim daily reward
     */
    const claimDailyReward = () => {
        if (!canClaimDailyReward.value) {
            console.warn('Daily reward already claimed today')
            return false
        }

        const today = new Date().toISOString().split('T')[0]
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0]

        // Calculate streak
        let newStreak = 1
        if (dailyRewards.value.lastClaimed === yesterday) {
            newStreak = Math.min((dailyRewards.value.streak || 0) + 1, CURRENCY_REWARDS.dailyRewards.maxStreak)
        }

        // Calculate reward based on streak
        const baseReward = CURRENCY_REWARDS.dailyRewards.base
        const streakMultiplier = Math.pow(CURRENCY_REWARDS.dailyRewards.streakMultiplier, newStreak - 1)
        const coinReward = Math.round(baseReward.coins * streakMultiplier)
        const diamondReward = Math.round(baseReward.diamonds * streakMultiplier)

        // Update daily rewards data
        gameData.currency.dailyRewards = {
            lastClaimed: today,
            streak: newStreak,
            nextRewardCoins: Math.round(baseReward.coins * Math.pow(CURRENCY_REWARDS.dailyRewards.streakMultiplier, newStreak)),
            nextRewardDiamonds: Math.round(baseReward.diamonds * Math.pow(CURRENCY_REWARDS.dailyRewards.streakMultiplier, newStreak))
        }

        return addCurrency(
            coinReward,
            diamondReward,
            'dailyReward',
            `Daily Reward - Day ${newStreak}`,
            { streak: newStreak }
        )
    }

    /**
     * Check if player can afford a purchase
     * @param {number} coinCost - Required coins
     * @param {number} diamondCost - Required diamonds
     */
    const canAfford = (coinCost = 0, diamondCost = 0) => {
        return coins.value >= coinCost && diamonds.value >= diamondCost
    }

    /**
     * Get formatted currency display
     */
    const formatCurrency = (amount, type = 'coins') => {
        if (amount >= 1000000) {
            return `${(amount / 1000000).toFixed(1)}M`
        } else if (amount >= 1000) {
            return `${(amount / 1000).toFixed(1)}K`
        }
        return amount.toString()
    }

    // Export all functionality
    return {
        // Reactive currency values
        coins,
        diamonds,
        totalCoinsEarned,
        totalDiamondsEarned,

        // Statistics and transactions
        currencyStats,
        transactions,
        recentTransactions,

        // Daily rewards
        dailyRewards,
        canClaimDailyReward,

        // Core functions
        addCurrency,
        spendCurrency,
        rewardAchievement,
        rewardLevelCompletion,
        rewardCombo,
        claimDailyReward,

        // Utility functions
        canAfford,
        formatCurrency,

        // Configuration access
        currencyRewards: CURRENCY_REWARDS
    }
}