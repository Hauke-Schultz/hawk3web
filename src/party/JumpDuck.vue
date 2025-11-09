<script setup>
import { ref, onMounted, onUnmounted, nextTick } from 'vue'

// Canvas Reference
const canvas = ref(null)
let ctx = null
let animationFrameId = null

// Spiel-Zustand
const gameStarted = ref(false)
const gameOver = ref(false)
const score = ref(0)

// Eingabe-Zustand
const isPressingUp = ref(false)
const isPressingDown = ref(false)

// Spieler (Boot)
const player = {
  x: 50,
  y: 0,
  width: 50,
  height: 50,
  currentY: 0,
  velocityY: 0,
  upForce: -0.8,
  downForce: 0.8,
  returnForce: 0.05
}

// Hindernisse
const obstacles = []
let obstacleSpeed = 2
let obstacleTimer = 0
let obstacleInterval = 140 // Frames zwischen Hindernissen

// Spielfeld-Dimensionen
let canvasWidth = 800
let canvasHeight = 800

// Positionen für das Boot
const getYPosition = (position) => {
  const skyHeight = canvasHeight * 0.4
  const waterHeight = canvasHeight * 0.6

  if (position === 0) return skyHeight * 0.3 // Oben (Himmel)
  if (position === 1) return canvasHeight * 0.5 - player.height / 2 // Mitte (Wasserlinie)
  if (position === 2) return skyHeight + waterHeight * 0.6 // Unten (Unterwasser)
}

// Touch/Klick-Handler - Gedrückt halten
const handleCanvasMouseDown = (event) => {
  if (!gameStarted.value || gameOver.value) return

  const rect = canvas.value.getBoundingClientRect()
  const clickY = event.clientY - rect.top
  const relativeY = clickY / rect.height

  // Obere Hälfte = Hochhalten
  // Untere Hälfte = Runterhalten
  if (relativeY < 0.5) {
    isPressingUp.value = true
    isPressingDown.value = false
  } else {
    isPressingDown.value = true
    isPressingUp.value = false
  }
}

const handleCanvasMouseUp = () => {
  isPressingUp.value = false
  isPressingDown.value = false
}

const handleCanvasTouchStart = (event) => {
  event.preventDefault()
  if (!gameStarted.value || gameOver.value) return

  const touch = event.touches[0]
  if (touch) {
    const rect = canvas.value.getBoundingClientRect()
    const touchY = touch.clientY - rect.top
    const relativeY = touchY / rect.height

    if (relativeY < 0.5) {
      isPressingUp.value = true
      isPressingDown.value = false
    } else {
      isPressingDown.value = true
      isPressingUp.value = false
    }
  }
}

const handleCanvasTouchEnd = () => {
  isPressingUp.value = false
  isPressingDown.value = false
}

// Spiel starten
const startGame = () => {
  gameStarted.value = true
  gameOver.value = false
  score.value = 0
  obstacles.length = 0
  obstacleSpeed = 2
  obstacleTimer = 0
  obstacleInterval = 140
  player.velocityY = 0
  player.currentY = getYPosition(1)

  nextTick(() => {
    if (canvas.value) {
      initCanvas()
      gameLoop()
    }
  })
}

const resetGame = () => {
  gameStarted.value = false
  gameOver.value = false
  score.value = 0
  obstacles.length = 0
  player.velocityY = 0
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = null
  }
}

// Canvas initialisieren
const initCanvas = () => {
  if (!canvas.value) return

  // Canvas an Container-Größe anpassen
  const container = canvas.value.parentElement
  const rect = container.getBoundingClientRect()

  canvas.value.width = rect.width
  canvas.value.height = rect.height

  ctx = canvas.value.getContext('2d')
  canvasWidth = canvas.value.width
  canvasHeight = canvas.value.height
  player.currentY = getYPosition(1)
}

// Resize-Handler
const handleResize = () => {
  if (canvas.value && gameStarted.value) {
    initCanvas()
  }
}

// Hindernisse erstellen
const createObstacle = () => {
  const positions = [0, 1, 2]
  const position = positions[Math.floor(Math.random() * positions.length)]

  // Emoji basierend auf Position
  let emoji = '🦅' // Vogel (oben)
  if (position === 1) emoji = '🏝️' // mitte
  if (position === 2) emoji = '🦈' // unten

  obstacles.push({
    x: canvasWidth,
    y: getYPosition(position),
    width: 50,
    height: 50,
    position: position,
    emoji: emoji,
    passed: false
  })
}

