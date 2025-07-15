import { computed, ref } from 'vue'
import { useLocalStorage } from "./useLocalStorage.js";

// reward configuration based on rarity
const REWARDS = {
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
export function useRewardSystem() {
    const { gameData, updatePlayer, saveData } = useLocalStorage()

    // Reactive currency values
    const coins = computed(() => gameData.player.coins || 0)
    const diamonds = computed(() => gameData.player.diamonds || 0)

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

        // Utility functions
        formatCurrency,

        // Configuration access
        rewards: REWARDS
    }
}