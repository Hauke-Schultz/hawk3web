<script setup>
import { ref, computed } from 'vue'

// Props for the header component
const props = defineProps({
  level: {
    type: Number,
    default: 15
  },
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

// Computed properties
const levelDisplay = computed(() => {
  return props.level < 10 ? `0${props.level}` : props.level.toString()
})

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
      <!-- Left section: Back button or Logo -->
      <div class="header-left">
        <!-- Back Button for settings and other pages -->
        <button
          v-if="showBackButton"
          class="btn btn--circle back-button"
          @click="handleBackClick"
          aria-label="Go back"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5m7-7l-7 7 7 7"/>
          </svg>
        </button>

        <!-- App Title/Logo for home page -->
        <div v-else class="header-title">
          <h1 class="app-title">{{ title }}</h1>
          <span class="app-subtitle">{{ subtitle }}</span>
        </div>
      </div>

      <!-- Center section: Page Title or Player Profile -->
      <div class="header-center">
        <!-- Page Title for non-home pages -->
        <h1 v-if="pageTitle" class="page-title">{{ pageTitle }}</h1>

        <!-- Player Profile for home page -->
        <div
          v-else-if="showProfile"
          class="player-profile"
          @click="handleProfileClick"
          @keydown.enter="handleProfileClick"
          tabindex="0"
          role="button"
          aria-label="View player profile"
        >
          <div class="player-avatar">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
          </div>
          <div class="player-info">
            <span class="player-name">Player</span>
            <span class="player-status">Online</span>
          </div>
        </div>
      </div>

      <!-- Right section: Actions or Spacer -->
      <div class="header-right">
        <!-- Notifications for home page -->
        <button
          v-if="showNotifications"
          class="btn btn--circle-ghost notification-btn"
          @click="handleNotificationClick"
          aria-label="View notifications"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <span v-if="notificationCount > 0" class="notification-badge">{{ notificationCount }}</span>
        </button>

        <!-- Spacer for settings page to center the title -->
        <div v-else-if="showBackButton" class="header-spacer"></div>
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

.page-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  text-align: center;
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
  background: linear-gradient(135deg, var(--success-color), var(--success-hover));
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
    color: var(--success-color);
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

.header-spacer {
  width: var(--space-8); // Same as back button to center title
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