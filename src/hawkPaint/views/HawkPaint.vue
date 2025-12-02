<script setup>
import { ref, reactive, watch, nextTick, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'

const router = useRouter()

// Minimap ref
const minimapCanvas = ref(null)

// Clipboard preview ref
const clipboardPreviewCanvas = ref(null)

// Grid size
const VIEWPORT_WIDTH = ref(16) // Viewport width
const VIEWPORT_HEIGHT = ref(16) // Viewport height
const canvasWidth = ref(16)
const canvasHeight = ref(16)
const viewportX = ref(0)
const viewportY = ref(0)
const viewportStepX = ref(16) // Horizontal step size for viewport movement
const viewportStepY = ref(16) // Vertical step size for viewport movement

// Animation state
const isPlaying = ref(false)
const animationSpeed = ref(500) // Animation interval in ms
let animationInterval = null

// Tools
const TOOLS = {
	PENCIL: 'pencil',
	FILL: 'fill',
	ERASER: 'eraser',
	PICKER: 'picker',
	SELECT: 'select',
	MOVE: 'move',
	PASTE: 'paste'
}

// Color Themes
const COLOR_THEMES = {
	classic: {
		name: 'Theme',
		colors: [
			'#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
			'#FF8800', '#8800FF', '#00FF88', '#FF0088', '#888888', '#444444', '#CCCCCC', '#884400'
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
			'#FFFEEA', '#FFFCC4', '#FFF99E', '#FFF678', '#FFF252', '#FFEF2C', '#F7E500', '#E1CE00',
			'#CBB800', '#B3A300', '#9A8C00', '#817600', '#695F00', '#524900', '#3A3300', '#241F00'
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
const customColor = ref('#000000')
const hasCustomColorSelected = ref(false)

// State
const currentTool = ref(TOOLS.PENCIL)
const foregroundColor = ref('#000000')
const backgroundColor = ref('#FFFFFF')
const isDrawing = ref(false)
const imageName = ref('hawk-paint')

// API-Endpunkt: Node.js für Dev, PHP für Production
const SPRITE_SHEETS_API = import.meta.env.DEV
	? 'http://localhost:3000/api/sprite-sheets'
	: '/api/sprite-sheets.php'

// Sprite-Sheet Loader - Lade alle verfügbaren Sprite-Sheets vom Server
const availableSpriteSheets = ref([])
const selectedSpriteSheet = ref('')

const loadAvailableSpriteSheets = async () => {
	try {
		const response = await fetch(SPRITE_SHEETS_API)
		if (response.ok) {
			const sheets = await response.json()
			availableSpriteSheets.value = sheets
		} else {
			console.warn('⚠️ Server läuft, aber API-Endpoint nicht verfügbar. Bitte starte den Server neu.')
		}
	} catch (error) {
		console.warn('⚠️ Server nicht erreichbar. Sprite-Sheet Dropdown ist leer. Starte den Server mit "npm start" im server/ Ordner.')
	}
}

// Lade Sprite-Sheets beim Start
loadAvailableSpriteSheets()

// Brush settings
const brushSize = ref(1)
const brushShape = ref('square')

// Pencil settings
const pencilOpacity = ref(100) // 0-100%, opacity of the pencil

// Fill settings
const fillOpacity = ref(100) // 0-100%, opacity of the fill

// Eraser settings
const eraserStrength = ref(100) // 0-100%, how much to erase per click

// Grid settings
const showGrid = ref(false) // true = visible grid (0.7), false = subtle grid (0.1)
const showBackgroundRaster = ref(false) // Show background raster color
const backgroundRasterColor = ref('#f0f0f0') // Default light gray

// Emoji Generator settings
const emojiInput = ref('')
const emojiSize = ref(16) // Default 16x16
const quickEmojis = ['💎', '🪙', '⭐', '❤️', '🔑']

// Selection state
const selection = ref(null) // { startRow, startCol, endRow, endCol, data, offsetRow, offsetCol, isDragging }
const selectionStart = ref(null)

// Clipboard for copy/paste
const clipboard = ref(null) // { width, height, data }
const pastePreview = ref(null) // { row, col, width, height } - for showing paste preview

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
	if (tool !== TOOLS.SELECT && tool !== TOOLS.MOVE) {
		cancelSelection()
	}
	if (tool !== TOOLS.PASTE) {
		pastePreview.value = null
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
	customColor.value = backgroundColor.value
	backgroundColor.value = temp
}

const getPixelIndex = (row, col) => {
	return row * canvasWidth.value + col
}

const handlePixelMouseDown = (row, col) => {
	if (hasCustomColorSelected.value) {
		foregroundColor.value = customColor.value
		hasCustomColorSelected.value = false
	}
	if (currentTool.value === TOOLS.SELECT) {
		// Start new selection
		selectionStart.value = { row, col }
		selection.value = null
	} else if (currentTool.value === TOOLS.MOVE) {
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
		}
	} else if (currentTool.value === TOOLS.PASTE) {
		// Show paste preview at clicked position
		if (clipboard.value) {
			pastePreview.value = {
				row,
				col,
				width: clipboard.value.width,
				height: clipboard.value.height
			}
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
		}
	} else if (currentTool.value === TOOLS.MOVE) {
		if (selection.value?.isDragging) {
			// Dragging existing selection
			const deltaRow = row - selection.value.dragStartRow
			const deltaCol = col - selection.value.dragStartCol
			selection.value.offsetRow = deltaRow
			selection.value.offsetCol = deltaCol
		}
	} else if (currentTool.value === TOOLS.PASTE) {
		// Update paste preview position while hovering
		if (pastePreview.value && clipboard.value) {
			pastePreview.value.row = row
			pastePreview.value.col = col
		}
	} else if (isDrawing.value && (currentTool.value === TOOLS.PENCIL || currentTool.value === TOOLS.ERASER)) {
		applyTool(row, col)
	}
}

const handlePixelMouseUp = () => {
	if (currentTool.value === TOOLS.SELECT) {
		// Automatically copy the selection to clipboard
		if (selection.value && selectionStart.value) {
			copyToClipboard()
		}
		selectionStart.value = null
	} else if (currentTool.value === TOOLS.MOVE) {
		if (selection.value?.isDragging) {
			// Apply the move
			applySelectionMove()
		}
	} else if (currentTool.value === TOOLS.PASTE) {
		// Perform paste at preview position
		if (pastePreview.value && clipboard.value) {
			saveToHistory()
			pasteFromClipboard(pastePreview.value.row, pastePreview.value.col)
			pastePreview.value = null
		}
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

// Helper function to parse color to RGBA
const parseColorToRGBA = (color) => {
	if (color === 'transparent') {
		return { r: 0, g: 0, b: 0, a: 0 }
	}

	let r, g, b, a = 1

	if (color.startsWith('rgba(')) {
		const match = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/)
		if (match) {
			r = parseInt(match[1])
			g = parseInt(match[2])
			b = parseInt(match[3])
			a = parseFloat(match[4])
		}
	} else if (color.startsWith('#')) {
		const hex = color.replace('#', '')
		r = parseInt(hex.substring(0, 2), 16)
		g = parseInt(hex.substring(2, 4), 16)
		b = parseInt(hex.substring(4, 6), 16)
		a = 1
	} else if (color.startsWith('rgb(')) {
		const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
		if (match) {
			r = parseInt(match[1])
			g = parseInt(match[2])
			b = parseInt(match[3])
			a = 1
		}
	}

	return { r, g, b, a }
}

// Helper function to blend two colors (like a brush painting over existing color)
const blendColors = (baseColor, topColor, opacity) => {
	const base = parseColorToRGBA(baseColor)
	const top = parseColorToRGBA(topColor)

	// Apply opacity to the top color
	const topAlpha = (opacity / 100) * top.a

	// If base is transparent, just return top color with applied opacity
	if (base.a === 0) {
		if (topAlpha === 0) return 'transparent'
		return `rgba(${top.r}, ${top.g}, ${top.b}, ${topAlpha.toFixed(3)})`
	}

	// Alpha blending formula
	const outAlpha = topAlpha + base.a * (1 - topAlpha)

	if (outAlpha === 0) return 'transparent'

	const outR = Math.round((top.r * topAlpha + base.r * base.a * (1 - topAlpha)) / outAlpha)
	const outG = Math.round((top.g * topAlpha + base.g * base.a * (1 - topAlpha)) / outAlpha)
	const outB = Math.round((top.b * topAlpha + base.b * base.a * (1 - topAlpha)) / outAlpha)

	// If alpha is 1, return as hex for cleaner storage
	if (outAlpha === 1) {
		const hex = '#' + [outR, outG, outB].map(x => {
			const hex = x.toString(16)
			return hex.length === 1 ? '0' + hex : hex
		}).join('').toUpperCase()
		return hex
	}

	return `rgba(${outR}, ${outG}, ${outB}, ${outAlpha.toFixed(3)})`
}

// Helper function to reduce alpha based on eraser strength
const applyEraserToColor = (currentColor, strength) => {
	const { r, g, b, a } = parseColorToRGBA(currentColor)

	if (a === 0) return 'transparent'

	// Calculate new alpha based on strength (strength is 0-100)
	const strengthFactor = strength / 100
	const alphaReduction = strengthFactor
	const newAlpha = Math.max(0, a - alphaReduction)

	// If alpha reaches 0, make it transparent
	if (newAlpha === 0) {
		return 'transparent'
	}

	// Return as rgba
	return `rgba(${r}, ${g}, ${b}, ${newAlpha.toFixed(3)})`
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
			// Apply pencil with opacity blending (like a brush)
			const pencilPattern = getBrushPattern(brushSize.value, brushShape.value)
			pencilPattern.forEach(({ x, y }) => {
				const targetRow = row + y
				const targetCol = col + x

				if (targetRow >= 0 && targetRow < canvasHeight.value && targetCol >= 0 && targetCol < canvasWidth.value) {
					const targetIndex = getPixelIndex(targetRow, targetCol)
					const currentColor = grid[targetIndex]
					grid[targetIndex] = blendColors(currentColor, foregroundColor.value, pencilOpacity.value)
				}
			})
			break
		case TOOLS.ERASER:
			// Apply gradual erasing based on strength
			const eraserPattern = getBrushPattern(brushSize.value, brushShape.value)
			eraserPattern.forEach(({ x, y }) => {
				const targetRow = row + y
				const targetCol = col + x

				if (targetRow >= 0 && targetRow < canvasHeight.value && targetCol >= 0 && targetCol < canvasWidth.value) {
					const targetIndex = getPixelIndex(targetRow, targetCol)
					const currentColor = grid[targetIndex]
					grid[targetIndex] = applyEraserToColor(currentColor, eraserStrength.value)
				}
			})
			break
		case TOOLS.PICKER:
			foregroundColor.value = grid[index]
			customColor.value = foregroundColor.value
			break
		case TOOLS.FILL:
			floodFill(row, col, grid[index], foregroundColor.value, fillOpacity.value)
			break
	}
}

const floodFill = (row, col, targetColor, fillColor, opacity) => {
	if (targetColor === fillColor && opacity === 100) return

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
		// Blend the fill color with the existing color based on opacity
		grid[index] = blendColors(grid[index], fillColor, opacity)

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

// Download image to user's device
const downloadImage = () => {
	// Create canvas with actual canvas size
	const canvas = document.createElement('canvas')
	canvas.width = canvasWidth.value
	canvas.height = canvasHeight.value
	const ctx = canvas.getContext('2d', { alpha: true })

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
		link.download = `${imageName.value}.png`
		link.click()
		URL.revokeObjectURL(url)

		console.log(`Heruntergeladen: ${imageName.value}.png`)
	}, 'image/png')
}

// Save image to server in public/dungeon/ folder
const saveImage = async () => {
	// Create canvas with actual canvas size
	const canvas = document.createElement('canvas')
	canvas.width = canvasWidth.value
	canvas.height = canvasHeight.value
	const ctx = canvas.getContext('2d', { alpha: true })

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

	// Convert canvas to base64
	const imageData = canvas.toDataURL('image/png')
	const fileName = `${imageName.value}.png`

	try {
		// Send to server API
		const response = await fetch(SPRITE_SHEETS_API, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				imageData,
				fileName
			})
		})

		const result = await response.json()

		if (response.ok) {
			console.log(`✅ Sprite-Sheet gespeichert: ${fileName}`)

			// Reload available sprite sheets to show new file in dropdown
			await loadAvailableSpriteSheets()

			// Select the saved file in dropdown (without .png extension)
			selectedSpriteSheet.value = imageName.value
		} else {
			console.error('Fehler beim Speichern:', result.error)
			alert(`❌ Fehler beim Speichern:\n${result.error}`)
		}
	} catch (error) {
		console.error('Fehler beim Speichern:', error)
		const serverType = import.meta.env.DEV ? 'Node.js Server' : 'PHP Server'
		alert(`❌ Fehler beim Speichern:\n${serverType} nicht erreichbar.`)
	}
}

