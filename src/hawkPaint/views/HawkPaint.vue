<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'

const router = useRouter()

// Grid size
const GRID_SIZE = 16

// Tools
const TOOLS = {
	PENCIL: 'pencil',
	FILL: 'fill',
	ERASER: 'eraser',
	PICKER: 'picker',
	SELECT: 'select'
}

// Color Themes
const COLOR_THEMES = {
	classic: {
		name: '8-Bit Classic',
		colors: [
			'#000000', '#FFFFFF', '#FF0000', '#00FF00',
			'#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
			'#FF8800', '#8800FF', '#00FF88', '#FF0088',
			'#888888', '#444444', '#CCCCCC', '#884400'
		]
	},
	pastell: {
		name: 'Pastell',
		colors: [
			'#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9',
			'#BAE1FF', '#E0BBE4', '#FFDFD3', '#FEC8D8',
			'#D4F1F4', '#C9E4CA', '#F9E5D8', '#E8D5C4',
			'#F5E6E8', '#D5AAFF', '#FFD3E1', '#C7CEEA'
		]
	},
	retro: {
		name: 'Retro Gaming',
		colors: [
			'#000000', '#FFFFFF', '#880000', '#AAFFEE',
			'#CC44CC', '#00CC55', '#0000AA', '#EEEE77',
			'#DD8855', '#664400', '#FF7777', '#333333',
			'#777777', '#AAFF66', '#0088FF', '#BBBBBB'
		]
	},
	neon: {
		name: 'Neon',
		colors: [
			'#FF006E', '#FB5607', '#FFBE0B', '#8338EC',
			'#3A86FF', '#06FFA5', '#FF00FF', '#00FFFF',
			'#FF1744', '#76FF03', '#FFEA00', '#00E5FF',
			'#E040FB', '#FF6E40', '#69F0AE', '#FFFFFF'
		]
	},
	earth: {
		name: 'Earth Tones',
		colors: [
			'#3E2723', '#5D4037', '#6D4C41', '#795548',
			'#8D6E63', '#A1887F', '#BCAAA4', '#D7CCC8',
			'#4E342E', '#6F4E37', '#8B4513', '#A0522D',
			'#CD853F', '#DEB887', '#F5DEB3', '#FFF8DC'
		]
	},
	ocean: {
		name: 'Ocean',
		colors: [
			'#001f3f', '#0074D9', '#7FDBFF', '#39CCCC',
			'#3D9970', '#2ECC40', '#01FF70', '#FFDC00',
			'#4A90E2', '#50E3C2', '#B8E986', '#F5A623',
			'#AAAAAA', '#DDDDDD', '#FFFFFF', '#000000'
		]
	},
	monochrome: {
		name: 'Monochrome',
		colors: [
			'#000000', '#1A1A1A', '#333333', '#4D4D4D',
			'#666666', '#808080', '#999999', '#B3B3B3',
			'#CCCCCC', '#E6E6E6', '#F2F2F2', '#FFFFFF',
			'#0D0D0D', '#262626', '#404040', '#595959'
		]
	},
	candy: {
		name: 'Candy',
		colors: [
			'#FF69B4', '#FF1493', '#FFB6C1', '#FFC0CB',
			'#FF6EB4', '#FF85C1', '#FF9ECE', '#FFB7DB',
			'#87CEEB', '#98D8E8', '#B0E0E6', '#AFEEEE',
			'#FFE4E1', '#FFF0F5', '#FFDAB9', '#FFEFD5'
		]
	}
}

// Active color palette (reactive)
const currentTheme = ref('classic')
const colorPalette = ref([...COLOR_THEMES.classic.colors])
const customColor = ref('#FF0000')
const hasCustomColorSelected = ref(false)

// State
const currentTool = ref(TOOLS.PENCIL)
const foregroundColor = ref('#000000')
const backgroundColor = ref('#FFFFFF')
const isDrawing = ref(false)

// Selection state
const selection = ref(null) // { startRow, startCol, endRow, endCol, data, offsetRow, offsetCol, isDragging }
const selectionStart = ref(null)

