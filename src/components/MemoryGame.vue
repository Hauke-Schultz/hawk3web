<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import Icon from './Icon.vue'
import ProgressOverview from "./ProgressOverview.vue";

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

// Game configuration based on level
const gameLevels = [
  { pairs: 2, timeBonus: 150 },   // Level 1: 2x2 grid
  { pairs: 6, timeBonus: 300 },   // Level 2: 3x4 grid
  { pairs: 8, timeBonus: 400 },   // Level 3: 4x4 grid
  { pairs: 10, timeBonus: 500 },  // Level 4: 4x5 grid
  { pairs: 12, timeBonus: 600 },  // Level 5: 4x6 grid
  { pairs: 15, timeBonus: 750 }   // Level 6: 5x6 grid
]
// Card symbols for memory game
const cardSymbols = [
  '🎮', '🏆', '⭐', '🎯', '🚀', '💎',
  '🔥', '⚡', '🎨', '🎵', '🌟', '💫',
  '🎪', '🎭', '🎺', '🎸', '🎤', '🎲',
  '🏅', '🎖️', '🏆', '👑', '💰', '🎁'
]

// Computed properties
const currentLevelConfig = computed(() => gameLevels[currentLevel.value - 1] || gameLevels[0])
const totalPairs = computed(() => currentLevelConfig.value.pairs)
const isGameComplete = computed(() => matches.value === totalPairs.value)
const gridCols = computed(() => {
  const pairs = totalPairs.value
  if (pairs <= 2) return 2  // 2x2 for 2 pairs
  if (pairs <= 6) return 3  // 3x4 for 6 pairs
  if (pairs <= 8) return 4  // 4x4 for 8 pairs
  if (pairs <= 12) return 4 // 4x6 for 12 pairs
  return 5                  // 5x6 for 15 pairs
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
  const selectedSymbols = cardSymbols.slice(0, pairs)
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
    }, 1000)
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
  checkAchievements(gameScore)

  emit('game-complete', {
    level: currentLevel.value,
    score: gameScore,
    time: timeElapsed.value,
    moves: moves.value
  })
}

const checkAchievements = (gameScore) => {
  // First game achievement
  if (gameData.games.memory.gamesPlayed === 0) {
    addAchievement({
      id: 'first_game',
      name: 'First Game',
      description: 'Played your first game'
    })
  }

  // Perfect game achievement (minimal moves)
  const minPossibleMoves = totalPairs.value
  if (moves.value === minPossibleMoves) {
    addAchievement({
      id: 'perfectionist',
      name: 'Perfectionist',
      description: 'Complete a game with perfect score'
    })
  }

  // NEU: Easy Level Achievement für 2x2
  if (currentLevel.value === 1 && isGameComplete.value) {
    addAchievement({
      id: 'memory_beginner',
      name: 'Memory Beginner',
      description: 'Completed first memory level'
    })
  }

  // Score achievements
  if (gameScore >= 1000) {
    addAchievement({
      id: 'score_1000',
      name: 'Score Hunter',
      description: 'Earned 1000 total points'
    })
  }

  if (currentLevel.value === 1 && isGameComplete.value) {
    addAchievement({
      id: 'memory_beginner',
      name: 'Memory Beginner',
      description: 'Completed first memory level'
    })
  }

  // Level-specific achievements
  if (currentLevel.value === 3 && isGameComplete.value) {
    addAchievement({
      id: 'memory_intermediate',
      name: 'Memory Intermediate',
      description: 'Completed level 3'
    })
  }

  if (currentLevel.value === 6 && isGameComplete.value) {
    addAchievement({
      id: 'memory_master',
      name: 'Memory Master',
      description: 'Completed the hardest level'
    })
  }
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

// Format time display
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
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
        <div class="performance-stats">
          <div class="stat-item">
            <span class="stat-label">Score</span>
            <span class="stat-value">{{ score }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ formatTime(timeElapsed) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Moves</span>
            <span class="stat-value">{{ moves }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Playing State - Direkt anzeigen -->
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
    <div v-else-if="gameState === 'completed'" class="game-completed">
      <div class="completed-content">
        <h3 class="completed-title">🎉 Level Complete!</h3>

        <div class="final-stats">
          <div class="final-stat">
            <span class="stat-label">Final Score</span>
            <span class="stat-value stat-value--large">{{ finalScore }}</span>
          </div>
          <div class="final-stat">
            <span class="stat-label">Time</span>
            <span class="stat-value">{{ formatTime(timeElapsed) }}</span>
          </div>
          <div class="final-stat">
            <span class="stat-label">Moves</span>
            <span class="stat-value">{{ moves }}</span>
          </div>
          <div class="final-stat">
            <span class="stat-label">Matches</span>
            <span class="stat-value">{{ matches }}/{{ totalPairs }}</span>
          </div>
        </div>

        <div class="completed-actions">
          <button
            class="btn btn--primary"
            @click="nextLevel"
          >
            Back to Levels
          </button>
          <button class="btn btn--ghost" @click="resetGame">
            Play Again
          </button>
          <button class="btn btn--ghost" @click="backToGaming">
            Back to Games
          </button>
        </div>
      </div>
    </div>
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

.performance-stats {
  display: flex;
  gap: var(--space-4);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  padding: var(--space-2);
  justify-content: space-around;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
}

.stat-value {
  font-size: var(--font-size-lg);
  color: var(--text-color);
  font-weight: var(--font-weight-bold);

  &--large {
    font-size: var(--font-size-2xl);
    color: var(--primary-color);
  }
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

// Game Completed State
.game-completed {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.completed-content {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  max-width: 350px;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-6);
}

.completed-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.final-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-3);
}

.final-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
}

.completed-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
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