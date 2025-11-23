<script setup>
import { ref, reactive, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'

const router = useRouter()

// Minimap ref
const minimapCanvas = ref(null)

// Grid size
const VIEWPORT_SIZE = 16 // Always show 16x16
const canvasWidth = ref(16)
const canvasHeight = ref(16)
const viewportX = ref(0)
const viewportY = ref(0)
const viewportStep = ref(16) // Step size for viewport movement

// Tools
const TOOLS = {
	PENCIL: 'pencil',
	FILL: 'fill',
	ERASER: 'eraser',
	PICKER: 'picker',
	SELECT: 'select',
	COPY: 'copy'
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
	grey: {
		name: 'Grau',
		colors: [
			'#F2F2F2', '#E6E6E6', '#D9D9D9', '#CCCCCC', '#BFBFBF', '#B3B3B3', '#A6A6A6', '#999999',
			'#8C8C8C', '#737373', '#5C5C5C', '#474747', '#333333', '#1F1F1F', '#141414', '#0A0A0A'
		]
	},
	yellow: {
		name: 'Gelb',
		colors: [
			'#FFFBEA', '#FFF3C4', '#FCE588', '#FADB5F', '#F7C948', '#F0B429', '#DE911D', '#CB6E17',
			'#B44D12', '#8D3613', '#7A2E0E', '#6B270C', '#5A1F0A', '#491908', '#381306', '#280D04'
		]
	},
	orange: {
		name: 'Orange',
		colors: [
			'#FFF4E5', '#FFE8CC', '#FFD4A8', '#FFBB77', '#FFA94D', '#FF922B', '#FD7E14', '#E86A0C',
			'#CC580A', '#B04708', '#933606', '#7A2C05', '#662403', '#521D03', '#3D1502', '#2A0E01'
		]
	},
	red: {
		name: 'Rot',
		colors: [
			'#FFE5E5', '#FFC9C9', '#FFA8A8', '#FF8787', '#FF6B6B', '#FA5252', '#F03E3E', '#E03131',
			'#C92A2A', '#B02525', '#962020', '#7D1A1A', '#661515', '#4E1010', '#370B0B', '#210606'
		]
	},
	pink: {
		name: 'Pink',
		colors: [
			'#FFE6F0', '#FFCBE1', '#FFADD1', '#FF8FC1', '#FF70B1', '#F55DA3', '#E64992', '#D1387F',
			'#B62E6B', '#9C2659', '#821F48', '#6A1839', '#54132D', '#3D0D20', '#270915', '#15040A'
		]
	},
	purple: {
		name: 'Violett',
		colors: [
			'#F3E8FF', '#E5D4FF', '#D0B6FF', '#BB98FF', '#A678FF', '#925EFF', '#7D47F0', '#6935D1',
			'#562AB6', '#452399', '#361C7D', '#2A1763', '#20124E', '#160D39', '#0E0826', '#070413'
		]
	},
	blue: {
		name: 'Blau',
		colors: [
			'#E6F0FF', '#CCE1FF', '#A8CCFF', '#85B6FF', '#5FA0FF', '#3D8BFF', '#1E78FF', '#0F66E6',
			'#0A55C2', '#0846A3', '#063985', '#052E6A', '#042452', '#031B3D', '#021227', '#010A14'
		]
	},
	cyan: {
		name: 'Cyan',
		colors: [
			'#E6FBFF', '#C6F5FF', '#9DEFFF', '#74E8FF', '#4DE2FF', '#29DAF8', '#14C7E6', '#0FB0CC',
			'#0C96AF', '#0A7D92', '#086678', '#065262', '#053F4A', '#032D36', '#021E25', '#011215'
		]
	},
	green: {
		name: 'Grün',
		colors: [
			'#E6FFE9', '#C9FFD1', '#A6F7B3', '#85EF96', '#62E679', '#48D565', '#36C153', '#2EA047',
			'#27833B', '#216930', '#1B5125', '#153E1C', '#102F15', '#0B2110', '#07160A', '#040D06'
		]
	},
	brown: {
		name: 'Braun',
		colors: [
			'#F7EFE7', '#EBDCCB', '#DCC5AC', '#CCA98A', '#BD8E6C', '#AD7752', '#9C633F', '#875333',
			'#734628', '#613A1F', '#503017', '#402612', '#321E0D', '#241608', '#170E05', '#0D0803'
		]
	},
	lime: {
		name: 'Lime',
		colors: [
			'#F2FFE6', '#E2FFC6', '#CCFF99', '#B3FF66', '#99FF33', '#80FF00', '#6CD100', '#59B300',
			'#4A9600', '#3C7A00', '#2E6000', '#244D00', '#1B3A00', '#142A00', '#0C1B00', '#071000'
		]
	},
	teal: {
		name: 'Teal',
		colors: [
			'#E6FFFB', '#C4FFF4', '#99FFE9', '#6DF5DC', '#48E8CF', '#2DD3BA', '#1EB8A3', '#14998A',
			'#107D72', '#0D665E', '#0A504A', '#083E3A', '#062F2C', '#04211F', '#031614', '#010A09'
		]
	},
	olive: {
		name: 'Oliv',
		colors: [
			'#F5F7E6', '#E8ECC3', '#DCE0A1', '#CCD07E', '#BCBF5D', '#A8AA48', '#979840', '#807F33',
			'#696728', '#545120', '#434019', '#342F13', '#26220E', '#1A1709', '#120F06', '#090803'
		]
	},
	gold: {
		name: 'Gold',
		colors: [
			'#FFF9E6', '#FFF1C7', '#FFE8A1', '#FFDD77', '#FFD24D', '#FFC72A', '#F2B615', '#D9990F',
			'#BF810A', '#A66A07', '#8A5605', '#704504', '#593603', '#422802', '#2C1B01', '#170E00'
		]
	},
	silver: {
		name: 'Silber',
		colors: [
			'#F9FAFB', '#F1F3F5', '#E6E9ED', '#D9DDE3', '#C8CCD2', '#B7BDC2', '#A5ABB0', '#8E959B',
			'#787E85', '#62686E', '#4F5458', '#3E4245', '#2F3234', '#222325', '#171718', '#0C0C0D'
		]
	},
	magenta: {
		name: 'Magenta',
		colors: [
			'#FFE6FA', '#FFC7F2', '#FFA3E8', '#FF7FDE', '#FF59D3', '#FF33C7', '#EB1DB2', '#C91695',
			'#A7127B', '#890F65', '#6C0B4F', '#53093D', '#3C072C', '#27051D', '#180312', '#0A0208'
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

// Brush settings
const brushSize = ref(1)
const brushShape = ref('square')

// Selection state
const selection = ref(null) // { startRow, startCol, endRow, endCol, data, offsetRow, offsetCol, isDragging }
const selectionStart = ref(null)

// Clipboard for copy/paste
const clipboard = ref(null) // { width, height, data }

// Initialize grid with transparent
const grid = reactive(
	Array(canvasWidth.value * canvasHeight.value).fill('transparent')
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
			if (newRow >= 0 && newRow < canvasHeight.value && newCol >= 0 && newCol < canvasWidth.value) {
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

// Copy to clipboard
const copyToClipboard = () => {
	if (!selection.value) return

	const { startRow, startCol, endRow, endCol } = selection.value
	const width = endCol - startCol + 1
	const height = endRow - startRow + 1
	const data = []

	// Copy pixels without clearing
	for (let row = startRow; row <= endRow; row++) {
		for (let col = startCol; col <= endCol; col++) {
			const index = getPixelIndex(row, col)
			data.push(grid[index])
		}
	}

	clipboard.value = { width, height, data }
}

// Paste from clipboard
const pasteFromClipboard = (targetRow, targetCol) => {
	if (!clipboard.value) return

	const { width, height, data } = clipboard.value
	let dataIndex = 0

	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const newRow = targetRow + row
			const newCol = targetCol + col

			// Only paste if within bounds
			if (newRow >= 0 && newRow < canvasHeight.value && newCol >= 0 && newCol < canvasWidth.value) {
				const gridIndex = getPixelIndex(newRow, newCol)
				grid[gridIndex] = data[dataIndex]
			}
			dataIndex++
		}
	}
}

// Tool functions
const selectTool = (tool) => {
	currentTool.value = tool
	if (tool !== TOOLS.SELECT && tool !== TOOLS.COPY) {
		cancelSelection()
	}
}

const selectColor = (color, index) => {
	if (hasCustomColorSelected.value) {
		foregroundColor.value = customColor.value
		// Replace this palette color with custom color
		colorPalette.value[index] = customColor.value
		hasCustomColorSelected.value = false
	} else {
		// Normal color selection
		foregroundColor.value = color
		customColor.value = color
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
	return row * canvasWidth.value + col
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
	} else if (currentTool.value === TOOLS.COPY) {
		// If we have clipboard data, paste it at clicked position
		if (clipboard.value) {
			saveToHistory()
			pasteFromClipboard(row, col)
			clipboard.value = null
			selection.value = null
			selectionStart.value = null
		} else if (selection.value && !selectionStart.value) {
			// Already have a selection, copy it to clipboard
			copyToClipboard()
			selection.value = null
		} else {
			// Start new selection for copying
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
	if (currentTool.value === TOOLS.SELECT || currentTool.value === TOOLS.COPY) {
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
	} else if (currentTool.value === TOOLS.COPY) {
		// Finish selection drawing
		selectionStart.value = null
	} else {
		isDrawing.value = false
	}
}

// Brush patterns
const getBrushPattern = (size, shape) => {
	const pattern = []
	const halfSize = Math.floor(size / 2)
	const isEven = size % 2 === 0
	const start = isEven ? -halfSize + 1 : -halfSize
	const end = halfSize

	for (let y = start; y <= end; y++) {
		for (let x = start; x <= end; x++) {
			let shouldInclude = false

			switch (shape) {
				case 'square':
					shouldInclude = true
					break
				case 'circle':
					shouldInclude = (x * x + y * y) <= (halfSize * halfSize)
					break
				case 'diamond':
					shouldInclude = Math.abs(x) + Math.abs(y) <= halfSize
					break
				case 'horizontal':
					shouldInclude = y === 0 || (isEven && y === -1)
					break
				case 'vertical':
					shouldInclude = x === 0 || (isEven && x === -1)
					break
				case 'cross':
					shouldInclude = x === 0 || y === 0 || (isEven && (x === -1 || y === -1))
					break
				case 'plus':
					shouldInclude = (x === 0 && Math.abs(y) <= 1) || (y === 0 && Math.abs(x) <= 1)
					break
			}

			if (shouldInclude) {
				pattern.push({ x, y })
			}
		}
	}

	return pattern
}

const applyBrush = (row, col, color) => {
	const pattern = getBrushPattern(brushSize.value, brushShape.value)

	pattern.forEach(({ x, y }) => {
		const targetRow = row + y
		const targetCol = col + x

		// Check bounds (use canvas size, not viewport)
		if (targetRow >= 0 && targetRow < canvasHeight.value && targetCol >= 0 && targetCol < canvasWidth.value) {
			const index = getPixelIndex(targetRow, targetCol)
			grid[index] = color
		}
	})
}

const applyTool = (row, col) => {
	const index = getPixelIndex(row, col)

	switch (currentTool.value) {
		case TOOLS.PENCIL:
			applyBrush(row, col, foregroundColor.value)
			break
		case TOOLS.ERASER:
			applyBrush(row, col, 'transparent')
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
		if (r < 0 || r >= canvasHeight.value || c < 0 || c >= canvasWidth.value) continue

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
	// Create canvas with actual canvas size
	const canvas = document.createElement('canvas')
	canvas.width = canvasWidth.value
	canvas.height = canvasHeight.value
	const ctx = canvas.getContext('2d')

	// Clear canvas (transparent by default)
	ctx.clearRect(0, 0, canvasWidth.value, canvasHeight.value)

	// Draw each pixel
	for (let row = 0; row < canvasHeight.value; row++) {
		for (let col = 0; col < canvasWidth.value; col++) {
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
		link.download = `hawk-paint-${canvasWidth.value}x${canvasHeight.value}.png`
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

				// Adjust canvas size to match image
				canvasWidth.value = img.width
				canvasHeight.value = img.height

				// Resize grid to match new canvas size
				const newSize = img.width * img.height
				grid.length = 0
				for (let i = 0; i < newSize; i++) {
					grid.push('transparent')
				}

				// Create temporary canvas to read pixels
				const canvas = document.createElement('canvas')
				canvas.width = img.width
				canvas.height = img.height
				const ctx = canvas.getContext('2d')

				// Draw image at actual size
				ctx.drawImage(img, 0, 0)

				// Read pixel data
				const imageData = ctx.getImageData(0, 0, img.width, img.height)

				// Convert to hex colors with alpha support
				for (let row = 0; row < img.height; row++) {
					for (let col = 0; col < img.width; col++) {
						const pixelIndex = (row * img.width + col) * 4
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

				// Reset viewport to origin
				viewportX.value = 0
				viewportY.value = 0
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

// Draw minimap
const drawMinimap = () => {
	if (!minimapCanvas.value) return

	const canvas = minimapCanvas.value
	const ctx = canvas.getContext('2d')

	// Set canvas size to match canvas dimensions
	const scale = 4 // Each pixel is 4x4 on minimap
	canvas.width = canvasWidth.value * scale
	canvas.height = canvasHeight.value * scale

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	// Draw grid pixels
	for (let row = 0; row < canvasHeight.value; row++) {
		for (let col = 0; col < canvasWidth.value; col++) {
			const index = getPixelIndex(row, col)
			const color = grid[index]

			if (color !== 'transparent') {
				ctx.fillStyle = color
				ctx.fillRect(col * scale, row * scale, scale, scale)
			}
		}
	}

	// Draw viewport rectangle
	ctx.strokeStyle = '#FF0000'
	ctx.lineWidth = 2
	ctx.strokeRect(
		viewportX.value * scale,
		viewportY.value * scale,
		VIEWPORT_SIZE * scale,
		VIEWPORT_SIZE * scale
	)
}

// Click on minimap to jump to position
const handleMinimapClick = (event) => {
	if (!minimapCanvas.value) return

	const canvas = minimapCanvas.value
	const rect = canvas.getBoundingClientRect()
	const scale = 4

	// Calculate click position in canvas coordinates
	const clickX = Math.floor((event.clientX - rect.left) / scale)
	const clickY = Math.floor((event.clientY - rect.top) / scale)

	// Center viewport on clicked position
	const newX = Math.max(0, Math.min(clickX - Math.floor(VIEWPORT_SIZE / 2), canvasWidth.value - VIEWPORT_SIZE))
	const newY = Math.max(0, Math.min(clickY - Math.floor(VIEWPORT_SIZE / 2), canvasHeight.value - VIEWPORT_SIZE))

	viewportX.value = newX
	viewportY.value = newY

	drawMinimap()
}

// Touch handler for minimap
const handleMinimapTouch = (event) => {
	event.preventDefault()
	if (!minimapCanvas.value) return

	const touch = event.touches[0]
	const canvas = minimapCanvas.value
	const rect = canvas.getBoundingClientRect()
	const scale = 4

	// Calculate touch position in canvas coordinates
	const clickX = Math.floor((touch.clientX - rect.left) / scale)
	const clickY = Math.floor((touch.clientY - rect.top) / scale)

	// Center viewport on touched position
	const newX = Math.max(0, Math.min(clickX - Math.floor(VIEWPORT_SIZE / 2), canvasWidth.value - VIEWPORT_SIZE))
	const newY = Math.max(0, Math.min(clickY - Math.floor(VIEWPORT_SIZE / 2), canvasHeight.value - VIEWPORT_SIZE))

	viewportX.value = newX
	viewportY.value = newY

	drawMinimap()
}

// Watch for changes and update minimap
watch([grid, viewportX, viewportY, canvasWidth, canvasHeight], () => {
	nextTick(() => {
		drawMinimap()
	})
}, { deep: true })

// Initial draw after component mount
nextTick(() => {
	drawMinimap()
})

// Store previous dimensions
let previousWidth = canvasWidth.value
let previousHeight = canvasHeight.value

// Move viewport
const moveViewport = (deltaX, deltaY) => {
	const stepSize = viewportStep.value
	const newX = viewportX.value + (deltaX * stepSize)
	const newY = viewportY.value + (deltaY * stepSize)

	// Check bounds and clamp to valid range
	if (deltaX !== 0) {
		viewportX.value = Math.max(0, Math.min(newX, canvasWidth.value - VIEWPORT_SIZE))
	}
	if (deltaY !== 0) {
		viewportY.value = Math.max(0, Math.min(newY, canvasHeight.value - VIEWPORT_SIZE))
	}
}

// Resize canvas function
const resizeCanvas = () => {
	const oldGrid = [...grid]
	const oldWidth = previousWidth
	const oldHeight = previousHeight

	// Create new grid with new dimensions
	const newSize = canvasWidth.value * canvasHeight.value
	grid.length = 0
	for (let i = 0; i < newSize; i++) {
		grid.push('transparent')
	}

	// Copy old content to new grid (top-left aligned)
	for (let row = 0; row < Math.min(oldHeight, canvasHeight.value); row++) {
		for (let col = 0; col < Math.min(oldWidth, canvasWidth.value); col++) {
			const oldIndex = row * oldWidth + col
			const newIndex = row * canvasWidth.value + col
			if (oldIndex < oldGrid.length) {
				grid[newIndex] = oldGrid[oldIndex]
			}
		}
	}

	// Update previous dimensions
	previousWidth = canvasWidth.value
	previousHeight = canvasHeight.value

	// Reset viewport to origin
	viewportX.value = 0
	viewportY.value = 0
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
			<button @click="clearCanvas" class="menu-btn">new</button>
			<button @click="loadImage" class="menu-btn">load</button>
			<button @click="saveImage" class="menu-btn">save</button>
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
			<button
				@click="selectTool(TOOLS.COPY)"
				:class="['tool-btn', { active: currentTool === TOOLS.COPY }]"
				title="Kopieren & Einfügen"
			>
				📋
			</button>

			<!-- Brush Settings -->
			<div class="brush-settings">
				<div class="brush-setting">
					<label for="brush-size">Größe:</label>
					<select id="brush-size" v-model.number="brushSize" class="brush-select">
						<option v-for="size in 16" :key="size" :value="size">{{ size }}px</option>
					</select>
				</div>
				<div class="brush-setting">
					<label for="brush-shape">Form:</label>
					<select id="brush-shape" v-model="brushShape" class="brush-select">
						<option value="square">■ Quadrat</option>
						<option value="circle">● Kreis</option>
						<option value="diamond">◆ Raute</option>
						<option value="horizontal">━ Horizontal</option>
						<option value="vertical">┃ Vertikal</option>
						<option value="cross">✛ Kreuz</option>
						<option value="plus">✚ Plus</option>
					</select>
				</div>
			</div>

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
		<section
			class="canvas-container"
			@mouseup="handlePixelMouseUp"
			@mouseleave="handlePixelMouseUp"
		>
			<div class="canvas-wrapper">
				<div class="canvas">
					<div
						v-for="row in VIEWPORT_SIZE"
						:key="`row-${row}`"
						class="pixel-row"
					>
						<div
							v-for="col in VIEWPORT_SIZE"
							:key="`pixel-${row}-${col}`"
							class="pixel"
							:style="{ backgroundColor: grid[getPixelIndex(viewportY + row - 1, viewportX + col - 1)] }"
							@mousedown="handlePixelMouseDown(viewportY + row - 1, viewportX + col - 1)"
							@mouseenter="handlePixelMouseEnter(viewportY + row - 1, viewportX + col - 1)"
						></div>
					</div>
				</div>

				<!-- Selection Overlay -->
				<div
					v-if="selection"
					class="selection-overlay"
					:style="{
						top: (selection.startRow - viewportY + selection.offsetRow) * 20 + 'px',
						left: (selection.startCol - viewportX + selection.offsetCol) * 20 + 'px',
						width: (selection.endCol - selection.startCol + 1) * 20 + 'px',
						height: (selection.endRow - selection.startRow + 1) * 20 + 'px'
					}"
				></div>
			</div>
		</section>

		<section class="viewport-section">

		</section>

		<!-- Minimap Section -->
		<section class="minimap-section">
			<div class="viewport-navigation">
				<label class="viewport-step-label">
					Schritt:
					<input
							type="number"
							v-model.number="viewportStep"
							min="1"
							max="64"
							class="size-input"
					/>
				</label>
				<div class="nav-row">
					<button
							@click="moveViewport(-1, 0)"
							:disabled="viewportX === 0"
							class="nav-btn"
							title="Links"
					>
						←
					</button>
					<button
							@click="moveViewport(0, -1)"
							:disabled="viewportY === 0"
							class="nav-btn"
							title="Hoch"
					>
						↑
					</button>
					<button
							@click="moveViewport(0, 1)"
							:disabled="viewportY + VIEWPORT_SIZE >= canvasHeight"
							class="nav-btn"
							title="Runter"
					>
						↓
					</button>
					<button
							@click="moveViewport(1, 0)"
							:disabled="viewportX + VIEWPORT_SIZE >= canvasWidth"
							class="nav-btn"
							title="Rechts"
					>
						→
					</button>
				</div>
			</div>
			<div class="minimap-container">
				<canvas
					ref="minimapCanvas"
					@click="handleMinimapClick"
					@touchstart="handleMinimapTouch"
					class="minimap-canvas"
				></canvas>
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

		<!-- Canvas Size Controls -->
		<div class="canvas-size-controls">
			<label>
				width:
				<input
						type="number"
						v-model.number="canvasWidth"
						@change="resizeCanvas"
						min="16"
						max="256"
						class="size-input"
				/>
			</label>
			<label>
				height:
				<input
						type="number"
						v-model.number="canvasHeight"
						@change="resizeCanvas"
						min="16"
						max="256"
						class="size-input"
				/>
			</label>
		</div>
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
	flex-wrap: wrap;
	align-items: center;
}

.canvas-size-controls {
	display: flex;
	gap: var(--space-2);
	margin-left: auto;
	align-items: center;

	label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--font-size-sm);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
	}
}

.viewport-navigation {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: var(--space-2);
}

.viewport-step-label {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

// Minimap Section
.minimap-section {
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.minimap-title {
	font-size: var(--font-size-md);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.minimap-container {
	display: flex;
	justify-content: center;
	align-items: center;
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	padding: var(--space-2);
	min-height: 100px;
}

.minimap-canvas {
	cursor: crosshair;
	image-rendering: pixelated;
	border: 1px solid var(--card-border);
	background-color: white;
	background-image:
		linear-gradient(45deg, #eee 25%, transparent 25%),
		linear-gradient(-45deg, #eee 25%, transparent 25%),
		linear-gradient(45deg, transparent 75%, #eee 75%),
		linear-gradient(-45deg, transparent 75%, #eee 75%);
	background-size: 8px 8px;
	background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
	touch-action: none; // Prevent scrolling/zooming during touch
}

.size-input {
	width: 60px;
	padding: var(--space-1) var(--space-2);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-sm);

	&:focus {
		outline: none;
		border-color: var(--primary-color);
	}
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
	flex-wrap: wrap;
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

// Brush Settings
.brush-settings {
	display: flex;
	gap: var(--space-2);
}

.brush-setting {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);

	label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-secondary);
		text-transform: uppercase;
	}
}

.brush-select {
	padding: var(--space-1) var(--space-2);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-sm);
	cursor: pointer;
	transition: all 0.2s;

	&:hover {
		background-color: var(--primary-color);
		color: white;
		border-color: var(--primary-color);
	}

	&:focus {
		outline: none;
		border-color: var(--primary-color);
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

// Canvas Section
.canvas-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.viewport-controls {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-2) var(--space-3);
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	gap: var(--space-3);
}

.viewport-info {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
}

.viewport-nav {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
}

.nav-row {
	display: flex;
	gap: var(--space-1);
}

.nav-btn {
	width: 40px;
	height: 40px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 20px;
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	cursor: pointer;
	transition: all 0.2s;
	color: var(--text-color);

	&:hover:not(:disabled) {
		background-color: var(--primary-color);
		color: white;
		transform: scale(1.05);
	}

	&:active:not(:disabled) {
		transform: scale(0.95);
	}

	&:disabled {
		opacity: 0.3;
		cursor: not-allowed;
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
	touch-action: none; // Prevent scrolling/zooming during touch drawing
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
	.menu-bar {
		justify-content: flex-start;
	}

	.canvas-size-controls {
		margin-left: 0;
		width: 100%;
		justify-content: center;
	}

	.toolbar {
		flex-wrap: wrap;
		justify-content: center;
	}

	.brush-settings {
		width: 100%;
		justify-content: center;
		border-left: none;
		border-top: 2px solid var(--card-border);
		padding-left: 0;
		padding-top: var(--space-2);
		margin-left: 0;
		margin-top: var(--space-2);
	}

	.brush-setting {
		flex: 1;
		min-width: 0;

		label {
			font-size: 10px;
		}
	}

	.brush-select {
		width: 100%;
		padding: var(--space-1);
		font-size: 11px;
	}

	.viewport-controls {
		flex-direction: column;
		align-items: stretch;
	}

	.viewport-info {
		text-align: center;
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
