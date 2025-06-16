<script setup>
import { ref, computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import Icon from "./Icon.vue";

// LocalStorage service
const { gameData } = useLocalStorage()

// Props for the header component
const props = defineProps({
  title: {
    type: String,
    default: 'Hawk3'
  },
  subtitle: {
    type: String,
    default: 'Gaming Platform'
  },
  showProfile: {
    type: Boolean,
    default: true
  },
  showNotifications: {
    type: Boolean,
    default: true
  },
  showBackButton: {
    type: Boolean,
    default: false
  },
  pageTitle: {
    type: String,
    default: ''
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'profile-click',
  'notification-click',
  'back-click'
])

// Reactive state
const notificationCount = ref(3)

// Computed properties for player data from store
const levelDisplay = computed(() => {
  const level = gameData.player.level
  return level < 10 ? `0${level}` : level.toString()
})

const playerInfo = computed(() => ({
  name: gameData.player.name,
  avatar: gameData.player.avatar,
  level: gameData.player.level
}))

// Event handlers
const handleNotificationClick = () => {
  emit('notification-click')
}

const handleBackClick = () => {
  emit('back-click')
}

const handleProfileClick = () => {
  emit('profile-click')
}
</script>

<template>
  <header class="header" role="banner">
    <div class="header-container">
      <!-- Left section -->
      <div class="header-left">
        <!-- Back Button -->
        <button
          v-if="showBackButton"
          class="btn btn--circle back-button"
          @click="handleBackClick"
          aria-label="Go back"
        >
          <Icon name="arrow-left" size="24" />
        </button>

        <!-- App Title/Logo for home page -->
        <div v-else class="header-title">
          <h1 class="app-title">{{ title }}</h1>
          <span class="app-subtitle">{{ subtitle }}</span>
        </div>
      </div>

      <!-- Center section -->
      <div class="header-center">
        <!-- Player Profile -->
        <div
          v-if="showProfile"
          class="player-profile"
          @click="handleProfileClick"
          @keydown.enter="handleProfileClick"
          tabindex="0"
          role="button"
          aria-label="View player profile"
        >
          <div class="player-avatar">
            <Icon :name="playerInfo.avatar" size="34" />
          </div>
          <div class="player-info">
            <span class="player-name">{{ playerInfo.name }}</span>
            <span class="player-status">Level {{ levelDisplay }}</span>
          </div>
        </div>
      </div>

      <!-- Right section -->
      <div class="header-right">
        <button
          v-if="showNotifications"
          class="btn btn--circle-ghost notification-btn"
          @click="handleNotificationClick"
          aria-label="View notifications"
        >
          <Icon name="bell" size="24" />
          <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
        </button>
      </div>
    </div>
  </header>
</template>

<style lang="scss" scoped>
.header {
  background-color: var(--bg-header);
  border-bottom: 1px solid var(--card-border);
  width: var(--content-width);
}

.header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-2) var(--space-4);
  height: 65px;
}

// Left Section
.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  flex: 1;
}

.header-title {
  display: flex;
  flex-direction: column;
  gap: 0;

  .app-title {
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
    color: var(--text-color);
    margin: 0;
    line-height: 1;
  }

  .app-subtitle {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    line-height: 1;
  }
}

// Center Section
.header-center {
  display: flex;
  justify-content: center;
  flex: 1;
}

.player-profile {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2rem;
  padding: var(--space-2);
  min-width: 180px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--card-bg-hover);
    box-shadow: var(--card-shadow-hover);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
  }
}

.player-avatar {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.player-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;

  .player-name {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    color: var(--text-color);
    line-height: 1;
  }

  .player-status {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
    line-height: 1;
    margin-top: var(--space-0);
  }
}

// Right Section
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  justify-content: flex-end;
}

.notification-badge {
  background-color: var(--error-color);
  color: var(--white);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  position: absolute;
  top: calc(-1 * var(--space-2));
  right: calc(-1 * var(--space-2));
  padding: var(--space-0) var(--space-1);
  border-radius: 50%;
  min-width: var(--space-5);
  height: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>