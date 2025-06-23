<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { fruitMergeConfig, FRUIT_MERGE_LEVELS } from '../config/fruitMergeConfig.js'
import { useComboSystem } from '../composables/useComboSystem.js'
import Icon from './Icon.vue'
import ProgressOverview from "./ProgressOverview.vue"
import GameCompletedModal from "./GameCompletedModal.vue"
import PerformanceStats from "./PerformanceStats.vue"
import GameControls from "./GameControls.vue"
import {calculateLevelStars} from "../config/levelUtils.js";

const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['back-to-gaming', 'game-complete'])

// LocalStorage service
const { gameData, updateGameStats, updateLevelStats, addScore, addExperience, addAchievement, checkGameLevelAchievements } = useLocalStorage()

const { t } = useI18n()

// Game state
const gameState = ref('playing') // 'playing', 'paused', 'completed'
const currentLevel = computed(() => props.level)
const score = ref(0)
const moves = ref(0)
const merges = ref(0)
const timeElapsed = ref(0)
const timer = ref(null)
const earnedAchievements = ref([])

// FruitMerge specific state
const fruitsCreated = ref({}) // Track created fruits by type
const targetReached = ref(false)

// Computed properties
const currentLevelConfig = computed(() => FRUIT_MERGE_LEVELS[currentLevel.value])
const targetFruit = computed(() => currentLevelConfig.value?.targetFruit)
const targetCount = computed(() => {
  const thresholds = currentLevelConfig.value?.starThresholds
  return thresholds ? (thresholds[1].targetCount || 1) : 1
})
const isGameComplete = computed(() => {
  const fruitsOfTargetType = fruitsCreated.value[targetFruit.value] || 0
  return fruitsOfTargetType >= targetCount.value
})

// Combo system for FruitMerge
const comboSystem = useComboSystem({
  minComboLength: 2,        // FruitMerge: 2 consecutive merges = combo
  maxComboLength: 10,       // Max 10 combo levels
  comboTimeout: 5000,       // 5 seconds to maintain combo
  baseMultiplier: 1.5,      // Higher base for merge game
  multiplierIncrement: 0.4  // More aggressive increase
})

const finalScore = computed(() => {
  if (!isGameComplete.value) return score.value

  // Add time bonus if completed
  const timeBonus = Math.max(0, 300 - timeElapsed.value) // 5 minute time bonus
  return score.value + timeBonus
})

const gameProgress = computed(() => {
  const fruitsOfTargetType = fruitsCreated.value[targetFruit.value] || 0
  return {
    completed: fruitsOfTargetType,
    total: targetCount.value,
    totalStars: 0,
    maxStars: 3,
    percentage: Math.round((fruitsOfTargetType / targetCount.value) * 100)
  }
})

