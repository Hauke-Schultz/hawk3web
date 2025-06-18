<script setup>
import { computed } from 'vue'
import Icon from './Icon.vue'

// Props for the level tile component
const props = defineProps({
  // Level information
  level: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: ''
  },
  description: {
    type: String,
    default: ''
  },

  // Level state
  isLocked: {
    type: Boolean,
    default: false
  },
  isCompleted: {
    type: Boolean,
    default: false
  },

  // Star rating (0-3)
  stars: {
    type: Number,
    default: 0,
    validator: (value) => value >= 0 && value <= 3
  },

  // High score for this level
  highScore: {
    type: Number,
    default: 0
  },

  // Best time for this level (in seconds)
  bestTime: {
    type: Number,
    default: null
  },

  // Visual theme
  theme: {
    type: String,
    default: 'primary',
    validator: (value) => ['primary', 'success', 'warning', 'info'].includes(value)
  },

  // Size variant
  size: {
    type: String,
    default: 'normal',
    validator: (value) => ['small', 'normal', 'large'].includes(value)
  }
})

// Emits for parent component communication
const emit = defineEmits([
  'play-level'
])

// Computed properties
const levelTitle = computed(() => {
  return props.title || `Level ${props.level}`
})

const canPlay = computed(() => {
  return !props.isLocked
})

const tileClass = computed(() => {
  return {
    'level-tile': true,
    [`level-tile--${props.theme}`]: true,
    [`level-tile--${props.size}`]: true,
    'level-tile--locked': props.isLocked,
    'level-tile--completed': props.isCompleted,
    'level-tile--playable': canPlay.value
  }
})