const loadImage = () => {
	const input = document.createElement('input')
	input.type = 'file'
	input.accept = 'image/png,image/jpg,image/jpeg,image/gif'
	input.onchange = (e) => {
		const file = e.target.files[0]
		if (!file) return

		// Extract filename without extension
		const fileName = file.name.replace(/\.[^/.]+$/, '')
		imageName.value = fileName

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

						// If alpha is 0, treat as transparent
						if (a === 0) {
							grid[gridIndex] = 'transparent'
						} else if (a === 255) {
							// Fully opaque - use hex format
							const hex = '#' + [r, g, b].map(x => {
								const hex = x.toString(16)
								return hex.length === 1 ? '0' + hex : hex
							}).join('').toUpperCase()
							grid[gridIndex] = hex
						} else {
							// Partial transparency - use rgba format
							grid[gridIndex] = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
						}
					}
				}

				// Reset viewport to origin
				viewportX.value = 0
				viewportY.value = 0

				console.log(`Geladen: ${fileName}`)
			}
			img.src = event.target.result
		}
		reader.readAsDataURL(file)
	}
	input.click()
}

// Load Sprite-Sheet from dropdown selection
const loadSpriteSheet = () => {
	if (!selectedSpriteSheet.value) return

	const spriteSheet = availableSpriteSheets.value.find(s => s.name === selectedSpriteSheet.value)
	if (!spriteSheet) return

	const img = new Image()
	img.onload = () => {
		saveToHistory()

		// Set image name from sprite sheet name
		imageName.value = spriteSheet.name

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

				// If alpha is 0, treat as transparent
				if (a === 0) {
					grid[gridIndex] = 'transparent'
				} else if (a === 255) {
					// Fully opaque - use hex format
					const hex = '#' + [r, g, b].map(x => {
						const hex = x.toString(16)
						return hex.length === 1 ? '0' + hex : hex
					}).join('').toUpperCase()
					grid[gridIndex] = hex
				} else {
					// Partial transparency - use rgba format
					grid[gridIndex] = `rgba(${r}, ${g}, ${b}, ${(a / 255).toFixed(3)})`
				}
			}
		}

		// Reset viewport to origin
		viewportX.value = 0
		viewportY.value = 0

		console.log(`Sprite-Sheet geladen: ${spriteSheet.name}`)
	}

	img.onerror = () => {
		console.error(`Fehler beim Laden von: ${spriteSheet.path}`)
	}

	// Load from public path or relative path
	img.src = spriteSheet.path
}

