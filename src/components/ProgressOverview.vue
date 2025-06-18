<script setup>
import { computed } from 'vue'

// Props for the progress overview component
const props = defineProps({
  // Progress data
  completed: {
    type: Number,
    required: true
  },
  total: {
    type: Number,
    required: true
  },
  totalStars: {
    type: Number,
    default: 0
  },
  maxStars: {
    type: Number,
    default: 0
  },

  // Display options
  showStars: {
    type: Boolean,
    default: true
  },
  showPercentage: {
    type: Boolean,
    default: true
  },

  // Labels customization
  levelsLabel: {
    type: String,
    default: 'Levels'
  },
  starsLabel: {
    type: String,
    default: 'Stars'
  },
  completeLabel: {
    type: String,
    default: 'Complete'
  },

  // Visual customization
  theme: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'info'].includes(value)
  },
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  }
})

// Computed properties
const completionPercentage = computed(() => {
  if (props.total === 0) return 0
  return Math.round((props.completed / props.total) * 100)
})

const progressBarClass = computed(() => {
  return {
    'progress-bar': true,
    [`progress-bar--${props.size}`]: true
  }
})

const progressFillClass = computed(() => {
  return {
    'progress-fill': true,
    [`progress-fill--${props.theme}`]: true
  }
})

const containerClass = computed(() => {
  return {
    'progress-overview': true,
    [`progress-overview--${props.size}`]: true
  }
})

// Stats to display
const displayStats = computed(() => {
  const stats = [
    {
      key: 'levels',
      number: props.completed,
      label: `${props.total} ${props.levelsLabel}`,
      show: true
    }
  ]

  if (props.showStars) {
    stats.push({
      key: 'stars',
      number: props.totalStars,
      label: `${props.maxStars} ${props.starsLabel}`,
      show: true
    })
  }

  if (props.showPercentage) {
    stats.push({
      key: 'percentage',
      number: completionPercentage.value,
      label: props.completeLabel,
      suffix: '%',
      show: true
    })
  }

  return stats.filter(stat => stat.show)
})
</script>

<template>
  <div :class="containerClass">
    <!-- Progress Stats -->
    <div class="progress-stats">
      <div
        v-for="stat in displayStats"
        :key="stat.key"
        class="progress-item"
      >
        <span class="progress-number">
          {{ stat.number }}{{ stat.suffix || '' }}
        </span>
        <span class="progress-label">{{ stat.label }}</span>
      </div>
    </div>

    <!-- Progress Bar -->
    <div :class="progressBarClass">
      <div
        :class="progressFillClass"
        :style="{ width: `${completionPercentage}%` }"
      ></div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Progress Overview Container
.progress-overview {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  // Size variants
  &--small {
    padding: var(--space-2);
    gap: var(--space-2);
  }

  &--large {
    padding: var(--space-4);
    gap: var(--space-4);
  }
}

// Progress Stats
.progress-stats {
  display: flex;
  gap: var(--space-4);
  justify-content: center;

  .progress-overview--small & {
    gap: var(--space-3);
  }

  .progress-overview--large & {
    gap: var(--space-6);
  }
}

.progress-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-width: 0; // Allow text to wrap if needed
}

.progress-number {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  white-space: nowrap;

  .progress-overview--small & {
    font-size: var(--font-size-sm);
  }

  .progress-overview--large & {
    font-size: var(--font-size-lg);
  }
}

.progress-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
  text-align: center;
  line-height: 1.2;

  .progress-overview--small & {
    font-size: var(--font-size-xxs);
  }

  .progress-overview--large & {
    font-size: var(--font-size-xs);
  }
}

// Progress Bar
.progress-bar {
  height: var(--space-2);
  background-color: var(--card-border);
  border-radius: var(--border-radius-md);
  overflow: hidden;
  position: relative;

  &--small {
    height: calc(var(--space-2) * 0.75);
  }

  &--large {
    height: calc(var(--space-2) * 1.5);
  }
}

.progress-fill {
  height: 100%;
  border-radius: var(--border-radius-md);
  transition: width 0.3s ease;

  // Theme variants
  &--primary {
    background: linear-gradient(90deg, var(--primary-color), var(--success-color));
  }

  &--success {
    background: linear-gradient(90deg, var(--success-color), var(--success-hover));
  }

  &--warning {
    background: linear-gradient(90deg, var(--warning-color), var(--warning-hover));
  }

  &--info {
    background: linear-gradient(90deg, var(--info-color), var(--info-hover));
  }
}

// Responsive Design
@media (max-width: 480px) {
  .progress-stats {
    gap: var(--space-2);
  }

  .progress-item {
    flex: 1;
  }

  .progress-label {
    font-size: var(--font-size-xxs);
  }
}
</style>