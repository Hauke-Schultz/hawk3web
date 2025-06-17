<script setup>
import { onMounted, ref } from 'vue'
import { useLocalStorage } from './composables/useLocalStorage.js'
import Header from './components/Header.vue'
import Settings from './components/Settings.vue'
import Profile from './components/Profile.vue'
import Home from './components/Home.vue'
import Gaming from "./components/Gaming.vue";
import Trophy from "./components/Trophy.vue";

// LocalStorage service
const { gameData, updatePlayer, updateSettings, checkAutoAchievements } = useLocalStorage()

// Reactive data
const currentView = ref('home')

// Theme handling
const handleThemeChange = (newTheme) => {
  updateSettings({ theme: newTheme })
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

const handleProfileClick = () => {
  console.log('Opening profile...')
  currentView.value = 'profile'
}

// Game action handlers
const handleStartGame = () => {
  console.log('Opening gaming hub...')
  currentView.value = 'gaming'
}

const handleGameStart = (game) => {
  console.log(`Starting ${game.name}...`)
  // TODO: Navigate to specific game
}

const handleTrophyClick = () => {
  console.log('Opening trophies...')
  currentView.value = 'trophy'
}

const handlePackageClick = () => {
  console.log('Welcome back! Ready to continue your journey?')
}

const handleNotificationClick = () => {
  console.log('Notifications clicked')
}

// Lifecycle
onMounted(() => {
  document.documentElement.setAttribute('data-theme', gameData.settings.theme)
  checkAutoAchievements()
})
</script>

<template>
  <div class="container" :class="gameData.settings.theme" role="application">
    <!-- Home View -->
    <template v-if="currentView === 'home'">
      <Header
        :show-profile="true"
        @profile-click="handleProfileClick"
        @notification-click="handleNotificationClick"
      />

      <Home
        :player-profile="gameData.player"
        @start-game="handleStartGame"
        @profile-click="handleProfileClick"
        @trophy-click="handleTrophyClick"
        @settings-click="handleSettingsClick"
        @package-click="handlePackageClick"
      />
    </template>

    <!-- Gaming View -->
    <template v-else-if="currentView === 'gaming'">
      <Header
        :show-profile="true"
        :show-back-button="true"
        :page-title="'Gaming Hub'"
        @back-click="handleBackToHome"
      />

      <Gaming
        @start-game="handleGameStart"
        @back-to-home="handleBackToHome"
      />
    </template>

    <!-- Trophy View -->
    <template v-else-if="currentView === 'trophy'">
      <Header
        :show-profile="true"
        :show-back-button="true"
        :page-title="'Trophies'"
        @back-click="handleBackToHome"
      />

      <Trophy />
    </template>

    <!-- Profile View -->
    <template v-else-if="currentView === 'profile'">
      <Header
        :show-profile="true"
        :show-back-button="true"
        :page-title="'Profile'"
        @back-click="handleBackToHome"
      />

      <Profile />
    </template>

    <!-- Settings View -->
    <template v-else-if="currentView === 'settings'">
      <Header
        :show-profile="true"
        :show-back-button="true"
        :page-title="'Settings'"
        @back-click="handleBackToHome"
      />

      <Settings
        :current-theme="gameData.settings.theme"
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