<script setup>
import {defineProps, defineEmits, computed} from 'vue'
import Icon from "./Icon.vue";
import WelcomeCard from "./WelcomeCard.vue";
import TrophyCard from "./TrophyCard.vue";
import { useLocalStorage } from '../composables/useLocalStorage.js'

// Props from parent component
const props = defineProps({
  playerProfile: {
    type: Object,
    required: true,
    default: () => ({
      name: 'Hawk',
      level: 15,
      score: 1325,
      trophies: 5,
    })
  }
})

// LocalStorage service for achievements
const { gameData, markCardAsRead, isCardRead } = useLocalStorage()

// Emits for parent component communication
const emit = defineEmits([
  'start-game',
  'profile-click',
  'trophy-click',
  'settings-click',
  'package-click'
])

// All possible achievements for mapping
const allAchievements = [
  {
    id: 'welcome',
    name: 'Welcome to Hawk3',
    description: 'Started your gaming journey'
  },
  {
    id: 'first_game',
    name: 'First Game',
    description: 'Played your first game'
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reached level 5'
  },
  {
    id: 'level_10',
    name: 'Dedicated Player',
    description: 'Reached level 10'
  },
  {
    id: 'level_15',
    name: 'Gaming Expert',
    description: 'Reached level 15'
  },
  {
    id: 'score_1000',
    name: 'Score Hunter',
    description: 'Earned 1000 total points'
  },
  {
    id: 'games_10',
    name: 'Game Enthusiast',
    description: 'Played 10 games'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a game with perfect score'
  }
]

const isWelcomeCardVisible = computed(() => {
  return !isCardRead('welcomeCard')
})

const isTrophyCardVisible = computed(() => {
  return !isCardRead('trophyCard') && recentAchievements.value.length > 0
})

// Computed values for achievements
const recentAchievements = computed(() => {
  return gameData.achievements
    .filter(achievement => achievement.earned)
    .map(achievement => {
      const details = allAchievements.find(a => a.id === achievement.id)
      return {
        ...achievement,
        name: details?.name || achievement.name || 'Unknown Achievement'
      }
    })
    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
    .slice(0, 3) // Show last 3 achievements
})

const achievementStats = computed(() => {
  const earned = gameData.achievements.filter(a => a.earned).length
  const total = allAchievements.length

  return {
    earned,
    total
  }
})

// Event handlers - emit to parent component
const handleStartGame = () => {
  emit('start-game')
}

const handleProfileClick = () => {
  emit('profile-click')
}

const handleTrophyClick = () => {
  emit('trophy-click')
}

const handleSettingsClick = () => {
  emit('settings-click')
}

const handlePackageClick = () => {
  emit('package-click')
}

// Card read handlers
const handleCardRead = (cardType) => {
  console.log(`Marking ${cardType} as read...`)
  markCardAsRead(cardType)
}

</script>

<template>
  <!-- Main Content Area -->
  <main class="content">

    <!-- Welcome Back Section -->
    <WelcomeCard
      v-if="isWelcomeCardVisible"
      title="Welcome back!"
      subtitle="Ready to continue your journey?"
      card-type="welcomeCard"
      :hide-when-read="true"
      @mark-as-read="handleCardRead"
      @click="handlePackageClick"
    />

    <!-- Latest Trophies Section -->
    <TrophyCard
      v-if="isTrophyCardVisible"
      :achievements="recentAchievements"
      :total-earned="achievementStats.earned"
      :total-achievements="achievementStats.total"
      card-type="trophyCard"
      :hide-when-read="true"
      @mark-as-read="handleCardRead"
      @trophy-click="handleTrophyClick"
    />

    <!-- Game Actions Section -->
    <section class="game-actions" aria-label="Game Actions">
      <!-- Start Game Card -->
      <div
        class="action-card"
        @click="handleStartGame"
        @keydown.enter="handleStartGame"
        tabindex="0"
        role="button"
        aria-label="Start new game"
      >
        <div class="card-icon">
          <div class="icon-btn btn--primary" aria-label="Play">
            <Icon name="play" size="32" />
          </div>
        </div>
        <div class="card-content">
          <h2 class="card-title">Start</h2>
        </div>
      </div>

      <!-- Profile Card -->
      <div
        class="action-card"
        @click="handleProfileClick"
        @keydown.enter="handleProfileClick"
        tabindex="0"
        role="button"
        aria-label="View profile"
      >
        <div class="card-icon">
          <div class="icon-btn btn--success" aria-label="Profile">
            <Icon name="user" size="32" />
          </div>
        </div>
        <div class="card-content">
          <h2 class="card-title">Profile</h2>
        </div>
      </div>

      <!-- Trophy Card -->
      <div
        class="action-card"
        @click="handleTrophyClick"
        @keydown.enter="handleTrophyClick"
        tabindex="0"
        role="button"
        aria-label="View trophies"
      >
        <div class="card-icon">
          <div class="icon-btn btn--warning" aria-label="Trophies">
            <Icon name="trophy" size="32" />
          </div>
        </div>
        <div class="card-content">
          <h2 class="card-title">Trophy</h2>
        </div>
      </div>

      <!-- Settings Card -->
      <div
        class="action-card"
        @click="handleSettingsClick"
        @keydown.enter="handleSettingsClick"
        tabindex="0"
        role="button"
        aria-label="Open settings"
      >
        <div class="card-icon">
          <div class="icon-btn btn--info" aria-label="Settings">
            <Icon name="settings" size="32" />
          </div>
        </div>
        <div class="card-content">
          <h2 class="card-title">Settings</h2>
        </div>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>

/* Game Actions Section */
.game-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.action-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-3);
  display: flex;
  align-items: center;
  gap: var(--space-3);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;

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

  &:active {
    transform: translateY(0);
  }
}

.card-icon {
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-title {
  color: var(--text-color);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

</style>