<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { apiService } from '../services/apiService.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import Header from '../components/Header.vue'
import { useLocalStorage } from '../composables/useLocalStorage.js'

const { t } = useI18n()
const { gameData } = useLocalStorage()
const router = useRouter()

const users = ref([])
const loading = ref(true)
const error = ref(null)
const sortBy = ref('level') // level, coins, diamonds, achievements, gamesPlayed

// Load users on mount
onMounted(async () => {
  await loadUsers()
})

async function loadUsers() {
  loading.value = true
  error.value = null

  try {
    const response = await apiService.getUserStats()
    if (response.success) {
      users.value = response.users
    }
  } catch (err) {
    error.value = err.message || 'Fehler beim Laden der Benutzer'
    console.error('Error loading users:', err)
  } finally {
    loading.value = false
  }
}

// Sorted users based on sortBy
const sortedUsers = computed(() => {
  const sorted = [...users.value]

  sorted.sort((a, b) => {
    switch (sortBy.value) {
      case 'level':
        if (b.level !== a.level) return b.level - a.level
        return b.coins - a.coins
      case 'coins':
        return b.coins - a.coins
      case 'diamonds':
        return b.diamonds - a.diamonds
      case 'achievements':
        return b.achievements - a.achievements
      case 'gamesPlayed':
        return b.gamesPlayed - a.gamesPlayed
      default:
        return 0
    }
  })

  return sorted
})

// Format date
function formatDate(dateString) {
  if (!dateString) return 'Nie'
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

function formatDateTime(dateString) {
  if (!dateString) return 'Nie'
  const date = new Date(dateString)
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Get rank badge
function getRankBadge(index) {
  if (index === 0) return '🥇'
  if (index === 1) return '🥈'
  if (index === 2) return '🥉'
  return `#${index + 1}`
}

function handleMenuClick() {
  router.push('/gaming')
}
</script>

<template>
  <div class="users-page">
    <Header
      :title="'Benutzer-Rangliste'"
      :coins="gameData.player.coins"
      :diamonds="gameData.player.diamonds"
      :achievements="gameData.achievements"
      :show-menu-button="true"
      @menu-click="handleMenuClick"
    />

    <main class="content">
      <section class="users-section">
        <div class="users-header">
          <h2>Alle Spieler</h2>
          <button class="btn btn--secondary btn--small" @click="loadUsers" :disabled="loading">
            <Icon name="sync" size="14" :class="{ spinning: loading }" />
            Aktualisieren
          </button>
        </div>

        <!-- Sort Controls -->
        <div class="sort-controls">
          <label>Sortieren nach:</label>
          <div class="sort-buttons">
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'level' }"
              @click="sortBy = 'level'"
            >
              <Icon name="level" size="14" />
              Level
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'coins' }"
              @click="sortBy = 'coins'"
            >
              <Icon name="coin" size="14" />
              Coins
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'diamonds' }"
              @click="sortBy = 'diamonds'"
            >
              <Icon name="diamond" size="14" />
              Diamanten
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'achievements' }"
              @click="sortBy = 'achievements'"
            >
              <Icon name="achievement" size="14" />
              Erfolge
            </button>
            <button
              class="sort-btn"
              :class="{ active: sortBy === 'gamesPlayed' }"
              @click="sortBy = 'gamesPlayed'"
            >
              <Icon name="game" size="14" />
              Spiele
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="loading-state">
          <Icon name="sync" size="32" class="spinning" />
          <p>Lade Spieler...</p>
        </div>

        <!-- Error State -->
        <div v-else-if="error" class="error-state">
          <Icon name="error" size="32" />
          <p>{{ error }}</p>
          <button class="btn btn--primary" @click="loadUsers">
            Erneut versuchen
          </button>
        </div>

        <!-- Empty State -->
        <div v-else-if="sortedUsers.length === 0" class="empty-state">
          <Icon name="user" size="32" />
          <p>Noch keine Spieler registriert</p>
        </div>

        <!-- Users List -->
        <div v-else class="users-list">
          <div
            v-for="(user, index) in sortedUsers"
            :key="user.username"
            class="user-card"
            :class="{ 'is-current-user': user.username.toLowerCase() === gameData.player.name.toLowerCase() }"
          >
            <div class="user-rank">
              {{ getRankBadge(index) }}
            </div>

            <div class="user-info">
              <div class="user-name">
                {{ user.username }}
                <span v-if="user.username.toLowerCase() === gameData.player.name.toLowerCase()" class="you-badge">
                  (Du)
                </span>
              </div>
              <div class="user-meta">
                Beigetreten: {{ formatDate(user.createdAt) }}
                <span v-if="user.lastLogin" class="divider">•</span>
                <span v-if="user.lastLogin">Zuletzt online: {{ formatDateTime(user.lastLogin) }}</span>
              </div>
            </div>

            <div class="user-stats">
              <div class="stat">
                <Icon name="level" size="16" />
                <span class="stat-label">Level</span>
                <span class="stat-value">{{ user.level }}</span>
              </div>

              <div class="stat">
                <Icon name="coin" size="16" />
                <span class="stat-label">Coins</span>
                <span class="stat-value">{{ user.coins.toLocaleString('de-DE') }}</span>
              </div>

              <div class="stat">
                <Icon name="diamond" size="16" />
                <span class="stat-label">Diamanten</span>
                <span class="stat-value">{{ user.diamonds.toLocaleString('de-DE') }}</span>
              </div>

              <div class="stat">
                <Icon name="achievement" size="16" />
                <span class="stat-label">Erfolge</span>
                <span class="stat-value">{{ user.achievements }}</span>
              </div>

              <div class="stat">
                <Icon name="game" size="16" />
                <span class="stat-label">Spiele</span>
                <span class="stat-value">{{ user.gamesPlayed }}</span>
              </div>

              <div class="stat">
                <Icon name="trophy" size="16" />
                <span class="stat-label">Punkte</span>
                <span class="stat-value">{{ user.totalScore.toLocaleString('de-DE') }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped lang="scss">
.users-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.content {
  flex: 1;
  padding: var(--space-4);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
}

.users-section {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
}

.users-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-4);

  h2 {
    margin: 0;
    color: var(--text-color);
    font-size: var(--font-size-2xl);
  }
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

