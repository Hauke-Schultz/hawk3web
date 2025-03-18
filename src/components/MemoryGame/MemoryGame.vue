<script setup>
import { ref, computed, onMounted } from 'vue'

// Game configuration
const symbols = ['🍎', '🍐', '🍋', '🍊', '🍇', '🍓', '🍒', '🥝']
const gridSize = ref(4) // 4x4 grid
const cards = ref([])
const flippedCards = ref([])
const matchedPairs = ref([])
const gameStarted = ref(false)
const moves = ref(0)
const currentFocus = ref(0)
const gameComplete = ref(false)

// Initialize the game board
const initializeGame = () => {
  // Reset game state
  flippedCards.value = []
  matchedPairs.value = []
  moves.value = 0
  gameComplete.value = false

  // Create pairs of cards
  const pairs = [...symbols, ...symbols].slice(0, (gridSize.value * gridSize.value) / 2)
  const duplicatedPairs = [...pairs, ...pairs]

  // Shuffle cards
  const shuffled = duplicatedPairs.sort(() => Math.random() - 0.5)

  // Create card objects
  cards.value = shuffled.map((symbol, index) => ({
    id: index,
    symbol,
    flipped: false,
    matched: false
  }))

  gameStarted.value = true
}

// Check if all pairs are matched
const isGameComplete = computed(() => {
  return gameStarted.value && matchedPairs.value.length === cards.value.length / 2
})

// Watch for game completion
const checkGameComplete = () => {
  if (isGameComplete.value) {
    gameComplete.value = true
  }
}

// Handle card flip
const flipCard = (index) => {
  // Prevent flipping if already flipped or matched
  if (
    flippedCards.value.length >= 2 ||
    cards.value[index].flipped ||
    cards.value[index].matched
  ) {
    return
  }

  // Flip the card
  cards.value[index].flipped = true
  flippedCards.value.push(index)

  // Check for match if 2 cards are flipped
  if (flippedCards.value.length === 2) {
    moves.value++

    const [firstIndex, secondIndex] = flippedCards.value
    const firstCard = cards.value[firstIndex]
    const secondCard = cards.value[secondIndex]

    if (firstCard.symbol === secondCard.symbol) {
      // Sofort als übereinstimmend markieren (keine Verzögerung)
      firstCard.matched = true
      secondCard.matched = true
      matchedPairs.value.push(firstCard.symbol)
      flippedCards.value = []

      // Check if game is complete
      checkGameComplete()
    } else {
      // No match, flip back after delay
      setTimeout(() => {
        firstCard.flipped = false
        secondCard.flipped = false
        flippedCards.value = []
      }, 1000)
    }
  }
}

// Keyboard navigation
const handleKeydown = (event, index) => {
  if (event.key === 'Enter' || event.key === ' ') {
    // Flip card on Enter or Space
    event.preventDefault()
    flipCard(index)
  } else if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault()
    navigateWithArrowKeys(event.key, index)
  }
}

// Navigate with arrow keys
const navigateWithArrowKeys = (key, currentIndex) => {
  const row = Math.floor(currentIndex / gridSize.value)
  const col = currentIndex % gridSize.value

  let newRow = row
  let newCol = col

  switch (key) {
    case 'ArrowUp':
      newRow = (row - 1 + gridSize.value) % gridSize.value
      break
    case 'ArrowDown':
      newRow = (row + 1) % gridSize.value
      break
    case 'ArrowLeft':
      newCol = (col - 1 + gridSize.value) % gridSize.value
      break
    case 'ArrowRight':
      newCol = (col + 1) % gridSize.value
      break
  }

  const newIndex = newRow * gridSize.value + newCol
  currentFocus.value = newIndex

  // Focus the new card
  const cardElement = document.getElementById(`card-${newIndex}`)
  if (cardElement) {
    cardElement.focus()
  }
}

// Reset game
const resetGame = () => {
  initializeGame()
}

// Initialize game on component mount
onMounted(() => {
  initializeGame()
})
</script>

