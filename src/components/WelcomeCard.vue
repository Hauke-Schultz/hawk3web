<script setup>
import { defineProps, defineEmits } from 'vue'

// Props for the welcome card component
const props = defineProps({
  title: {
    type: String,
    default: 'Welcome back!'
  },
  subtitle: {
    type: String,
    default: 'Ready to continue your journey?'
  },
  // Allow customization of the gradient colors
  gradientStart: {
    type: String,
    default: 'var(--button-gradient-start)'
  },
  gradientEnd: {
    type: String,
    default: 'var(--button-gradient-end)'
  },
  // Control visibility
  visible: {
    type: Boolean,
    default: true
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'click',
  'package-click' // Keep existing naming for compatibility
])

// Event handlers
const handleClick = () => {
  emit('click')
  emit('package-click') // Emit both for backward compatibility
}

const handleKeyDown = (event) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    handleClick()
  }
}
</script>

<template>
  <section
    v-if="visible"
    class="welcome-card welcome-card--interactive"
    :style="{
      background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`
    }"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
    :aria-label="`${title} ${subtitle}`"
  >
    <div class="welcome-card__content">
      <h2 class="welcome-card__title">{{ title }}</h2>
      <p class="welcome-card__subtitle">{{ subtitle }}</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.welcome-card {
  border-radius: var(--border-radius-xl);
  padding: var(--space-6);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  text-align: center;

  /* Modifier: Interactive */
  &--interactive {
    cursor: pointer;

    &:hover {
      opacity: 0.95;
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 2rem rgba(68, 51, 255, 0.3);
    }

    &:focus-visible {
      outline: var(--focus-outline);
      outline-offset: 2px;
    }

    &:active {
      transform: translateY(0);
    }
  }

  /* Element: Content */
  &__content {
    color: var(--white);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }

  /* Element: Title */
  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-2) 0;
    color: var(--white);
  }

  /* Element: Subtitle */
  &__subtitle {
    font-size: var(--font-size-base);
    margin: 0;
    opacity: 0.9;
    color: var(--white);
  }
}
</style>