<script setup>
import {ref, computed, onMounted, onUnmounted, nextTick, shallowRef, reactive} from 'vue'
import Matter from 'matter-js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import {PHYSICS_CONFIG, FRUIT_TYPES, FRUIT_SPAWN_WEIGHTS, FRUIT_MERGE_LEVELS} from '../config/fruitMergeConfig.js'
import {calculateLevelStars} from "../config/levelUtils.js";

const props = defineProps({
  level: {
    type: Number,
    default: 1
  }
})

const emit = defineEmits(['back-to-gaming', 'game-complete'])

// LocalStorage service
const { } = useLocalStorage()

const { t } = useI18n()

// Game state
const gameState = ref('playing') // 'playing', 'paused', 'completed'
const fruits = ref([]);
const currentLevel = ref(props.level || 1)

const topBoundary = computed(() => {
  return 50;
});
</script>

<template>
  <main class="fruit-merge-game">
    <!-- Game Header -->
    <div class="game-header">
      <div class="game-info">
        <h2 class="game-title">{{ t('fruitMerge.title') }}</h2>
        <div class="level-indicator">{{ t('fruitMerge.level_title', { level: currentLevel }) }}</div>
      </div>
      <div class="game-stats-container">
        <!-- Progress Overview -->
        <!-- Game Performance Stats -->
      </div>
    </div>

    <!-- Game Playing State -->
    <div class="game-board">
      <!-- Game Controls -->
      <!-- Game Field -->
      <div class="game-field">
        <div class="physics-field" ref="gameBoard">
          <div class="top-boundary-line" :style="{ top: topBoundary + 'px' }"></div>
          <div
            v-for="fruit in fruits"
            :key="fruit.id"
            class="fruit"
            :class="{
              'merging': fruit.merging
            }"
            :style="{
              left: `${fruit.x}px`,
              top: `${fruit.y}px`,
              width: `${fruit.size}px`,
              height: `${fruit.size}px`,
              transform: `rotate(${fruit.rotation}deg)`
            }"
          >
            <div class="fruit-svg" v-html="fruit.svg"></div>
          </div>
        </div>
      </div>
    </div>
    <!-- Game Completed State -->
  </main>
</template>

<style lang="scss">
.fruit-merge-game {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: var(--space-4);
  min-height: calc(100vh - 80px);
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
  background-color: var(--warning-color);
  color: white;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
}

.game-stats-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.game-field {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  min-height: 320px;
}

.physics-field {
  width: 280px;
  height: 320px;
  position: relative;
  background: transparent;
  border: 2px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;

  &.physics-ready {
    cursor: crosshair;
  }

  &.drop-ready {
    cursor: pointer;
  }

  &.dragging {
    cursor: grabbing;
  }
}

.top-boundary-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: rgba(255, 0, 0, 0.7);
  z-index: 5;
}
</style>