const handleMenuClick = () => {
	router.push('/gaming')
}

// Emoji to Pixel Generator
const generateFromEmoji = (emoji) => {
	if (!emoji) return

	saveToHistory()

	// Create temporary canvas for emoji rendering
	const size = emojiSize.value
	const canvas = document.createElement('canvas')
	canvas.width = size
	canvas.height = size
	const ctx = canvas.getContext('2d')

	// Clear canvas with transparent background
	ctx.clearRect(0, 0, size, size)

	// Set font size based on canvas size
	const fontSize = Math.floor(size * 0.875) // 87.5% of canvas size
	ctx.font = `${fontSize}px Arial`
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'

	// Draw emoji in center
	ctx.fillText(emoji, size / 2, size / 2)

	// Read pixel data
	const imageData = ctx.getImageData(0, 0, size, size)

	// Insert emoji at current viewport position
	const startRow = viewportY.value
	const startCol = viewportX.value

	// Convert to hex colors and paste at viewport position
	for (let row = 0; row < size; row++) {
		for (let col = 0; col < size; col++) {
			const pixelIndex = (row * size + col) * 4
			const r = imageData.data[pixelIndex]
			const g = imageData.data[pixelIndex + 1]
			const b = imageData.data[pixelIndex + 2]
			const a = imageData.data[pixelIndex + 3]

			// Calculate target position in grid
			const targetRow = startRow + row
			const targetCol = startCol + col

			// Only paste if within canvas bounds
			if (targetRow >= 0 && targetRow < canvasHeight.value && targetCol >= 0 && targetCol < canvasWidth.value) {
				const gridIndex = getPixelIndex(targetRow, targetCol)

				// If alpha is below threshold, treat as transparent (don't paste)
				if (a >= 32) {
					const hex = '#' + [r, g, b].map(x => {
						const hex = x.toString(16)
						return hex.length === 1 ? '0' + hex : hex
					}).join('').toUpperCase()
					grid[gridIndex] = hex
				}
			}
		}
	}

	// Clear emoji input after generation
	emojiInput.value = ''

	console.log(`Emoji "${emoji}" eingefügt als ${size}x${size} bei Position (${startCol}, ${startRow})`)
}

