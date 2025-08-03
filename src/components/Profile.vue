<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { useInventory } from '../composables/useInventory.js'
import Icon from "./Icon.vue"
import CurrencyDisplay from "./CurrencyDisplay.vue";
import Header from "./Header.vue";

const emit = defineEmits(['menu-click'])

// LocalStorage service
const { gameData, updatePlayer, formatCurrency } = useLocalStorage()
const { t } = useI18n()
const { getAllOwnedItems } = useInventory()

// Available avatar options
const avatarOptions = [
  { value: 'avatar/user', label: t('profile.avatars.default_user'), icon: 'avatar/user' },
  { value: 'avatar/beard', label: t('profile.avatars.beard_user'), icon: 'avatar/beard' },
  { value: 'avatar/glasses', label: t('profile.avatars.glasses_user'), icon: 'avatar/glasses' },
  { value: 'avatar/headset', label: t('profile.avatars.headset_user'), icon: 'avatar/headset' },
  { value: 'avatar/cap', label: t('profile.avatars.cap_user'), icon: 'avatar/cap' }
]

// Computed values for direct access
const playerName = computed({
  get: () => gameData.player.name,
  set: (value) => {
    // Validate name (remove extra spaces, ensure minimum length)
    const trimmedName = value.trim()
	  updatePlayer({ name: trimmedName })
  }
})

const ownedItems = computed(() => {
	return getAllOwnedItems().slice(0, 12) // Limit to 12 items for display
})

const selectedAvatar = computed({
  get: () => gameData.player.avatar,
  set: (value) => {
    updatePlayer({ avatar: value })
  }
})

// Methods
const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
}

const updatePlayerName = () => {
  // Trigger validation through computed setter
  playerName.value = playerName.value
}

const handleMenuClick = () => {
	emit('menu-click')
}
</script>

