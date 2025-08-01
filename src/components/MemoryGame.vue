<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import {
  memoryConfig,
  getMemoryLevel,
  getGridConfig,
  MEMORY_LEVELS
} from '../config/memoryConfig.js'
import { REWARDS } from '../config/achievementsConfig.js'
import { calculateLevelStars } from '../config/levelUtils.js'
import { useComboSystem } from '../composables/useComboSystem.js'
import Icon from './Icon.vue'
import ProgressOverview from "./ProgressOverview.vue";
import GameCompletedModal from "./GameCompletedModal.vue";
import PerformanceStats from "./PerformanceStats.vue";
import GameControls from "./GameControls.vue";
import Header from "./Header.vue";

const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['back-to-gaming', 'game-complete', 'menu-click'])

// LocalStorage service
const { gameData, updateGameStats, updateLevelStats, addScore, addExperience, checkGameLevelAchievements, checkAutoAchievements, getLevelStats } = useLocalStorage()
const { t } = useI18n()

// Game state
const gameState = ref('playing') // 'playing', 'paused', 'completed'
const currentLevel = ref(props.level || 1)
const score = ref(0)
const moves = ref(0)
const matches = ref(0)
const timeElapsed = ref(0)
const timer = ref(null)
const earnedAchievements = ref([])
const levelReward = ref(null)
const rewardBreakdown = ref(null)

// Card system
const cards = ref([])
const flippedCards = ref([])
const matchedCards = ref([])
const isProcessing = ref(false)

// Computed properties
const currentLevelConfig = computed(() => getMemoryLevel(currentLevel.value))
const totalPairs = computed(() => currentLevelConfig.value.pairs)
const isGameComplete = computed(() => matches.value === totalPairs.value)
const gridCols = computed(() => {
  return getGridConfig(totalPairs.value).cols
})

// Combo system
const comboSystem = useComboSystem({
  minComboLength: 2,        // Memory Game: 2 consecutive matches = combo
  maxComboLength: 8,        // Max 8 combo levels
  comboTimeout: 8000,       // 8 seconds to maintain combo
  baseMultiplier: 1.2,      // Lower base for memory game
  multiplierIncrement: 0.3  // Gradual increase
})

const finalScore = computed(() => {
  if (!isGameComplete.value) return 0

  let baseScore = matches.value * 100
  let moveBonus = Math.max(0, (totalPairs.value * 2 - moves.value) * 10)
  let timeBonus = Math.max(0, currentLevelConfig.value.timeBonus - timeElapsed.value)

  return baseScore + moveBonus + timeBonus
})

const gameProgress = computed(() => {
  return {
    completed: matches.value,
    total: totalPairs.value,
    totalStars: 0,
    maxStars: 3,
    percentage: Math.round((matches.value / totalPairs.value) * 100)
  }
})

const initializeGame = () => {
  startLevel(currentLevel.value)
}

const startLevel = (level) => {
  // Create pairs of cards
  const pairs = totalPairs.value
  const selectedSymbols = memoryConfig.cardSymbols.slice(0, pairs)
  const gameCards = []

  // Create pairs
  selectedSymbols.forEach((symbol, index) => {
    gameCards.push(
      { id: index * 2, symbol, isFlipped: false, isMatched: false },
      { id: index * 2 + 1, symbol, isFlipped: false, isMatched: false }
    )
  })

  // Shuffle cards
  cards.value = shuffleArray(gameCards)

  // Reset game state
  flippedCards.value = []
  matchedCards.value = []
  score.value = 0
  moves.value = 0
  matches.value = 0
  timeElapsed.value = 0
	comboSystem.resetCombo() // Reset combo system
  isProcessing.value = false
  gameState.value = 'playing'
  startTimer()
}

const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