// Quick emoji button handler
const generateQuickEmoji = (emoji) => {
	generateFromEmoji(emoji)
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
		VIEWPORT_WIDTH.value * scale,
		VIEWPORT_HEIGHT.value * scale
	)
}

// Draw clipboard preview
const drawClipboardPreview = () => {
	if (!clipboardPreviewCanvas.value) return

	const canvas = clipboardPreviewCanvas.value
	const ctx = canvas.getContext('2d')

	// If no clipboard data, show empty state
	if (!clipboard.value) {
		canvas.width = 100
		canvas.height = 50
		ctx.clearRect(0, 0, canvas.width, canvas.height)
		ctx.fillStyle = '#999'
		ctx.font = '12px Arial'
		ctx.textAlign = 'center'
		ctx.textBaseline = 'middle'
		ctx.fillText('Keine Auswahl', canvas.width / 2, canvas.height / 2)
		return
	}

	const { width, height, data } = clipboard.value
	const scale = 8 // Each pixel is 8x8 on preview
	canvas.width = width * scale
	canvas.height = height * scale

	// Clear canvas
	ctx.clearRect(0, 0, canvas.width, canvas.height)

	// Draw clipboard pixels
	let dataIndex = 0
	for (let row = 0; row < height; row++) {
		for (let col = 0; col < width; col++) {
			const color = data[dataIndex]

			if (color !== 'transparent') {
				ctx.fillStyle = color
				ctx.fillRect(col * scale, row * scale, scale, scale)
			}
			dataIndex++
		}
	}
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
	let newX = Math.max(0, Math.min(clickX - Math.floor(VIEWPORT_WIDTH.value / 2), canvasWidth.value - VIEWPORT_WIDTH.value))
	let newY = Math.max(0, Math.min(clickY - Math.floor(VIEWPORT_HEIGHT.value / 2), canvasHeight.value - VIEWPORT_HEIGHT.value))

	// Snap to viewport step grid
	newX = Math.round(newX / viewportStepX.value) * viewportStepX.value
	newY = Math.round(newY / viewportStepY.value) * viewportStepY.value

	// Clamp again after snapping to ensure we don't exceed bounds
	newX = Math.max(0, Math.min(newX, canvasWidth.value - VIEWPORT_WIDTH.value))
	newY = Math.max(0, Math.min(newY, canvasHeight.value - VIEWPORT_HEIGHT.value))

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
	let newX = Math.max(0, Math.min(clickX - Math.floor(VIEWPORT_WIDTH.value / 2), canvasWidth.value - VIEWPORT_WIDTH.value))
	let newY = Math.max(0, Math.min(clickY - Math.floor(VIEWPORT_HEIGHT.value / 2), canvasHeight.value - VIEWPORT_HEIGHT.value))

	// Snap to viewport step grid
	newX = Math.round(newX / viewportStepX.value) * viewportStepX.value
	newY = Math.round(newY / viewportStepY.value) * viewportStepY.value

	// Clamp again after snapping to ensure we don't exceed bounds
	newX = Math.max(0, Math.min(newX, canvasWidth.value - VIEWPORT_WIDTH.value))
	newY = Math.max(0, Math.min(newY, canvasHeight.value - VIEWPORT_HEIGHT.value))

	viewportX.value = newX
	viewportY.value = newY

	drawMinimap()
}

// Watch for changes and update minimap
watch([grid, viewportX, viewportY, canvasWidth, canvasHeight, VIEWPORT_WIDTH, VIEWPORT_HEIGHT], () => {
	nextTick(() => {
		drawMinimap()
	})
}, { deep: true })

// Watch for clipboard changes and update preview
watch(clipboard, () => {
	nextTick(() => {
		drawClipboardPreview()
	})
}, { deep: true })

// Sync viewport step sizes with viewport dimensions
watch(VIEWPORT_WIDTH, (newWidth) => {
	viewportStepX.value = newWidth
})

watch(VIEWPORT_HEIGHT, (newHeight) => {
	viewportStepY.value = newHeight
})

// Restart animation when speed changes
watch(animationSpeed, () => {
	if (isPlaying.value) {
		startAnimation()
	}
})

// Initial draw after component mount
nextTick(() => {
	drawMinimap()
	drawClipboardPreview()
})

// Store previous dimensions
let previousWidth = canvasWidth.value
let previousHeight = canvasHeight.value

// Accordion states for collapsible sections
const isMenuBarOpen = ref(true)
const isEmojiGeneratorOpen = ref(false)
const isToolbarOpen = ref(true)
const isColorPaletteOpen = ref(true)

