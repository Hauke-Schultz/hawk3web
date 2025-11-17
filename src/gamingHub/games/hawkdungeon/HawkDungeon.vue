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
        :mana="gameState.currentMana"
        :maxMana="gameState.maxMana"
        :kills="gameState.kills"
        :killGoal="gameState.killGoal"
        :coins="gameState.coins"
        :health-regen-progress="healthRegenProgress"
        :mana-regen-progress="manaRegenProgress"
      />

      <GameCanvas
        :knight="knight"
        :monsters="monsters"
        :items="items"
        :attackHitbox="attackHitbox"
        :dungeonOffset="dungeonOffset"
        :levelLoader="levelLoader"
        :chestSystem="chestSystem"
      />
    </div>

    <div class="controls">
      <div class="left-controls">
        <AttackButton
          :cooldown="attackCooldown"
          :weapon="gameState.weapon"
          @attack="handleAttack"
        />
	      <ItemButton
		      :is-active="showWeaponSelector"
		      @toggle="toggleWeaponSelector"
	      />
      </div>
      <JoystickControl
        :player-direction="knight.direction"
        @move="handleMove"
        @stop="handleStopMove"
      />
    </div>

    <div v-if="showWeaponSelector" class="weapon-selector-container">
      <InventoryPanel
        :weapons="gameState.weapons"
        :current-weapon="gameState.weapon"
        :inventory="gameState.inventory"
        @select-weapon="handleWeaponSwitch"
      />
    </div>

    <GameCompletedModal
      :visible="showGameCompletedModal"
      game-name="hawkDungeon"
      :level="gameState.level"
      :game-title="t('hawkDungeon.title')"
      :final-score="gameState.kills"
      :time-elapsed="0"
      :show-stars="false"
      :new-achievements="earnedAchievements"
      :show-achievements="true"
      :show-reward="true"
      :reward="levelReward"
      :show-completion-phases="true"
      :enable-phase-transition="true"
      :show-next-level="!isEndlessMode"
      :next-level-label="isEndlessMode ? t('hawkDungeon.play_again') : t('hawkDungeon.next_level')"
      :play-again-label="t('hawkDungeon.play_again')"
      :back-to-games-label="t('hawkDungeon.back_to_levels')"
      :show-reward-breakdown="true"
      :reward-breakdown="rewardBreakdown"
      @next-level="handleNextLevel"
      @play-again="handleModalPlayAgain"
      @back-to-games="handleModalBackToLevels"
      @close="handleModalBackToLevels"
    />

    <GameOverModal
      v-if="!isEndlessMode"
      :visible="showGameOverModal"
      :level="gameState.level"
      :game-title="t('hawkDungeon.title')"
      :final-score="gameState.kills"
      :game-over-icon="'💀'"
      :try-again-label="t('common.try_again')"
      :back-to-games-label="t('common.back_to_levels')"
      @try-again="handleModalPlayAgain"
      @back-to-games="handleModalBackToLevels"
    />
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
import ItemButton from './components/ItemButton.vue'
import JoystickControl from './components/JoystickControl.vue'
import WeaponSelector from './components/WeaponSelector.vue'
import InventoryPanel from './components/InventoryPanel.vue'
import GameOverModal from '../../components/GameOverModal.vue'
import GameCompletedModal from '../../components/GameCompletedModal.vue'
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
  levelLoader,
  chestSystem,
  manaRegenProgress,
  healthRegenProgress,
  handleAttack,
  handleMove,
  handleStopMove,
  switchWeapon,
  unlockWeapon,
  startGame,
  stopGame,
  setGameOverCallback,
  setLevelCompletionCallback
} = useHawkDungeon()

// For testing: Unlock weapons with keyboard shortcuts (Alt + 1/2/3)
// Remove this in production
const handleWeaponUnlock = (event) => {
  if (event.altKey) {
    switch(event.key) {
      case '1':
        unlockWeapon('axe')
        break
      case '2':
        unlockWeapon('spear')
        break
    }
  }
}

