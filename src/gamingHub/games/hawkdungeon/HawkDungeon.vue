<template>
  <div class="hawk-dungeon">
    <GameHUD
      :health="gameState.currentHealth"
      :maxHealth="gameState.maxHealth"
      :level="gameState.level"
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
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import GameHUD from './components/GameHUD.vue'
import GameCanvas from './components/GameCanvas.vue'
import AttackButton from './components/AttackButton.vue'
import JoystickControl from './components/JoystickControl.vue'
import { useHawkDungeon } from './composables/useHawkDungeon'

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

onMounted(() => {
  startGame()
})

onUnmounted(() => {
  stopGame()
})
</script>

<style scoped>
.hawk-dungeon {
  width: 100vw;
  height: 100vh;
  background: #1a1a1a;
  position: relative;
  overflow: hidden;
  touch-action: none;
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
</style>