// Move viewport
const moveViewport = (deltaX, deltaY) => {
	const stepX = viewportStepX.value
	const stepY = viewportStepY.value
	const newX = viewportX.value + (deltaX * stepX)
	const newY = viewportY.value + (deltaY * stepY)

	// Check bounds and clamp to valid range
	if (deltaX !== 0) {
		viewportX.value = Math.max(0, Math.min(newX, canvasWidth.value - VIEWPORT_WIDTH.value))
	}
	if (deltaY !== 0) {
		viewportY.value = Math.max(0, Math.min(newY, canvasHeight.value - VIEWPORT_HEIGHT.value))
	}
}

// Animation functions
const toggleAnimation = () => {
	if (isPlaying.value) {
		stopAnimation()
	} else {
		startAnimation()
	}
}

const startAnimation = () => {
	if (animationInterval) {
		clearInterval(animationInterval)
	}

	isPlaying.value = true
	animationInterval = setInterval(() => {
		// Move one step to the right
		const stepX = viewportStepX.value
		const newX = viewportX.value + stepX

		// If we reached the end, loop back to the start
		if (newX > canvasWidth.value - VIEWPORT_WIDTH.value) {
			viewportX.value = 0
		} else {
			viewportX.value = newX
		}
	}, animationSpeed.value)
}

const stopAnimation = () => {
	isPlaying.value = false
	if (animationInterval) {
		clearInterval(animationInterval)
		animationInterval = null
	}
}

