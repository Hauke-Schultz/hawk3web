<script setup>
import {ref, computed, watch} from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from "./Icon.vue";
import CurrencyDisplay from "./CurrencyDisplay.vue";

// LocalStorage service
const { formatCurrency } = useLocalStorage()

// Internationalization
const { t } = useI18n()

// Props for the header component
const props = defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  },
  showProfile: {
    type: Boolean,
    default: true
  },
  showNotifications: {
    type: Boolean,
    default: false
  },
  showMenuButton: {
    type: Boolean,
    default: false
  },
	showStatus: {
		type: Boolean,
		default: false
	},
  pageTitle: {
    type: String,
    default: ''
  },
	gameData: {
		type: Object,
		default: () => ({
			player: {
				name: 'Player',
				avatar: 'avatar/user',
				level: 1,
				coins: 0,
				diamonds: 0
			}
		})
	}
})

// Emits for parent component communication
const emit = defineEmits([
  'profile-click',
  'notification-click',
  'menu-click'
])

// Reactive state
const notificationCount = ref(3)

// Computed properties for player data from store
const levelDisplay = computed(() => {
  const level = props.gameData.player.level
  return level < 10 ? `0${level}` : level.toString()
})

const playerInfo = computed(() => ({
  name: props.gameData.player.name,
  avatar: props.gameData.player.avatar,
  level: props.gameData.player.level,
	coins: props.gameData.player.coins || 0,
	diamonds: props.gameData.player.diamonds || 0
}))

// Computed title and subtitle with i18n fallback
const displayTitle = computed(() => {
  return props.title || t('app.title')
})

const displaySubtitle = computed(() => {
  return props.subtitle || t('app.subtitle')
})

// Event handlers
const handleNotificationClick = () => {
  emit('notification-click')
}

const handleMenuClick = () => {
  emit('menu-click')
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
        <!-- Menu Button -->
        <button
          v-if="showMenuButton"
          class="btn btn--circle-ghost menu-button"
          @click="handleMenuClick"
          :aria-label="t('a11y.menu_button')"
        >
          <Icon name="menu" size="24" />
        </button>

        <!-- App Title/Logo for home page -->
        <div v-else class="header-title">
          <h1 class="app-title">{{ displayTitle }}</h1>
          <span class="app-subtitle">{{ displaySubtitle }}</span>
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
          :aria-label="t('a11y.profile_button')"
        >
          <div class="player-avatar">
            <Icon :name="playerInfo.avatar" size="34" />
          </div>
          <div class="player-display">
	          <div class="player-info">
	            <span class="player-name">{{ playerInfo.name }}</span>
	            <span v-if="showStatus" class="player-status">{{ t('common.level') }} {{ levelDisplay }}</span>
	          </div>
	          <CurrencyDisplay
		          :coins="playerInfo.coins"
		          :diamonds="playerInfo.diamonds"
		          layout="horizontal"
		          size="small"
		          variant="compact"
		          :format-numbers="true"
	          />
          </div>
        </div>
      </div>

      <!-- Right section -->
      <div class="header-right">
        <button
          v-if="showNotifications"
          class="btn btn--circle-ghost notification-btn"
          @click="handleNotificationClick"
          :aria-label="t('a11y.notification_button')"
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
	min-width: 65px;
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
  align-items: center;
  flex: 1;
  gap: var(--space-3);
}

.player-display {
	display: flex;
	align-items: center;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: var(--space-1);
	flex: 1;
}

.player-profile {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: 2rem;
  padding: var(--space-2);
  min-width: 190px;
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
	width: 100%;

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