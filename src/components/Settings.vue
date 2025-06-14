<script setup>
import { ref, watch } from 'vue'

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
  <div class="container">
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
    </main>
  </div>
</template>

<style lang="scss" scoped>
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