// Stop animation when component unmounts
onUnmounted(() => {
	stopAnimation()
})

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
		<section class="menu-bar collapsible-section">
			<div class="section-header" @click="isMenuBarOpen = !isMenuBarOpen">
				<h3 class="section-title">{{ isMenuBarOpen ? '▼' : '▶' }} Menu</h3>
			</div>
			<div v-show="isMenuBarOpen" class="section-content">
				<button @click="clearCanvas" class="menu-btn">new</button>
				<button @click="loadImage" class="menu-btn">load</button>
				<button @click="downloadImage" class="menu-btn">download</button>
				<button @click="saveImage" class="menu-btn menu-btn--save">save</button>

				<div class="sprite-sheet-loader">
					<label for="sprite-sheet-select">Sprite:</label>
					<select
						id="sprite-sheet-select"
						v-model="selectedSpriteSheet"
						@change="loadSpriteSheet"
						class="sprite-select"
					>
						<option value="">-- Wähle Sprite-Sheet --</option>
						<option v-for="sheet in availableSpriteSheets" :key="sheet.name" :value="sheet.name">
							{{ sheet.name }}
						</option>
					</select>
				</div>

				<div class="image-name-container">
					<label for="image-name">Name:</label>
					<input
						id="image-name"
						type="text"
						v-model="imageName"
						class="image-name-input"
						placeholder="Bildname"
					/>
				</div>

				<!-- Canvas Size Controls -->
				<div class="canvas-size-controls">
					<span class="size-label">Canvas:</span>
					<label>
						W:
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
						H:
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

				<!-- Viewport Size Controls -->
				<div class="canvas-size-controls">
					<span class="size-label">Grid:</span>
					<label>
						W:
						<input
								type="number"
								v-model.number="VIEWPORT_WIDTH"
								min="8"
								max="64"
								class="size-input"
						/>
					</label>
					<label>
						H:
						<input
								type="number"
								v-model.number="VIEWPORT_HEIGHT"
								min="8"
								max="64"
								class="size-input"
						/>
					</label>
				</div>

				<!-- Grid Visibility Controls -->
				<div class="grid-controls">
					<span class="size-label">Raster:</span>
					<label class="radio-label">
						<input
							type="radio"
							:value="true"
							v-model="showGrid"
							class="radio-input"
						/>
						Sichtbar
					</label>
					<label class="radio-label">
						<input
							type="radio"
							:value="false"
							v-model="showGrid"
							class="radio-input"
						/>
						Subtil
					</label>
				</div>

				<!-- Background Raster Controls -->
				<div class="grid-controls">
					<span class="size-label">Hintergrund:</span>
					<label class="radio-label">
						<input
							type="checkbox"
							v-model="showBackgroundRaster"
							class="checkbox-input"
						/>
						Farbe
					</label>
					<label class="color-picker-label">
						<input
							type="color"
							v-model="backgroundRasterColor"
							:disabled="!showBackgroundRaster"
							class="color-picker-input"
						/>
					</label>
				</div>
			</div>
		</section>

		<!-- Emoji Generator -->
		<section class="collapsible-section">
			<div class="section-header" @click="isEmojiGeneratorOpen = !isEmojiGeneratorOpen">
				<h3 class="section-title">{{ isEmojiGeneratorOpen ? '▼' : '▶' }} Emoji Generator</h3>
			</div>
			<div v-show="isEmojiGeneratorOpen" class="section-content">
				<!-- Quick Emoji Buttons -->
				<div class="quick-emojis">
					<span class="size-label">Quick:</span>
					<button
						v-for="emoji in quickEmojis"
						:key="emoji"
						@click="generateQuickEmoji(emoji)"
						class="emoji-btn"
						:title="`Generate ${emoji}`"
					>
						{{ emoji }}
					</button>
				</div>

				<!-- Custom Emoji Input -->
				<div class="emoji-input-group">
					<label for="emoji-input">Emoji:</label>
					<input
						id="emoji-input"
						type="text"
						v-model="emojiInput"
						@keyup.enter="generateFromEmoji(emojiInput)"
						class="emoji-input"
						placeholder="💎 eingeben..."
						maxlength="2"
					/>
					<button
						@click="generateFromEmoji(emojiInput)"
						:disabled="!emojiInput"
						class="menu-btn"
					>
						Generate
					</button>
				</div>

				<!-- Size Selection -->
				<div class="emoji-size-controls">
					<label for="emoji-size">Größe:</label>
					<select id="emoji-size" v-model.number="emojiSize" class="size-select">
						<option :value="8">8x8</option>
						<option :value="16">16x16</option>
						<option :value="24">24x24</option>
						<option :value="32">32x32</option>
						<option :value="48">48x48</option>
						<option :value="64">64x64</option>
					</select>
				</div>
			</div>
		</section>

		<!-- Toolbar -->
		<section class="toolbar collapsible-section">
			<div class="section-header" @click="isToolbarOpen = !isToolbarOpen">
				<h3 class="section-title">{{ isToolbarOpen ? '▼' : '▶' }} Tools</h3>
			</div>
			<div v-show="isToolbarOpen" class="section-content toolbar-content">
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
					title="Auswählen"
				>
					🔳
				</button>
				<button
					@click="selectTool(TOOLS.MOVE)"
					:class="['tool-btn', { active: currentTool === TOOLS.MOVE }]"
					title="Verschieben"
				>
					✋
				</button>
				<button
					@click="selectTool(TOOLS.PASTE)"
					:class="['tool-btn', { active: currentTool === TOOLS.PASTE }]"
					title="Einfügen"
				>
					📋
				</button>

				<button @click="undo" :disabled="history.length === 0" class="menu-btn menu-btn--icon" title="Rückgängig">↶</button>
				<button @click="redo" :disabled="redoHistory.length === 0" class="menu-btn menu-btn--icon" title="Wiederherstellen">↷</button>

				<!-- Brush Settings -->
				<div class="brush-settings">
					<div class="brush-setting">
						<select id="brush-size" v-model.number="brushSize" class="brush-select">
							<option v-for="size in 16" :key="size" :value="size">{{ size }}px</option>
						</select>
					</div>
					<div class="brush-setting">
						<select id="brush-shape" v-model="brushShape" class="brush-select">
							<option value="square">■</option>
							<option value="circle">●</option>
							<option value="diamond">◆</option>
							<option value="horizontal">━</option>
							<option value="vertical">┃</option>
							<option value="cross">✛</option>
							<option value="plus">✚</option>
						</select>
					</div>
					<div class="theme-selector">
						<select id="theme-select" v-model="currentTheme" @change="changeTheme(currentTheme)" class="theme-select">
							<option v-for="(theme, key) in COLOR_THEMES" :key="key" :value="key">
								{{ theme.name }}
							</option>
						</select>
					</div>
				</div>

				<!-- Active Colors -->
				<div class="active-colors">
					<div class="color-display">
						<label class="color-box foreground color-picker-btn" :class="{ active: hasCustomColorSelected }">
							<input
									type="color"
									v-model="customColor"
									@input="openCustomColorPicker"
									class="color-input"
							/>
							<span class="color-box foreground" :style="{ backgroundColor: customColor }"></span>
						</label>
						<div
							class="color-box background"
							:style="{ backgroundColor: backgroundColor }"
							@click="swapColors"
							title="Hintergrund"
						></div>
					</div>
				</div>

				<!-- Pencil Opacity Slider (only visible when PENCIL is active) -->
				<div v-if="currentTool === TOOLS.PENCIL" class="pencil-opacity-container">
					<label for="pencil-opacity" class="pencil-opacity-label">
						Deckkraft: {{ pencilOpacity }}%
					</label>
					<input
							id="pencil-opacity"
							type="range"
							v-model.number="pencilOpacity"
							min="0"
							max="100"
							step="1"
							class="pencil-opacity-slider"
					/>
				</div>

				<!-- Fill Opacity Slider (only visible when FILL is active) -->
				<div v-if="currentTool === TOOLS.FILL" class="fill-opacity-container">
					<label for="fill-opacity" class="fill-opacity-label">
						Deckkraft: {{ fillOpacity }}%
					</label>
					<input
							id="fill-opacity"
							type="range"
							v-model.number="fillOpacity"
							min="0"
							max="100"
							step="1"
							class="fill-opacity-slider"
					/>
				</div>

				<!-- Eraser Strength Slider (only visible when ERASER is active) -->
				<div v-if="currentTool === TOOLS.ERASER" class="eraser-strength-container">
					<label for="eraser-strength" class="eraser-strength-label">
						Löschstärke: {{ eraserStrength }}%
					</label>
					<input
							id="eraser-strength"
							type="range"
							v-model.number="eraserStrength"
							min="0"
							max="100"
							step="1"
							class="eraser-strength-slider"
					/>
				</div>

				<!-- Clipboard Preview Section -->
				<div
					v-if="clipboard && (currentTool === TOOLS.SELECT || currentTool === TOOLS.MOVE || currentTool === TOOLS.PASTE)"
					class="clipboard-container"
				>
					<canvas
							ref="clipboardPreviewCanvas"
							class="clipboard-canvas"
					></canvas>
				</div>
				<div v-show="isColorPaletteOpen" class="color-palette-section section-content">
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
				<div
					class="canvas"
					:class="{
						'canvas--transparent': !showBackgroundRaster
					}"
					:style="{
						backgroundColor: showBackgroundRaster ? backgroundRasterColor : 'white'
					}"
				>
					<div
						v-for="row in VIEWPORT_HEIGHT"
						:key="`row-${row}`"
						class="pixel-row"
					>
						<div
							v-for="col in VIEWPORT_WIDTH"
							:key="`pixel-${row}-${col}`"
							class="pixel"
							:style="{
								backgroundColor: grid[getPixelIndex(viewportY + row - 1, viewportX + col - 1)],
								border: showGrid ? '1px solid rgba(0, 0, 0, 0.7)' : '1px solid rgba(0, 0, 0, 0.1)'
							}"
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

		<!-- Minimap Section -->
		<section class="minimap-section">
			<div class="viewport-navigation">
				<div class="viewport-step-controls">
					<label class="viewport-step-label">
						W:
						<input
								type="number"
								v-model.number="viewportStepX"
								min="1"
								max="64"
								class="size-input"
						/>
					</label>
					<label class="viewport-step-label">
						H:
						<input
								type="number"
								v-model.number="viewportStepY"
								min="1"
								max="64"
								class="size-input"
						/>
					</label>
				</div>
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
							:disabled="viewportY + VIEWPORT_HEIGHT >= canvasHeight"
							class="nav-btn"
							title="Runter"
					>
						↓
					</button>
					<button
							@click="moveViewport(1, 0)"
							:disabled="viewportX + VIEWPORT_WIDTH >= canvasWidth"
							class="nav-btn"
							title="Rechts"
					>
						→
					</button>
				</div>
			</div>

			<!-- Animation Controls -->
			<div class="animation-controls">
				<label class="viewport-step-label">
					Speed:
					<input
							type="number"
							v-model.number="animationSpeed"
							min="50"
							max="5000"
							step="50"
							class="size-input"
					/>
					<span class="speed-unit">ms</span>
				</label>
				<button
						@click="toggleAnimation"
						:class="['play-btn', { playing: isPlaying }]"
						:title="isPlaying ? 'Pause Animation' : 'Play Animation'"
				>
					{{ isPlaying ? '⏸' : '▶' }}
				</button>
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
	</main>
