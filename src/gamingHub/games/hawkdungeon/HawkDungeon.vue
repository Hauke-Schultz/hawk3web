<template>
  <Header
    :game-data="gameData"
    :player="gameData.player"
    :achievements="gameData.achievements"
    :show-menu-button="true"
    @menu-click="handleMenuClick"
  />

  <main class="hawk-dungeon">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2 class="game-title">{{ t('hawkDungeon.title') }}</h2>
        <div class="level-indicator" :class="{ 'level-indicator--endless': isEndlessMode }">
          {{ isEndlessMode ? t('hawkDungeon.endless_mode') : t('hawkDungeon.level_title', { level: gameState.level }) }}
        </div>
      </div>
    </div>

    <!-- Game Canvas Container -->
    <div class="game-container">
      <GameHUD
        :health="gameState.currentHealth"
        :maxHealth="gameState.maxHealth"
        :kills="gameState.kills"
        :killGoal="gameState.killGoal"
        :coins="gameState.coins"
      />

      <GameCanvas
        :knight="knight"
        :monsters="monsters"
        :items="items"
        :attackHitbox="attackHitbox"
        :dungeonOffset="dungeonOffset"
      />
    </div>

    <div class="controls">
      <AttackButton
        :cooldown="attackCooldown"
        :weapon="gameState.weapon"
        @attack="handleAttack"
      />
      <JoystickControl
        @move="handleMove"
        @stop="handleStopMove"
      />
    </div>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../../composables/useI18n.js'
import { getLevelConfig } from './hawkDungeonConfig'
import Header from '../../components/Header.vue'
import GameHUD from './components/GameHUD.vue'
import GameCanvas from './components/GameCanvas.vue'
import AttackButton from './components/AttackButton.vue'
import JoystickControl from './components/JoystickControl.vue'
import { useHawkDungeon } from './composables/useHawkDungeon'

// Props
const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

const router = useRouter()
const { t } = useI18n()
const { gameData } = useLocalStorage()

const {
  gameState,
  knight,
  monsters,
  items,
  attackHitbox,
  attackCooldown,
  dungeonOffset,
  handleAttack,
  handleMove,
  handleStopMove,
  startGame,
  stopGame
} = useHawkDungeon()

// Session timer for endless mode
const sessionTime = ref(0)
const sessionTimer = ref(null)

// Computed
const currentLevelConfig = computed(() => getLevelConfig(props.level || gameState.value?.level || 1))

const isEndlessMode = computed(() => {
  return currentLevelConfig.value.endless || false
})

// Timer functions
const startSessionTimer = () => {
  if (!isEndlessMode.value) return

  sessionTimer.value = setInterval(() => {
    sessionTime.value++
  }, 1000)
}

const stopSessionTimer = () => {
  if (sessionTimer.value) {
    clearInterval(sessionTimer.value)
    sessionTimer.value = null
  }
}

// Navigation
const handleMenuClick = () => {
  router.push('/')
}

// Keyboard controls
const activeKeys = ref(new Set())

const handleKeyDown = (event) => {
  // Prevent default for game controls
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' '].includes(event.key)) {
    event.preventDefault()
  }

  // Avoid key repeat
  if (activeKeys.value.has(event.key)) return
  activeKeys.value.add(event.key)

  // Movement keys
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
      handleMove('up')
      break
    case 'ArrowDown':
    case 's':
      handleMove('down')
      break
    case 'ArrowLeft':
    case 'a':
      handleMove('left')
      break
    case 'ArrowRight':
    case 'd':
      handleMove('right')
      break
    case ' ':
      handleAttack()
      break
  }
}

const handleKeyUp = (event) => {
  activeKeys.value.delete(event.key)

  // Stop movement when key is released
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(event.key)) {
    // Only stop if no movement keys are pressed
    const hasMovementKey = Array.from(activeKeys.value).some(key =>
      ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'].includes(key)
    )
    if (!hasMovementKey) {
      handleStopMove()
    }
  }
}

onMounted(() => {
  startGame()

  if (isEndlessMode.value) {
    startSessionTimer()
  }

  // Add keyboard event listeners
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  stopGame()
  stopSessionTimer()

  // Remove keyboard event listeners
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})
</script>

<style lang="scss" scoped>
.hawk-dungeon {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
  background: #1a1a1a;
  touch-action: manipulation;
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  user-select: none;
  overscroll-behavior: contain;
}

// Game Header
.game-header {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.game-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.game-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.level-indicator {
  background-color: var(--primary-color);
  color: white;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  align-self: center;

  &--endless {
    background: linear-gradient(135deg, var(--primary-color), var(--warning-color));
    animation: endlessGlow 2s ease-in-out infinite alternate;
  }
}

// Game Container
.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  position: relative;
  flex: 1;
  touch-action: manipulation;
  overscroll-behavior: contain;
  user-select: none;
}

.controls {
  position: absolute;
  bottom: 20px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
}

.controls > * {
  pointer-events: auto;
}

// Animations
@keyframes endlessGlow {
  0% {
    box-shadow: 0 0 5px rgba(59, 130, 246, 0.3);
  }
  100% {
    box-shadow: 0 0 15px rgba(59, 130, 246, 0.6);
  }
}

// Touch feedback
@media (hover: none) {
  .game-container {
    user-select: none;
    -webkit-user-select: none;
  }
}
</style>