<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import Icon from "./Icon.vue"

// LocalStorage service
const { gameData, updatePlayer } = useLocalStorage()

// Available avatar options
const avatarOptions = [
  { value: 'user', label: 'Default User', icon: 'user' },
  { value: 'trophy', label: 'Champion', icon: 'trophy' },
  { value: 'play', label: 'Gamer', icon: 'play' },
  { value: 'settings', label: 'Tech Expert', icon: 'settings' },
  { value: 'bell', label: 'Alert Master', icon: 'bell' }
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
      <h2 class="section-title">Player Profile</h2>

      <!-- Player Avatar Preview -->
      <div class="profile-preview">
        <div class="profile-avatar-large">
          <Icon :name="selectedAvatar" size="48" />
        </div>
        <div class="profile-info">
          <h3 class="profile-name">{{ playerName }}</h3>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-label">Level</span>
              <span class="stat-value">{{ gameData.player.level }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Score</span>
              <span class="stat-value">{{ gameData.player.totalScore }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Games</span>
              <span class="stat-value">{{ gameData.player.gamesPlayed }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Player Settings -->
      <div class="player-settings">
        <!-- Player Name Input -->
        <div class="setting-group">
          <label for="player-name" class="setting-label">Display Name</label>
          <input
            id="player-name"
            v-model="playerName"
            type="text"
            class="name-input"
            placeholder="Enter your name"
            maxlength="20"
            @blur="updatePlayerName"
            @keydown.enter="updatePlayerName"
          />
        </div>

        <!-- Avatar Selection -->
        <div class="setting-group">
          <label class="setting-label">Avatar</label>
          <div class="avatar-selector">
            <button
              v-for="option in avatarOptions"
              :key="option.value"
              class="avatar-option"
              :class="{ 'avatar-option--active': selectedAvatar === option.value }"
              @click="selectAvatar(option.value)"
              :aria-label="`Select ${option.label} avatar`"
              :aria-pressed="selectedAvatar === option.value"
            >
              <div class="avatar-icon">
                <Icon :name="option.icon" size="28" />
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
  background: linear-gradient(135deg, var(--success-color), var(--success-hover));
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
  padding: var(--space-3);

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