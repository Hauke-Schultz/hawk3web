<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useCurrencySystem } from '../composables/useCurrencySystem.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from "./Icon.vue"

// LocalStorage service
const { gameData, updatePlayer } = useLocalStorage()
const { t } = useI18n()
const {
  coins,
  diamonds,
  totalCoinsEarned,
  totalDiamondsEarned,
  recentTransactions,
  formatCurrency
} = useCurrencySystem()

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
    if (trimmedName.length < 1) {
      updatePlayer({ name: 'Player' }) // Reset to default if empty
    } else {
      updatePlayer({ name: trimmedName })
    }
  }
})

const selectedAvatar = computed({
  get: () => gameData.player.avatar,
  set: (value) => {
    updatePlayer({ avatar: value })
  }
})
// Format date helper
const formatTransactionDate = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}
// Methods
const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
}

const updatePlayerName = () => {
  // Trigger validation through computed setter
  playerName.value = playerName.value
}
</script>

<template>
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
        <!-- Currency Stats Section -->
        <div class="currency-stats">
          <div class="currency-item">
            <span class="currency-icon">💰</span>
            <div class="currency-info">
              <span class="currency-current">{{ formatCurrency(coins) }}</span>
              <span class="currency-total">{{ t('profile.currency.total_earned', { amount: formatCurrency(totalCoinsEarned) }) }}</span>
            </div>
          </div>
          <div v-if="diamonds > 0" class="currency-item currency-item--premium">
            <span class="currency-icon">💎</span>
            <div class="currency-info">
              <span class="currency-current">{{ formatCurrency(diamonds) }}</span>
              <span class="currency-total">{{ t('profile.currency.total_earned', { amount: formatCurrency(totalDiamondsEarned) }) }}</span>
            </div>
          </div>
        </div>
      </div>
      <!-- Currency Transaction History -->
      <div v-if="recentTransactions.length > 0" class="currency-section">
        <h3 class="section-subtitle">{{ t('profile.currency.recent_earnings') }}</h3>
        <div class="transaction-list">
          <div
              v-for="transaction in recentTransactions"
              :key="transaction.id"
              class="transaction-item"
          >
            <div class="transaction-icon">
              <span v-if="transaction.source === 'achievement'">🏆</span>
              <span v-else-if="transaction.source === 'levelCompletion'">⭐</span>
              <span v-else-if="transaction.source === 'combo'">🔥</span>
              <span v-else>💰</span>
            </div>
            <div class="transaction-info">
              <span class="transaction-description">{{ transaction.description }}</span>
              <span class="transaction-date">{{ formatTransactionDate(transaction.timestamp) }}</span>
            </div>
            <div class="transaction-amount">
            <span v-if="transaction.amounts.coins > 0" class="amount-coins">
              +{{ formatCurrency(transaction.amounts.coins) }} 💰
            </span>
              <span v-if="transaction.amounts.diamonds > 0" class="amount-diamonds">
              +{{ formatCurrency(transaction.amounts.diamonds) }} 💎
            </span>
            </div>
          </div>
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

.currency-stats {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid var(--card-border);
}

.currency-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);
  padding: var(--space-3);

  &--premium {
    background: linear-gradient(135deg, rgba(79, 70, 229, 0.1), rgba(99, 102, 241, 0.1));
    border: 1px solid var(--primary-color);

    .currency-icon {
      filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.6));
    }

    .currency-current {
      color: var(--primary-color);
    }
  }
}

.currency-icon {
  font-size: var(--font-size-xl);
  flex-shrink: 0;
}

.currency-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.currency-current {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.currency-total {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

// Currency Transaction Section
.currency-section {
  margin-top: var(--space-6);
}

.section-subtitle {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0 0 var(--space-4) 0;
}

.transaction-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-3);
}

.transaction-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-2);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-md);
}

.transaction-icon {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  flex: 1;
}

.transaction-description {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.transaction-date {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
}

.transaction-amount {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  text-align: right;
  flex-shrink: 0;
}

.amount-coins,
.amount-diamonds {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.amount-coins {
  color: var(--warning-color);
}

.amount-diamonds {
  color: var(--primary-color);
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
</style>