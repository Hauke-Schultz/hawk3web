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
					<div>ZombMode:</div>
					<div>{{ playerMode === 'human' ? 'human' : 'zombie' }}</div>
				</div>
				<div class="stat">
					<div>ZombErgy:</div>
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
					:style="{ left: ((zPos * 50) + 20) + 'px' }"
				></div>

				<div
					class="player-sprite animated-entity"
					:class="{ 'zombie-mode': playerMode === 'zombie' }"
					:style="{ left: ((playerPos * 50) + 20) + 'px'}"
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

const fieldWidth = 16
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

	// Zombies bewegen sich nach der Spielerbewegung (mit kurzer Verzögerung für Animation)
	setTimeout(() => {
		if (gameState.value === 'playing') {
			moveZombies()
			checkCollisions()
			checkStairs()
		}
	}, 300)
}

function toggleMode() {
	if (gameState.value !== 'playing') return
	if (zombieBar.value === 0) return

	if (playerMode.value === 'human') {
		playerMode.value = 'zombie'
	} else {
		playerMode.value = 'human'
	}

	// Zustandswechsel zählt als Zug - Zombies bewegen sich
	setTimeout(() => {
		if (gameState.value === 'playing') {
			moveZombies()
			checkCollisions()
		}
	}, 300)
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
			// Bonus für geschafften Floor
			zombieBar.value = Math.min(maxZombieBar, zombieBar.value + 3)
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
:root {
	--c64-black: #000000;
	--c64-white: #ffffff;
	--c64-red: #882000;
	--c64-cyan: #68d0a8;
	--c64-purple: #a838a0;
	--c64-green: #50b818;
	--c64-blue: #181090;
	--c64-yellow: #f0e858;
	--c64-orange: #a04800;
	--c64-brown: #472b1b;
	--c64-light-red: #c87870;
	--c64-dark-grey: #484848;
	--c64-grey: #808080;
	--c64-light-green: #98ff98;
	--c64-light-blue: #5090d0;
	--c64-light-grey: #b8b8b8;
}

.zombyrun {
	font-family: 'Courier New', monospace;
	margin: 0 auto;
	padding: 20px;
	background: var(--c64-black);
	color: var(--c64-white);
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
	color: var(--c64-red);
	font-size: 3em;
	line-height: 1;
	margin: 0;
	text-shadow: 3px 3px 0 var(--c64-black);
}

.stats {
	display: flex;
	justify-content: center;
	gap: 20px;
	flex-wrap: wrap;
}

.stat {
	background: var(--c64-dark-grey);
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
	background: var(--c64-dark-grey);
	border: 2px solid var(--c64-grey);
	border-radius: 3px;
	overflow: hidden;
}

.zombie-bar-fill {
	position: absolute;
	top: 0;
	left: 0;
	height: 100%;
	background: linear-gradient(90deg, var(--c64-green), var(--c64-light-green));
	transition: width 0.3s ease;
}

.zombie-bar-text {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
	color: var(--c64-white);
	font-weight: bold;
	text-shadow: 1px 1px 2px var(--c64-black);
	z-index: 1;
	width: 100%;
}

.menu, .game-over, .victory {
	text-align: center;
	background: var(--c64-dark-grey);
	padding: 40px;
	border-radius: 10px;
	max-width: 600px;
	margin: 0 auto;
}

.menu h2, .game-over h2, .victory h2 {
	font-size: 2.5em;
	color: var(--c64-red);
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
	background: var(--c64-red);
	color: var(--c64-white);
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
	background: var(--c64-light-red);
}

.game-area {
	text-align: center;
}

.playfield-container {
	display: inline-block;
	position: relative;
	background: var(--c64-dark-grey);
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
	width: 48px;
	height: 42px;
	background: var(--c64-blue);
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 1.8em;
	position: relative;
}

/* Stairs/Door Sprite - C64 Style */
.stairs-sprite {
	width: 6px;
	height: 6px;
	background: transparent;
	box-shadow:
		/* Door frame - Top */
		6px 0px 0 0 var(--c64-brown),
		12px 0px 0 0 var(--c64-brown),
		18px 0px 0 0 var(--c64-brown),
		24px 0px 0 0 var(--c64-brown),
		/* Left side */
		6px 6px 0 0 var(--c64-brown),
		6px 12px 0 0 var(--c64-brown),
		6px 18px 0 0 var(--c64-brown),
		6px 24px 0 0 var(--c64-brown),
		/* Right side */
		24px 6px 0 0 var(--c64-brown),
		24px 12px 0 0 var(--c64-brown),
		24px 18px 0 0 var(--c64-brown),
		24px 24px 0 0 var(--c64-brown),
		/* Door inside */
		12px 6px 0 0 var(--c64-orange),
		18px 6px 0 0 var(--c64-orange),
		12px 12px 0 0 var(--c64-orange),
		18px 12px 0 0 var(--c64-orange),
		12px 18px 0 0 var(--c64-orange),
		18px 18px 0 0 var(--c64-orange),
		/* Door knob */
		18px 12px 0 0 var(--c64-yellow),
		/* Bottom */
		6px 30px 0 0 var(--c64-brown),
		12px 30px 0 0 var(--c64-brown),
		18px 30px 0 0 var(--c64-brown),
		24px 30px 0 0 var(--c64-brown);
	position: absolute;
	top: 0;
	left: 6px;
	transform: translate(-50%, -50%);
}

.animated-entity {
	position: absolute;
	top: 20px;
	width: 24px;
	height: 21px;
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
	background: var(--c64-light-blue);
}

.field-cell.has-zombie {
	background: var(--c64-red);
}

.field-cell.has-player {
	border-color: var(--c64-light-green);
}

/* Player Sprite - C64 Style Human */
.player-sprite {
	width: 6px;
	height: 6px;
	background: transparent;
	box-shadow:
		/* Head - Row 1 */
		6px 0px 0 0 var(--c64-orange),
		12px 0px 0 0 var(--c64-orange),
		/* Head - Row 2 */
		0px 6px 0 0 var(--c64-orange),
		6px 6px 0 0 var(--c64-orange),
		12px 6px 0 0 var(--c64-orange),
		18px 6px 0 0 var(--c64-orange),
		/* Body - Row 3 */
		6px 12px 0 0 var(--c64-cyan),
		12px 12px 0 0 var(--c64-cyan),
		/* Body - Row 4 */
		6px 18px 0 0 var(--c64-cyan),
		12px 18px 0 0 var(--c64-cyan),
		/* Arms - Row 3 */
		0px 12px 0 0 var(--c64-cyan),
		18px 12px 0 0 var(--c64-cyan),
		/* Legs - Row 5 */
		6px 24px 0 0 var(--c64-blue),
		12px 24px 0 0 var(--c64-blue),
		/* Legs - Row 6 */
		6px 30px 0 0 var(--c64-blue),
		12px 30px 0 0 var(--c64-blue);
	animation: player-pulse 0.8s infinite alternate;
}

/* Zombie Sprite - C64 Style */
.zombie-sprite {
	width: 6px;
	height: 6px;
	background: transparent;
	box-shadow:
		/* Head - Row 1 */
		6px 0px 0 0 var(--c64-light-green),
		12px 0px 0 0 var(--c64-light-green),
		/* Head - Row 2 */
		0px 6px 0 0 var(--c64-light-green),
		6px 6px 0 0 var(--c64-light-green),
		12px 6px 0 0 var(--c64-light-green),
		18px 6px 0 0 var(--c64-light-green),
		/* Body - Row 3 */
		6px 12px 0 0 var(--c64-grey),
		12px 12px 0 0 var(--c64-grey),
		/* Body - Row 4 */
		6px 18px 0 0 var(--c64-grey),
		12px 18px 0 0 var(--c64-grey),
		/* Arms (spread out menacingly) - Row 3 */
		-6px 12px 0 0 var(--c64-light-green),
		0px 12px 0 0 var(--c64-light-green),
		18px 12px 0 0 var(--c64-light-green),
		24px 12px 0 0 var(--c64-light-green),
		/* Legs - Row 5 */
		6px 24px 0 0 var(--c64-grey),
		12px 24px 0 0 var(--c64-grey),
		/* Legs - Row 6 */
		6px 30px 0 0 var(--c64-grey),
		12px 30px 0 0 var(--c64-grey);
	animation: zombie-shake 1s infinite;
}

/* Player in Zombie Mode */
.player-sprite.zombie-mode {
	box-shadow:
		/* Head - Row 1 */
		6px 0px 0 0 var(--c64-light-green),
		12px 0px 0 0 var(--c64-light-green),
		/* Head - Row 2 */
		0px 6px 0 0 var(--c64-light-green),
		6px 6px 0 0 var(--c64-light-green),
		12px 6px 0 0 var(--c64-light-green),
		18px 6px 0 0 var(--c64-light-green),
		/* Body - Row 3 */
		6px 12px 0 0 var(--c64-red),
		12px 12px 0 0 var(--c64-red),
		/* Body - Row 4 */
		6px 18px 0 0 var(--c64-red),
		12px 18px 0 0 var(--c64-red),
		/* Arms (spread) - Row 3 */
		-6px 12px 0 0 var(--c64-light-green),
		0px 12px 0 0 var(--c64-light-green),
		18px 12px 0 0 var(--c64-light-green),
		24px 12px 0 0 var(--c64-light-green),
		/* Legs - Row 5 */
		6px 24px 0 0 var(--c64-red),
		12px 24px 0 0 var(--c64-red),
		/* Legs - Row 6 */
		6px 30px 0 0 var(--c64-red),
		12px 30px 0 0 var(--c64-red);
}

.controls-hint {
	color: var(--c64-grey);
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