const startTimer = () => {
  timer.value = setInterval(() => {
    timeElapsed.value++
  }, 1000)
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const flipCard = (cardIndex) => {
  if (isProcessing.value || gameState.value !== 'playing') return

  const card = cards.value[cardIndex]
  if (card.isFlipped || card.isMatched) return
  if (flippedCards.value.length >= 2) return

  // Flip the card
  card.isFlipped = true
  flippedCards.value.push(cardIndex)

  // Check if we have 2 flipped cards
  if (flippedCards.value.length === 2) {
    moves.value++
    isProcessing.value = true

    setTimeout(() => {
      checkForMatch()
    }, memoryConfig.settings.flipDuration)
  }
}

const checkForMatch = () => {
  const [firstIndex, secondIndex] = flippedCards.value
  const firstCard = cards.value[firstIndex]
  const secondCard = cards.value[secondIndex]

  if (firstCard.symbol === secondCard.symbol) {
    // Match found!
    firstCard.isMatched = true
    secondCard.isMatched = true
    matchedCards.value.push(firstIndex, secondIndex)
    matches.value++

    // Add combo for successful match
    const comboResult = comboSystem.addCombo()
    console.log('Combo added:', comboResult)

    // Calculate score with combo multiplier
    const baseMatchScore = 100
    const comboMultipliedScore = Math.round(baseMatchScore * comboResult.multiplier)
    score.value += comboMultipliedScore

    // Check if game is complete
    if (isGameComplete.value) {
      completeGame()
    }
  } else {
    // No match - break combo
    const comboBreak = comboSystem.breakCombo()
    if (comboBreak.comboBroken) {
      console.log('Combo broken at:', comboBreak.finalCount)
    }

    // No match - flip cards back
    firstCard.isFlipped = false
    secondCard.isFlipped = false
  }

  // Reset flipped cards
  flippedCards.value = []
  isProcessing.value = false
}

const calculateCurrentStars = () => {
  if (!isGameComplete.value) return 0
  return calculateLevelStars(
    { score: finalScore.value, moves: moves.value, completed: true },
    currentLevelConfig.value
  )
}

const calculateLevelReward = () => {
	if (!isGameComplete.value) return { coins: 0, diamonds: 0, breakdown: [] }

	const levelConfig = currentLevelConfig.value
	const levelNumber = currentLevel.value
	const previousLevelStats = getLevelStats('memory', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed
	const starsEarned = calculateCurrentStars()

	// Determine difficulty tier for memory game
	let difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.easy
	let difficultyName = 'Easy Level'
	if (levelNumber >= 5) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.hard
		difficultyName = 'Hard Level'
	} else if (levelNumber >= 3) {
		difficultyMultiplier = REWARDS.levelCompletion.levelMultiplier.medium
		difficultyName = 'Medium Level'
	}

	// Detailed breakdown array
	const breakdown = []
	let totalCoins = 0
	let totalDiamonds = 0

	// 1. Difficulty multiplier info (informational only)
	if (difficultyMultiplier > 1) {
		breakdown.push({
			type: 'multiplier',
			source: t('rewards.breakdown.difficulty_multiplier', {
				difficulty: difficultyName,
				multiplier: difficultyMultiplier
			}),
			coins: 0,
			diamonds: 0,
			icon: 'star',
			style: 'info',
			isInfo: true
		})
	}

	// 2. Base reward
	const baseCoins = Math.round(REWARDS.levelCompletion.base.coins * difficultyMultiplier)
	const baseDiamonds = REWARDS.levelCompletion.base.diamonds
	if (baseCoins > 0 || baseDiamonds > 0) {
		breakdown.push({
			type: 'base',
			source: t('rewards.breakdown.base_completion'),
			coins: baseCoins,
			diamonds: baseDiamonds,
			icon: 'trophy',
			style: 'default'
		})
		totalCoins += baseCoins
		totalDiamonds += baseDiamonds
	}

	// 3. First time completion bonus
	if (isFirstTimeCompletion) {
		const firstTimeCoins = Math.round(REWARDS.levelCompletion.firstTime.coins * difficultyMultiplier)
		const firstTimeDiamonds = REWARDS.levelCompletion.firstTime.diamonds
		breakdown.push({
			type: 'firstTime',
			source: t('rewards.breakdown.first_time_completion'),
			coins: firstTimeCoins,
			diamonds: firstTimeDiamonds,
			icon: 'star-filled',
			style: 'special'
		})
		totalCoins += firstTimeCoins
		totalDiamonds += firstTimeDiamonds
	}

	// 4. Star-based bonus
	if (starsEarned > 0) {
		const starBonus = REWARDS.levelCompletion.stars[starsEarned]
		if (starBonus) {
			const starCoins = Math.round(starBonus.coins * difficultyMultiplier)
			const starDiamonds = starBonus.diamonds
			breakdown.push({
				type: 'stars',
				source: t('rewards.breakdown.star_performance', { stars: starsEarned }),
				coins: starCoins,
				diamonds: starDiamonds,
				icon: 'star-filled',
				style: 'performance'
			})
			totalCoins += starCoins
			totalDiamonds += starDiamonds
		}
	}

	// 5. Perfect bonus (3 stars)
	if (starsEarned === 3) {
		const perfectBonusCoins = Math.round(totalCoins * REWARDS.levelCompletion.perfectBonus)
		breakdown.push({
			type: 'perfect',
			source: t('rewards.breakdown.perfect_performance'),
			coins: perfectBonusCoins,
			diamonds: 0,
			icon: 'trophy',
			style: 'perfect'
		})
		totalCoins += perfectBonusCoins
	}

	return {
		coins: totalCoins,
		diamonds: totalDiamonds,
		breakdown: breakdown
	}
}

const completeGame = () => {
	stopTimer()
	comboSystem.cleanup()
	gameState.value = 'completed'

	// Calculate final score
	const gameScore = finalScore.value
	score.value = gameScore

	// Calculate level rewards
	const rewardCalculation = calculateLevelReward()
	levelReward.value = rewardCalculation

	// Prepare level completion data
	const levelResult = {
		completed: true,
		score: gameScore,
		time: timeElapsed.value,
		moves: moves.value
	}

	// Check if this is first time completion
	const previousLevelStats = getLevelStats('memory', currentLevel.value)
	const isFirstTimeCompletion = !previousLevelStats?.completed

	// Calculate stars after updating stats
	const starsEarned = calculateCurrentStars()

	// Update level statistics
	updateLevelStats('memory', currentLevel.value, levelResult)

	// Update overall game statistics
	const gameStats = {
		gamesPlayed: gameData.games.memory.gamesPlayed + 1,
		totalScore: gameData.games.memory.totalScore + gameScore,
		highScore: Math.max(gameData.games.memory.highScore, gameScore),
		bestTime: gameData.games.memory.bestTime ?
				Math.min(gameData.games.memory.bestTime, timeElapsed.value) :
				timeElapsed.value,
		averageTime: gameData.games.memory.averageTime ?
				Math.round((gameData.games.memory.averageTime + timeElapsed.value) / 2) :
				timeElapsed.value,
		maxCombo: Math.max(
				gameData.games.memory.maxCombo || 0,
				comboSystem.comboCount.value
		)
	}

	updateGameStats('memory', gameStats)

	// Check for achievements and track new ones
	const achievementsBefore = [...gameData.achievements]
	checkLevelAchievements()
	checkAutoAchievements()
	const achievementsAfter = [...gameData.achievements]

	// Find newly earned achievements
	earnedAchievements.value = achievementsAfter.filter(after =>
			!achievementsBefore.some(before => before.id === after.id && before.earned)
	)

	// Add achievement rewards to breakdown
	const achievementBreakdown = earnedAchievements.value.map(achievement => ({
		type: 'achievement',
		source: t('rewards.breakdown.achievement_reward', { name: achievement.name }),
		coins: achievement.rewards.coins,
		diamonds: achievement.rewards.diamonds,
		icon: achievement.icon,
		style: 'achievement'
	}))

	// Create final breakdown with all rewards
	rewardBreakdown.value = {
		items: [
			...rewardCalculation.breakdown,
			...achievementBreakdown
		],
		total: {
			coins: rewardCalculation.coins + earnedAchievements.value.reduce((sum, a) => sum + a.rewards.coins, 0),
			diamonds: rewardCalculation.diamonds + earnedAchievements.value.reduce((sum, a) => sum + a.rewards.diamonds, 0)
		}
	}

	// Add currency rewards to player
	if (rewardBreakdown.value.total.coins > 0 || rewardBreakdown.value.total.diamonds > 0) {
		gameData.player.coins = (gameData.player.coins || 0) + rewardBreakdown.value.total.coins
		gameData.player.diamonds = (gameData.player.diamonds || 0) + rewardBreakdown.value.total.diamonds
	}

	addScore(gameScore)
	addExperience(50)

	emit('game-complete', {
		level: currentLevel.value,
		score: gameScore,
		time: timeElapsed.value,
		moves: moves.value,
		coins: levelReward.value?.coins || 0,
		diamonds: levelReward.value?.diamonds || 0,
		completed: true,
		firstTime: isFirstTimeCompletion
	})
}

const checkLevelAchievements = () => {
  checkGameLevelAchievements('memory', currentLevel.value)
}

const resetGame = () => {
  stopTimer()
  comboSystem.resetCombo() // Reset combo system
  initializeGame()
}

const pauseGame = () => {
  if (gameState.value === 'playing') {
    stopTimer()
    gameState.value = 'paused'
  }
}

const resumeGame = () => {
  if (gameState.value === 'paused') {
    startTimer()
    gameState.value = 'playing'
  }
}

const nextLevel = () => {
  if (currentLevel.value <  Object.keys(MEMORY_LEVELS).length) {
    currentLevel.value++
    startLevel(currentLevel.value)
  } else {
    backToGaming()
  }
}

const backToGaming = () => {
  stopTimer()
  emit('back-to-gaming')
}

const handleMenuClick = () => {
	emit('menu-click')
}

// Lifecycle hooks
onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  stopTimer()
  comboSystem.cleanup() // Cleanup combo system
})
</script>

