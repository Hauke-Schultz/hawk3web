<script setup>
import { ref, watch } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import Icon from './Icon.vue'
import ConfirmationModal from './ConfirmationModal.vue'

// Props
const props = defineProps({
  currentTheme: {
    type: String,
    default: 'dark'
  }
})

// Emits
const emit = defineEmits(['theme-change', 'back'])

// LocalStorage service
const { clearStorage } = useLocalStorage()

// State
const selectedTheme = ref(props.currentTheme)
const isDeleteUnlocked = ref(false)
const showDeleteConfirmation = ref(false)

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

// Methods
const selectTheme = (theme) => {
  selectedTheme.value = theme
  emit('theme-change', theme)
}

const handleBack = () => {
  emit('back')
}

// Profile Reset Methods
const toggleDeleteLock = () => {
  isDeleteUnlocked.value = !isDeleteUnlocked.value

  // Auto-lock after 10 seconds if unlocked
  if (isDeleteUnlocked.value) {
    setTimeout(() => {
      isDeleteUnlocked.value = false
    }, 10000)
  }
}

const handleDeleteProfile = () => {
  if (!isDeleteUnlocked.value) return
  showDeleteConfirmation.value = true
}

const confirmDelete = () => {
  clearStorage()
  showDeleteConfirmation.value = false
  isDeleteUnlocked.value = false
  // Return to Home Page after reset
  handleBack()
}

const cancelDelete = () => {
  showDeleteConfirmation.value = false
  isDeleteUnlocked.value = false
}
</script>

<template>
  <main class="content">
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

    <!-- Profile Reset Section -->
    <section class="profile-section">
      <h2 class="section-title">Profile Management</h2>

      <div class="reset-container">
        <div class="reset-info">
          <h3 class="reset-title">Delete Profile</h3>
          <p class="reset-description">
            This will permanently delete all your game progress, achievements, and settings.
            This action cannot be undone.
          </p>
        </div>

        <div class="reset-controls">
          <!-- Lock/Unlock Button -->
          <button
            class="btn btn--circle"
            :class="isDeleteUnlocked ? 'btn--unlock' : 'btn--lock'"
            @click="toggleDeleteLock"
            :aria-label="isDeleteUnlocked ? 'Lock delete button' : 'Unlock delete button'"
          >
            <Icon :name="isDeleteUnlocked ? 'unlock' : 'lock'" size="20" />
          </button>

          <!-- Delete Profile Button -->
          <button
            class="btn"
            :class="isDeleteUnlocked ? 'btn--delete-active' : 'btn--delete'"
            :disabled="!isDeleteUnlocked"
            @click="handleDeleteProfile"
            aria-label="Delete profile"
          >
            Delete Profile
          </button>
        </div>
      </div>
    </section>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :visible="showDeleteConfirmation"
      title="Confirm Profile Deletion"
      message="Are you absolutely sure you want to delete your profile? This will permanently remove:"
      :items="[
        'All game progress and scores',
        'All achievements and trophies',
        'Player settings and preferences',
        'Avatar and profile customizations'
      ]"
      warning="This action cannot be undone!"
      confirm-text="Delete Everything"
      cancel-text="Cancel"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </main>
</template>

<style lang="scss" scoped>
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

// Profile Reset Section
.profile-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  margin-top: var(--space-8);
}

.reset-container {
  background-color: var(--card-bg);
  border: 1px solid var(--error-color);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.reset-info {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.reset-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--error-color);
  margin: 0;
}

.reset-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

.reset-controls {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}
</style>