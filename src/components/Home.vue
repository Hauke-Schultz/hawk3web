<script setup>
import { defineProps, defineEmits } from 'vue'
import Icon from "./Icon.vue";
import WelcomeCard from "./WelcomeCard.vue";

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

// Emits for parent component communication
const emit = defineEmits([
  'start-game',
  'profile-click',
  'trophy-click',
  'settings-click',
  'package-click'
])

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
</script>

<template>
  <!-- Main Content Area -->
  <main class="content">

    <!-- Welcome Back Section -->
    <WelcomeCard
      title="Welcome back!"
      subtitle="Ready to continue your journey?"
      @click="handlePackageClick"
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