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
          {{ isEndlessMode ? t('hawkDungeon.endless_mode') : t('hawkDungeon.level_title', { level: currentLevel }) }}
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
        ref="gameCanvas"
        :knight="knight"
        :monsters="monsters"
        :items="items"
        :attackHitbox="attackHitbox"
        :dungeonOffset="dungeonOffset"
        :lockedDoorFlash="lockedDoorFlash"
        :levelLoader="levelLoader"
        :chestSystem="chestSystem"
        :npcSystem="npcSystem"
        @tileClick="handleClickMove"
      />

      <DialogueBubble
        :visible="npcSystem.dialogueState.visible"
        :npcName="npcSystem.dialogueState.npcName"
        :text="npcSystem.dialogueState.text"
        :position="npcSystem.dialogueState.position"
        :hasMoreText="npcSystem.dialogueState.hasMoreText"
        @advance="npcSystem.advanceNPCDialogue"
        @close="npcSystem.endDialogue"
      />
    </div>

    <div class="controls">
      <div class="left-controls">
        <AttackButton
          :cooldown="attackCooldown"
          :weapon="gameState.weapon"
          @attack="handleAttack"
        />
	      <WeaponButton
		      :is-active="showWeaponSelector"
		      :current-weapon="gameState.weapon"
		      :weapon-data="gameState.weapons.find(w => w.name === gameState.weapon)"
		      @toggle="toggleWeaponSelector"
	      />
	      <ItemButton
		      :is-active="showItemSelector"
		      @toggle="toggleItemSelector"
	      />
      </div>
      <JoystickControl
        :player-direction="knight.direction"
        @move="handleMove"
        @stop="handleStopMove"
      />
    </div>

    <div v-if="showWeaponSelector" class="inventory-overlay" @click.self="closeWeaponSelector">
      <div class="weapon-selector-container">
        <GemSelectionPanel
          :visible="showGemSelection"
          :inventory="gameState.inventory"
          @select="handleGemSelected"
          @close="handleGemSelectionClose"
        />
        <WeaponInventoryPanel
          :weapons="gameState.weapons"
          :current-weapon="gameState.weapon"
          @select-weapon="handleWeaponSwitch"
          @socket-gem="handleSocketGem"
          @unsocket-gem="handleUnsocketGem"
        />
      </div>
    </div>

    <div v-if="showItemSelector" class="inventory-overlay" @click.self="closeItemSelector">
      <div class="item-selector-container">
        <InventoryPanel
          :inventory="gameState.inventory"
        />
      </div>
    </div>

    <GameCompletedModal
      :visible="showGameCompletedModal"
      game-name="hawkDungeon"
      :level="currentLevel"
      :game-title="t('hawkDungeon.title')"
      :final-score="gameState.kills"
      :time-elapsed="0"
      :show-stars="true"
      :stars-earned="starsEarned"
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
      :level="currentLevel"
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
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
import WeaponInventoryPanel from './components/WeaponInventoryPanel.vue'
import WeaponButton from './components/WeaponButton.vue'
import GemSelectionPanel from './components/GemSelectionPanel.vue'
import DialogueBubble from './components/DialogueBubble.vue'
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

// Current level state
const currentLevel = ref(props.level || 1)

const router = useRouter()
const { t } = useI18n()
const {
  gameData,
  updateHawkDungeonLevel,
  updateGameStats,
  addScore,
  checkGameLevelAchievements,
  checkAutoAchievements,
  addAchievement
} = useLocalStorage()

// GameCanvas ref for blood splatter effects
const gameCanvas = ref(null)

