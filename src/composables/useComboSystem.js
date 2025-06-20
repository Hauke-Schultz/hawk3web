import { ref, computed, watch } from 'vue'

// Combo system configuration
const COMBO_CONFIG = {
	// Base combo settings
	minComboLength: 3,        // Minimum matches for combo
	maxComboLength: 10,       // Maximum combo multiplier
	comboTimeout: 5000,       // Time before combo resets (ms)

	// Scoring multipliers
	baseMultiplier: 1.5,      // Base combo multiplier
	multiplierIncrement: 0.5, // Increment per combo level
	maxMultiplier: 5.0,       // Maximum possible multiplier

	// Visual feedback settings
	animationDuration: 1000,  // Animation duration (ms)
	pulseIntensity: 0.2       // Pulse effect intensity
}

/**
 * Composable for managing combo system in games
 * @param {Object} options - Configuration options
 * @returns {Object} Combo system methods and reactive data
 */
export function useComboSystem(options = {}) {
	// Merge options with defaults
	const config = { ...COMBO_CONFIG, ...options }

	// Reactive state
	const comboCount = ref(0)           // Current combo count
	const comboMultiplier = ref(1)      // Current score multiplier
	const isComboActive = ref(false)    // Whether combo is active
	const comboProgress = ref(0)        // Progress towards next combo level (0-100)
	const timeRemaining = ref(0)        // Time left before combo expires
	const comboTimer = ref(null)        // Timer reference
	const lastComboTime = ref(null)     // Timestamp of last combo action

	// Animation state
	const isAnimating = ref(false)      // Whether combo animation is playing
	const showComboEffect = ref(false)  // Show visual combo effect

	// Computed properties
	const comboLevel = computed(() => {
		return Math.min(
			Math.floor(comboCount.value / config.minComboLength),
			config.maxComboLength
		)
	})

	const nextComboThreshold = computed(() => {
		return (comboLevel.value + 1) * config.minComboLength
	})

	const progressToNextLevel = computed(() => {
		if (comboLevel.value >= config.maxComboLength) return 100

		const currentLevelStart = comboLevel.value * config.minComboLength
		const nextLevelStart = nextComboThreshold.value
		const currentProgress = comboCount.value - currentLevelStart
		const levelRange = nextLevelStart - currentLevelStart

		return Math.min((currentProgress / levelRange) * 100, 100)
	})

	const comboPercentage = computed(() => {
		return Math.min((comboCount.value / config.maxComboLength) * 100, 100)
	})

	const isMaxCombo = computed(() => {
		return comboLevel.value >= config.maxComboLength
	})

	// Calculate current multiplier based on combo level
	const calculateMultiplier = () => {
		if (comboLevel.value === 0) return 1

		const multiplier = config.baseMultiplier +
			(comboLevel.value - 1) * config.multiplierIncrement

		return Math.min(multiplier, config.maxMultiplier)
	}

	// Start combo timer
	const startComboTimer = () => {
		clearComboTimer()

		timeRemaining.value = config.comboTimeout
		lastComboTime.value = Date.now()

		comboTimer.value = setInterval(() => {
			const elapsed = Date.now() - lastComboTime.value
			const remaining = Math.max(0, config.comboTimeout - elapsed)

			timeRemaining.value = remaining

			if (remaining <= 0) {
				resetCombo()
			}
		}, 100) // Update every 100ms for smooth progress
	}

	// Clear combo timer
	const clearComboTimer = () => {
		if (comboTimer.value) {
			clearInterval(comboTimer.value)
			comboTimer.value = null
		}
	}

	// Add to combo (when player makes correct match)
	const addCombo = () => {
		const previousLevel = comboLevel.value

		comboCount.value++
		isComboActive.value = true

		// Update multiplier
		comboMultiplier.value = calculateMultiplier()

		// Check if combo level increased
		const newLevel = comboLevel.value
		if (newLevel > previousLevel) {
			triggerComboLevelUp()
		} else {
			triggerComboHit()
		}

		// Restart timer
		startComboTimer()

		return {
			comboCount: comboCount.value,
			comboLevel: newLevel,
			multiplier: comboMultiplier.value,
			levelUp: newLevel > previousLevel
		}
	}

	// Break combo (when player makes mistake)
	const breakCombo = () => {
		const hadCombo = isComboActive.value

		resetCombo()

		if (hadCombo) {
			triggerComboBreak()
		}

		return {
			comboBroken: hadCombo,
			finalCount: comboCount.value
		}
	}

	// Reset combo to initial state
	const resetCombo = () => {
		comboCount.value = 0
		comboMultiplier.value = 1
		isComboActive.value = false
		timeRemaining.value = 0
		clearComboTimer()
	}

	// Trigger combo hit animation
	const triggerComboHit = () => {
		isAnimating.value = true

		setTimeout(() => {
			isAnimating.value = false
		}, config.animationDuration)
	}

	// Trigger combo level up animation
	const triggerComboLevelUp = () => {
		showComboEffect.value = true
		isAnimating.value = true

		setTimeout(() => {
			showComboEffect.value = false
			isAnimating.value = false
		}, config.animationDuration)
	}

	// Trigger combo break animation
	const triggerComboBreak = () => {
		// Could add specific break animation here
		isAnimating.value = true

		setTimeout(() => {
			isAnimating.value = false
		}, config.animationDuration * 0.5)
	}

	// Get combo color based on level
// Get combo color based on level and activity
	const getComboColor = (forceActive = false) => {
		if (!isComboActive.value && !forceActive) return '#6B7280' // Gray when inactive
		if (comboLevel.value === 0) return '#6B7280' // Gray
		if (comboLevel.value < 3) return '#10B981'   // Green
		if (comboLevel.value < 6) return '#F59E0B'   // Orange
		if (comboLevel.value < 9) return '#EF4444'   // Red
		return '#8B5CF6' // Purple for max combo
	}

	// Get time remaining percentage
	const getTimePercentage = () => {
		return (timeRemaining.value / config.comboTimeout) * 100
	}

	// Cleanup function
	const cleanup = () => {
		clearComboTimer()
	}

	// Watch for combo expiration
	watch(timeRemaining, (newTime) => {
		if (newTime <= 0 && isComboActive.value) {
			resetCombo()
		}
	})

	return {
		// Reactive state
		comboCount,
		comboLevel,
		comboMultiplier,
		isComboActive,
		comboProgress: progressToNextLevel,
		comboPercentage,
		timeRemaining,
		isAnimating,
		showComboEffect,
		isMaxCombo,
		nextComboThreshold,

		// Methods
		addCombo,
		breakCombo,
		resetCombo,
		getComboColor,
		getTimePercentage,
		cleanup,

		// Configuration
		config: {
			minComboLength: config.minComboLength,
			maxComboLength: config.maxComboLength,
			comboTimeout: config.comboTimeout
		}
	}
}