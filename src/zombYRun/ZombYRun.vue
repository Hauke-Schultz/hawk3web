<template>
	<div class="zombyrun">
		<div class="game-header">
			<div class="stats">
				<div class="stat">
					<h1>ZombYRun</h1>
				</div>
				<div class="stat">
					<div>Floor:</div>
					<div>{{ currentFloor }}</div>
				</div>
				<div class="stat">
					<div>Mode:</div>
					<div>{{ playerMode === 'human' ? 'human' : 'zombie' }}</div>
				</div>
				<div class="stat">
					<div>Energy:</div>
					<div class="zombie-bar">
						<div class="zombie-bar-fill" :style="{ width: zombieBarPercentage + '%' }"></div>
						<span class="zombie-bar-text">{{ zombieBar }} / {{ maxZombieBar }}</span>
					</div>
				</div>
			</div>
		</div>

		<div class="game-area">
			<div class="playfield-container">
				<div class="playfield">
					<div
							v-for="pos in fieldWidth"
							:key="pos - 1"
							class="field-cell"
							:class="getCellClass(pos - 1)"
					>
						<div v-if="pos - 1 === fieldWidth - 1" class="stairs-sprite"></div>
					</div>
				</div>

				<!-- Animated entities -->
				<div
					v-for="(zPos, index) in zombiePositions"
					:key="'zombie-' + index"
					class="zombie-sprite animated-entity"
					:style="{ left: ((zPos * 34) + 20) + 'px' }"
				></div>

				<div
					class="player-sprite animated-entity"
					:class="{ 'zombie-mode': playerMode === 'zombie' }"
					:style="{ left: ((playerPos * 34) + 20) + 'px'}"
				></div>
			</div>
		</div>

		<div v-if="gameState === 'gameover'" class="game-over">
			<h2>Game Over!</h2>
			<p>Sie wurden von einem Zombie erwischt!</p>
			<p>Erreichte Etage: {{ currentFloor }}</p>
			<button @click="startGame" class="start-button">Nochmal spielen</button>
		</div>

		<div v-else-if="gameState === 'victory'" class="victory">
			<h2>Gewonnen!</h2>
			<p>Sie haben alle Etagen überlebt!</p>
			<p>Etagen: {{ totalFloors }}</p>
			<button @click="startGame" class="start-button">Nochmal spielen</button>
		</div>
	</div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const fieldWidth = 19
const maxZombieBar = 20
const totalFloors = 10
const zombiesPerFloor = 5

const gameState = ref('playing')
const currentFloor = ref(10)
const playerPos = ref(0)
const playerMode = ref('human')
const zombieBar = ref(maxZombieBar)
const zombiePositions = ref([])
const passedZombies = ref(new Set())

const zombieBarPercentage = computed(() => {
	return (zombieBar.value / maxZombieBar) * 100
})

function initFloor() {
	playerPos.value = 0
	zombiePositions.value = []
	passedZombies.value = new Set()

	for (let i = 0; i < zombiesPerFloor; i++) {
		let pos
		do {
			pos = Math.floor(Math.random() * (fieldWidth - 5)) + 3
		} while (zombiePositions.value.includes(pos) || pos === 0 || pos === fieldWidth - 1)

		zombiePositions.value.push(pos)
	}
}

function startGame() {
	gameState.value = 'playing'
	currentFloor.value = 10
	playerMode.value = 'human'
	zombieBar.value = maxZombieBar
	initFloor()
}

function movePlayer(direction) {
	if (gameState.value !== 'playing') return

	const newPos = playerPos.value + direction

	if (newPos < 0 || newPos >= fieldWidth) return

	playerPos.value = newPos

	// Check if player passed a zombie
	for (let i = 0; i < zombiePositions.value.length; i++) {
		const zombiePos = zombiePositions.value[i]
		if (playerPos.value === zombiePos && !passedZombies.value.has(i)) {
			passedZombies.value.add(i)
			zombieBar.value = Math.min(maxZombieBar, zombieBar.value + 3)
		}
	}

	if (playerMode.value === 'zombie') {
		zombieBar.value = Math.max(0, zombieBar.value - 1)
		if (zombieBar.value === 0) {
			playerMode.value = 'human'
		}
	}

	moveZombies()
	checkCollisions()
	checkStairs()
}

function toggleMode() {
	if (gameState.value !== 'playing') return
	if (zombieBar.value === 0) return

	if (playerMode.value === 'human') {
		playerMode.value = 'zombie'
	} else {
		playerMode.value = 'human'
	}
}

function moveZombies() {
	const newPositions = []

	for (const zPos of zombiePositions.value) {
		let newPos = zPos

		if (playerMode.value === 'human') {
			if (zPos < playerPos.value) {
				newPos = zPos + 1
			} else if (zPos > playerPos.value) {
				newPos = zPos - 1
			}
		} else {
			const action = Math.floor(Math.random() * 3)
			if (action === 0 && newPos > 0) {
				newPos = zPos - 1
			} else if (action === 1 && newPos < fieldWidth - 1) {
				newPos = zPos + 1
			}
		}

		newPositions.push(newPos)
	}

	zombiePositions.value = newPositions
}

