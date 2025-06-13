
<script setup>
import { onMounted, ref } from 'vue'
import Header from './components/Header.vue'

// Reactive data
const theme = ref('dark')
const playerProfile = {
  name: 'Hawk',
  level: 15,
  score: 1325,
  trophies: 5,
}

// Methods
const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem('theme', theme.value)
  document.documentElement.setAttribute('data-theme', theme.value)
}

const handleStartGame = () => {
  console.log('Starting game...')
  // Game start logic here
}

const handleProfileClick = () => {
  console.log('Opening profile...')
  // Profile logic here
}

const handleTrophyClick = () => {
  console.log('Opening trophies...')
  // Trophy logic here
}

const handleSettingsClick = () => {
  console.log('Opening settings...')
  // Settings logic here
}

const handlePackageClick = () => {
  console.log('Welcome back! Ready to continue your journey?')
  // Continue journey logic here
}

// Header event handlers
const handleMenuClick = (isOpen) => {
  console.log('Menu toggled:', isOpen)
  // Handle mobile menu toggle
}

const handleNotificationClick = () => {
  console.log('Notifications clicked')
  // Handle notification logic
}

// Lifecycle
onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'dark'
  document.documentElement.setAttribute('data-theme', theme.value)
})
</script>

<template>
  <div class="app-container" :class="theme" role="application">
    <!-- New Header Component -->
    <Header
      :level="playerProfile.level"
      :theme="theme"
      :show-navigation="true"
      :show-profile="true"
      @toggle-theme="toggleTheme"
      @profile-click="handleProfileClick"
      @menu-click="handleMenuClick"
      @notification-click="handleNotificationClick"
    />

    <!-- Main Content Area -->
    <main class="main-content" id="main-content">
      <!-- Game Actions Section -->
      <section class="game-actions" aria-label="Game Actions">
        <!-- Start Game Card -->
        <div class="action-card" @click="handleStartGame" @keydown.enter="handleStartGame" tabindex="0" role="button" aria-label="Start new game">
          <div class="card-icon">
            <button class="icon-btn icon-btn--primary" aria-label="Play">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z"/>
              </svg>
            </button>
          </div>
          <div class="card-content">
            <h2 class="card-title">Start</h2>
          </div>
        </div>

        <!-- Profile Card -->
        <div class="action-card" @click="handleProfileClick" @keydown.enter="handleProfileClick" tabindex="0" role="button" aria-label="View profile">
          <div class="card-icon">
            <button class="icon-btn icon-btn--success" aria-label="Profile">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
            </button>
          </div>
          <div class="card-content">
            <h2 class="card-title">Profile</h2>
          </div>
        </div>

        <!-- Trophy Card -->
        <div class="action-card" @click="handleTrophyClick" @keydown.enter="handleTrophyClick" tabindex="0" role="button" aria-label="View trophies">
          <div class="card-icon">
            <button class="icon-btn icon-btn--warning" aria-label="Trophies">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
                <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
                <path d="M4 22h16"/>
                <path d="M10 14.66V17c0 .55.47.98.97 1.21C12.04 18.75 13 19.38 13 20.15"/>
                <path d="M14 14.66V17c0 .55-.47.98-.97 1.21C11.96 18.75 11 19.38 11 20.15"/>
                <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/>
              </svg>
            </button>
          </div>
          <div class="card-content">
            <h2 class="card-title">Trophy</h2>
          </div>
        </div>

        <!-- Settings Card -->
        <div class="action-card" @click="handleSettingsClick" @keydown.enter="handleSettingsClick" tabindex="0" role="button" aria-label="Open settings">
          <div class="card-icon">
            <button class="icon-btn icon-btn--info" aria-label="Settings">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6m11-7h-6m-6 0H1"/>
              </svg>
            </button>
          </div>
          <div class="card-content">
            <h2 class="card-title">Settings</h2>
          </div>
        </div>
      </section>

      <!-- Welcome Back Section -->
      <section class="welcome-section" aria-label="Welcome back">
        <div class="welcome-card" @click="handlePackageClick" @keydown.enter="handlePackageClick" tabindex="0" role="button">
          <div class="welcome-content">
            <h2 class="welcome-title">Welcome back!</h2>
            <p class="welcome-subtitle">Ready to continue your journey?</p>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss">
.app-container {
  min-height: 100vh;
  font-family: var(--font-family-base);
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* Header Styles */
.app-header {
  background-color: var(--bg-header);
  padding: var(--space-4) var(--space-6);
  border-bottom: 1px solid var(--card-border);
}

.header-content {
  max-width: 375px; /* Mobile-first approach */
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.level-display {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--primary-color);
  padding: var(--space-2) var(--space-3);
  border-radius: 50px;
  min-width: 4rem;
  justify-content: center;
}

.level-number {
  color: white;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

.level-star {
  color: var(--warning-color);
  font-size: var(--font-size-base);
}

.app-title {
  color: var(--text-color);
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
}

/* Main Content */
.main-content {
  flex: 1;
  padding: var(--space-6);
  max-width: 375px; /* Mobile-first approach */
  margin: 0 auto;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-8);

  &:focus {
    outline: none;
  }
}

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
  padding: var(--space-4);
  display: flex;
  align-items: center;
  gap: var(--space-4);
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

/* Welcome Section */
.welcome-section {
  margin-top: auto; /* Push to bottom */
}

.welcome-card {
  background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));
  border-radius: var(--border-radius-xl);
  padding: var(--space-6);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;

  &:hover {
    opacity: 0.95;
    transform: translateY(-2px);
    box-shadow: 0 0.5rem 2rem rgba(68, 51, 255, 0.3);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
  }

  &:active {
    transform: translateY(0);
  }
}

.welcome-content {
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: flex-start;
}

.welcome-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--space-2) 0;
  color: white;
}

.welcome-subtitle {
  font-size: var(--font-size-base);
  margin: 0;
  opacity: 0.9;
  color: var(--text-secondary);
}

/* Icon Button Styles */
.icon-btn {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: var(--font-size-lg);

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
    box-shadow: var(--focus-shadow);
  }

  &--primary {
    background-color: var(--primary-color);
    color: white;

    &:hover {
      background-color: var(--primary-hover);
      transform: scale(1.05);
    }
  }

  &--success {
    background-color: var(--success-color);
    color: white;

    &:hover {
      background-color: var(--success-hover);
      transform: scale(1.05);
    }
  }

  &--warning {
    background-color: var(--warning-color);
    color: white;

    &:hover {
      background-color: var(--warning-hover);
      transform: scale(1.05);
    }
  }

  &--info {
    background-color: var(--info-color);
    color: white;

    &:hover {
      background-color: var(--info-hover);
      transform: scale(1.05);
    }
  }
}

/* Theme Toggle */
.theme-toggle {
  position: fixed;
  top: var(--space-4);
  right: var(--space-4);
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--font-size-lg);
  transition: all 0.2s ease;
  z-index: 100;

  &:hover {
    background-color: var(--card-bg-hover);
    transform: scale(1.1);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
    box-shadow: var(--focus-shadow);
  }
}

</style>