// Set game over callback to show modal
if (setGameOverCallback) {
  setGameOverCallback(() => {
    showGameOverModal.value = true
  })
}

// Set level completion callback
if (setLevelCompletionCallback) {
  setLevelCompletionCallback(() => {
    // Calculate rewards
    calculateLevelRewards()
    // Show completion modal
    showGameCompletedModal.value = true
    // Stop game
    stopGame()
  })
}

// Calculate level rewards and achievements
const calculateLevelRewards = () => {
  const currentLevel = gameState.level
  const levelConfig = getLevelConfig(currentLevel)

  // Base reward per level
  const baseReward = 50
  const levelMultiplier = currentLevel * 10

  // Calculate total reward
  const totalReward = baseReward + levelMultiplier

  // Build reward breakdown
  const breakdown = [
    {
      label: t('common.level_completion'),
      value: baseReward
    },
    {
      label: t('common.level_bonus'),
      value: levelMultiplier
    }
  ]

  // Bonus for remaining health
  const healthBonus = gameState.currentHealth * 5
  if (healthBonus > 0) {
    breakdown.push({
      label: t('common.health_bonus'),
      value: healthBonus
    })
  }

  // Total kills bonus
  const killsBonus = gameState.kills * 2
  if (killsBonus > 0) {
    breakdown.push({
      label: t('common.kills_bonus'),
      value: killsBonus
    })
  }

  levelReward.value = totalReward + healthBonus + killsBonus
  rewardBreakdown.value = breakdown

  // Award coins to player
  gameData.player.coins += levelReward.value

  // Check for achievements
  earnedAchievements.value = []

  // Mark level as completed in game stats
  if (!gameData.hawkDungeon) {
    gameData.hawkDungeon = { levels: [] }
  }
  if (!gameData.hawkDungeon.levels[currentLevel - 1]) {
    gameData.hawkDungeon.levels[currentLevel - 1] = {}
  }
  gameData.hawkDungeon.levels[currentLevel - 1].completed = true
  gameData.hawkDungeon.levels[currentLevel - 1].highScore = Math.max(
    gameData.hawkDungeon.levels[currentLevel - 1].highScore || 0,
    gameState.kills
  )
}

// Session timer for endless mode
const sessionTime = ref(0)
const sessionTimer = ref(null)

// Modal state
const showGameOverModal = ref(false)
const showGameCompletedModal = ref(false)

// Item menu state
const showWeaponSelector = ref(false)

// Achievements and rewards
const earnedAchievements = ref([])
const levelReward = ref(0)
const rewardBreakdown = ref([])

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
  router.push('/gaming')
}

const backToLevelSelection = () => {
  stopGame()
  router.push('/games/hawkdungeon')
}

const handleModalPlayAgain = () => {
  showGameOverModal.value = false
  showGameCompletedModal.value = false
  handleTryAgain()
}

const handleModalBackToLevels = () => {
  showGameOverModal.value = false
  showGameCompletedModal.value = false
  backToLevelSelection()
}

const handleNextLevel = () => {
  showGameCompletedModal.value = false

  // Calculate next level
  const nextLevelNum = gameState.level + 1

  // Navigate to next level
  router.push(`/games/hawkdungeon/level/${nextLevelNum}`)

  // Reload the page to start the new level
  setTimeout(() => {
    window.location.reload()
  }, 100)
}

const handleTryAgain = () => {
  // Clear all game state
  monsters.value = []
  items.value = []

  // Restart the game completely
  stopGame()

  // Small delay to ensure cleanup
  setTimeout(() => {
    // Set the level from props if available
    if (props.level) {
      gameState.level = props.level
    }
    startGame()
  }, 100)
}

const handleWeaponSwitch = (weaponName) => {
  switchWeapon(weaponName)
  // Auto-close weapon selector after selection
  showWeaponSelector.value = false
}

