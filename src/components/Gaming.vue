<script setup>
import { computed, ref } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { memoryConfig } from '../config/memoryConfig.js'
import { fruitMergeConfig } from '../config/fruitMergeConfig.js'
import Icon from './Icon.vue'
import MemoryGame from './MemoryGame.vue'
import LevelSelection from "./LevelSelection.vue";
import FruitMergeGame from "./FruitMergeGame.vue";
import OldFruitMergeGame from "./OldFruitMergeGame.vue";

// LocalStorage service
const { gameData } = useLocalStorage()
const { t } = useI18n()

// View management
const currentView = ref('hub') // 'hub', 'memory-levels', 'memory-game', 'fruitmerge-levels', 'fruitmerge-game'
const selectedLevel = ref(1)

// Game methods
const startGame = (gameId) => {
  console.log(`Starting ${gameId} game...`)
  if (gameId === 'memory') {
    currentView.value = 'memory-levels'
  } else if (gameId === 'fruitMerge') {
    currentView.value = 'fruitmerge-levels'
  } else if (gameId === 'oldFruitMerge') {
    currentView.value = 'old-fruitmerge'
  }
}

// Neue Funktionen hinzufügen:
const handlePlayLevel = (levelNumber) => {
  selectedLevel.value = levelNumber
  currentView.value = 'memory-game'
}

const backToHub = () => {
  currentView.value = 'hub'
}

const backToLevels = () => {
  currentView.value = 'memory-levels'
}

const startFruitMergeGame = () => {
  console.log('Starting FruitMerge game...')
  currentView.value = 'fruitmerge-levels'
}

const handlePlayFruitMergeLevel = (levelNumber) => {
  selectedLevel.value = levelNumber
  currentView.value = 'fruitmerge-game'
}

const backToFruitMergeLevels = () => {
  currentView.value = 'fruitmerge-levels'
}

const handleGameComplete = (gameResult) => {
  console.log('Game completed:', gameResult)
}
</script>

<template>
  <main v-if="currentView === 'hub'" class="gaming-hub">
    <div class="hero-section">
      <h2 class="hero-title">{{ t('gaming.title') }}</h2>
      <p class="hero-subtitle">{{ t('gaming.subtitle') }}</p>
    </div>

    <div class="games-grid">
      <!-- Memory Game Card -->
      <div class="game-card">
        <div class="game-icon">
          <Icon :name="memoryConfig.gameIcon" size="56" />
        </div>
        <div class="game-info">
          <h3 class="game-title">{{ t('memory.title') }}</h3>
          <p class="game-description">{{ t('memory.description') }}</p>
          <div class="game-stats">
            <span class="best-score">{{ t('gaming.stats.best_score', { score: gameData.games.memory.highScore }) }}</span>
            <span class="games-played">{{ t('gaming.stats.games_played', { count: gameData.games.memory.gamesPlayed }) }}</span>
          </div>
        </div>
        <button class="btn" @click="startGame('memory')">
          <Icon name="play" size="20" />
          {{ t('common.play') }}
        </button>
      </div>

      <!-- FruitMerge Game Card (Coming Soon) -->
      <div class="game-card">
        <div class="game-icon">
          <Icon :name="fruitMergeConfig.gameIcon" size="56" />
        </div>
        <div class="game-info">
          <h3 class="game-title">{{ fruitMergeConfig.gameTitle }}</h3>
          <p class="game-description">{{ fruitMergeConfig.gameDescription }}</p>
          <div class="game-stats">
            <span class="best-score">{{ t('gaming.stats.best_score', { score: gameData.games.fruitMerge.highScore }) }}</span>
            <span class="games-played">{{ t('gaming.stats.games_played', { count: gameData.games.fruitMerge.gamesPlayed }) }}</span>
          </div>
        </div>
        <button class="btn" @click="startGame('fruitMerge')">
          <Icon name="play" size="20" />
          {{ t('common.play') }}
        </button>
      </div>

      <!-- Old FruitMerge Game Card (Coming Soon) -->
      <div class="game-card">
        <div class="game-icon">

        </div>
        <div class="game-info">
          <h3 class="game-title">Old Fruit</h3>
        </div>
        <button class="btn" @click="startGame('oldFruitMerge')">
          <Icon name="play" size="20" />
          {{ t('common.play') }}
        </button>
      </div>
    </div>
  </main>

  <!-- Memory Game Level Selection -->
  <LevelSelection
    v-else-if="currentView === 'memory-levels'"
    :game-id="memoryConfig.gameId"
    :game-title="memoryConfig.gameTitle"
    :levels="memoryConfig.levels"
    theme="primary"
    @play-level="handlePlayLevel"
    @back-to-game-hub="backToHub"
  />

  <LevelSelection
    v-else-if="currentView === 'fruitmerge-levels'"
    :game-id="fruitMergeConfig.gameId"
    :game-title="fruitMergeConfig.gameTitle"
    :levels="fruitMergeConfig.levels"
    theme="warning"
    @play-level="handlePlayFruitMergeLevel"
    @back-to-game-hub="backToHub"
  />

  <!-- Memory Game View -->
  <MemoryGame
    v-else-if="currentView === 'memory-game'"
    :level="selectedLevel"
    @back-to-gaming="backToLevels"
    @game-complete="handleGameComplete"
  />

  <!-- FruitMerge Game View -->
  <FruitMergeGame
    v-else-if="currentView === 'fruitmerge-game'"
    :level="selectedLevel"
    @back-to-gaming="backToFruitMergeLevels"
    @game-complete="handleGameComplete"
  />

  <!-- Old FruitMerge Game View -->
  <OldFruitMergeGame
    v-else-if="currentView === 'old-fruitmerge'"
    @back-to-gaming="backToHub"
    @game-complete="handleGameComplete"
  />
</template>

<style lang="scss" scoped>
// Gaming Hub Main Container
.gaming-hub {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
}

// Hero Section
.hero-section {
  text-align: center;
  padding: var(--space-4) 0;
}

.hero-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0 0 var(--space-2) 0;
}

.hero-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

// Games Grid
.games-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

// Game Cards
.game-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
  transition: all 0.2s ease;
  position: relative;

  &:hover:not(&--coming-soon) {
    background-color: var(--card-bg-hover);
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-2px);
  }

  &--coming-soon {
    opacity: 0.7;

    .btn {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
}

.game-icon {
  color: white;
  border-radius: 50%;
  width: var(--space-14);
  height: var(--space-14);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.game-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.game-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.game-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.game-stats {
  display: flex;
  gap: var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.best-score,
.games-played {
  font-weight: var(--font-weight-bold);
}

.coming-soon-badge {
  background-color: var(--warning-color);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  width: fit-content;
}

</style>