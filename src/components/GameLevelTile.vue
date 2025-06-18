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
      <Icon name="lock" size="20" />
    </div>

    <!-- Level Header -->
    <div class="level-tile__header">
      <div class="level-tile__level-number">{{ level }}</div>
      <div v-if="isCompleted" class="level-tile__completion-badge">
        <Icon name="completion-badge" size="20" />
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
          :name="starIndex <= stars ? 'star-filled' : 'star'"
          size="20"
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
        class="btn"
        @click.stop="handlePlayClick"
        :aria-label="`Play ${levelTitle}`"
      >
        {{ isCompleted ? 'Replay' : 'Play' }}
      </button>
      <div v-else class="locked-indicator">
        <Icon name="lock" size="12" />
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
  border-radius: var(--border-radius-lg);
  padding: var(--space-2);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition: all 0.2s ease;
  position: relative;
  cursor: pointer;
  min-height: 140px;
  width: 100%;

  &--playable {
    &:hover {
      background-color: var(--card-bg-hover);
      box-shadow: var(--card-shadow-hover);
      transform: translateY(-1px);
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
      border-radius: var(--border-radius-lg);
      z-index: 1;
    }
  }

  &--completed {
    border-color: var(--success-color);
  }

  // Size variants
  &--small {
    padding: var(--space-1);
    min-height: 120px;

    .level-tile__title {
      font-size: var(--font-size-xs);
    }
  }

  &--large {
    padding: var(--space-3);
    min-height: 160px;

    .level-tile__title {
      font-size: var(--font-size-base);
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
  width: var(--space-5);
  height: var(--space-5);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-xs);
}

.level-tile__completion-badge {
  color: var(--success-color);
  display: flex;
}

// Level Content
.level-tile__content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.level-tile__title {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  line-height: 1.2;
}

.level-tile__description {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// Star Rating
.level-tile__stars {
  display: flex;
  gap: var(--space-1);
  align-items: center;
  justify-content: center;
  margin-top: var(--space-1);
}

.star--filled {
  color: var(--warning-color);
}

.star--empty {
  color: var(--white);
}

// Level Stats
.level-tile__stats {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-1) 0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0;
  flex: 1;
  text-align: center;
}

.stat-label {
  font-size: var(--font-size-xxs);
  color: var(--text-secondary);
  text-transform: uppercase;
  line-height: 1;
}

.stat-value {
  font-size: var(--font-size-xs);
  color: var(--text-color);
  line-height: 1;
}

// Actions
.level-tile__actions {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: var(--space-1);

  .btn {
    width: 100%;
  }
}

.locked-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  color: var(--text-muted);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  width: 100%;
  justify-content: center;
  padding: var(--space-1) var(--space-2);
}
</style>