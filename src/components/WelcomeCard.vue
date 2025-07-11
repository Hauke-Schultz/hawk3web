<script setup>
import { computed, ref } from 'vue'
import { useI18n } from '../composables/useI18n.js'

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
  },
  // Card type for tracking read status
  cardType: {
    type: String,
    default: 'welcomeCard'
  },
  // Whether to hide after being read
  hideWhenRead: {
    type: Boolean,
    default: true
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'click',
  'package-click',
  'mark-as-read'
])

const { t } = useI18n()

// Reactive state for checkbox
const isMarkedAsRead = ref(false)

// Event handlers
const handleClick = () => {
  // Only emit click events, not mark-as-read
  emit('click')
  emit('package-click') // Emit both for backward compatibility
}

const handleCheckboxChange = (event) => {
  // Stop event propagation to prevent card click
  event.stopPropagation()

  isMarkedAsRead.value = event.target.checked

  if (event.target.checked) {
    // Emit read event when checkbox is checked
    emit('mark-as-read', props.cardType)

    // Optional: Show feedback that achievement was earned
    setTimeout(() => {
      console.log('💰 Welcome bonus earned!')
    }, 500)
  }
}

const handleCheckboxClick = (event) => {
  // Prevent card click when clicking checkbox area
  event.stopPropagation()
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
    <!-- Read Checkbox -->
    <div class="read-checkbox-container" @click="handleCheckboxClick">
      <label class="read-checkbox-label">
        <input
          type="checkbox"
          class="read-checkbox"
          :checked="isMarkedAsRead"
          @change="handleCheckboxChange"
          @click="handleCheckboxClick"
          :aria-label="t('common.mark_as_read')"
        />
        <span class="checkbox-custom"></span>
      </label>
    </div>

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
  position: relative;

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

  &__content {
    color: var(--white);
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    align-items: flex-start;
  }

  &__title {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    margin: 0 0 var(--space-2) 0;
    color: var(--white);
  }

  &__subtitle {
    font-size: var(--font-size-base);
    margin: 0;
    opacity: 0.9;
    color: var(--white);
  }
}

// Read Checkbox Styles
.read-checkbox-container {
  position: absolute;
  top: var(--space-3);
  right: var(--space-3);
  z-index: 10;
  cursor: pointer;
}

.read-checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
  user-select: none;
}

.read-checkbox {
  position: absolute;
  opacity: 0;
  cursor: pointer;
  height: 0;
  width: 0;

  &:checked + .checkbox-custom {
     background-color: rgba(255, 255, 255, 0.9);
     border-color: rgba(255, 255, 255, 0.9);

     &::after {
       display: block;
     }
  }

  &:focus + .checkbox-custom {
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.5);
  }
}

.checkbox-custom {
  position: relative;
  height: var(--space-5);
  width: var(--space-5);
  background-color: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--border-radius-sm);
  transition: all 0.2s ease;
  backdrop-filter: blur(4px);

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.7);
  }

  // Checkmark
  &::after {
    content: '';
    position: absolute;
    display: none;
    left: 6px;
    top: 2px;
    width: 6px;
    height: 10px;
    border: solid var(--primary-color);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}
</style>