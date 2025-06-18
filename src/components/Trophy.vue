<script setup>
import { computed } from 'vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import Icon from "./Icon.vue"

// LocalStorage service for achievements
const { gameData } = useLocalStorage()

// Achievement categories for organization
const achievementCategories = [
  {
    id: 'general',
    name: 'General',
    color: 'primary'
  },
  {
    id: 'gaming',
    name: 'Gaming',
    color: 'success'
  },
  {
    id: 'progress',
    name: 'Progress',
    color: 'warning'
  },
  {
    id: 'special',
    name: 'Special',
    color: 'info'
  }
]

// All possible achievements (earned and unearned)
const allAchievements = [
  // General achievements
  {
    id: 'welcome',
    name: 'Welcome to Hawk3',
    description: 'Started your gaming journey',
    category: 'general',
    icon: 'user',
    rarity: 'common'
  },
  {
    id: 'first_game',
    name: 'First Game',
    description: 'Played your first game',
    category: 'gaming',
    icon: 'play',
    rarity: 'common'
  },
  {
    id: 'level_5',
    name: 'Rising Star',
    description: 'Reached level 5',
    category: 'progress',
    icon: 'trophy',
    rarity: 'common'
  },
  {
    id: 'level_10',
    name: 'Dedicated Player',
    description: 'Reached level 10',
    category: 'progress',
    icon: 'trophy',
    rarity: 'uncommon'
  },
  {
    id: 'level_15',
    name: 'Gaming Expert',
    description: 'Reached level 15',
    category: 'progress',
    icon: 'trophy',
    rarity: 'rare'
  },
  {
    id: 'score_1000',
    name: 'Score Hunter',
    description: 'Earned 1000 total points',
    category: 'gaming',
    icon: 'trophy',
    rarity: 'uncommon'
  },
  {
    id: 'games_10',
    name: 'Game Enthusiast',
    description: 'Played 10 games',
    category: 'gaming',
    icon: 'play',
    rarity: 'uncommon'
  },
  {
    id: 'perfectionist',
    name: 'Perfectionist',
    description: 'Complete a game with perfect score',
    category: 'special',
    icon: 'trophy',
    rarity: 'legendary'
  }
]

// Computed achievements with earned status
const achievementsWithStatus = computed(() => {
  return allAchievements.map(achievement => {
    const earned = gameData.achievements.find(a => a.id === achievement.id && a.earned)

    return {
      ...achievement,
      earned: !!earned,
      earnedAt: earned?.earnedAt || null,
      progress: getAchievementProgress(achievement)
    }
  })
})

// Get achievement progress for unearned achievements
const getAchievementProgress = (achievement) => {
  if (gameData.achievements.find(a => a.id === achievement.id && a.earned)) {
    return 100 // Already earned
  }

  // Calculate progress based on achievement type
  switch (achievement.id) {
    case 'level_5':
      return Math.min((gameData.player.level / 5) * 100, 100)
    case 'level_10':
      return Math.min((gameData.player.level / 10) * 100, 100)
    case 'level_15':
      return Math.min((gameData.player.level / 15) * 100, 100)
    case 'score_1000':
      return Math.min((gameData.player.totalScore / 1000) * 100, 100)
    case 'games_10':
      return Math.min((gameData.player.gamesPlayed / 10) * 100, 100)
    case 'first_game':
      return gameData.player.gamesPlayed > 0 ? 100 : 0
    default:
      return 0
  }
}

// Group achievements by category
const achievementsByCategory = computed(() => {
  const grouped = {}
  achievementCategories.forEach(category => {
    grouped[category.id] = achievementsWithStatus.value.filter(
      achievement => achievement.category === category.id
    )
  })
  return grouped
})

// Statistics
const achievementStats = computed(() => {
  const earned = achievementsWithStatus.value.filter(a => a.earned).length
  const total = achievementsWithStatus.value.length

  return {
    earned,
    total,
    percentage: Math.round((earned / total) * 100)
  }
})

// Get rarity color class
const getRarityClass = (rarity) => {
  const rarityMap = {
    common: 'rarity--common',
    uncommon: 'rarity--uncommon',
    rare: 'rarity--rare',
    epic: 'rarity--epic',
    legendary: 'rarity--legendary'
  }
  return rarityMap[rarity] || 'rarity--common'
}

// Format date
const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}
</script>