// Format time display
const formatTime = (seconds) => {
  if (!seconds) return '--'
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Event handlers
const handlePlayClick = () => {
  if (canPlay.value) {
    emit('play-level', props.level)
  }
}

const handleTileClick = () => {
  if (canPlay.value) {
    emit('play-level', props.level)
  }
}

const handleKeyDown = (event) => {
  if ((event.key === 'Enter' || event.key === ' ') && canPlay.value) {
    event.preventDefault()
    handlePlayClick()
  }
}
</script>

<template>
  <div
    :class="tileClass"
    @click="handleTileClick"
    @keydown="handleKeyDown"
    :tabindex="canPlay ? 0 : -1"
    :aria-label="`${levelTitle}, ${isCompleted ? 'completed' : isLocked ? 'locked' : 'available'}`"
    role="button"
  >
    <!-- Lock Overlay -->
    <div v-if="isLocked" class="level-tile__lock-overlay">
      <Icon name="lock" size="24" />
    </div>

    <!-- Level Header -->
    <div class="level-tile__header">
      <div class="level-tile__level-number">{{ level }}</div>
      <div v-if="isCompleted" class="level-tile__completion-badge">
        <Icon name="trophy" size="16" />
      </div>
    </div>

    <!-- Level Content -->
    <div class="level-tile__content">
      <h3 class="level-tile__title">{{ levelTitle }}</h3>
      <p v-if="description" class="level-tile__description">{{ description }}</p>

      <!-- Star Rating -->
      <div class="level-tile__stars">
        <Icon
          v-for="starIndex in 3"
          :key="starIndex"
          name="trophy"
          size="14"
          :class="{
            'star--filled': starIndex <= stars,
            'star--empty': starIndex > stars
          }"
        />
      </div>
    </div>

    <!-- Level Stats -->
    <div class="level-tile__stats">
      <div class="stat-item">
        <span class="stat-label">Score</span>
        <span class="stat-value">{{ highScore || 0 }}</span>
      </div>
      <div class="stat-item">
        <span class="stat-label">Time</span>
        <span class="stat-value">{{ formatTime(bestTime) }}</span>
      </div>
    </div>

    <!-- Play Button -->
    <div class="level-tile__actions">
      <button
        v-if="canPlay"
        class="play-button"
        @click.stop="handlePlayClick"
        :aria-label="`Play ${levelTitle}`"
      >
        <Icon name="play" size="16" />
        {{ isCompleted ? 'Replay' : 'Play' }}
      </button>
      <div v-else class="locked-indicator">
        <Icon name="lock" size="16" />
        Locked
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
// Base Level Tile Styles
.level-tile {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  min-height: 180px;

  &--playable {
    &:hover {
      background-color: var(--card-bg-hover);
      box-shadow: var(--card-shadow-hover);
      transform: translateY(-2px);
    }

    &:focus-visible {
      outline: var(--focus-outline);
      outline-offset: 2px;
    }
  }

  &--locked {
    opacity: 0.6;
    cursor: not-allowed;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.3);
      border-radius: var(--border-radius-xl);
      z-index: 1;
    }
  }

  &--completed {
    border-color: var(--success-color);

    &::after {
      content: '';
      position: absolute;
      top: var(--space-2);
      right: var(--space-2);
      width: var(--space-6);
      height: var(--space-6);
      background-color: var(--success-color);
      border-radius: 50%;
      z-index: 2;
    }
  }

  // Size variants
  &--small {
    padding: var(--space-3);
    min-height: 140px;

    .level-tile__title {
      font-size: var(--font-size-sm);
    }
  }

  &--large {
    padding: var(--space-6);
    min-height: 220px;

    .level-tile__title {
      font-size: var(--font-size-lg);
    }
  }

  // Theme variants
  &--primary {
    .level-tile__level-number {
      background-color: var(--primary-color);
    }

    .play-button {
      background-color: var(--primary-color);

      &:hover {
        background-color: var(--primary-hover);
      }
    }
  }

  &--success {
    .level-tile__level-number {
      background-color: var(--success-color);
    }

    .play-button {
      background-color: var(--success-color);

      &:hover {
        background-color: var(--success-hover);
      }
    }
  }

  &--warning {
    .level-tile__level-number {
      background-color: var(--warning-color);
    }

    .play-button {
      background-color: var(--warning-color);

      &:hover {
        background-color: var(--warning-hover);
      }
    }
  }

  &--info {
    .level-tile__level-number {
      background-color: var(--info-color);
    }

    .play-button {
      background-color: var(--info-color);

      &:hover {
        background-color: var(--info-hover);
      }
    }
  }
}

// Lock Overlay
.level-tile__lock-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
  color: var(--text-color);
  opacity: 0.7;
}

// Level Header
.level-tile__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.level-tile__level-number {
  width: var(--space-8);
  height: var(--space-8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-base);
}

.level-tile__completion-badge {
  color: var(--success-color);
}

// Level Content
.level-tile__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.level-tile__title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.level-tile__description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.3;
}

// Star Rating
.level-tile__stars {
  display: flex;
  gap: var(--space-1);
  align-items: center;
}

.star--filled {
  color: var(--warning-color);
}

.star--empty {
  color: var(--card-border);
}

// Level Stats
.level-tile__stats {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-2) 0;
  border-top: 1px solid var(--card-border);
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: var(--space-0);
  flex: 1;
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
  font-weight: var(--font-weight-bold);
}

.stat-value {
  font-size: var(--font-size-sm);
  color: var(--text-color);
  font-weight: var(--font-weight-bold);
}

// Actions
.level-tile__actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  transition: all 0.2s ease;
  width: 100%;
  justify-content: center;

  &:hover {
    transform: scale(1.05);
  }
}

.locked-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-muted);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  width: 100%;
  justify-content: center;
  padding: var(--space-2) var(--space-4);
}

// Responsive Design
@media (max-width: 400px) {
  .level-tile {
    min-height: 160px;

    &--small {
      min-height: 120px;
    }

    &--large {
      min-height: 200px;
    }
  }

  .level-tile__stats {
    flex-direction: column;
    gap: var(--space-2);
  }

  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}
</style>