// Initialize grid with transparent
const grid = reactive(
	Array(GRID_SIZE * GRID_SIZE).fill('transparent')
)

// History for undo/redo
const history = ref([])
const redoHistory = ref([])

// Save current state to history
const saveToHistory = () => {
	history.value.push([...grid])
	// Clear redo history when new action is made
	redoHistory.value = []
	// Limit history to last 50 states
	if (history.value.length > 50) {
		history.value.shift()
	}
}

// Undo function
const undo = () => {
	if (history.value.length === 0) return

	// Save current state to redo history
	redoHistory.value.push([...grid])

	const previousState = history.value.pop()
	for (let i = 0; i < grid.length; i++) {
		grid[i] = previousState[i]
	}
}

// Redo function
const redo = () => {
	if (redoHistory.value.length === 0) return

	// Save current state to undo history
	history.value.push([...grid])

	const nextState = redoHistory.value.pop()
	for (let i = 0; i < grid.length; i++) {
		grid[i] = nextState[i]
	}
}

// Selection functions
const isInsideSelection = (row, col) => {
	if (!selection.value) return false
	const { startRow, startCol, endRow, endCol } = selection.value
	return row >= startRow && row <= endRow && col >= startCol && col <= endCol
}

const cutSelection = () => {
	if (!selection.value) return

	saveToHistory()
	const { startRow, startCol, endRow, endCol } = selection.value
	const data = []

	// Extract pixels
	for (let row = startRow; row <= endRow; row++) {
		for (let col = startCol; col <= endCol; col++) {
			const index = getPixelIndex(row, col)
			data.push(grid[index])
			grid[index] = 'transparent' // Clear original area
		}
	}

	selection.value.data = data
}

const copySelection = () => {
	if (!selection.value) return

	const { startRow, startCol, endRow, endCol } = selection.value
	const data = []

	// Copy pixels without clearing
	for (let row = startRow; row <= endRow; row++) {
		for (let col = startCol; col <= endCol; col++) {
			const index = getPixelIndex(row, col)
			data.push(grid[index])
		}
	}

	selection.value.data = data
}

const applySelectionMove = () => {
	if (!selection.value || !selection.value.data) return

	saveToHistory()

	const { startRow, startCol, endRow, endCol, data, offsetRow, offsetCol } = selection.value
	const width = endCol - startCol + 1
	const height = endRow - startRow + 1

	// Apply the moved selection
	let dataIndex = 0
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const newRow = startRow + row + offsetRow
			const newCol = startCol + col + offsetCol

			// Only paste if within bounds
			if (newRow >= 0 && newRow < GRID_SIZE && newCol >= 0 && newCol < GRID_SIZE) {
				const gridIndex = getPixelIndex(newRow, newCol)
				grid[gridIndex] = data[dataIndex]
			}
			dataIndex++
		}
	}

	// Update selection position
	selection.value.startRow += offsetRow
	selection.value.endRow += offsetRow
	selection.value.startCol += offsetCol
	selection.value.endCol += offsetCol
	selection.value.offsetRow = 0
	selection.value.offsetCol = 0
	selection.value.isDragging = false
}

const cancelSelection = () => {
	selection.value = null
	selectionStart.value = null
}

// Tool functions
const selectTool = (tool) => {
	currentTool.value = tool
	if (tool !== TOOLS.SELECT) {
		cancelSelection()
	}
}

const selectColor = (color, index) => {
	if (hasCustomColorSelected.value) {
		// Replace this palette color with custom color
		colorPalette.value[index] = customColor.value
		hasCustomColorSelected.value = false
	} else {
		// Normal color selection
		foregroundColor.value = color
	}
}

const changeTheme = (themeKey) => {
	currentTheme.value = themeKey
	colorPalette.value = [...COLOR_THEMES[themeKey].colors]
}

const openCustomColorPicker = () => {
	hasCustomColorSelected.value = true
}

const swapColors = () => {
	const temp = foregroundColor.value
	foregroundColor.value = backgroundColor.value
	backgroundColor.value = temp
}

const getPixelIndex = (row, col) => {
	return row * GRID_SIZE + col
}

