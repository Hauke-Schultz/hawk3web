<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { memoryConfig, getMemoryLevel, calculateMaxPossibleScore, calculateStars, getGridConfig } from '../config/memoryConfig.js'
import Icon from './Icon.vue'
import ProgressOverview from "./ProgressOverview.vue";
import GameCompletedModal from "./GameCompletedModal.vue";
import PerformanceStats from "./PerformanceStats.vue";

const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['back-to-gaming', 'game-complete'])

// LocalStorage service
const { gameData, updateGameStats, updateLevelStats, addScore, addExperience, addAchievement } = useLocalStorage()

// Game state
const gameState = ref('playing') // 'playing', 'paused', 'completed'
const currentLevel = computed(() => props.level)
const score = ref(0)
const moves = ref(0)
const matches = ref(0)
const timeElapsed = ref(0)
const timer = ref(null)

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
    totalStars: 0, // Während des Spiels noch keine Sterne
    maxStars: 3, // Maximum für aktuelles Level
    percentage: Math.round((matches.value / totalPairs.value) * 100)
  }
})

const initializeGame = () => {
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
  isProcessing.value = false

  // Direkt starten
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

    // Add immediate score for match
    const matchScore = 100
    score.value += matchScore

    // Check if game is complete
    if (isGameComplete.value) {
      completeGame()
    }
  } else {
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
  return calculateStars(finalScore.value, currentLevelConfig.value)
}

const getMaxPossibleScore = () => {
  return calculateMaxPossibleScore(currentLevelConfig.value)
}

const completeGame = () => {
  stopTimer()
  gameState.value = 'completed'

  // Calculate final score
  const gameScore = finalScore.value
  score.value = gameScore

  // Prepare level completion data
  const levelResult = {
    completed: true,
    score: gameScore,
    time: timeElapsed.value,
    moves: moves.value
  }

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
      timeElapsed.value
  }

  updateGameStats('memory', gameStats)
  addScore(gameScore)
  addExperience(50)

  // Check for achievements
  checkLevelAchievements()

  emit('game-complete', {
    level: currentLevel.value,
    score: gameScore,
    time: timeElapsed.value,
    moves: moves.value
  })
}

const checkLevelAchievements = () => {
  const levelAchievements = memoryConfig.achievements.filter(
    ach => ach.trigger.type === 'level_complete' && ach.trigger.level === currentLevel.value
  )

  levelAchievements.forEach(achievement => {
    if (isGameComplete.value) {
      addAchievement(achievement)
    }
  })
}

const resetGame = () => {
  stopTimer()
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
  if (currentLevel.value < 6) {
    // Emit to parent to change level
    emit('back-to-gaming') // Return to level selection
  }
}

const backToGaming = () => {
  stopTimer()
  emit('back-to-gaming')
}

// Lifecycle hooks
onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  stopTimer()
})
</script>

<template>
  <main class="memory-game">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2 class="game-title">Memory Game</h2>
        <div class="level-indicator">Level {{ currentLevel }}</div>
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
          levels-label="Pairs"
          :show-stars="false"
          :show-percentage="true"
        />

        <!-- Game Performance Stats -->
        <PerformanceStats
          :score="score"
          :time-elapsed="timeElapsed"
          :moves="moves"
          :matches="matches"
          :total-pairs="totalPairs"
          layout="horizontal"
          theme="card"
          size="normal"
          :show-score="true"
          :show-time="true"
          :show-moves="true"
          :show-matches="false"
        />
      </div>
    </div>

    <!-- Game Playing State -->
    <div v-if="gameState === 'playing' || gameState === 'paused'" class="game-board">
      <!-- Game Controls -->
      <div class="game-controls">
        <button
          v-if="gameState === 'playing'"
          class="btn btn--ghost btn--small"
          @click="pauseGame"
        >
          Pause
        </button>
        <button
          v-else
          class="btn btn--primary btn--small"
          @click="resumeGame"
        >
          Resume
        </button>
        <button class="btn btn--ghost btn--small" @click="resetGame">
          Reset
        </button>
        <button class="btn btn--ghost btn--small" @click="backToGaming">
          Back
        </button>
      </div>

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

      <!-- Pause Overlay -->
      <div v-if="gameState === 'paused'" class="pause-overlay">
        <div class="pause-content">
          <h3>Game Paused</h3>
          <button class="btn btn--primary" @click="resumeGame">
            <Icon name="play" size="20" />
            Resume
          </button>
        </div>
      </div>
    </div>

    <!-- Game Completed State -->
    <GameCompletedModal
      :visible="gameState === 'completed'"
      :level="currentLevel"
      :game-title="memoryConfig.gameTitle"
      :final-score="finalScore"
      :time-elapsed="timeElapsed"
      :moves="moves"
      :matches="matches"
      :total-pairs="totalPairs"
      :stars-earned="calculateCurrentStars()"
      :show-stars="true"
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
  flex-direction: column;
  gap: var(--space-3);
}

// Game Board
.game-board {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  position: relative;
}

.game-controls {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
  flex-wrap: wrap;
}

// Cards Grid
.cards-grid {
  display: grid;
  gap: var(--space-2);
  justify-content: center;
  flex: 1;

  &--cols-2 {
    grid-template-columns: repeat(2, 1fr);
    max-width: 180px;
    margin: 0 auto;
  }

  &--cols-3 {
    grid-template-columns: repeat(3, 1fr);
    max-width: 280px;
    margin: 0 auto;
  }

  &--cols-4 {
    grid-template-columns: repeat(4, 1fr);
    max-width: 320px;
    margin: 0 auto;
  }

  &--cols-5 {
    grid-template-columns: repeat(5, 1fr);
    max-width: 350px;
    margin: 0 auto;
  }
}

// Memory Cards
.memory-card {
  aspect-ratio: 1;
  position: relative;
  cursor: pointer;
  perspective: 1000px;
  min-height: 60px;

  .cards-grid--cols-2 & {
    min-height: 80px;
  }

  &--disabled {
    cursor: not-allowed;
  }
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: var(--border-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.6s;
  border: 2px solid var(--card-border);
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

// Pause Overlay
.pause-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-lg);
}

.pause-content {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-lg);
  padding: var(--space-6);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  h3 {
    margin: 0;
    color: var(--text-color);
  }
}

// Responsive Design
@media (max-width: 400px) {
  .cards-grid {
    gap: var(--space-1);

    // NEU: 2x2 Mobile Anpassung
    &--cols-2 {
      max-width: 160px;
    }

    &--cols-3 {
      max-width: 240px;
    }

    &--cols-4 {
      max-width: 280px;
    }

    &--cols-5 {
      max-width: 300px;
    }
  }

  .memory-card {
    min-height: 50px;

    .cards-grid--cols-2 & {
      min-height: 70px;
    }
  }

  .card-symbol {
    font-size: var(--font-size-lg);
  }
}
</style>