const {
  gameState,
  knight,
  monsters,
  items,
  attackHitbox,
  attackCooldown,
  dungeonOffset,
  lockedDoorFlash,
  levelLoader,
  chestSystem,
  npcSystem,
  manaRegenProgress,
  healthRegenProgress,
  handleAttack,
  handleMove,
  handleStopMove,
  handleClickMove,
  switchWeapon,
  unlockWeapon,
  socketGem,
  unsocketGem,
  getWeaponStats,
  startGame,
  stopGame,
  setGameOverCallback,
  setLevelCompletionCallback,
  setBloodSplatterCallback,
  savePersistentState,
  clearPersistentState
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
      case '3':
        // Add test gems to inventory
        gameState.inventory.push(
          { type: 'ruby', name: 'Ruby' },
          { type: 'sapphire', name: 'Sapphire' },
          { type: 'emerald', name: 'Emerald' },
          { type: 'topaz', name: 'Topaz' },
          { type: 'amethyst', name: 'Amethyst' },
          { type: 'diamond', name: 'Diamond' }
        )
        console.log('Added test gems to inventory!')
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


// Check Hawk Dungeon specific achievements
const checkHawkDungeonAchievements = () => {
  // You can add HawkDungeon-specific achievements here later
  // For now, this is a placeholder for game-specific achievements
}

// Calculate level rewards and achievements
const calculateLevelRewards = () => {
  const levelConfig = getLevelConfig(currentLevel.value)

  // Reset earned achievements
  earnedAchievements.value = []

  // Calculate stars (1-3 based on health remaining)
  const healthPercent = (gameState.currentHealth / gameState.maxHealth) * 100
  const stars = healthPercent >= 80 ? 3 : healthPercent >= 50 ? 2 : 1
  starsEarned.value = stars

  // Update level statistics
  updateHawkDungeonLevel(currentLevel.value, {
    completed: true,
    stars: stars,
    kills: gameState.kills,
    score: gameState.kills,
    survivalTime: sessionTime.value,
    healthRemaining: gameState.currentHealth
  })

  // Track achievements before checks
  const achievementsBeforeCheck = gameData.achievements.length

  // Check level completion achievements
  checkGameLevelAchievements('hawkDungeon', currentLevel.value)

  // Check HawkDungeon specific achievements
  checkHawkDungeonAchievements()

  // Check auto achievements
  checkAutoAchievements()

  // Collect newly earned achievements
  const newAchievements = gameData.achievements.slice(achievementsBeforeCheck)
  newAchievements.forEach(achievement => {
    earnedAchievements.value.push(achievement)
  })

  // Check if first time completion
  const previousStats = gameData.games.hawkDungeon.levels[currentLevel.value]
  const isFirstTime = previousStats ? !previousStats.completed : true

  // Calculate level reward
  const baseLevelReward = currentLevel.value * 50 // 50 coins per level
  const starMultiplier = stars * 0.5 // +50% per star
  const healthBonus = gameState.currentHealth * 5
  const killsBonus = gameState.kills * 2

  const totalCoins = Math.round(baseLevelReward * (1 + starMultiplier)) + healthBonus + killsBonus
  const totalDiamonds = stars >= 3 ? 3 : stars >= 2 ? 2 : 1

  // Create reward breakdown
  const breakdown = []

  // Base completion
  breakdown.push({
    type: 'base',
    source: t('rewards.breakdown.base_completion'),
    coins: baseLevelReward,
    diamonds: 0,
    icon: 'completion',
    style: 'default'
  })

  // Star performance
  if (stars > 0) {
    breakdown.push({
      type: 'stars',
      source: t('rewards.breakdown.star_performance', { stars }),
      coins: Math.round(baseLevelReward * starMultiplier),
      diamonds: totalDiamonds,
      icon: 'star-filled',
      style: 'performance'
    })
  }

  // Health bonus
  if (healthBonus > 0) {
    breakdown.push({
      type: 'health',
      source: t('rewards.breakdown.health_bonus', { health: gameState.currentHealth }),
      coins: healthBonus,
      diamonds: 0,
      icon: 'heart',
      style: 'performance'
    })
  }

  // Kills bonus
  if (killsBonus > 0) {
    breakdown.push({
      type: 'kills',
      source: t('rewards.breakdown.kills_bonus', { kills: gameState.kills }),
      coins: killsBonus,
      diamonds: 0,
      icon: 'skull',
      style: 'performance'
    })
  }

  // Add achievement rewards to breakdown
  if (earnedAchievements.value.length > 0) {
    earnedAchievements.value.forEach(achievement => {
      breakdown.push({
        type: 'achievement',
        source: t('rewards.breakdown.achievement_reward', { name: t(`achievements.definitions.${achievement.id}.name`) }),
        coins: achievement.rewards.coins,
        diamonds: achievement.rewards.diamonds,
        icon: 'trophy',
        style: 'achievement'
      })
    })

    // Add achievement rewards to totals
    const achievementCoins = earnedAchievements.value.reduce((sum, a) => sum + a.rewards.coins, 0)
    const achievementDiamonds = earnedAchievements.value.reduce((sum, a) => sum + a.rewards.diamonds, 0)

    rewardBreakdown.value = {
      items: breakdown,
      total: {
        coins: totalCoins + achievementCoins,
        diamonds: totalDiamonds + achievementDiamonds
      }
    }

    levelReward.value = {
      coins: totalCoins + achievementCoins,
      diamonds: totalDiamonds + achievementDiamonds
    }

    // Update player currency with achievements
    gameData.player.coins = (gameData.player.coins || 0) + totalCoins + achievementCoins
    gameData.player.diamonds = (gameData.player.diamonds || 0) + totalDiamonds + achievementDiamonds
  } else {
    rewardBreakdown.value = {
      items: breakdown,
      total: {
        coins: totalCoins,
        diamonds: totalDiamonds
      }
    }

    levelReward.value = {
      coins: totalCoins,
      diamonds: totalDiamonds
    }

    // Update player currency
    gameData.player.coins = (gameData.player.coins || 0) + totalCoins
    gameData.player.diamonds = (gameData.player.diamonds || 0) + totalDiamonds
  }

  // Update game stats
  const gameStats = {
    gamesPlayed: gameData.games.hawkDungeon.gamesPlayed + 1,
    totalScore: gameData.games.hawkDungeon.totalScore + gameState.kills,
    highScore: Math.max(gameData.games.hawkDungeon.highScore, gameState.kills),
    maxLevel: Math.max(gameData.games.hawkDungeon.maxLevel, currentLevel.value),
    totalKills: gameData.games.hawkDungeon.totalKills + gameState.kills,
    totalCoins: gameData.games.hawkDungeon.totalCoins + gameState.coins,
    stars: gameData.games.hawkDungeon.stars + stars,
    completedLevels: gameData.games.hawkDungeon.completedLevels + (isFirstTime ? 1 : 0)
  }

  updateGameStats('hawkDungeon', gameStats)
  addScore(gameState.kills)

  console.log('⚔️ Level completed with achievements!', {
    level: currentLevel.value,
    kills: gameState.kills,
    healthRemaining: gameState.currentHealth,
    stars,
    achievements: earnedAchievements.value.length,
    reward: rewardBreakdown.value
  })
}

// Session timer for endless mode
const sessionTime = ref(0)
const sessionTimer = ref(null)

// Modal state
const showGameOverModal = ref(false)
const showGameCompletedModal = ref(false)

// Inventory menu state
const showWeaponSelector = ref(false)
const showItemSelector = ref(false)

// Gem selection modal state
const showGemSelection = ref(false)
const selectedWeaponForSocket = ref(null)
const selectedSocketIndex = ref(null)

// Achievements and rewards
const earnedAchievements = ref([])
const levelReward = ref(0)
const rewardBreakdown = ref([])
const starsEarned = ref(0)

// Computed
const currentLevelConfig = computed(() => getLevelConfig(currentLevel.value))

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

  // Clear persistent state when going back to level selection
  clearPersistentState()

  backToLevelSelection()
}

