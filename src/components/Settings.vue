<script setup>
import { ref, watch } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from './Icon.vue'
import ConfirmationModal from './ConfirmationModal.vue'
import Header from "./Header.vue";

// Props
const props = defineProps({
  currentTheme: {
    type: String,
    default: 'dark'
  }
})

// Emits
const emit = defineEmits(['theme-change', 'language-change', 'back', 'menu-click'])

// LocalStorage service
const { gameData, clearStorage } = useLocalStorage()

// Internationalization
const { t, currentLanguage, availableLanguages, setLanguage } = useI18n()

// State
const selectedTheme = ref(props.currentTheme)
const selectedLanguage = ref(currentLanguage.value)
const isDeleteUnlocked = ref(false)
const showDeleteConfirmation = ref(false)

// Theme options
const themeOptions = [
  { value: 'dark', label: () => t('settings.themes.dark') },
  { value: 'light', label: () => t('settings.themes.light') },
  { value: 'system', label: () => t('settings.themes.system') }
]

// Watch for prop changes
watch(() => props.currentTheme, (newTheme) => {
  selectedTheme.value = newTheme
})

// Watch for language changes
watch(currentLanguage, (newLang) => {
  selectedLanguage.value = newLang
})

// Methods
const selectTheme = (theme) => {
  selectedTheme.value = theme
  emit('theme-change', theme)
}

const selectLanguage = async (languageCode) => {
  const success = await setLanguage(languageCode)
  if (success) {
    selectedLanguage.value = languageCode
    emit('language-change', languageCode)
  }
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
    <!-- Theme Section -->
    <section class="theme-section">
      <h2 class="section-title">{{ t('settings.theme') }}</h2>

      <div class="theme-selector">
        <button
          v-for="option in themeOptions"
          :key="option.value"
          class="theme-option"
          :class="{ 'theme-option--active': selectedTheme === option.value }"
          @click="selectTheme(option.value)"
          :aria-pressed="selectedTheme === option.value"
        >
          {{ option.label() }}
        </button>
      </div>
    </section>

    <!-- Language Section -->
    <section class="language-section">
      <h2 class="section-title">{{ t('settings.language') }}</h2>

      <div class="language-selector">
        <button
          v-for="language in availableLanguages"
          :key="language.code"
          class="language-option"
          :class="{ 'language-option--active': selectedLanguage === language.code }"
          @click="selectLanguage(language.code)"
          :aria-pressed="selectedLanguage === language.code"
        >
          <span class="language-flag">{{ language.flag }}</span>
          <span class="language-name">{{ language.nativeName }}</span>
        </button>
      </div>
    </section>

    <!-- Profile Reset Section -->
    <section class="profile-section">
      <h2 class="section-title">{{ t('settings.profile_management') }}</h2>

      <div class="reset-container">
        <div class="reset-info">
          <h3 class="reset-title">{{ t('settings.delete_profile') }}</h3>
          <p class="reset-description">
            {{ t('settings.delete_profile_description') }}
          </p>
        </div>

        <div class="reset-controls">
          <!-- Lock/Unlock Button -->
          <button
            class="btn btn--circle"
            :class="isDeleteUnlocked ? 'btn--unlock' : 'btn--lock'"
            @click="toggleDeleteLock"
            :aria-label="isDeleteUnlocked ? t('common.lock') : t('common.unlock')"
          >
            <Icon :name="isDeleteUnlocked ? 'unlock' : 'lock'" size="20" />
          </button>

          <!-- Delete Profile Button -->
          <button
            class="btn"
            :class="isDeleteUnlocked ? 'btn--delete-active' : 'btn--delete'"
            :disabled="!isDeleteUnlocked"
            @click="handleDeleteProfile"
            :aria-label="t('settings.delete_profile')"
          >
            {{ t('settings.delete_profile') }}
          </button>
        </div>
      </div>
    </section>

    <!-- Confirmation Modal -->
    <ConfirmationModal
      :visible="showDeleteConfirmation"
      :title="t('settings.delete_confirmation.title')"
      :message="t('settings.delete_confirmation.message')"
      :items="[
        t('settings.delete_confirmation.items.0'),
        t('settings.delete_confirmation.items.1'),
        t('settings.delete_confirmation.items.2'),
        t('settings.delete_confirmation.items.3')
      ]"
      :warning="t('settings.delete_confirmation.warning')"
      :confirm-text="t('settings.delete_confirmation.confirm')"
      :cancel-text="t('common.cancel')"
      confirm-variant="danger"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </main>
</template>

<style lang="scss" scoped>
.theme-section,
.language-section {
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

// Language Selector
.language-selector {
  background-color: var(--card-bg);
  border-radius: var(--border-radius-xl);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.language-option {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-lg);
  border: none;
  background-color: transparent;
  color: var(--text-color);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-base);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-base), serif;
  text-align: left;

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

.language-flag {
  font-size: var(--font-size-lg);
  flex-shrink: 0;
}

.language-name {
  font-weight: var(--font-weight-bold);
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