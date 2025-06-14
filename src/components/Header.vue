<script setup>
import { ref, computed } from 'vue'

// Props for the header component
const props = defineProps({
  // Player level display
  level: {
    type: Number,
    default: 15
  },
  // App title
  title: {
    type: String,
    default: 'Hawk3'
  },
  showProfile: {
    type: Boolean,
    default: true
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'profile-click',
])

// Reactive state
const notificationCount = ref(3)

// Computed properties
const levelDisplay = computed(() => {
  return props.level < 10 ? `0${props.level}` : props.level.toString()
})

const handleNotificationClick = () => {
  emit('notification-click')
}
</script>

<template>
  <header class="header" role="banner">
    <div class="header-container">
      <!-- Left section: Menu & Logo -->
      <div class="header-left">
        <!-- App Title/Logo -->
        <div class="header-title">
          <h1 class="app-title">{{ title }}</h1>
          <span class="app-subtitle">Gaming Platform</span>
        </div>
      </div>

      <!-- Center section: Player Profile -->
      <div class="header-center">
        <div class="player-profile">
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

      <!-- Right section: Actions -->
      <div class="header-right">
        <!-- Notifications -->
        <button
          class="header-action-btn notification-btn"
          @click="handleNotificationClick"
          aria-label="View notifications"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
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
  width: 2rem;
  height: 2rem;
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
    margin-top: 0.125rem;
  }
}

// Right Section
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  justify-content: flex-end;

  @media (max-width: 480px) {
    gap: var(--space-2);
    flex: 0 0 auto;
  }
}

.header-action-btn {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  position: relative;

  &:hover {
    background-color: var(--card-bg-hover);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
  }
}

.notification-btn {
  .notification-badge {
    position: absolute;
    top: -0.25rem;
    right: -0.25rem;
    background-color: var(--error-color);
    color: white;
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-bold);
    padding: 0.125rem 0.375rem;
    border-radius: 0.75rem;
    min-width: 1.25rem;
    height: 1.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>