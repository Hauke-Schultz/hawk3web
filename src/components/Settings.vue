<script setup>
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  currentTheme: {
    type: String,
    default: 'dark'
  }
})

// Emits
const emit = defineEmits(['theme-change', 'back'])

// State
const selectedTheme = ref(props.currentTheme)

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
</script>

<template>
  <div class="settings-container">
    <!-- Header -->
    <header class="settings-header">
      <button
        class="back-button"
        @click="handleBack"
        aria-label="Go back"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5m7-7l-7 7 7 7"/>
        </svg>
      </button>
      <h1 class="settings-title">Settings</h1>
      <div class="header-spacer"></div>
    </header>

    <!-- Main Content -->
    <main class="settings-content">
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
  </div>
</template>

<style lang="scss" scoped>
.settings-container {
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  max-width: 375px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
}

.settings-header {
  background-color: var(--bg-header);
  border-bottom: 1px solid var(--card-border);
  padding: var(--space-4) var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
}

.back-button {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  color: var(--text-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--card-bg-hover);
    transform: scale(1.05);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: 2px;
  }
}

.settings-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  text-align: center;
  flex: 1;
}

.header-spacer {
  width: 2rem; // Same as back button to center title
}

.settings-content {
  flex: 1;
  padding: var(--space-6);
  display: flex;
  flex-direction: column;
  gap: var(--space-8);
}

.theme-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.section-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  padding-left: var(--space-4);
}

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