</template>

<style lang="scss" scoped>
.content {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	padding-bottom: var(--space-6);
}

// Collapsible Section
.collapsible-section {
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	overflow: hidden;
}

.section-header {
	padding: var(--space-2);
	cursor: pointer;
	user-select: none;
	background-color: var(--bg-secondary);
	transition: all 0.2s;

	&:hover {
		background-color: var(--primary-color);

		.section-title {
			color: white;
		}
	}
}

.section-title {
	margin: 0;
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	transition: color 0.2s;
}

.section-content {
	display: flex;
	gap: var(--space-2);
	padding: var(--space-2);
	flex-wrap: wrap;
	align-items: center;
}

// Menu Bar
.menu-bar {
	.section-content {
		display: flex;
		gap: var(--space-2);
		flex-wrap: wrap;
		align-items: center;
	}
}

.sprite-sheet-loader {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);

	label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
		white-space: nowrap;
	}
}

.sprite-select {
	min-width: 150px;
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);
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

.image-name-container {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);

	label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
		white-space: nowrap;
	}
}

.image-name-input {
	min-width: 100px;
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);

	&:focus {
		outline: none;
		border-color: var(--primary-color);
	}
}

.canvas-size-controls {
	display: flex;
	gap: var(--space-1);
	align-items: center;

	.size-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-secondary);
		white-space: nowrap;
	}

	label {
		display: flex;
		align-items: center;
		gap: var(--space-1);
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
	}
}

.grid-controls {
	display: flex;
	gap: var(--space-2);
	align-items: center;
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);

	.size-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-secondary);
		white-space: nowrap;
	}
}

.radio-label {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	cursor: pointer;
	transition: color 0.2s;

	&:hover {
		color: var(--primary-color);
	}
}

.radio-input {
	cursor: pointer;
	width: 16px;
	height: 16px;
	accent-color: var(--primary-color);
}

.checkbox-input {
	cursor: pointer;
	width: 16px;
	height: 16px;
	accent-color: var(--primary-color);
}

.color-picker-label {
	display: flex;
	align-items: center;
	cursor: pointer;
}

.color-picker-input {
	cursor: pointer;
	width: 40px;
	height: 28px;
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	background-color: transparent;
	transition: all 0.2s;

	&:hover:not(:disabled) {
		border-color: var(--primary-color);
		transform: scale(1.05);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&:focus {
		outline: none;
		border-color: var(--primary-color);
	}
}

// Emoji Generator Styles
.quick-emojis {
	display: flex;
	gap: var(--space-1);
	align-items: center;
	flex-wrap: wrap;
	width: 100%;

	.size-label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-secondary);
		white-space: nowrap;
	}
}

.emoji-btn {
	width: 40px;
	height: 40px;
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
		transform: scale(1.1);
		box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
	}

	&:active {
		transform: scale(0.95);
	}
}

.emoji-input-group {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);

	label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
		white-space: nowrap;
	}
}

.emoji-input {
	width: 170px;
	padding: var(--space-2);
	background-color: white;
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-size: 24px;
	text-align: center;
	font-family: "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif;

	&:focus {
		outline: none;
		border-color: var(--primary-color);
	}

	&::placeholder {
		font-size: var(--font-size-sm);
	}
}

.emoji-size-controls {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);

	label {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
		white-space: nowrap;
	}
}

.size-select {
	min-width: 80px;
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);
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

.viewport-navigation {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: var(--space-2);
}

.viewport-step-controls {
	display: flex;
	gap: var(--space-1);
	align-items: center;
}

.viewport-step-label {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);

	.speed-unit {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
	}
}

// Animation Controls
.animation-controls {
	display: flex;
	gap: var(--space-2);
	align-items: center;
}

.play-btn {
	width: 50px;
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

	&:hover {
		background-color: var(--primary-color);
		color: white;
		transform: scale(1.05);
	}

	&.playing {
		background-color: #F44336;
		color: white;
		border-color: #D32F2F;
		animation: pulse-animation 1.5s ease-in-out infinite;

		&:hover {
			background-color: #D32F2F;
		}
	}

	&:active {
		transform: scale(0.95);
	}
}