const handleNextLevel = () => {
  showGameCompletedModal.value = false
  nextLevel()
}

const nextLevel = () => {
  // Check if there are more levels
  const maxLevel = 6 // Maximum number of levels in the game

  if (currentLevel.value < maxLevel) {
    currentLevel.value++
    router.push(`/games/hawkdungeon/${currentLevel.value}`)
    stopGame()
	  savePersistentState()

    // Small delay to ensure cleanup
    setTimeout(() => {
      startGame(currentLevel.value)
    }, 100)
  } else {
    backToLevelSelection()
  }
}

const handleTryAgain = () => {
  // Clear all game state
  monsters.value = []
  items.value = []

  // Clear persistent state when retrying (fresh start)
  clearPersistentState()

  // Restart the game completely
  stopGame()

  // Small delay to ensure cleanup
  setTimeout(() => {
    // Start game with current level
    startGame(currentLevel.value)
  }, 100)
}

const handleWeaponSwitch = (weaponName) => {
  switchWeapon(weaponName)
  // Auto-close weapon selector after selection
  showWeaponSelector.value = false
}

const toggleWeaponSelector = () => {
  showWeaponSelector.value = !showWeaponSelector.value
  // Close item selector when opening weapon selector
  if (showWeaponSelector.value) {
    showItemSelector.value = false
  }
}

