<script setup>
import { ref } from 'vue'

const gameStarted = ref(false)
const score = ref(0)

const startGame = () => {
  gameStarted.value = true
  score.value = 0
}

const stopGame = () => {
  gameStarted.value = false
}
</script>

<template>
  <div class="fruit-merge">
    <div v-if="!gameStarted" class="game-start">
      <h3>Fruit Merge</h3>
      <p>Kombiniere gleiche Früchte, um Punkte zu sammeln!</p>
      <button @click="startGame" class="btn">Spiel starten</button>
    </div>
    <div v-else class="game-container">
      <div class="game-header">
        <div class="score">Punkte: {{ score }}</div>
        <button @click="stopGame" class="btn btn--ghost">Beenden</button>
      </div>
      <div class="game-board">
        <!-- Hier kommt später das Spielfeld -->
        <p>Spielfeld wird geladen...</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fruit-merge {
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.game-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.game-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
}

.score {
  font-size: 1.25rem;
  font-weight: bold;
}

.game-board {
  flex: 1;
  background-color: rgba(0, 0, 0, 0.05);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn {
  padding: 0.5rem 1rem;
  border-radius: 0.25rem;
  border: none;
  background-color: var(--accent-color);
  color: white;
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: var(--accent-color-hover);
  }

  &.btn--ghost {
    background-color: transparent;
    border: 1px solid var(--accent-color);
    color: var(--accent-color);

    &:hover {
      background-color: var(--accent-color);
      color: white;
    }
  }
}
</style> 