@keyframes pulse-animation {
	0%, 100% {
		box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7);
	}
	50% {
		box-shadow: 0 0 0 4px rgba(244, 67, 54, 0);
	}
}

// Clipboard Section
.clipboard-section {
	background-color: var(--card-bg);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.section-title-static {
	font-size: var(--font-size-md);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.clipboard-container {
	background-color: var(--bg-secondary);
	min-height: 80px;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: var(--space-2);
	border-radius: var(--border-radius-sm);
}

.clipboard-canvas {
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
	background-color: var(--bg-secondary);
	min-height: 100px;
	overflow: scroll;
	max-height: 324px;
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
	width: 50px;
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);

	&:focus {
		outline: none;
		border-color: var(--primary-color);
	}
}

.menu-btn {
	padding: var(--space-1) var(--space-3);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-sm);
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
		font-size: 20px;
		padding: var(--space-1) var(--space-2);
		min-width: 40px;
	}

	&--save {
		background-color: #4CAF50;
		color: white;
		border-color: #45a049;

		&:hover:not(:disabled) {
			background-color: #45a049;
			border-color: #3d8b40;
		}
	}
}

// Toolbar
.toolbar {
	.toolbar-content {
		display: flex;
		flex-direction: row;
		gap: var(--space-2);
		align-items: center;
		flex-wrap: wrap;
	}
}

.tool-btn {
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

// Pencil Opacity Slider
.pencil-opacity-container {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	width: 100%;
}

.pencil-opacity-label {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	text-align: center;
}

.pencil-opacity-slider {
	width: 100%;
	height: 8px;
	-webkit-appearance: none;
	appearance: none;
	background: linear-gradient(to right, rgba(100, 100, 100, 0.2) 0%, #2196F3 50%, #1976D2 100%);
	border-radius: 5px;
	outline: none;
	cursor: pointer;

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: var(--primary-color);
		border: 2px solid white;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		}

		&:active {
			transform: scale(1.1);
		}
	}

	&::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--primary-color);
		border: 2px solid white;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		}

		&:active {
			transform: scale(1.1);
		}
	}
}

// Fill Opacity Slider
.fill-opacity-container {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	width: 100%;
}

.fill-opacity-label {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	text-align: center;
}

.fill-opacity-slider {
	width: 100%;
	height: 8px;
	-webkit-appearance: none;
	appearance: none;
	background: linear-gradient(to right, rgba(100, 100, 100, 0.2) 0%, #66BB6A 50%, #4CAF50 100%);
	border-radius: 5px;
	outline: none;
	cursor: pointer;

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: var(--primary-color);
		border: 2px solid white;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		}

		&:active {
			transform: scale(1.1);
		}
	}

	&::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--primary-color);
		border: 2px solid white;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		}

		&:active {
			transform: scale(1.1);
		}
	}
}

// Eraser Strength Slider
.eraser-strength-container {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	width: 100%;
}

.eraser-strength-label {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	text-align: center;
}

.eraser-strength-slider {
	width: 100%;
	height: 8px;
	-webkit-appearance: none;
	appearance: none;
	background: linear-gradient(to right, #f44336 0%, #ff9800 50%, #4caf50 100%);
	border-radius: 5px;
	outline: none;
	cursor: pointer;

	&::-webkit-slider-thumb {
		-webkit-appearance: none;
		appearance: none;
		width: 20px;
		height: 20px;
		background: var(--primary-color);
		border: 2px solid white;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		}

		&:active {
			transform: scale(1.1);
		}
	}

	&::-moz-range-thumb {
		width: 20px;
		height: 20px;
		background: var(--primary-color);
		border: 2px solid white;
		border-radius: 50%;
		cursor: pointer;
		box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
		transition: all 0.2s;

		&:hover {
			transform: scale(1.2);
			box-shadow: 0 3px 6px rgba(0, 0, 0, 0.3);
		}

		&:active {
			transform: scale(1.1);
		}
	}
}

.brush-select {
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);
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

.color-display {
	position: relative;
	width: 40px;
	height: 40px;
	cursor: pointer;
}

.color-box {
	position: absolute;
	border: 2px solid var(--card-border);

	&.foreground {
		width: 28px;
		height: 28px;
		top: 0;
		left: 0;
		z-index: 2;
	}

	&.background {
		width: 28px;
		height: 28px;
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
	padding: var(--space-4) 0;
	touch-action: none; // Prevent scrolling/zooming during touch drawing
}

.canvas-wrapper {
	position: relative;
	display: inline-block;
}

.canvas {
	display: inline-block;
	background-color: white;
	border: 2px solid var(--card-border);
	user-select: none;

	&--transparent {
		background-size: 20px 20px;
		background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
		background-image:
				linear-gradient(45deg, #ccc 25%, transparent 25%),
				linear-gradient(-45deg, #ccc 25%, transparent 25%),
				linear-gradient(45deg, transparent 75%, #ccc 75%),
				linear-gradient(-45deg, transparent 75%, #ccc 75%);
	}
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
	padding: var(--space-1);
	background-color: var(--bg-secondary);
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	font-size: var(--font-size-xs);
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

	&.active .color-box {
		border: 2px solid var(--success-color);
		animation: pulse 1.5s ease-in-out infinite;
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
.color-palette-section {
	width: 100%;
}

.color-palette {
	display: grid;
	grid-template-columns: repeat(8, 1fr);
	gap: var(--space-2);
	width: 100%;

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
</style>