const handlePixelMouseDown = (row, col) => {
	if (currentTool.value === TOOLS.SELECT) {
		// Check if clicking inside existing selection
		if (selection.value && isInsideSelection(row, col) && !selection.value.data) {
			// Auto-cut the selection when clicking on it
			cutSelection()
			selection.value.isDragging = true
			selection.value.dragStartRow = row
			selection.value.dragStartCol = col
			selection.value.offsetRow = 0
			selection.value.offsetCol = 0
		} else if (selection.value && isInsideSelection(row, col) && selection.value.data) {
			// Already cut, just start dragging
			selection.value.isDragging = true
			selection.value.dragStartRow = row
			selection.value.dragStartCol = col
			selection.value.offsetRow = 0
			selection.value.offsetCol = 0
		} else {
			// Start new selection
			selectionStart.value = { row, col }
			selection.value = null
		}
	} else {
		isDrawing.value = true
		saveToHistory()
		applyTool(row, col)
	}
}

const handlePixelMouseEnter = (row, col) => {
	if (currentTool.value === TOOLS.SELECT) {
		if (selectionStart.value && !selection.value?.isDragging) {
			// Drawing selection rectangle
			const startRow = Math.min(selectionStart.value.row, row)
			const endRow = Math.max(selectionStart.value.row, row)
			const startCol = Math.min(selectionStart.value.col, col)
			const endCol = Math.max(selectionStart.value.col, col)

			selection.value = {
				startRow,
				startCol,
				endRow,
				endCol,
				data: null,
				offsetRow: 0,
				offsetCol: 0,
				isDragging: false
			}
		} else if (selection.value?.isDragging) {
			// Dragging existing selection
			const deltaRow = row - selection.value.dragStartRow
			const deltaCol = col - selection.value.dragStartCol
			selection.value.offsetRow = deltaRow
			selection.value.offsetCol = deltaCol
		}
	} else if (isDrawing.value && (currentTool.value === TOOLS.PENCIL || currentTool.value === TOOLS.ERASER)) {
		applyTool(row, col)
	}
}

const handlePixelMouseUp = () => {
	if (currentTool.value === TOOLS.SELECT) {
		if (selection.value?.isDragging) {
			// Apply the move
			applySelectionMove()
		}
		selectionStart.value = null
	} else {
		isDrawing.value = false
	}
}

const applyTool = (row, col) => {
	const index = getPixelIndex(row, col)

	switch (currentTool.value) {
		case TOOLS.PENCIL:
			grid[index] = foregroundColor.value
			break
		case TOOLS.ERASER:
			grid[index] = 'transparent'
			break
		case TOOLS.PICKER:
			foregroundColor.value = grid[index]
			break
		case TOOLS.FILL:
			floodFill(row, col, grid[index], foregroundColor.value)
			break
	}
}

const floodFill = (row, col, targetColor, fillColor) => {
	if (targetColor === fillColor) return

	const stack = [[row, col]]
	const visited = new Set()

	while (stack.length > 0) {
		const [r, c] = stack.pop()
		const key = `${r},${c}`

		if (visited.has(key)) continue
		if (r < 0 || r >= GRID_SIZE || c < 0 || c >= GRID_SIZE) continue

		const index = getPixelIndex(r, c)
		if (grid[index] !== targetColor) continue

		visited.add(key)
		grid[index] = fillColor

		stack.push([r + 1, c])
		stack.push([r - 1, c])
		stack.push([r, c + 1])
		stack.push([r, c - 1])
	}
}

// Menu functions
const clearCanvas = () => {
	saveToHistory()
	for (let i = 0; i < grid.length; i++) {
		grid[i] = 'transparent'
	}
}

const saveImage = () => {
	// Create canvas
	const canvas = document.createElement('canvas')
	canvas.width = GRID_SIZE
	canvas.height = GRID_SIZE
	const ctx = canvas.getContext('2d')

	// Clear canvas (transparent by default)
	ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE)

	// Draw each pixel
	for (let row = 0; row < GRID_SIZE; row++) {
		for (let col = 0; col < GRID_SIZE; col++) {
			const index = getPixelIndex(row, col)
			const color = grid[index]

			// Only draw if not transparent
			if (color !== 'transparent') {
				ctx.fillStyle = color
				ctx.fillRect(col, row, 1, 1)
			}
		}
	}

	// Convert to PNG and download
	canvas.toBlob((blob) => {
		const url = URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.download = 'hawk-paint.png'
		link.click()
		URL.revokeObjectURL(url)
	}, 'image/png')
}