function checkCollisions() {
	if (playerMode.value === 'human') {
		if (zombiePositions.value.includes(playerPos.value)) {
			gameState.value = 'gameover'
		}
	}
}

function checkStairs() {
	if (playerPos.value === fieldWidth - 1) {
		if (currentFloor.value <= 1) {
			gameState.value = 'victory'
		} else {
			currentFloor.value--
			initFloor()
		}
	}
}

function getCellClass(pos) {
	const classes = []
	if (pos === playerPos.value) classes.push('has-player')
	if (zombiePositions.value.includes(pos)) classes.push('has-zombie')
	if (pos === fieldWidth - 1) classes.push('has-stairs')
	return classes
}

function handleKeydown(event) {
	if (event.key === 'ArrowLeft') {
		event.preventDefault()
		movePlayer(-1)
	} else if (event.key === 'ArrowRight') {
		event.preventDefault()
		movePlayer(1)
	} else if (event.key === ' ' || event.key === 'Spacebar') {
		event.preventDefault()
		toggleMode()
	}
}

onMounted(() => {
	window.addEventListener('keydown', handleKeydown)
	initFloor()
})

onUnmounted(() => {
	window.removeEventListener('keydown', handleKeydown)
})
</script>

<style>
.zombyrun {
	font-family: 'Courier New', monospace;
	margin: 0 auto;
	padding: 20px;
	background: #1a1a1a;
	color: #fff;
	min-height: 100vh;
}

body:has(.zombyrun) .container {
	max-width: none;
}

.game-header {
	text-align: center;
	margin-bottom: 20px;
}

.game-header h1 {
	color: #ff4444;
	font-size: 3em;
	line-height: 1;
	margin: 0;
	text-shadow: 3px 3px 0 #000;
}

.stats {
	display: flex;
	justify-content: center;
	gap: 20px;
	flex-wrap: wrap;
}

.stat {
	background: #2a2a2a;
	border-radius: 5px;
	font-size: 1.2em;
	padding: 10px;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: 0;
	min-width: 90px;
}

.zombie-bar {
	position: relative;
	width: 150px;
	height: 25px;
	background: #333;
	border: 2px solid #666;
	border-radius: 3px;
	overflow: hidden;
}

.zombie-bar-fill {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: linear-gradient(90deg, #44ff44, #88ff88);
	transition: width 0.3s ease;
}

.zombie-bar-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: #fff;
	font-weight: bold;
	text-shadow: 1px 1px 2px #000;
	z-index: 1;
	width: 100%;
}

.menu, .game-over, .victory {
	text-align: center;
	background: #2a2a2a;
	padding: 40px;
	border-radius: 10px;
	max-width: 600px;
	margin: 0 auto;
}

.menu h2, .game-over h2, .victory h2 {
	font-size: 2.5em;
	color: #ff4444;
	margin-bottom: 20px;
}

.menu ul {
	text-align: left;
	display: inline-block;
	margin: 20px 0;
}

.menu li {
	margin: 10px 0;
	font-size: 1.1em;
}

.start-button {
	background: #ff4444;
	color: #fff;
	border: none;
	padding: 15px 40px;
	font-size: 1.3em;
	font-family: 'Courier New', monospace;
	cursor: pointer;
	border-radius: 5px;
	margin-top: 20px;
	transition: background 0.3s;
}

.start-button:hover {
	background: #ff6666;
}

.game-area {
	text-align: center;
}

.playfield-container {
	display: inline-block;
	position: relative;
	background: #2a2a2a;
	padding: 20px;
	border-radius: 10px;
	margin-bottom: 20px;
}

.playfield {
	display: flex;
	gap: 2px;
	flex-wrap: wrap;
	justify-content: center;
}

.field-cell {
	width: 32px;
	height: 32px;
	background: #3a3a3a;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.8em;
	position: relative;
}

