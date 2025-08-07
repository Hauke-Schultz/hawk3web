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
  showMenuButton: {
    type: Boolean,
    default: false
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
  'menu-click'
])

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


const handleMenuClick = () => {
  emit('menu-click')
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
      </div>

      <!-- Right section -->
      <div class="header-right">
	      <CurrencyDisplay
		      :coins="playerInfo.coins"
		      :diamonds="playerInfo.diamonds"
		      layout="vertical"
		      size="small"
		      variant="compact"
		      :format-numbers="true"
	      />
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

// Right Section
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  flex: 1;
  justify-content: flex-end;
}

</style>