<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import Icon from "./Icon.vue"

// LocalStorage service for game statistics
const { gameData } = useLocalStorage()

// Available games configuration - nur die ersten 2 Spiele
const availableGames = [
  {
    id: 'memory',
    name: 'Memory Game',
    description: 'Test your memory with card matching',
    icon: 'play',
    color: 'primary',
    status: 'coming-soon', // 'available', 'coming-soon', 'locked'
  },
  {
    id: 'fruitMerge',
    name: 'Fruit Merge',
    description: 'Merge fruits to create new combinations',
    icon: 'play',
    color: 'success',
    status: 'coming-soon',
  }
]

// Computed game statistics
const getGameStats = (gameId) => {
  return gameData.games[gameId] || {
    highScore: 0,
    gamesPlayed: 0,
    totalScore: 0,
    bestTime: null,
    averageTime: null
  }
}

// Event handlers
const emit = defineEmits([
  'start-game',
  'back-to-home'
])

const handleGameStart = (game) => {
  if (game.status === 'available') {
    emit('start-game', game)
  } else {
    console.log(`${game.name} is ${game.status}`)
  }
}

const handleBackToHome = () => {
  emit('back-to-home')
}
</script>

<template>
  <main class="content">
    <!-- Games Header -->
    <section class="games-header">
      <h2 class="games-title">Choose Your Game</h2>
      <p class="games-subtitle">Select a game to start your adventure</p>
    </section>

    <!-- Games Grid -->
    <section class="games-grid" aria-label="Available Games">
      <div
        v-for="game in availableGames"
        :key="game.id"
        class="game-card"
        :class="{
          'game-card--available': game.status === 'available',
          'game-card--coming-soon': game.status === 'coming-soon',
          'game-card--locked': game.status === 'locked'
        }"
        @click="handleGameStart(game)"
        @keydown.enter="handleGameStart(game)"
        tabindex="0"
        role="button"
        :aria-label="`${game.name} - ${game.status}`"
      >
        <!-- Game Icon -->
        <div class="game-icon">
          <div
            class="icon-btn"
            :class="`btn--${game.color}`"
            :aria-label="game.name"
          >
            <Icon :name="game.icon" size="28" />
          </div>
        </div>

        <!-- Game Content -->
        <div class="game-content">
          <div class="game-header">
            <h3 class="game-name">{{ game.name }}</h3>
            <div
              class="game-status-badge"
              :class="`badge--${game.status}`"
            >
              {{ game.status === 'coming-soon' ? 'Coming Soon' :
              game.status === 'locked' ? 'Locked' : 'Available' }}
            </div>
          </div>

          <p class="game-description">{{ game.description }}</p>

          <!-- Game Info mit Highscore und Punkten -->
          <div class="game-info">
            <div class="personal-stats">
              <div class="personal-stat">
                <span class="stat-label">Highscore</span>
                <span class="stat-value">{{ getGameStats(game.id).highScore.toString() }}</span>
              </div>
              <div class="personal-stat">
                <span class="stat-label">Points</span>
                <span class="stat-value">{{ getGameStats(game.id).totalScore.toString() }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Play Button Overlay (nur für verfügbare Spiele) -->
        <div
          v-if="game.status === 'available'"
          class="game-play-overlay"
        >
          <div class="play-button">
            <Icon name="play" size="24" />
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
// Games Header
.games-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.games-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0 0 var(--space-2) 0;
}

.games-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

// Games Grid
.games-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-6);
}

// Game Card
.game-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  align-items: flex-start;
  gap: var(--space-4);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;

  &:hover {
    background-color: var(--card-bg-hover);
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-1px);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
    box-shadow: var(--focus-shadow);
  }

  &--available {
    &:hover .game-play-overlay {
      opacity: 1;
      visibility: visible;
    }
  }

  &--coming-soon {
    opacity: 0.8;
    cursor: default;

    &:hover {
      transform: none;
      box-shadow: var(--card-shadow);
    }
  }

  &--locked {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      transform: none;
      box-shadow: var(--card-shadow);
      background-color: var(--card-bg);
    }
  }
}

.game-icon {
  flex-shrink: 0;
}

.game-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.game-name {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.game-status-badge {
  padding: var(--space-1) var(--space-2);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;

  &.badge--available {
    background-color: var(--success-color);
    color: white;
  }

  &.badge--coming-soon {
    background-color: var(--warning-color);
    color: white;
  }

  &.badge--locked {
    background-color: var(--info-color);
    color: white;
  }
}

.game-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

// Game Info mit Personal Stats
.game-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.personal-stats {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-3);
  background-color: var(--card-bg-hover);
  border-radius: var(--border-radius-md);
  border: 1px solid var(--card-border);
}

.personal-stat {
  display: flex;
  flex-direction: column;
  gap: var(--space-0);
  align-items: flex-start;
  flex: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
  font-weight: var(--font-weight-base);
  text-transform: uppercase;
}

.stat-value {
  font-size: var(--font-size-base);
  color: var(--text-color);
  font-weight: var(--font-weight-bold);
}

.game-meta {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.meta-item {
  font-size: var(--font-size-xs);
  color: var(--text-muted);

  strong {
    color: var(--text-secondary);
  }
}

// Play Button Overlay
.game-play-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background-color: rgba(79, 70, 229, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  visibility: hidden;
  transition: all 0.2s ease;
  border-radius: var(--border-radius-xl);
}

.play-button {
  background-color: white;
  color: var(--primary-color);
  border-radius: 50%;
  width: var(--space-12);
  height: var(--space-12);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.2);
}

// Games Actions
.games-actions {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
}
</style>