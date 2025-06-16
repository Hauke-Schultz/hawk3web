<script setup>
import { computed, ref } from 'vue'
import Icon from "./Icon.vue"

// Props for the trophy card component
const props = defineProps({
  achievements: {
    type: Array,
    default: () => []
  },
  totalEarned: {
    type: Number,
    default: 0
  },
  totalAchievements: {
    type: Number,
    default: 0
  },
  visible: {
    type: Boolean,
    default: true
  },
  // Card type for tracking read status
  cardType: {
    type: String,
    default: 'trophyCard'
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
  'trophy-click', // Keep existing naming for compatibility
  'mark-as-read'
])

// Reactive state for checkbox
const isMarkedAsRead = ref(false)

// Achievement icon mapping
const achievementIcons = {
  'welcome': 'user',
  'first_game': 'play',
  'level_5': 'trophy',
  'level_10': 'trophy',
  'level_15': 'trophy',
  'score_1000': 'trophy',
  'games_10': 'play',
  'perfectionist': 'trophy'
}

// Get icon for achievement
const getAchievementIcon = (achievementId) => {
  return achievementIcons[achievementId] || 'trophy'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now - date)
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  })
}

// Computed values
const hasAchievements = computed(() => props.achievements.length > 0)
const completionPercentage = computed(() => {
  if (props.totalAchievements === 0) return 0
  return Math.round((props.totalEarned / props.totalAchievements) * 100)
})

// Event handlers
const handleClick = () => {
  // Only emit click events, not mark-as-read
  emit('click')
  emit('trophy-click') // Emit both for backward compatibility
}

const handleCheckboxChange = (event) => {
  // Stop event propagation to prevent card click
  event.stopPropagation()

  isMarkedAsRead.value = event.target.checked

  if (event.target.checked) {
    // Emit read event when checkbox is checked
    emit('mark-as-read', props.cardType)
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
    class="trophy-card trophy-card--interactive"
    @click="handleClick"
    @keydown="handleKeyDown"
    tabindex="0"
    aria-label="View all trophies"
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
          aria-label="Mark as read"
        />
        <span class="checkbox-custom"></span>
      </label>
    </div>

    <div class="trophy-card__header">
      <div class="trophy-header-info">
        <h3 class="trophy-card__title">Latest Trophies</h3>
        <div class="trophy-stats">
          <span class="stat-text">{{ totalEarned }}/{{ totalAchievements }}</span>
          <span class="completion-badge">{{ completionPercentage }}%</span>
        </div>
      </div>
      <div class="trophy-main-icon">
        <Icon name="trophy" size="24" />
      </div>
    </div>

    <!-- Recent Achievements -->
    <div v-if="hasAchievements" class="recent-achievements">
      <div
        v-for="achievement in achievements"
        :key="achievement.id"
        class="achievement-item"
      >
        <div class="achievement-icon">
          <Icon :name="getAchievementIcon(achievement.id)" size="16" />
        </div>
        <div class="achievement-info">
          <span class="achievement-name">{{ achievement.name }}</span>
          <span class="achievement-date">{{ formatDate(achievement.earnedAt) }}</span>
        </div>
      </div>
    </div>

    <!-- No Achievements Yet -->
    <div v-else class="no-achievements">
      <p class="no-achievements-text">Start playing to earn your first trophy!</p>
    </div>
  </section>
</template>

<style lang="scss" scoped>
.trophy-card {
  background: linear-gradient(135deg, var(--warning-color), #FF8C00);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  color: white;
  position: relative;
  overflow: hidden;

  // Subtle pattern overlay
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at 100% 0%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
    pointer-events: none;
  }

  &--interactive {
    cursor: pointer;

    &:hover {
      opacity: 0.95;
      transform: translateY(-2px);
      box-shadow: 0 0.5rem 2rem rgba(255, 140, 0, 0.3);
    }

    &:focus-visible {
      outline: var(--focus-outline);
      outline-offset: 2px;
    }

    &:active {
      transform: translateY(0);
    }
  }

  &__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }

  &__title {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    margin: 0;
    color: white;
  }
}

.trophy-header-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.trophy-stats {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.stat-text {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  opacity: 0.9;
}

.completion-badge {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  padding: var(--space-0) var(--space-2);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
}

.trophy-main-icon {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: var(--space-10);
  height: var(--space-10);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

// Recent Achievements
.recent-achievements {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.achievement-item {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-lg);
  padding: var(--space-2) var(--space-3);
  backdrop-filter: blur(4px);
}

.achievement-icon {
  background-color: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: var(--space-6);
  height: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.achievement-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.achievement-name {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: white;
  line-height: 1.2;
}

.achievement-date {
  font-size: var(--font-size-xs);
  opacity: 0.8;
  color: white;
  line-height: 1;
}

// No Achievements State
.no-achievements {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3);
}

.no-achievements-text {
  font-size: var(--font-size-sm);
  color: white;
  opacity: 0.9;
  text-align: center;
  margin: 0;
  font-style: italic;
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
    border: solid var(--warning-color);
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}
</style>