const loadImage = () => {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'image/png,image/jpg,image/jpeg,image/gif'
	input.onchange = (e) => {
		const file = e.target.files[0]
		if (!file) return

		const reader = new FileReader()
		reader.onload = (event) => {
			const img = new Image()
			img.onload = () => {
				saveToHistory()

				// Create temporary canvas to read pixels
				const canvas = document.createElement('canvas')
				canvas.width = GRID_SIZE
				canvas.height = GRID_SIZE
				const ctx = canvas.getContext('2d')

				// Draw image scaled to 16x16
				ctx.drawImage(img, 0, 0, GRID_SIZE, GRID_SIZE)

				// Read pixel data
				const imageData = ctx.getImageData(0, 0, GRID_SIZE, GRID_SIZE)

				// Convert to hex colors with alpha support
				for (let row = 0; row < GRID_SIZE; row++) {
					for (let col = 0; col < GRID_SIZE; col++) {
						const pixelIndex = (row * GRID_SIZE + col) * 4
						const r = imageData.data[pixelIndex]
						const g = imageData.data[pixelIndex + 1]
						const b = imageData.data[pixelIndex + 2]
						const a = imageData.data[pixelIndex + 3]

						const gridIndex = getPixelIndex(row, col)

						// If alpha is below threshold, treat as transparent
						if (a < 128) {
							grid[gridIndex] = 'transparent'
						} else {
							const hex = '#' + [r, g, b].map(x => {
								const hex = x.toString(16)
								return hex.length === 1 ? '0' + hex : hex
							}).join('').toUpperCase()
							grid[gridIndex] = hex
						}
					}
				}
			}
			img.src = event.target.result
		}
		reader.readAsDataURL(file)
	}
	input.click()
}

const handleMenuClick = () => {
	router.push('/gaming')
}
</script>