<template>
	<Header
		:game-data="gameData"
		:show-profile="true"
		:show-menu-button="true"
		@menu-click="handleMenuClick"
	/>
  <main class="memory-game">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2 class="game-title">{{ t('memory.title') }}</h2>
        <div class="level-indicator">{{ t('memory.level_title', { level: currentLevel }) }}</div>
      </div>

      <div class="game-stats-container">
        <!-- Progress Overview -->
        <ProgressOverview
          :completed="gameProgress.completed"
          :total="gameProgress.total"
          :total-stars="gameProgress.totalStars"
          :max-stars="gameProgress.maxStars"
          theme="primary"
          size="small"
          :levels-label="t('gaming.stats.pairs')"
          :show-stars="false"
          :show-percentage="false"
        />

        <!-- Game Performance Stats -->
        <PerformanceStats
          :score="score"
          :time-elapsed="timeElapsed"
          :moves="moves"
          :matches="matches"
          :total-pairs="totalPairs"
          :combo-count="comboSystem.comboCount.value"
          :combo-multiplier="comboSystem.comboMultiplier.value"
          :max-combo="gameData.games.memory.maxCombo || 0"
          :combo-time-remaining="comboSystem.timeRemaining.value"
          :combo-time-max="comboSystem.config.comboTimeout"
          :is-combo-active="comboSystem.isComboActive.value"
          layout="horizontal"
          theme="card"
          size="normal"
          :show-score="true"
          :show-time="true"
          :show-moves="true"
          :show-matches="false"
          :show-combo="true"
          :score-label="t('stats.score')"
          :time-label="t('stats.time')"
          :moves-label="t('stats.moves')"
          :combo-label="t('stats.combo')"
        />
      </div>
    </div>

    <!-- Game Playing State -->
    <div v-if="gameState === 'playing' || gameState === 'paused'" class="game-board">
      <!-- Game Controls -->
      <GameControls
        :game-state="gameState"
        :pause-label="t('controls.pause')"
        :resume-label="t('controls.resume')"
        :reset-label="t('controls.reset')"
        :back-label="t('common.back')"
        @pause-game="pauseGame"
        @resume-game="resumeGame"
        @reset-game="resetGame"
        @back-to-gaming="backToGaming"
      />

      <!-- Cards Grid -->
      <div
        class="cards-grid"
        :class="`cards-grid--cols-${gridCols}`"
        :style="{ '--grid-cols': gridCols }"
      >
        <div
          v-for="(card, index) in cards"
          :key="card.id"
          class="memory-card"
          :class="{
            'memory-card--flipped': card.isFlipped,
            'memory-card--matched': card.isMatched,
            'memory-card--disabled': isProcessing || gameState === 'paused'
          }"
          @click="flipCard(index)"
        >
          <!-- Card Back -->
          <div class="card-face card-back">
            <Icon name="card-back" size="100%" />
          </div>

          <!-- Card Front -->
          <div class="card-face card-front">
            <span class="card-symbol">{{ card.symbol }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Completed State -->
	  <GameCompletedModal
		  :visible="gameState === 'completed'"
		  :level="currentLevel"
		  :game-title="t('memory.title')"
		  :final-score="finalScore"
		  :time-elapsed="timeElapsed"
		  :moves="moves"
		  :matches="matches"
		  :total-pairs="totalPairs"
		  :stars-earned="calculateCurrentStars()"
		  :show-stars="true"
		  :new-achievements="earnedAchievements"
		  :show-achievements="true"
		  :show-reward="true"
		  :reward="levelReward"
		  :show-reward-breakdown="true"
		  :reward-breakdown="rewardBreakdown"
		  :show-completion-phases="true"
		  :enable-phase-transition="true"
		  :next-level-label="t('memory.next_level')"
		  :play-again-label="t('memory.play_again')"
		  :back-to-games-label="t('memory.back_to_levels')"
		  @next-level="nextLevel"
		  @play-again="resetGame"
		  @back-to-games="backToGaming"
		  @close="backToGaming"
	  />
  </main>
</template>

<style lang="scss" scoped>
.memory-game {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
}

// Game Header
.game-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.game-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.game-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.level-indicator {
  background-color: var(--primary-color);
  color: white;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.game-stats-container {
	display: flex;
	flex-direction: row;
	gap: var(--space-2);
	justify-content: space-between;
}

// Game Board
.game-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: relative;
}

// Cards Grid
.cards-grid {
  display: grid;
  gap: var(--space-2);
  justify-content: center;
  max-width: calc(var(--content-width) - 2 * var(--space-4));
  margin: 0 auto;
  padding: var(--space-1);

  &--cols-2 {
    grid-template-columns: repeat(2, 1fr);
    max-width: 180px;
  }

  &--cols-3 {
    grid-template-columns: repeat(3, 1fr);
    max-width: 280px;
  }

  &--cols-4,
  &--cols-5 {
    grid-template-columns: repeat(4, 1fr);
  }
}

// Memory Cards
.memory-card {
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
  perspective: 1000px;
  height: 80px;

  &--disabled {
    cursor: not-allowed;
  }
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--border-radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s;
}

.card-back {
  color: white;
  transform: rotateY(0deg);
}

.card-front {
  background-color: var(--card-bg);
  color: var(--text-color);
  transform: rotateY(180deg);
}

.card-symbol {
  font-size: var(--font-size-xl);
}

.memory-card--flipped {
  .card-back {
    transform: rotateY(-180deg);
  }

  .card-front {
    transform: rotateY(0deg);
  }
}

.memory-card--matched {
  .card-front {
    background-color: var(--success-color);
    color: white;
    border-color: var(--success-color);
  }
}
</style>