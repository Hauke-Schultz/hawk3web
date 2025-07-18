<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import GameLevelTile from './GameLevelTile.vue'
import Icon from './Icon.vue'
import ProgressOverview from "./ProgressOverview.vue";
import { calculateLevelStars, getLevelTitle, getLevelDescription } from "../config/levelUtils.js"
import Header from "./Header.vue";

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
const { t } = useI18n()

// Computed game data
const gameStats = computed(() => {
  return gameData.games[props.gameId] || {}
})

// Compute level data with completion status
const levelData = computed(() => {
  return props.levels.map((level, index) => {
    const levelNumber = index + 1
    const levelStats = gameStats.value.levels?.[levelNumber] || {}

    const isUnlocked = levelNumber === 1 ||
      (gameStats.value.levels?.[levelNumber - 1]?.completed || false)

    const stars = calculateLevelStars(levelStats, level)
    const title = getLevelTitle(levelNumber, props.gameId, t)
    const description = getLevelDescription(levelNumber, props.gameId, t)

    return {
      level: levelNumber,
      title: title,
      description: description,
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
        <p class="level-subtitle">{{ t('gaming.choose_level') }}</p>
      </div>

      <button
        class="btn btn--ghost btn--small"
        @click="handleBackToHub"
        :aria-label="t('gaming.back_to_game_hub')"
      >
        <Icon name="arrow-left" size="16" />
        {{ t('common.back') }}
      </button>
    </div>

    <!-- Progress Overview -->
    <ProgressOverview
      :completed="completionStats.completed"
      :total="completionStats.total"
      :total-stars="completionStats.totalStars"
      :max-stars="completionStats.maxStars"
      :theme="theme"
      :levels-label="t('gaming.stats.levels')"
      :stars-label="t('gaming.stats.stars')"
      :complete-label="t('common.complete')"
    />

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
        :game-type="gameId"
        @play-level="handlePlayLevel"
      />
    </div>
  </main>
</template>

<style lang="scss" scoped>
// Main Container
.level-selection {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
}

// Header Section
.level-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
}

.level-title-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.level-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.level-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
}

.levels-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--space-2);
  justify-items: stretch;
}

</style>