<template>
  <div class="memory-game">
    <div class="game-header">
      <h3>Memory-Spiel</h3>
      <p class="game-info">Finde alle Paare der Symbole</p>
      <div class="game-stats">
        <span>Züge: {{ moves }}</span>
        <span>Paare gefunden: {{ matchedPairs.length }} / {{ cards.length / 2 }}</span>
      </div>
    </div>

    <!-- Game board -->
    <div
      class="game-board"
      :style="{
        'grid-template-columns': `repeat(${gridSize}, 1fr)`
      }"
      aria-label="Memory-Spielfeld"
    >
      <div
        v-for="(card, index) in cards"
        :key="card.id"
        :id="`card-${index}`"
        :class="[
          'card',
          { 'flipped': card.flipped },
          { 'matched': card.matched }
        ]"
        @click="flipCard(index)"
        @keydown="handleKeydown($event, index)"
        role="button"
        :aria-label="`Karte ${index + 1}${card.flipped ? ', zeigt ' + card.symbol : ', verdeckt'}`"
        :aria-pressed="card.flipped"
        tabindex="0"
        :ref="el => { if (index === currentFocus) el?.focus() }"
      >
        <div class="card-inner">
          <div class="card-front">
            <span class="card-symbol">?</span>
          </div>
          <div class="card-back">
            <span class="card-symbol">{{ card.symbol }}</span>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="gameComplete"
      class="game-controls"
      role="alert"
    >
      <h3>Gratulation!</h3>
      <p>Du hast alle Paare mit {{ moves }} Zügen gefunden.</p>
      <button @click="resetGame" class="btn">Nochmal spielen</button>
    </div>
    <div
      v-else
      class="game-controls"
    >
      <button
        class="btn"
        @click="resetGame"
        aria-label="Spiel neu starten"
      >
        Neu starten
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '../../assets/variables.scss' as vars;
.memory-game {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  font-family: 'Arial', sans-serif;

  @media (min-width: vars.$breakpoint-sm) {
    max-width: 28rem;
  }

  @media (min-width: vars.$breakpoint-md) {
    max-width: 32rem;
  }
}

.game-header {
  margin-bottom: var(--space-2);

  @media (min-width: vars.$breakpoint-md) {
    margin-bottom: var(--space-4);
  }
}

.game-info {
  margin-bottom: var(--space-1);
  font-size: var(--font-size-sm);

  @media (min-width: vars.$breakpoint-md) {
    margin-bottom: var(--space-2);
    font-size: var(--font-size-base);
  }
}

.game-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-2);
  font-weight: bold;
  font-size: var(--font-size-sm);

  @media (min-width: vars.$breakpoint-md) {
    margin-bottom: var(--space-4);
    font-size: var(--font-size-base);
  }
}

.game-board {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-4);

  @media (min-width: var(--breakpoint-sm)) {
    gap: var(--space-2);
  }

  @media (min-width: vars.$breakpoint-md) {
    gap: var(--space-3);
    margin-bottom: var(--space-6);
  }
}

.card {
  aspect-ratio: 1;
  perspective: 1000px;
  cursor: pointer;
  border-radius: var(--border-radius-sm);
  transition: transform 0.2s;

  @media (min-width: vars.$breakpoint-md) {
    border-radius: var(--border-radius-md);
  }

  &:hover {
    box-shadow: var(--focus-shadow);
  }

  &:focus-visible {
    outline: var(--focus-outline);
    outline-offset: var(--space-1);
  }
}

.card-inner {
  position: relative;
  width: 100%;
  height: 100%;
  text-align: center;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  border-radius: var(--border-radius-sm);
  border: 0.125rem solid var(--grey-color);

  @media (min-width: vars.$breakpoint-md) {
    border-radius: var(--border-radius-md);
    border-width: 0.25rem;
  }
}

.card.flipped .card-inner {
  transform: rotateY(180deg);
}

.card-front, .card-back {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--border-radius-sm);
  background-color: var(--card-bg);

  @media (min-width: vars.$breakpoint-md) {
    border-radius: var(--border-radius-md);
  }
}

.card-back {
  transform: rotateY(180deg);
}

.card-symbol {
  font-size: var(--font-size-3xl);
}

.card.flipped .card-inner {
  border: 0.125rem solid var(--notion-color);

  @media (min-width: vars.$breakpoint-md) {
    border-width: 0.25rem;
  }
}

.card.matched .card-inner {
  border: 0.125rem solid var(--success-color);
  box-shadow: none;

  @media (min-width: vars.$breakpoint-md) {
    border-width: 0.25rem;
  }
}

.game-controls {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-2);

  @media (min-width: vars.$breakpoint-md) {
    gap: var(--space-4);
    margin-top: var(--space-4);
  }

  h3 {
    margin-bottom: var(--space-1);

    @media (min-width: vars.$breakpoint-md) {
      margin-bottom: var(--space-2);
    }
  }

  p {
    margin-bottom: var(--space-2);
    text-align: center;

    @media (min-width: vars.$breakpoint-md) {
      margin-bottom: var(--space-4);
    }
  }
}
</style>