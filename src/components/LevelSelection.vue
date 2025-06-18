<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import GameLevelTile from './GameLevelTile.vue'
import Icon from './Icon.vue'

// Props for the level selection component
const props = defineProps({
  // Game identifier
  gameId: {
    type: String,
    required: true
  },
  // Game title
  gameTitle: {
    type: String,
    required: true
  },
  // Game levels configuration
  levels: {
    type: Array,
    required: true
  },
  // Theme for the tiles
  theme: {
    type: String,
    default: 'primary'
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'play-level',
  'back-to-game-hub'
])

// LocalStorage service
const { gameData } = useLocalStorage()

// Computed game data
const gameStats = computed(() => {
  return gameData.games[props.gameId] || {}
})

// Compute level data with completion status
const levelData = computed(() => {
  return props.levels.map((level, index) => {
    const levelNumber = index + 1
    const levelStats = gameStats.value.levels?.[levelNumber] || {}

    // A level is unlocked if it's the first level or the previous level is completed
    const isUnlocked = levelNumber === 1 ||
      (gameStats.value.levels?.[levelNumber - 1]?.completed || false)

    // Calculate stars based on performance (0-3 stars)
    const stars = calculateStars(levelStats, level)

    return {
      level: levelNumber,
      title: level.title || `Level ${levelNumber}`,
      description: level.description || `Match ${level.pairs} pairs`,
      pairs: level.pairs,
      timeBonus: level.timeBonus,
      isLocked: !isUnlocked,
      isCompleted: levelStats.completed || false,
      highScore: levelStats.highScore || 0,
      bestTime: levelStats.bestTime || null,
      stars: stars,
      attempts: levelStats.attempts || 0
    }
  })
})

// Calculate star rating based on performance
const calculateStars = (levelStats, levelConfig) => {
  if (!levelStats.completed) return 0

  const { score, time, moves } = levelStats.bestPerformance || {}
  if (!score) return 1 // Minimum 1 star for completion

  const maxPossibleScore = getMaxPossibleScore(levelConfig, time, moves)
  const scorePercentage = (score / maxPossibleScore) * 100

  if (scorePercentage >= 90) return 3 // 3 stars for 90%+ efficiency
  if (scorePercentage >= 70) return 2 // 2 stars for 70%+ efficiency
  return 1 // 1 star for completion
}

// Calculate maximum possible score for a level
const getMaxPossibleScore = (levelConfig, actualTime, actualMoves) => {
  const baseScore = levelConfig.pairs * 100
  const perfectMoves = levelConfig.pairs // Perfect game uses minimum moves
  const timeBonus = levelConfig.timeBonus

  return baseScore + (perfectMoves * 10) + timeBonus
}

// Completion stats
const completionStats = computed(() => {
  const completed = levelData.value.filter(level => level.isCompleted).length
  const total = levelData.value.length
  const totalStars = levelData.value.reduce((sum, level) => sum + level.stars, 0)
  const maxStars = total * 3

  return {
    completed,
    total,
    totalStars,
    maxStars,
    percentage: Math.round((completed / total) * 100)
  }
})

// Event handlers
const handlePlayLevel = (levelNumber) => {
  emit('play-level', levelNumber)
}

const handleBackToHub = () => {
  emit('back-to-game-hub')
}
</script>

<template>
  <main class="level-selection">
    <!-- Header Section -->
    <div class="level-header">
      <div class="level-title-section">
        <h2 class="level-title">{{ gameTitle }}</h2>
        <p class="level-subtitle">Choose your level</p>
      </div>

      <button
        class="btn btn--ghost btn--small"
        @click="handleBackToHub"
        aria-label="Back to game hub"
      >
        <Icon name="arrow-left" size="16" />
        Back
      </button>
    </div>

    <!-- Progress Overview -->
    <div class="progress-overview">
      <div class="progress-stats">
        <div class="progress-item">
          <span class="progress-number">{{ completionStats.completed }}</span>
          <span class="progress-label">/ {{ completionStats.total }} Levels</span>
        </div>
        <div class="progress-item">
          <span class="progress-number">{{ completionStats.totalStars }}</span>
          <span class="progress-label">/ {{ completionStats.maxStars }} Stars</span>
        </div>
        <div class="progress-item">
          <span class="progress-number">{{ completionStats.percentage }}%</span>
          <span class="progress-label">Complete</span>
        </div>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar">
        <div
          class="progress-fill"
          :style="{ width: `${completionStats.percentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Levels Grid -->
    <div class="levels-grid">
      <GameLevelTile
        v-for="level in levelData"
        :key="level.level"
        :level="level.level"
        :title="level.title"
        :description="level.description"
        :is-locked="level.isLocked"
        :is-completed="level.isCompleted"
        :stars="level.stars"
        :high-score="level.highScore"
        :best-time="level.bestTime"
        :theme="theme"
        @play-level="handlePlayLevel"
      />
    </div>

    <!-- Game Tips (if no levels completed) -->
    <div v-if="completionStats.completed === 0" class="game-tips">
      <div class="tips-card">
        <div class="tips-header">
          <Icon name="brain" size="24" />
          <h3>Memory Game Tips</h3>
        </div>
        <ul class="tips-list">
          <li>Start with easier levels to practice</li>
          <li>Try to remember card positions</li>
          <li>Complete levels faster for higher scores</li>
          <li>Use fewer moves to earn more stars</li>
        </ul>
      </div>
    </div>
  </main>
</template>

<style lang="scss" scoped>
// Main Container
.level-selection {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
}

// Header Section
.level-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
}

.level-title-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.level-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.level-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

// Progress Overview
.progress-overview {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.progress-stats {
  display: flex;
  gap: var(--space-6);
  justify-content: center;
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.progress-number {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
}

.progress-bar {
  height: var(--space-2);
  background-color: var(--card-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  border-radius: var(--border-radius-md);
  transition: width 0.3s ease;
}

// Levels Grid
.levels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-4);
  justify-items: center;
}

// Game Tips
.game-tips {
  margin-top: var(--space-4);
}

.tips-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.tips-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--primary-color);

  h3 {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-color);
    margin: 0;
  }
}

.tips-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);

  li {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1.4;
    padding-left: var(--space-4);
    position: relative;

    &::before {
      content: '•';
      color: var(--primary-color);
      font-weight: var(--font-weight-bold);
      position: absolute;
      left: 0;
    }
  }
}

// Responsive Design
@media (max-width: 480px) {
  .level-header {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-3);
  }

  .progress-stats {
    gap: var(--space-4);
  }

  .levels-grid {
    grid-template-columns: 1fr;
    gap: var(--space-3);
  }
}

@media (max-width: 600px) {
  .levels-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (min-width: 768px) {
  .levels-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
</style>