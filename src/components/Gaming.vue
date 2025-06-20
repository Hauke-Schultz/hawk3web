<script setup>
import { computed, ref } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { memoryConfig } from '../config/memoryConfig.js'
import Icon from './Icon.vue'
import MemoryGame from './MemoryGame.vue'
import LevelSelection from "./LevelSelection.vue";

// LocalStorage service
const { gameData } = useLocalStorage()

// View management
const currentView = ref('hub') // 'hub', 'memory-levels', 'memory-game'
const selectedLevel = ref(1)

// Game methods
const startGame = (gameId) => {
  console.log(`Starting ${gameId} game...`)
  if (gameId === 'memory') {
    currentView.value = 'memory-levels'
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

const handleGameComplete = (gameResult) => {
  console.log('Game completed:', gameResult)
}
</script>

<template>
  <main v-if="currentView === 'hub'" class="gaming-hub">
    <div class="hero-section">
      <h2 class="hero-title">Gaming Hub</h2>
      <p class="hero-subtitle">Challenge yourself with exciting games</p>
    </div>

    <div class="games-grid">
      <!-- Memory Game Card -->
      <div class="game-card">
        <div class="game-icon">
          <Icon :name="memoryConfig.gameIcon" size="56" />
        </div>
        <div class="game-info">
          <h3 class="game-title">{{ memoryConfig.gameTitle }}</h3>
          <p class="game-description">{{ memoryConfig.gameDescription }}</p>
          <div class="game-stats">
            <span class="best-score">Best: {{ gameData.games.memory.highScore }}</span>
            <span class="games-played">{{ gameData.games.memory.gamesPlayed }} played</span>
          </div>
        </div>
        <button class="btn" @click="startGame('memory')">
          <Icon name="play" size="20" />
          Play
        </button>
      </div>

      <!-- FruitMerge Game Card (Coming Soon) -->
      <div class="game-card game-card--coming-soon">
        <div class="game-icon">
          <Icon name="play" size="32" />
        </div>
        <div class="game-info">
          <h3 class="game-title">Fruit Merge</h3>
          <p class="game-description">Merge fruits to create new combinations</p>
          <div class="coming-soon-badge">Coming Soon</div>
        </div>
        <button class="btn" disabled>
          <Icon name="play" size="20" />
          Soon
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

  <!-- Memory Game View aktualisieren: -->
  <MemoryGame
    v-else-if="currentView === 'memory-game'"
    :level="selectedLevel"
    @back-to-gaming="backToLevels"
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