<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { STACK_CONFIG } from './stackConfig.js'

// Props
const props = defineProps({
	blocks: {
		type: Array,
		default: () => []
	},
	currentBlock: {
		type: Object,
		default: null
	},
	fallingPieces: {
		type: Array,
		default: () => []
	},
	cameraOffset: {
		type: Number,
		default: 0
	},
	gameState: {
		type: String,
		default: 'playing'
	}
})

// Refs
const canvasRef = ref(null)
const ctx = ref(null)
const animationFrameId = ref(null)

// Canvas dimensions
const canvasWidth = ref(STACK_CONFIG.canvas.baseWidth)
const canvasHeight = ref(STACK_CONFIG.canvas.baseHeight)

// Setup canvas
const setupCanvas = () => {
	if (!canvasRef.value) return

	const canvas = canvasRef.value
	const dpr = window.devicePixelRatio || 1

	// Set display size (css pixels)
	canvas.style.width = `${canvasWidth.value}px`
	canvas.style.height = `${canvasHeight.value}px`

	// Set actual size in memory (scaled for retina)
	canvas.width = canvasWidth.value * dpr
	canvas.height = canvasHeight.value * dpr

	// Get context and scale for retina
	ctx.value = canvas.getContext('2d')
	ctx.value.scale(dpr, dpr)

	console.log('✅ Canvas initialized:', {
		width: canvas.width,
		height: canvas.height,
		dpr
	})
}

// Render loop
const render = () => {
	if (!ctx.value) return

	const context = ctx.value

	// Clear canvas
	context.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

	// Apply camera offset
	context.save()
	context.translate(0, props.cameraOffset)

	// Render background grid
	renderGrid(context)

	// Render placed blocks
	props.blocks.forEach(block => {
		renderBlock(context, block, false)
	})

	// Render falling pieces
	props.fallingPieces.forEach(piece => {
		renderFallingPiece(context, piece)
	})

	// Render current moving block
	if (props.currentBlock) {
		renderBlock(context, props.currentBlock, true)
	}

	context.restore()

	// Continue animation loop
	animationFrameId.value = requestAnimationFrame(render)
}

// Render background grid
const renderGrid = (context) => {
	const gridSize = 40
	const lineColor = 'rgba(255, 255, 255, 0.05)'

	context.strokeStyle = lineColor
	context.lineWidth = 1

	// Vertical lines
	for (let x = 0; x <= canvasWidth.value; x += gridSize) {
		context.beginPath()
		context.moveTo(x, 0)
		context.lineTo(x, canvasHeight.value + props.cameraOffset)
		context.stroke()
	}

	// Horizontal lines
	for (let y = 0; y <= canvasHeight.value + props.cameraOffset; y += gridSize) {
		context.beginPath()
		context.moveTo(0, y)
		context.lineTo(canvasWidth.value, y)
		context.stroke()
	}
}

// Render a single block
const renderBlock = (context, block, isMoving = false) => {
	if (!block) return

	const { x, y, width, height, color } = block

	// Shadow for depth
	if (!isMoving) {
		context.fillStyle = 'rgba(0, 0, 0, 0.2)'
		context.fillRect(x + 2, y + 2, width, height)
	}

	// Main block
	context.fillStyle = color || '#EF4444'
	context.fillRect(x, y, width, height)

	// Border/outline
	context.strokeStyle = isMoving ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)'
	context.lineWidth = 2
	context.strokeRect(x, y, width, height)

	// Highlight for moving block
	if (isMoving) {
		const gradient = context.createLinearGradient(x, y, x, y + height)
		gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
		gradient.addColorStop(1, 'rgba(255, 255, 255, 0)')
		context.fillStyle = gradient
		context.fillRect(x, y, width, height / 2)
	}
}

// Render falling piece
const renderFallingPiece = (context, piece) => {
	if (!piece || piece.opacity <= 0) return

	context.save()
	context.globalAlpha = piece.opacity

	context.fillStyle = piece.color
	context.fillRect(piece.x, piece.y, piece.width, piece.height)

	context.strokeStyle = 'rgba(0, 0, 0, 0.3)'
	context.lineWidth = 1
	context.strokeRect(piece.x, piece.y, piece.width, piece.height)

	context.restore()
}

// Start rendering
const startRenderLoop = () => {
	if (animationFrameId.value) {
		cancelAnimationFrame(animationFrameId.value)
	}
	render()
}

// Stop rendering
const stopRenderLoop = () => {
	if (animationFrameId.value) {
		cancelAnimationFrame(animationFrameId.value)
		animationFrameId.value = null
	}
}

// Lifecycle
onMounted(() => {
	setupCanvas()
	startRenderLoop()
})

onUnmounted(() => {
	stopRenderLoop()
})

// Watch game state changes
watch(() => props.gameState, (newState) => {
	if (newState === 'playing') {
		startRenderLoop()
	} else {
		stopRenderLoop()
	}
})
</script>

<template>
	<div class="game-canvas-wrapper">
		<canvas
				ref="canvasRef"
				class="game-canvas"
				:width="canvasWidth"
				:height="canvasHeight"
		/>

		<!-- Overlay for game over/paused states -->
		<div v-if="gameState !== 'playing'" class="canvas-overlay">
			<div class="overlay-content">
				<p v-if="gameState === 'paused'">⏸️ Paused</p>
				<p v-if="gameState === 'gameover'">💥 Game Over</p>
				<p v-if="gameState === 'completed'">🎉 Complete!</p>
			</div>
		</div>
	</div>
</template>

<style lang="scss" scoped>
.game-canvas-wrapper {
	position: relative;
	width: 100%;
	display: flex;
	justify-content: center;
	align-items: center;
}

.game-canvas {
	display: block;
	background: linear-gradient(180deg,
			rgba(15, 15, 15, 1) 0%,
			rgba(25, 25, 35, 1) 100%
	);
	border-radius: var(--border-radius-lg);
	box-shadow:
			inset 0 0 20px rgba(0, 0, 0, 0.5),
			0 4px 20px rgba(0, 0, 0, 0.3);
	touch-action: none;
	user-select: none;
	-webkit-user-select: none;
}

.canvas-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: var(--border-radius-lg);
	pointer-events: none;
}

.overlay-content {
	text-align: center;
	color: white;
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);

	p {
		margin: 0;
	}
}
</style>