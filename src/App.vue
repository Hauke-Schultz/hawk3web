<script setup>
import { onMounted, ref } from 'vue'
import Header from './components/Header.vue'
import Settings from './components/Settings.vue'
import Home from './components/Home.vue'

// Reactive data
const theme = ref('dark')
const currentView = ref('home')
const playerProfile = {
  name: 'Hawk',
  level: 15,
  score: 1325,
  trophies: 5,
}

// Theme handling
const handleThemeChange = (newTheme) => {
  theme.value = newTheme
  localStorage.setItem('theme', newTheme)
  document.documentElement.setAttribute('data-theme', newTheme)
}

// Navigation handling
const handleBackToHome = () => {
  currentView.value = 'home'
}

const handleSettingsClick = () => {
  console.log('Opening settings...')
  currentView.value = 'settings'
}

// Game action handlers
const handleStartGame = () => {
  console.log('Starting game...')
}

const handleProfileClick = () => {
  console.log('Opening profile...')
}

const handleTrophyClick = () => {
  console.log('Opening trophies...')
}

const handlePackageClick = () => {
  console.log('Welcome back! Ready to continue your journey?')
}

const handleNotificationClick = () => {
  console.log('Notifications clicked')
}

// Lifecycle
onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>

<template>
  <div class="container" :class="theme" role="application">
    <!-- Home View -->
    <template v-if="currentView === 'home'">
      <Header
        :level="playerProfile.level"
        :show-profile="true"
        @profile-click="handleProfileClick"
        @menu-click="handleMenuClick"
        @notification-click="handleNotificationClick"
      />

      <Home
        :player-profile="playerProfile"
        @start-game="handleStartGame"
        @profile-click="handleProfileClick"
        @trophy-click="handleTrophyClick"
        @settings-click="handleSettingsClick"
        @package-click="handlePackageClick"
      />
    </template>

    <!-- Settings View -->
    <template v-else-if="currentView === 'settings'">
      <Header
        :show-profile="false"
        :show-back-button="true"
        :page-title="'Settings'"
        @back-click="handleBackToHome"
      />

      <Settings
        :current-theme="theme"
        @theme-change="handleThemeChange"
        @back="handleBackToHome"
      />
    </template>
  </div>
</template>

<style lang="scss">
#app {
  margin: 0 auto;
  display: flex;
  justify-content: center;
}

.container {
  min-height: 100vh;
  font-family: var(--font-family-base), sans-serif;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
  width: var(--content-width);
}

.content {
  padding: var(--space-4) 0;
  max-width: var(--content-width);
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  gap: var(--space-4);

  &:focus {
    outline: none;
  }
}
</style>