const toggleWeaponSelector = () => {
  showWeaponSelector.value = !showWeaponSelector.value
}

// Keyboard controls
const activeKeys = ref(new Set())
const spaceCharging = ref(false)
const spaceChargeStart = ref(0)
let spaceChargeInterval = null
let movementInterval = null
let currentDirection = ref(null)

const handleKeyDown = (event) => {
  // Check for weapon unlock shortcuts (Alt + 1/2)
  handleWeaponUnlock(event)

  // Prevent default for game controls
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', '1', '2', '3', '4', 'i', 'I'].includes(event.key)) {
    event.preventDefault()
  }

  // Avoid key repeat
  if (activeKeys.value.has(event.key)) return
  activeKeys.value.add(event.key)

  // Toggle weapon selector (i/I key)
  if (event.key === 'i' || event.key === 'I') {
    toggleWeaponSelector()
    return
  }

  // Weapon switching (number keys 1-4)
  if (['1', '2', '3', '4'].includes(event.key)) {
    const weaponIndex = parseInt(event.key) - 1
    if (gameState.weapons[weaponIndex]) {
      switchWeapon(gameState.weapons[weaponIndex])
      // Auto-close weapon selector after keyboard selection
      showWeaponSelector.value = false
    }
    return
  }

  // Movement keys
  let direction = null
  switch (event.key) {
    case 'ArrowUp':
    case 'w':
      direction = 'up'
      break
    case 'ArrowDown':
    case 's':
      direction = 'down'
      break
    case 'ArrowLeft':
    case 'a':
      direction = 'left'
      break
    case 'ArrowRight':
    case 'd':
      direction = 'right'
      break
    case ' ':
      // Start charging attack
      if (!spaceCharging.value && attackCooldown.value <= 0) {
        spaceCharging.value = true
        spaceChargeStart.value = performance.now()

        // Check every 16ms if charge is complete
        spaceChargeInterval = setInterval(() => {
          const duration = performance.now() - spaceChargeStart.value
          if (duration >= 300) {
            // Auto-execute charged attack
            clearInterval(spaceChargeInterval)
            spaceCharging.value = false
            handleAttack({ charged: true })
          }
        }, 16)
      }
      break
  }

  // Start continuous movement
  if (direction && direction !== currentDirection.value) {
    currentDirection.value = direction

    // Clear previous interval if exists
    if (movementInterval) {
      clearInterval(movementInterval)
    }

    // Send initial move
    handleMove(direction)

    // Start continuous move interval (every 100ms, like joystick)
    movementInterval = setInterval(() => {
      if (currentDirection.value) {
        handleMove(currentDirection.value)
      }
    }, 100)
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
      // Clear movement interval
      if (movementInterval) {
        clearInterval(movementInterval)
        movementInterval = null
      }
      currentDirection.value = null
      handleStopMove()
    }
  }

  // Handle space key release
  if (event.key === ' ' && spaceCharging.value) {
    clearInterval(spaceChargeInterval)
    const duration = performance.now() - spaceChargeStart.value
    spaceCharging.value = false

    // Only execute normal attack if released before 300ms
    // (charged attack already executed automatically at 300ms)
    if (duration < 300) {
      handleAttack({ charged: false })
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

  // Clear movement interval
  if (movementInterval) {
    clearInterval(movementInterval)
    movementInterval = null
  }

  // Clear space charge interval
  if (spaceChargeInterval) {
    clearInterval(spaceChargeInterval)
    spaceChargeInterval = null
  }

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
  bottom: 80px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  pointer-events: none;
}

.controls > * {
  pointer-events: auto;
}

.left-controls {
  display: flex;
  gap: 12px;
  align-items: center;
}

.weapon-selector-container {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  pointer-events: auto;
  z-index: 10;
  animation: slideUp 0.3s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
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