const toggleItemSelector = () => {
  showItemSelector.value = !showItemSelector.value
  // Close weapon selector when opening item selector
  if (showItemSelector.value) {
    showWeaponSelector.value = false
  }
}

const closeWeaponSelector = () => {
  showWeaponSelector.value = false
}

const closeItemSelector = () => {
  showItemSelector.value = false
}

const closeAllSelectors = () => {
  showWeaponSelector.value = false
  showItemSelector.value = false
}

// Gem socketing handlers
const handleSocketGem = (weaponName, socketIndex) => {
  // Store the weapon and socket index for later use
  selectedWeaponForSocket.value = weaponName
  selectedSocketIndex.value = socketIndex

  // Show gem selection modal
  showGemSelection.value = true
}

const handleGemSelected = (gemType) => {
  // Socket the selected gem
  const success = socketGem(selectedWeaponForSocket.value, selectedSocketIndex.value, gemType)

  if (success) {
    console.log(`Successfully socketed ${gemType} into ${selectedWeaponForSocket.value}`)
  }

  // Close the modal
  showGemSelection.value = false
  selectedWeaponForSocket.value = null
  selectedSocketIndex.value = null
}

const handleGemSelectionClose = () => {
  // Close the modal without socketing
  showGemSelection.value = false
  selectedWeaponForSocket.value = null
  selectedSocketIndex.value = null
}

const handleUnsocketGem = (weaponName, socketIndex) => {
  const success = unsocketGem(weaponName, socketIndex)

  if (success) {
    console.log(`Successfully removed gem from ${weaponName}`)
  }
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

  // Close inventory panels on ESC
  if (event.key === 'Escape') {
    if (showWeaponSelector.value || showItemSelector.value) {
      closeAllSelectors()
      event.preventDefault()
      return
    }
  }

  // Prevent default for game controls
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', ' ', '1', '2', '3', '4', 'i', 'I', 'u', 'U'].includes(event.key)) {
    event.preventDefault()
  }

  // Avoid key repeat
  if (activeKeys.value.has(event.key)) return
  activeKeys.value.add(event.key)

  // Toggle weapon selector (u/U key)
  if (event.key === 'u' || event.key === 'U') {
    toggleWeaponSelector()
    return
  }

	// Toggle Item Selector
	if (event.key === 'i' || event.key === 'I') {
		toggleItemSelector()
		return
	}

  // Weapon switching (number keys 1-4)
  if (['1', '2', '3', '4'].includes(event.key)) {
    const weaponIndex = parseInt(event.key) - 1
    if (gameState.weapons[weaponIndex]) {
      switchWeapon(gameState.weapons[weaponIndex].name)
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
  // Set blood splatter callback after canvas is mounted
  if (setBloodSplatterCallback) {
    setBloodSplatterCallback((gridX, gridY, isBoss = false) => {
      if (gameCanvas.value && gameCanvas.value.generateBloodSplatter) {
        gameCanvas.value.generateBloodSplatter(gridX, gridY, isBoss)
      }
    })
  }

  // Start game with current level
  startGame(currentLevel.value)

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

// Watch level changes
watch(() => props.level, (newLevel) => {
  currentLevel.value = newLevel
  stopGame()
  startGame(currentLevel.value)
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
  align-items: flex-end;
}

.inventory-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 20px;
  z-index: 100;
  pointer-events: auto;
  animation: fadeIn 0.2s ease-out;
}

.weapon-selector-container,
.item-selector-container {
  pointer-events: auto;
  animation: slideUp 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
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