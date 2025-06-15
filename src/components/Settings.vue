<script setup>
import { ref, watch } from 'vue'
import Icon from "./Icon.vue"

// Props
const props = defineProps({
  currentTheme: {
    type: String,
    default: 'dark'
  },
  // Player profile data from parent
  playerProfile: {
    type: Object,
    default: () => ({
      name: 'Player',
      avatar: 'user'
    })
  }
})

// Emits
const emit = defineEmits(['theme-change', 'back', 'player-update'])

// State
const selectedTheme = ref(props.currentTheme)
const playerName = ref(props.playerProfile?.name || 'Player')
const selectedAvatar = ref(props.playerProfile?.avatar || 'user')

// Available avatar options
const avatarOptions = [
  { value: 'user', label: 'Default User', icon: 'user' },
  { value: 'trophy', label: 'Champion', icon: 'trophy' },
  { value: 'play', label: 'Gamer', icon: 'play' },
  { value: 'settings', label: 'Tech Expert', icon: 'settings' },
  { value: 'bell', label: 'Alert Master', icon: 'bell' }
]

// Theme options
const themeOptions = [
  { value: 'dark', label: 'Dark' },
  { value: 'light', label: 'Light' },
  { value: 'system', label: 'System' }
]

// Watch for prop changes
watch(() => props.currentTheme, (newTheme) => {
  selectedTheme.value = newTheme
})

watch(() => props.playerProfile, (newProfile) => {
  if (newProfile) {
    playerName.value = newProfile.name || 'Player'
    selectedAvatar.value = newProfile.avatar || 'user'
  }
}, { deep: true })

// Methods
const selectTheme = (theme) => {
  selectedTheme.value = theme
  emit('theme-change', theme)
}

const selectAvatar = (avatar) => {
  selectedAvatar.value = avatar
  emitPlayerUpdate()
}

const updatePlayerName = () => {
  // Validate name (remove extra spaces, ensure minimum length)
  const trimmedName = playerName.value.trim()
  if (trimmedName.length < 1) {
    playerName.value = 'Player' // Reset to default if empty
  } else {
    playerName.value = trimmedName
  }
  emitPlayerUpdate()
}

const emitPlayerUpdate = () => {
  emit('player-update', {
    name: playerName.value,
    avatar: selectedAvatar.value
  })
}

const handleBack = () => {
  emit('back')
}
</script>

<template>
  <main class="content">
    <!-- Player Profile Section -->
    <section class="player-section">
      <h2 class="section-title">Player Profile</h2>

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

    <!-- Theme Section -->
    <section class="theme-section">
      <h2 class="section-title">Theme</h2>

      <div class="theme-selector">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="theme-option"
          :class="{ 'theme-option--active': selectedTheme === option.value }"
          @click="selectTheme(option.value)"
          :aria-pressed="selectedTheme === option.value"
        >
          {{ option.label }}
        </button>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.player-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-bottom: var(--space-8);
}

.theme-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

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

// Theme Selector
.theme-selector {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-xl);
  padding: var(--space-1);
  display: flex;
  gap: var(--space-1);
}

.theme-option {
  flex: 1;
  padding: var(--space-2) var(--space-3);
  border-radius: var(--border-radius-lg);
  border: none;
  background-color: transparent;
  color: var(--text-color);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-base);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-base), serif;

  &:hover {
    background-color: var(--card-bg-hover);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
  }

  &--active {
    background-color: var(--primary-color);
    color: white;

    &:hover {
      background-color: var(--primary-hover);
    }
  }
}
</style>