// Spieler bewegen mit Gravitation
const updatePlayer = () => {
  const centerY = getYPosition(1) // Mittlere Position (Wasserlinie)
  const topY = getYPosition(0)
  const bottomY = getYPosition(2)

  // Kraft anwenden basierend auf Eingabe
  if (isPressingUp.value) {
    // Nach oben drücken
    player.velocityY += player.upForce
  } else if (isPressingDown.value) {
    // Nach unten drücken
    player.velocityY += player.downForce
  } else {
    // Zurück zur Mitte ziehen wenn losgelassen
    const distanceFromCenter = player.currentY - centerY
    player.velocityY -= distanceFromCenter * player.returnForce

    // Starke Dämpfung in der Nähe der Mitte (Dead Zone)
    if (Math.abs(distanceFromCenter) < 30) {
      player.velocityY *= 0.7
    }
  }

  // Dämpfung
  player.velocityY *= 0.88

  // Position aktualisieren
  player.currentY += player.velocityY

  // Weiche Grenzen
  const maxTop = topY - 10
  const maxBottom = bottomY + 10

  if (player.currentY < maxTop) {
    player.currentY = maxTop
    player.velocityY *= -0.3
  }
  if (player.currentY > maxBottom) {
    player.currentY = maxBottom
    player.velocityY *= -0.3
  }
}

// Hindernisse bewegen
const updateObstacles = () => {
  // Hindernisse bewegen
  for (let i = obstacles.length - 1; i >= 0; i--) {
    obstacles[i].x -= obstacleSpeed

    // Score erhöhen wenn Hindernis passiert wurde
    if (!obstacles[i].passed && obstacles[i].x + obstacles[i].width < player.x) {
      obstacles[i].passed = true
      score.value++
    }

    // Hindernis entfernen wenn außerhalb des Canvas
    if (obstacles[i].x + obstacles[i].width < 0) {
      obstacles.splice(i, 1)
    }
  }

  // Neue Hindernisse spawnen
  obstacleTimer++
  if (obstacleTimer >= obstacleInterval) {
    createObstacle()
    obstacleTimer = 0

    // Schwierigkeit erhöhen
    if (score.value % 10 === 0 && score.value > 0) {
      obstacleSpeed = Math.min(obstacleSpeed + 0.15, 6)
      obstacleInterval = Math.max(obstacleInterval - 5, 70)
    }
  }
}

// Kollisionserkennung
const checkCollision = () => {
  for (const obstacle of obstacles) {
    if (
      player.x < obstacle.x + obstacle.width &&
      player.x + player.width > obstacle.x &&
      player.currentY < obstacle.y + obstacle.height &&
      player.currentY + player.height > obstacle.y
    ) {
      return true
    }
  }
  return false
}

// Spielfeld zeichnen
const drawBackground = () => {
  const skyHeight = canvasHeight * 0.4

  // Himmel (obere 40%)
  const skyGradient = ctx.createLinearGradient(0, 0, 0, skyHeight)
  skyGradient.addColorStop(0, '#87CEEB')
  skyGradient.addColorStop(1, '#B0E0E6')
  ctx.fillStyle = skyGradient
  ctx.fillRect(0, 0, canvasWidth, skyHeight)

  // Wasser (untere 60%)
  const waterGradient = ctx.createLinearGradient(0, skyHeight, 0, canvasHeight)
  waterGradient.addColorStop(0, '#4A90E2')
  waterGradient.addColorStop(1, '#2E5C8A')
  ctx.fillStyle = waterGradient
  ctx.fillRect(0, skyHeight, canvasWidth, canvasHeight - skyHeight)

  // Wasserlinie (Wellen)
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.beginPath()
  for (let x = 0; x < canvasWidth; x += 20) {
    const waveY = skyHeight + Math.sin((x + score.value) * 0.1) * 5
    if (x === 0) {
      ctx.moveTo(x, waveY)
    } else {
      ctx.lineTo(x, waveY)
    }
  }
  ctx.stroke()
}

