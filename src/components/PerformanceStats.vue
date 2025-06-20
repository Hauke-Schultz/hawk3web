<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Current game performance data
  score: {
    type: Number,
    default: 0
  },
  timeElapsed: {
    type: Number,
    default: 0
  },
  moves: {
    type: Number,
    default: 0
  },

  // Additional stats (optional)
  matches: {
    type: Number,
    default: null
  },
  totalPairs: {
    type: Number,
    default: null
  },
  level: {
    type: Number,
    default: null
  },

  // Display customization
  showScore: {
    type: Boolean,
    default: true
  },
  showTime: {
    type: Boolean,
    default: true
  },
  showMoves: {
    type: Boolean,
    default: true
  },
  showMatches: {
    type: Boolean,
    default: false
  },
  showLevel: {
    type: Boolean,
    default: false
  },

  // Layout options
  layout: {
    type: String,
    default: 'horizontal', // 'horizontal', 'vertical', 'grid'
    validator: (value) => ['horizontal', 'vertical', 'grid'].includes(value)
  },

  // Size variant
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  },

  // Theme
  theme: {
    type: String,
    default: 'default',
    validator: (value) => ['default', 'card', 'compact'].includes(value)
  },

  // Custom labels
  scoreLabel: {
    type: String,
    default: 'Score'
  },
  timeLabel: {
    type: String,
    default: 'Time'
  },
  movesLabel: {
    type: String,
    default: 'Moves'
  },
  matchesLabel: {
    type: String,
    default: 'Matches'
  },
  levelLabel: {
    type: String,
    default: 'Level'
  }
})

// Format time display
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Format matches display
const formatMatches = computed(() => {
  if (props.matches === null || props.totalPairs === null) return props.matches || 0
  return `${props.matches}/${props.totalPairs}`
})

// Stats to display
const statsToShow = computed(() => {
  const stats = []

  if (props.showLevel && props.level !== null) {
    stats.push({
      key: 'level',
      label: props.levelLabel,
      value: props.level,
      type: 'number'
    })
  }

  if (props.showScore) {
    stats.push({
      key: 'score',
      label: props.scoreLabel,
      value: props.score,
      type: 'number'
    })
  }

  if (props.showTime) {
    stats.push({
      key: 'time',
      label: props.timeLabel,
      value: formatTime(props.timeElapsed),
      type: 'time'
    })
  }

  if (props.showMoves) {
    stats.push({
      key: 'moves',
      label: props.movesLabel,
      value: props.moves,
      type: 'number'
    })
  }

  if (props.showMatches && props.matches !== null) {
    stats.push({
      key: 'matches',
      label: props.matchesLabel,
      value: formatMatches.value,
      type: 'progress'
    })
  }

  return stats
})

// Container classes
const containerClass = computed(() => {
  return {
    'performance-stats': true,
    [`performance-stats--${props.layout}`]: true,
    [`performance-stats--${props.size}`]: true,
    [`performance-stats--${props.theme}`]: true
  }
})
</script>

<template>
  <div :class="containerClass">
    <div
      v-for="stat in statsToShow"
      :key="stat.key"
      class="stat-item"
      :class="`stat-item--${stat.type}`"
    >
      <span class="stat-label">{{ stat.label }}</span>
      <span class="stat-value">{{ stat.value }}</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Base Performance Stats Container
.performance-stats {
  display: flex;
  gap: var(--space-3);

  // Layout variants
  &--horizontal {
    flex-direction: row;
    justify-content: space-around;
    align-items: center;
  }

  &--vertical {
    flex-direction: column;
    align-items: stretch;
  }

  &--grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    gap: var(--space-2);
  }

  // Size variants
  &--small {
    gap: var(--space-2);

    .stat-label {
      font-size: var(--font-size-xxs);
    }

    .stat-value {
      font-size: var(--font-size-sm);
    }
  }

  &--large {
    gap: var(--space-4);

    .stat-label {
      font-size: var(--font-size-sm);
    }

    .stat-value {
      font-size: var(--font-size-xl);
    }
  }

  // Theme variants
  &--card {
    background-color: var(--card-bg);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius-lg);
    padding: var(--space-3);
  }

  &--compact {
    gap: var(--space-2);
    padding: var(--space-2);
    background-color: var(--bg-secondary);
    border-radius: var(--border-radius-md);
  }
}

// Stat Items
.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  flex: 1;
  min-width: 0; // Allow flex items to shrink

  .performance-stats--vertical & {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }

  // Type-specific styling
  &--number {
    .stat-value {
      color: var(--primary-color);
      font-weight: var(--font-weight-bold);
    }
  }

  &--time {
    .stat-value {
      color: var(--info-color);
      font-weight: var(--font-weight-bold);
      font-family: 'Courier New', monospace;
    }
  }

  &--progress {
    .stat-value {
      color: var(--success-color);
      font-weight: var(--font-weight-bold);
    }
  }
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
  text-align: center;
  line-height: 1;

  .performance-stats--vertical & {
    text-align: left;
  }
}

.stat-value {
  font-size: var(--font-size-base);
  color: var(--text-color);
  font-weight: var(--font-weight-bold);
  text-align: center;
  line-height: 1;
  white-space: nowrap;

  .performance-stats--vertical & {
    text-align: right;
  }
}

// Responsive Design
@media (max-width: 480px) {
  .performance-stats {
    &--horizontal {
      gap: var(--space-2);
    }

    &--grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  .stat-label {
    font-size: var(--font-size-xxs);
  }

  .stat-value {
    font-size: var(--font-size-sm);
  }
}

// Animation for value changes
.stat-value {
  transition: color 0.3s ease, transform 0.2s ease;
}

.stat-item--number .stat-value {
  &:hover {
    transform: scale(1.05);
  }
}
</style>