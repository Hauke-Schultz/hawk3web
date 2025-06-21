<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'

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
  comboCount: {
    type: Number,
    default: null
  },
  comboMultiplier: {
    type: Number,
    default: null
  },
  maxCombo: {
    type: Number,
    default: null
  },
  comboTimeRemaining: {
    type: Number,
    default: 0
  },
  comboTimeMax: {
    type: Number,
    default: 8000
  },
  isComboActive: {
    type: Boolean,
    default: false
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
  showCombo: {
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
  comboLabel: {
    type: String,
    default: 'Combo'
  },
  maxComboLabel: {
    type: String,
    default: 'Max Combo'
  },
  levelLabel: {
    type: String,
    default: 'Level'
  },
})

const { t, formatTime: i18nFormatTime } = useI18n()

// Format time display
const formatTime = (seconds) => {
  return i18nFormatTime(seconds)
}

// Format matches display
const formatMatches = computed(() => {
  if (props.matches === null || props.totalPairs === null) return props.matches || 0
  return `${props.matches}/${props.totalPairs}`
})

// Format combo display
const formatCombo = computed(() => {
  if (props.comboCount === 0) return '0'
  return `${props.comboCount} (x${props.comboMultiplier.toFixed(1)})`
})

// Combo timer percentage
const comboTimePercentage = computed(() => {
  if (props.comboTimeMax === 0) return 0
  return Math.max(0, (props.comboTimeRemaining / props.comboTimeMax) * 100)
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

  if (props.showCombo) {
    stats.push({
      key: 'combo',
      label: props.comboLabel,
      value: formatCombo.value,
      type: 'combo',
      isActive: props.isComboActive,
      timePercentage: comboTimePercentage.value
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
      :class="[
        `stat-item--${stat.type}`,
        {
          'stat-item--inactive': stat.type === 'combo' && !stat.isActive
        }
      ]"
    >
      <span class="stat-label">{{ stat.label }}</span>
      <span class="stat-value">{{ stat.value }}</span>

      <!-- Combo Timer Bar -->
      <div
        v-if="stat.type === 'combo'"
        class="combo-timer"
        :class="{ 'combo-timer--inactive': !stat.isActive }"
      >
        <div
          class="combo-timer-bar"
          :style="{
          width: `${stat.timePercentage}%`,
          backgroundColor: stat.isActive ? 'var(--warning-color)' : 'var(--text-muted)'
        }"
        ></div>
      </div>
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
    align-items: flex-start;
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

  &--combo {
    .stat-value {
      color: var(--warning-color);
      font-weight: var(--font-weight-bold);
      transition: color 0.3s ease, opacity 0.3s ease;
    }
  }

  &--inactive {
    opacity: 0.5;

    .stat-value {
      color: var(--text-muted);
    }

    .stat-label {
      color: var(--text-muted);
    }
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
      font-weight: var(--font-weight-bold);
    }
  }

  &--time {
    .stat-value {
      font-weight: var(--font-weight-bold);
    }
  }

  &--progress {
    .stat-value {
      font-weight: var(--font-weight-bold);
    }
  }

  &--combo {
    .stat-value {
      color: var(--warning-color);
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

// Animation for value changes
.stat-value {
  transition: color 0.3s ease, transform 0.2s ease;
}

.stat-item--number .stat-value {
  &:hover {
    transform: scale(1.05);
  }
}

// Combo Timer
.combo-timer {
  width: 100%;
  height: 3px;
  background-color: var(--card-border);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
  margin-top: var(--space-1);
  transition: opacity 0.3s ease;

  &--inactive {
    opacity: 0.3;
  }
}

.combo-timer-bar {
  height: 100%;
  transition: width 0.1s linear, background-color 0.3s ease;
  border-radius: var(--border-radius-sm);
}

</style>