// Sort Controls
.sort-controls {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
  padding: var(--space-3);
  background-color: var(--bg-secondary);
  border-radius: var(--border-radius-lg);

  label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
    color: var(--text-color);
  }

  .sort-buttons {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .sort-btn {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2) var(--space-3);
    background-color: var(--card-bg);
    border: 2px solid var(--card-border);
    border-radius: var(--border-radius-md);
    color: var(--text-color);
    font-size: var(--font-size-sm);
    cursor: pointer;
    transition: all 0.2s;

    &:hover {
      background-color: var(--bg-primary);
      border-color: var(--primary-color);
    }

    &.active {
      background-color: var(--primary-color);
      border-color: var(--primary-color);
      color: white;
    }
  }
}

// States
.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-6);
  color: var(--text-secondary);
  text-align: center;
}

.error-state {
  color: var(--error-color);
}

// Users List
.users-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background-color: var(--bg-secondary);
  border: 2px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  transition: all 0.2s;

  &:hover {
    border-color: var(--primary-color);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  &.is-current-user {
    border-color: var(--success-color);
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.05) 0%, var(--bg-secondary) 100%);
  }
}

.user-rank {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  min-width: 60px;
  text-align: center;
  color: var(--text-color);
}

.user-info {
  flex: 1;
  min-width: 0;

  .user-name {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    color: var(--text-color);
    margin-bottom: var(--space-1);

    .you-badge {
      display: inline-block;
      padding: 2px 8px;
      background-color: var(--success-color);
      color: white;
      font-size: var(--font-size-xs);
      border-radius: var(--border-radius-sm);
      margin-left: var(--space-1);
    }
  }

  .user-meta {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);

    .divider {
      margin: 0 var(--space-1);
    }
  }
}

.user-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: var(--space-3);

  .stat {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-1);
    padding: var(--space-2);
    background-color: var(--card-bg);
    border-radius: var(--border-radius-md);
    text-align: center;

    .stat-label {
      font-size: var(--font-size-xs);
      color: var(--text-secondary);
    }

    .stat-value {
      font-size: var(--font-size-base);
      font-weight: var(--font-weight-bold);
      color: var(--text-color);
    }
  }
}

// Responsive
@media (max-width: 768px) {
  .user-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .user-rank {
    align-self: center;
  }

  .user-stats {
    width: 100%;
    grid-template-columns: repeat(3, 1fr);
  }

  .sort-controls {
    .sort-buttons {
      justify-content: center;
    }
  }
}
</style>