<template>
  <main class="content">
    <!-- Trophy Header -->
    <section class="trophy-header">
      <h2 class="trophy-title">Trophy Collection</h2>
      <div class="trophy-stats">
        <div class="stat-card">
          <span class="stat-number">{{ achievementStats.earned }}</span>
          <span class="stat-label">Earned</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ achievementStats.total }}</span>
          <span class="stat-label">Total</span>
        </div>
        <div class="stat-card">
          <span class="stat-number">{{ achievementStats.percentage }}%</span>
          <span class="stat-label">Complete</span>
        </div>
      </div>
    </section>

    <!-- Achievement Categories -->
    <section
      v-for="category in achievementCategories"
      :key="category.id"
      class="achievement-category"
    >
      <h3 class="category-title">{{ category.name }}</h3>

      <div class="achievements-grid">
        <div
          v-for="achievement in achievementsByCategory[category.id]"
          :key="achievement.id"
          class="achievement-card"
          :class="{
            'achievement-card--earned': achievement.earned,
            'achievement-card--locked': !achievement.earned && achievement.progress === 0,
            [getRarityClass(achievement.rarity)]: true
          }"
        >
          <!-- Achievement Icon -->
          <div class="achievement-icon">
            <div
              class="icon-container"
              :class="`btn--${category.color}`"
            >
              <Icon :name="achievement.icon" size="24" />
            </div>
          </div>

          <!-- Achievement Content -->
          <div class="achievement-content">
            <div class="achievement-header">
              <h4 class="achievement-name">{{ achievement.name }}</h4>
              <div
                class="rarity-badge"
                :class="getRarityClass(achievement.rarity)"
              >
                {{ achievement.rarity }}
              </div>
            </div>

            <p class="achievement-description">{{ achievement.description }}</p>

            <!-- Progress Bar (for unearned achievements) -->
            <div
              v-if="!achievement.earned && achievement.progress > 0"
              class="achievement-progress"
            >
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: `${achievement.progress}%` }"
                ></div>
              </div>
              <span class="progress-text">{{ Math.round(achievement.progress) }}%</span>
            </div>

            <!-- Earned Date -->
            <div
              v-if="achievement.earned && achievement.earnedAt"
              class="earned-date"
            >
              <Icon name="trophy" size="14" />
              <span>Earned {{ formatDate(achievement.earnedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
// Trophy Header
.trophy-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.trophy-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0 0 var(--space-4) 0;
}

.trophy-stats {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
}

.stat-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
  min-width: 80px;
}

.stat-number {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.stat-label {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  text-transform: uppercase;
}

// Achievement Categories
.achievement-category {
  margin-bottom: var(--space-8);
}

.category-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0 0 var(--space-4) 0;
  padding-left: var(--space-2);
}

// Achievements Grid
.achievements-grid {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

// Achievement Card
.achievement-card {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  display: flex;
  gap: var(--space-4);
  transition: all 0.2s ease;
  position: relative;

  &--earned {
    background-color: var(--card-bg-hover);
    border-color: var(--success-color);
  }

  &--locked {
    opacity: 0.6;

    .achievement-icon {
      opacity: 0.5;
    }
  }
}

.achievement-icon {
  flex-shrink: 0;

  .icon-container {
    width: var(--space-12);
    height: var(--space-12);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
}

.achievement-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.achievement-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.achievement-name {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.achievement-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.4;
}

// Rarity System
.rarity-badge {
  padding: var(--space-0) var(--space-2);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;

  &.rarity--common {
    background-color: var(--info-color);
    color: white;
  }

  &.rarity--uncommon {
    background-color: var(--success-color);
    color: white;
  }

  &.rarity--rare {
    background-color: var(--primary-color);
    color: white;
  }

  &.rarity--epic {
    background-color: var(--warning-color);
    color: white;
  }

  &.rarity--legendary {
    background: linear-gradient(45deg, #ff6b6b, #ffd93d);
    color: white;
  }
}

// Progress System
.achievement-progress {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-1);
}

.progress-bar {
  flex: 1;
  height: var(--space-1);
  background-color: var(--card-border);
  border-radius: var(--border-radius-sm);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: var(--border-radius-sm);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-weight: var(--font-weight-bold);
  min-width: 35px;
}

// Earned Date
.earned-date {
  display: flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  color: var(--success-color);
  font-weight: var(--font-weight-bold);
  margin-top: var(--space-1);
}
</style>