const initializeGame = () => {
  // Reset all game state
  fruitsCreated.value = {}
  targetReached.value = false
  score.value = 0
  moves.value = 0
  merges.value = 0
  timeElapsed.value = 0
  gameState.value = 'playing'

  // Reset combo system
  comboSystem.resetCombo()

  startTimer()
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

// Game actions
const handleFruitMerge = (fruitType, points) => {
  // Add combo for successful merge
  const comboResult = comboSystem.addCombo()
  console.log('Combo added:', comboResult)

  // Calculate score with combo multiplier
  const comboMultipliedScore = Math.round(points * comboResult.multiplier)
  score.value += comboMultipliedScore

  // Track merge statistics
  merges.value++
  moves.value++

  // Track created fruits
  if (!fruitsCreated.value[fruitType]) {
    fruitsCreated.value[fruitType] = 0
  }
  fruitsCreated.value[fruitType]++

  // Check if game is complete
  if (isGameComplete.value && !targetReached.value) {
    targetReached.value = true
    setTimeout(() => {
      completeGame()
    }, 1000) // Small delay to show the final merge
  }
}

const handleMissedDrop = () => {
  moves.value++
}

const completeGame = () => {
  stopTimer()
  comboSystem.cleanup()
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
  updateLevelStats('fruitMerge', currentLevel.value, levelResult)

  // Update overall game statistics
  const gameStats = {
    gamesPlayed: gameData.games.fruitMerge.gamesPlayed + 1,
    totalScore: gameData.games.fruitMerge.totalScore + gameScore,
    highScore: Math.max(gameData.games.fruitMerge.highScore, gameScore),
    totalMerges: gameData.games.fruitMerge.totalMerges + merges.value,
    maxLevel: Math.max(gameData.games.fruitMerge.maxLevel, currentLevel.value)
  }

  updateGameStats('fruitMerge', gameStats)

  // Check for achievements and track new ones
  const achievementsBefore = [...gameData.achievements]
  checkLevelAchievements()
  const achievementsAfter = [...gameData.achievements]

  // Find newly earned achievements
  const newAchievements = achievementsAfter.filter(after =>
    !achievementsBefore.some(before => before.id === after.id && before.earned)
  )
  earnedAchievements.value = newAchievements

  addScore(gameScore)
  addExperience(75) // More XP for FruitMerge

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
  checkGameLevelAchievements('fruitMerge', currentLevel.value)
}

const resetGame = () => {
  stopTimer()
  comboSystem.resetCombo()
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
  if (currentLevel.value < Object.keys(FRUIT_MERGE_LEVELS).length) {
    emit('back-to-gaming') // Return to level selection
  }
}

const backToGaming = () => {
  stopTimer()
  emit('back-to-gaming')
}

const calculateCurrentStars = () => {
  if (!isGameComplete.value) return 0
  return calculateLevelStars(
    { score: finalScore.value, moves: moves.value, completed: true },
    currentLevelConfig.value
  )
}

// Lifecycle hooks
onMounted(() => {
  initializeGame()
})

onUnmounted(() => {
  stopTimer()
  comboSystem.cleanup()
})
</script>

<template>
  <main class="fruit-merge-game">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2 class="game-title">{{ t('fruitMerge.title') }}</h2>
        <div class="level-indicator">{{ t('fruitMerge.level_title', { level: currentLevel }) }}</div>
      </div>

      <div class="game-stats-container">
        <!-- Progress Overview -->
        <ProgressOverview
          :completed="gameProgress.completed"
          :total="gameProgress.total"
          :total-stars="gameProgress.totalStars"
          :max-stars="gameProgress.maxStars"
          theme="warning"
          size="small"
          :levels-label="targetFruit"
          :show-stars="false"
          :show-percentage="true"
          :complete-label="t('fruitMerge.target')"
        />

        <!-- Game Performance Stats -->
        <PerformanceStats
          :score="score"
          :time-elapsed="timeElapsed"
          :moves="moves"
          :matches="merges"
          :total-pairs="targetCount"
          :combo-count="comboSystem.comboCount.value"
          :combo-multiplier="comboSystem.comboMultiplier.value"
          :max-combo="gameData.games.fruitMerge.maxCombo || 0"
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

      <!-- Game Field Placeholder -->
      <div class="game-field">
        <div class="field-placeholder">
          <div class="placeholder-content">
            <Icon name="apple" size="64" />
            <h3>{{ t('fruitMerge.title') }}</h3>
            <p>{{ t('fruitMerge.level_title', { level: currentLevel }) }}</p>
            <div class="target-info">
              <span>{{ t('fruitMerge.target') }}: {{ targetCount }}x {{ t(`fruitMerge.fruits.${targetFruit.toLowerCase()}`) }}</span>
            </div>

            <!-- Demo buttons for testing -->
            <div class="demo-controls" style="margin-top: 20px;">
              <button class="btn btn--small" @click="handleFruitMerge('APPLE', 100)">
                Test Merge Apple (+100)
              </button>
              <button class="btn btn--small" @click="handleMissedDrop()">
                Test Miss
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Game Completed State -->
    <GameCompletedModal
      :visible="gameState === 'completed'"
      :level="currentLevel"
      :game-title="t('fruitMerge.title')"
      :final-score="finalScore"
      :time-elapsed="timeElapsed"
      :moves="moves"
      :matches="merges"
      :total-pairs="targetCount"
      :stars-earned="calculateCurrentStars()"
      :show-stars="true"
      :new-achievements="earnedAchievements"
      :show-achievements="true"
      :next-level-label="t('fruitMerge.back_to_levels')"
      :play-again-label="t('fruitMerge.play_again')"
      :back-to-games-label="t('gaming.back_to_games')"
      @next-level="nextLevel"
      @play-again="resetGame"
      @back-to-games="backToGaming"
      @close="backToGaming"
    />
  </main>
</template>

<style lang="scss" scoped>
.fruit-merge-game {
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
  background-color: var(--warning-color);
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

// Game Field Placeholder
.game-field {
  flex: 1;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.field-placeholder {
  padding: var(--space-6);
  text-align: center;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  color: var(--text-secondary);
}

.placeholder-content h3 {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.placeholder-content p {
  font-size: var(--font-size-base);
  margin: 0;
}

.target-info {
  background-color: var(--warning-color);
  color: white;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

// Demo Controls
.demo-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}
</style>