<template>
	<Header
		:game-data="gameData"
		:show-profile="true"
		:show-menu-button="true"
		@menu-click="handleMenuClick"
	/>
  <main class="content">
    <!-- Player Profile Section -->
    <section class="profile-section">
      <h2 class="section-title">{{ t('profile.title') }}</h2>

      <!-- Player Avatar Preview -->
      <div class="profile-preview">
        <div class="profile-avatar-large">
          <Icon :name="selectedAvatar" size="64" />
        </div>
        <div class="profile-info">
          <h3 class="profile-name">{{ playerName }}</h3>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-label">{{ t('profile.stats.level') }}</span>
              <span class="stat-value">{{ gameData.player.level }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('profile.stats.score') }}</span>
              <span class="stat-value">{{ gameData.player.totalScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">{{ t('profile.stats.played') }}</span>
              <span class="stat-value">{{ gameData.player.gamesPlayed }}</span>
            </div>
          </div>
        </div>
	      <CurrencyDisplay
		      :coins="gameData.player.coins"
		      :diamonds="gameData.player.diamonds"
		      layout="horizontal"
		      size="large"
		      variant="card"
		      :format-numbers="true"
	      />
      </div>
	    <!-- Inventory Section -->
	    <div class="profile-section">
		    <h3 class="section-title">{{ t('profile.inventory.title') }}</h3>

		    <div v-if="ownedItems.length > 0" class="inventory-grid">
			    <div
					    v-for="item in ownedItems"
					    :key="item.id"
					    class="inventory-item"
					    :class="`inventory-item--${item.rarity}`"
			    >
				    <div class="inventory-item__icon">
					    <Icon :name="item.icon" size="24" />
				    </div>
				    <div class="inventory-item__info">
					    <span class="inventory-item__name">{{ item.name }}</span>
					    <span v-if="item.quantity > 1" class="inventory-item__quantity">
							x{{ item.quantity }}
						</span>
				    </div>
				    <div class="inventory-item__rarity">
					    {{ t(`shop.rarities.${item.rarity}`) }}
				    </div>
			    </div>
		    </div>

		    <div v-else class="inventory-empty">
			    <Icon name="info" size="48" />
			    <h4>{{ t('profile.inventory.empty') }}</h4>
			    <p>{{ t('profile.inventory.empty_description') }}</p>
		    </div>
	    </div>
      <!-- Player Settings -->
      <div class="player-settings">
        <!-- Player Name Input -->
        <div class="setting-group">
          <label for="player-name" class="setting-label">{{ t('profile.display_name') }}</label>
          <input
            id="player-name"
            v-model="playerName"
            type="text"
            class="name-input"
            :placeholder="t('profile.display_name')"
            maxlength="20"
            @blur="updatePlayerName"
            @keydown.enter="updatePlayerName"
          />
        </div>

        <!-- Avatar Selection -->
        <div class="setting-group">
          <label class="setting-label">{{ t('profile.avatar') }}</label>
          <div class="avatar-selector">
            <button
              v-for="option in avatarOptions"
              :key="option.value"
              class="avatar-option"
              :class="{ 'avatar-option--active': selectedAvatar === option.value }"
              @click="selectAvatar(option.value)"
              :aria-label="t('profile.select_avatar', { name: option.label })"
              :aria-pressed="selectedAvatar === option.value"
            >
              <div class="avatar-icon">
                <Icon :name="option.icon" size="50" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.profile-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

// Profile Preview Section
.profile-preview {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-4);
  text-align: center;
}

.profile-avatar-large {
  width: var(--space-16);
  height: var(--space-16);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.profile-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.profile-name {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.profile-stats {
  display: flex;
  gap: var(--space-6);
  justify-content: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  align-items: center;
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: var(--font-weight-base);
}

.stat-value {
  font-size: var(--font-size-lg);
  color: var(--text-color);
  font-weight: var(--font-weight-bold);
}

.currency-total {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

// Player Settings Section
.player-settings {
  display: flex;
  flex-direction: column;
  gap: var(--space-6);
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.setting-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

// Player Name Input
.name-input {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-base);
  color: var(--text-color);
  font-family: var(--font-family-base), sans-serif;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 0.125rem rgba(79, 70, 229, 0.25);
  }

  &:hover {
    border-color: var(--primary-color);
  }

  &::placeholder {
    color: var(--text-muted);
  }
}

// Avatar Selector
.avatar-selector {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: var(--space-2);
  background-color: var(--card-bg);
  border-radius: var(--border-radius-xl);
  padding: var(--space-3);
}

.avatar-option {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 1;
  border: 2px solid transparent;
  border-radius: var(--border-radius-lg);
  background-color: var(--card-bg-hover);
  color: var(--text-color);
  cursor: pointer;
  transition: all 0.2s ease;
  padding: 0;

  &:hover {
    background-color: var(--card-border);
    transform: translateY(-2px);
    box-shadow: var(--card-shadow-hover);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
  }

  &--active {
    background-color: var(--primary-color);
    border-color: var(--primary-color);
    color: white;

    &:hover {
      background-color: var(--primary-hover);
      border-color: var(--primary-hover);
    }
  }
}

.avatar-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: inherit;
}

// Inventory Section
.inventory-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-2);
	max-height: 300px;
	overflow-y: auto;
}

.inventory-item {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-2);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	border-left: 4px solid var(--card-border);

	&--common { border-left-color: #6B7280; }
	&--uncommon { border-left-color: #10B981; }
	&--rare { border-left-color: #3B82F6; }
	&--epic { border-left-color: #8B5CF6; }
	&--legendary {
		border-left-color: #F59E0B;
		box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
	}
}

.inventory-item__icon {
	width: var(--space-8);
	height: var(--space-8);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--primary-color);
	flex-shrink: 0;
}

.inventory-item__info {
	display: flex;
	flex-direction: column;
	gap: 0;
	flex: 1;
}

.inventory-item__name {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	line-height: 1.2;
}

.inventory-item__quantity {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	line-height: 1;
}

.inventory-item__rarity {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	text-transform: uppercase;
	font-weight: var(--font-weight-bold);
}

.inventory-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-8) var(--space-4);
	text-align: center;
	color: var(--text-secondary);

	h4 {
		margin: 0;
		font-size: var(--font-size-base);
	}

	p {
		margin: 0;
		font-size: var(--font-size-sm);
	}
}
</style>