// Boot zeichnen
const drawPlayer = () => {
  ctx.font = `${player.height}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('⛵', player.x + player.width / 2, player.currentY + player.height / 2)
}

// Hindernisse zeichnen
const drawObstacles = () => {
  ctx.font = '50px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  for (const obstacle of obstacles) {
    ctx.fillText(obstacle.emoji, obstacle.x + obstacle.width / 2, obstacle.y + obstacle.height / 2)
  }
}

// Game Loop
const gameLoop = () => {
  if (!gameStarted.value || gameOver.value) return

  // Update
  updatePlayer()
  updateObstacles()

  // Kollisionsprüfung
  if (checkCollision()) {
    gameOver.value = true
    return
  }

  // Draw
  drawBackground()
  drawPlayer()
  drawObstacles()

  // Nächster Frame
  animationFrameId = requestAnimationFrame(gameLoop)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="game-container">
    <div class="game-header">
      <h3>🏃 Jump & Duck</h3>
      <div v-if="gameStarted" class="score-display">
        Score: {{ score }}
      </div>
    </div>

    <!-- Start Screen -->
    <div v-if="!gameStarted" class="start-screen">
      <div class="instructions">
        <p>Weiche den Hindernissen aus!</p>
        <div class="controls">
          <div class="control-item">
            <span class="key">☝️ Oben halten</span>
            <span>Im Himmel bleiben</span>
          </div>
          <div class="control-item">
            <span class="key">👇 Unten halten</span>
            <span>Unter Wasser bleiben</span>
          </div>
        </div>
      </div>
      <button class="start-btn" @click="startGame">
        Spiel Starten
      </button>
    </div>

    <!-- Game Canvas -->
    <div v-else class="game-canvas-wrapper">
      <canvas
        ref="canvas"
        class="game-canvas"
        @mousedown="handleCanvasMouseDown"
        @mouseup="handleCanvasMouseUp"
        @mouseleave="handleCanvasMouseUp"
        @touchstart="handleCanvasTouchStart"
        @touchend="handleCanvasTouchEnd"
        @touchcancel="handleCanvasTouchEnd"
      ></canvas>

      <!-- Game Over Overlay -->
      <div v-if="gameOver" class="game-over-overlay">
        <div class="game-over-content">
          <h2>Game Over!</h2>
          <div class="final-score">
            Dein Score: {{ score }}
          </div>
          <button class="restart-btn" @click="resetGame">
            Nochmal spielen
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.game-container {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
	padding: var(--space-4) var(--space-4) 0;

  h3 {
    margin: 0;
    font-size: var(--font-size-xl);
    font-weight: var(--font-weight-bold);
  }

  .score-display {
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-bold);
    padding: var(--space-2) var(--space-4);
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--border-radius-lg);
  }
}

.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--space-6);
  padding: var(--space-8) var(--space-4);
  text-align: center;
}

.instructions {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);

  p {
    font-size: var(--font-size-lg);
    margin: 0;
  }

  .controls {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    margin-top: var(--space-4);
  }

  .control-item {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    justify-content: center;
    font-size: var(--font-size-base);

    .key {
      padding: var(--space-2) var(--space-4);
      background: rgba(255, 255, 255, 0.3);
      border-radius: var(--border-radius-md);
      font-weight: var(--font-weight-bold);
      min-width: 120px;
      text-align: center;
    }
  }
}

.start-btn,
.restart-btn {
  padding: var(--space-4) var(--space-8);
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  background: rgba(255, 255, 255, 0.3);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.5);
  border-radius: var(--border-radius-xl);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.4);
    border-color: rgba(255, 255, 255, 0.8);
    transform: scale(1.05);
  }

  &:active {
    transform: scale(0.98);
  }
}

.game-canvas-wrapper {
  flex: 1;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.game-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: pointer;
  touch-action: none;
  user-select: none;
}

.game-over-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  backdrop-filter: blur(4px);
}

.game-over-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-6);
  padding: var(--space-8);
  background: rgba(0, 0, 0, 0.25);
  border-radius: var(--border-radius-xl);
  border: 2px solid rgba(255, 255, 255, 0.3);

  h2 {
    font-size: var(--font-size-3xl);
    margin: 0;
    color: white;
  }

  .final-score {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    padding: var(--space-4) var(--space-6);
    background: rgba(255, 255, 255, 0.2);
    border-radius: var(--border-radius-lg);
    color: white;
  }
}
</style>