/* Stairs/Door Sprite - C64 Style */
.stairs-sprite {
	width: 4px;
	height: 4px;
	background: transparent;
	box-shadow:
		/* Door frame */
		8px 4px 0 0 #9B5F28,
		12px 4px 0 0 #9B5F28,
		16px 4px 0 0 #9B5F28,
		20px 4px 0 0 #9B5F28,
		/* Left side */
		8px 8px 0 0 #9B5F28,
		8px 12px 0 0 #9B5F28,
		8px 16px 0 0 #9B5F28,
		8px 20px 0 0 #9B5F28,
		8px 24px 0 0 #9B5F28,
		/* Right side */
		20px 8px 0 0 #9B5F28,
		20px 12px 0 0 #9B5F28,
		20px 16px 0 0 #9B5F28,
		20px 20px 0 0 #9B5F28,
		20px 24px 0 0 #9B5F28,
		/* Door inside */
		12px 8px 0 0 #D4A76A,
		16px 8px 0 0 #D4A76A,
		12px 12px 0 0 #D4A76A,
		16px 12px 0 0 #D4A76A,
		12px 16px 0 0 #D4A76A,
		16px 16px 0 0 #D4A76A,
		12px 20px 0 0 #D4A76A,
		16px 20px 0 0 #D4A76A,
		/* Door knob */
		16px 14px 0 0 #FFD700,
		/* Bottom */
		8px 28px 0 0 #9B5F28,
		12px 28px 0 0 #9B5F28,
		16px 28px 0 0 #9B5F28,
		20px 28px 0 0 #9B5F28;
	position: absolute;
	top: 0;
	left: 4px;
	transform: translate(-50%, -50%);
}

.animated-entity {
	position: absolute;
	top: 20px;
	width: 32px;
	height: 32px;
	transition: left 0.3s ease-out;
	pointer-events: none;
	image-rendering: pixelated;
	image-rendering: -moz-crisp-edges;
	image-rendering: crisp-edges;
}

.zombie-sprite {
	z-index: 1;
}

.player-sprite {
	z-index: 2;
}

.field-cell.has-stairs {
	background: #4a4aff;
}

.field-cell.has-zombie {
	background: #ff4444;
}

.field-cell.has-player {
	border-color: #44ff44;
}

/* Player Sprite - C64 Style Human */
.player-sprite {
	width: 4px;
	height: 4px;
	background: transparent;
	box-shadow:
		/* Head */
		12px 4px 0 0 #FFC864,
		16px 4px 0 0 #FFC864,
		8px 8px 0 0 #FFC864,
		12px 8px 0 0 #FFC864,
		16px 8px 0 0 #FFC864,
		20px 8px 0 0 #FFC864,
		/* Body */
		12px 12px 0 0 #5CE8F4,
		16px 12px 0 0 #5CE8F4,
		12px 16px 0 0 #5CE8F4,
		16px 16px 0 0 #5CE8F4,
		/* Arms */
		8px 12px 0 0 #5CE8F4,
		20px 12px 0 0 #5CE8F4,
		/* Legs */
		12px 20px 0 0 #4242FF,
		16px 20px 0 0 #4242FF,
		12px 24px 0 0 #4242FF,
		16px 24px 0 0 #4242FF;
	animation: player-pulse 0.8s infinite alternate;
}

/* Zombie Sprite - C64 Style */
.zombie-sprite {
	width: 4px;
	height: 4px;
	background: transparent;
	box-shadow:
		/* Head */
		12px 4px 0 0 #50FF50,
		16px 4px 0 0 #50FF50,
		8px 8px 0 0 #50FF50,
		12px 8px 0 0 #50FF50,
		16px 8px 0 0 #50FF50,
		20px 8px 0 0 #50FF50,
		/* Body */
		12px 12px 0 0 #666666,
		16px 12px 0 0 #666666,
		12px 16px 0 0 #666666,
		16px 16px 0 0 #666666,
		/* Arms (spread out menacingly) */
		4px 12px 0 0 #50FF50,
		8px 12px 0 0 #50FF50,
		20px 12px 0 0 #50FF50,
		24px 12px 0 0 #50FF50,
		/* Legs */
		12px 20px 0 0 #666666,
		16px 20px 0 0 #666666,
		12px 24px 0 0 #666666,
		16px 24px 0 0 #666666;
	animation: zombie-shake 1s infinite;
}

/* Player in Zombie Mode */
.player-sprite.zombie-mode {
	box-shadow:
		/* Head */
		12px 4px 0 0 #A8FF60,
		16px 4px 0 0 #A8FF60,
		8px 8px 0 0 #A8FF60,
		12px 8px 0 0 #A8FF60,
		16px 8px 0 0 #A8FF60,
		20px 8px 0 0 #A8FF60,
		/* Body */
		12px 12px 0 0 #FF4242,
		16px 12px 0 0 #FF4242,
		12px 16px 0 0 #FF4242,
		16px 16px 0 0 #FF4242,
		/* Arms (spread) */
		4px 12px 0 0 #A8FF60,
		8px 12px 0 0 #A8FF60,
		20px 12px 0 0 #A8FF60,
		24px 12px 0 0 #A8FF60,
		/* Legs */
		12px 20px 0 0 #FF4242,
		16px 20px 0 0 #FF4242,
		12px 24px 0 0 #FF4242,
		16px 24px 0 0 #FF4242;
}

.controls-hint {
	color: #999;
	font-size: 1.1em;
	margin-top: 10px;
}

@keyframes player-pulse {
	from {
		transform: translateY(0);
	}
	to {
		transform: translateY(-3px);
	}
}

@keyframes zombie-shake {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(3px);
	}
}
</style>