<template>
	<Header
		:show-menu-button="true"
		:show-game-info="false"
		@menu-click="handleMenuClick"
	/>
	<main class="content">
		<!-- Menu Bar -->
		<section class="menu-bar">
			<button @click="clearCanvas" class="menu-btn">Neu</button>
			<button @click="loadImage" class="menu-btn">Laden</button>
			<button @click="saveImage" class="menu-btn">Speichern</button>
			<button @click="undo" :disabled="history.length === 0" class="menu-btn menu-btn--icon" title="Rückgängig">↶</button>
			<button @click="redo" :disabled="redoHistory.length === 0" class="menu-btn menu-btn--icon" title="Wiederherstellen">↷</button>
		</section>

		<!-- Toolbar -->
		<section class="toolbar">
			<button
				@click="selectTool(TOOLS.PENCIL)"
				:class="['tool-btn', { active: currentTool === TOOLS.PENCIL }]"
				title="Bleistift"
			>
				✏️
			</button>
			<button
				@click="selectTool(TOOLS.FILL)"
				:class="['tool-btn', { active: currentTool === TOOLS.FILL }]"
				title="Füllen"
			>
				🪣
			</button>
			<button
				@click="selectTool(TOOLS.ERASER)"
				:class="['tool-btn', { active: currentTool === TOOLS.ERASER }]"
				title="Radierer"
			>
				🧹
			</button>
			<button
				@click="selectTool(TOOLS.PICKER)"
				:class="['tool-btn', { active: currentTool === TOOLS.PICKER }]"
				title="Farbwähler"
			>
				🎨
			</button>
			<button
				@click="selectTool(TOOLS.SELECT)"
				:class="['tool-btn', { active: currentTool === TOOLS.SELECT }]"
				title="Auswählen & Verschieben"
			>
				✂️
			</button>

			<!-- Active Colors -->
			<div class="active-colors">
				<div class="color-display">
					<div
						class="color-box foreground"
						:style="{ backgroundColor: foregroundColor }"
						@click="swapColors"
						title="Vordergrund"
					></div>
					<div
						class="color-box background"
						:style="{ backgroundColor: backgroundColor }"
						@click="swapColors"
						title="Hintergrund"
					></div>
				</div>
			</div>
		</section>

		<!-- Canvas -->
		<section class="canvas-container" @mouseup="handlePixelMouseUp" @mouseleave="handlePixelMouseUp">
			<div class="canvas-wrapper">
				<div class="canvas">
					<div
						v-for="row in GRID_SIZE"
						:key="`row-${row}`"
						class="pixel-row"
					>
						<div
							v-for="col in GRID_SIZE"
							:key="`pixel-${row}-${col}`"
							class="pixel"
							:style="{ backgroundColor: grid[getPixelIndex(row - 1, col - 1)] }"
							@mousedown="handlePixelMouseDown(row - 1, col - 1)"
							@mouseenter="handlePixelMouseEnter(row - 1, col - 1)"
						></div>
					</div>
				</div>

				<!-- Selection Overlay -->
				<div
					v-if="selection"
					class="selection-overlay"
					:style="{
						top: (selection.startRow + selection.offsetRow) * 20 + 'px',
						left: (selection.startCol + selection.offsetCol) * 20 + 'px',
						width: (selection.endCol - selection.startCol + 1) * 20 + 'px',
						height: (selection.endRow - selection.startRow + 1) * 20 + 'px'
					}"
				></div>
			</div>
		</section>

		<!-- Color Palette Section -->
		<section class="palette-section">
			<!-- Palette Header -->
			<div class="palette-header">
				<div class="theme-selector">
					<label for="theme-select">Theme:</label>
					<select id="theme-select" v-model="currentTheme" @change="changeTheme(currentTheme)" class="theme-select">
						<option v-for="(theme, key) in COLOR_THEMES" :key="key" :value="key">
							{{ theme.name }}
						</option>
					</select>
				</div>
				<div class="custom-color-picker">
					<label class="color-picker-btn" :class="{ active: hasCustomColorSelected }">
						<input
							type="color"
							v-model="customColor"
							@input="openCustomColorPicker"
							class="color-input"
						/>
						<span class="color-preview" :style="{ backgroundColor: customColor }"></span>
						<span class="color-label">{{ hasCustomColorSelected ? 'Farbe wählen...' : 'Farbe' }}</span>
					</label>
				</div>
			</div>

			<!-- Color Palette Grid -->
			<div class="color-palette" :class="{ 'replace-mode': hasCustomColorSelected }">
				<div
					v-for="(color, index) in colorPalette"
					:key="index"
					class="palette-color-wrapper"
				>
					<div
						class="palette-color"
						:class="{
							active: color === foregroundColor && !hasCustomColorSelected
						}"
						:style="{ backgroundColor: color }"
						@click="selectColor(color, index)"
					></div>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.content {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding-bottom: var(--space-6);
}

// Menu Bar
.menu-bar {
	display: flex;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
}

.menu-btn {
	padding: var(--space-2) var(--space-4);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	cursor: pointer;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		background-color: var(--primary-color);
		color: white;
		transform: translateY(-1px);
	}

	&:active:not(:disabled) {
		transform: translateY(0);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&--icon {
		font-size: 24px;
		padding: var(--space-2) var(--space-3);
		min-width: 48px;
	}
}

// Toolbar
.toolbar {
	display: flex;
	flex-direction: row;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	align-items: center;
}

.tool-btn {
	width: 48px;
	height: 48px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 24px;
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: var(--primary-color);
		transform: scale(1.05);
	}

	&.active {
		background-color: var(--primary-color);
		border-color: var(--primary-color);
		box-shadow: 0 0 0 2px var(--card-bg), 0 0 0 4px var(--primary-color);
	}

	&:active {
		transform: scale(0.95);
	}
}

// Active Colors
.active-colors {
	margin-left: var(--space-2);
	padding-left: var(--space-2);
	border-left: 2px solid var(--card-border);
}

.color-display {
	position: relative;
	width: 48px;
	height: 48px;
	cursor: pointer;
}

.color-box {
	position: absolute;
	border: 2px solid var(--card-border);

	&.foreground {
		width: 32px;
		height: 32px;
		top: 0;
		left: 0;
		z-index: 2;
	}

	&.background {
		width: 32px;
		height: 32px;
		bottom: 0;
		right: 0;
		z-index: 1;
	}
}

// Canvas
.canvas-container {
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-4);
}

.canvas-wrapper {
	position: relative;
	display: inline-block;
}

.canvas {
	display: inline-block;
	background-color: white;
	background-image:
		linear-gradient(45deg, #ccc 25%, transparent 25%),
		linear-gradient(-45deg, #ccc 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #ccc 75%),
		linear-gradient(-45deg, transparent 75%, #ccc 75%);
	background-size: 20px 20px;
	background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
	border: 2px solid var(--card-border);
	user-select: none;
}

.selection-overlay {
	position: absolute;
	border: 2px dashed var(--primary-color);
	background-color: rgba(0, 123, 255, 0.1);
	pointer-events: none;
	box-sizing: border-box;
	z-index: 10;
}

.pixel-row {
	display: flex;
	height: 20px;
}

.pixel {
	width: 20px;
	height: 20px;
	border: 1px solid rgba(0, 0, 0, 0.1);
	cursor: crosshair;
	box-sizing: border-box;

	&:hover {
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.5);
	}
}

// Color Palette Section
.palette-section {
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.palette-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: var(--space-2);
}

.theme-selector {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	flex: 1;

	label {
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
	}
}

.theme-select {
	flex: 1;
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: var(--primary-color);
		color: white;
	}

	&:focus {
		outline: none;
		border-color: var(--primary-color);
	}
}

.custom-color-picker {
	display: flex;
	align-items: center;
}

.color-picker-btn {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2) var(--space-3);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-sm);
	cursor: pointer;
	transition: all 0.2s;
	white-space: nowrap;

	&:hover {
		background-color: var(--primary-color);
		color: white;

		.color-preview {
			border-color: white;
		}
	}

	&.active {
		background-color: var(--success-color);
		color: white;
		border-color: var(--success-color);
		animation: pulse 1.5s ease-in-out infinite;

		.color-preview {
			border-color: white;
		}
	}
}

.color-input {
	position: absolute;
	opacity: 0;
	width: 0;
	height: 0;
	pointer-events: none;
}

.color-preview {
	width: 20px;
	height: 20px;
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	transition: all 0.2s;
}

.color-label {
	user-select: none;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.05);
	}
}

// Color Palette
.color-palette {
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	gap: var(--space-2);

	&.replace-mode {
		.palette-color {
			cursor: crosshair;

			&:hover {
				transform: scale(1.2);
				box-shadow: 0 0 0 3px var(--success-color);
			}
		}
	}
}

.palette-color-wrapper {
	position: relative;
}

.palette-color {
	width: 100%;
	aspect-ratio: 1;
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	cursor: pointer;
	transition: all 0.2s;
	position: relative;

	&:hover {
		transform: scale(1.1);
		z-index: 1;
	}

	&.active {
		box-shadow: 0 0 0 2px var(--card-bg), 0 0 0 4px var(--primary-color);
		z-index: 2;
	}

	&:active {
		transform: scale(0.95);
	}
}

// Responsive
@media (max-width: 768px) {
	.toolbar {
		flex-wrap: wrap;
		justify-content: center;
	}

	.canvas {
		background-size: 15px 15px;
		background-position: 0 0, 0 7.5px, 7.5px -7.5px, -7.5px 0px;
	}

	.pixel-row {
		height: 15px;
	}

	.pixel {
		width: 15px;
		height: 15px;
	}

	.palette-header {
		flex-direction: column;
		align-items: stretch;
	}

	.theme-selector {
		flex-direction: column;
		align-items: stretch;

		label {
			text-align: left;
		}
	}

	.custom-color-picker {
		width: 100%;

		.color-picker-btn {
			width: 100%;
			justify-content: center;
		}
	}

	.color-palette {
		grid-template-columns: repeat(8, 1fr);
	}
}
</style>
