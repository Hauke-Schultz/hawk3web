// Level loader and manager for HawkDungeon
import { ref, reactive } from 'vue'
import { levelConfig } from '../config/levelConfig'
import { getTileTypeFromChar, getTileConfig, getTileDefaultState, isTileWalkable, getTileSprite } from '../config/tileConfig'

export function useLevelLoader() {
  const currentLevel = ref(null)
  const levelData = reactive({
    tiles: [],
    walls: new Set(),
    floors: new Map(),
    tileTypes: new Map(), // Map of position -> tile type
    tileStates: new Map(), // Map of position -> current state (for stateful tiles)
    width: 0,
    height: 0,
    playerStart: { x: 0, y: 0 },
    spawns: {},
    chests: []
  })

  /**
   * Load a level from levelConfig
   * @param {number} levelNumber - The level number to load
   */
  const loadLevel = (levelNumber) => {
    const level = levelConfig[levelNumber]

    if (!level || !level.map) {
      console.error(`Level ${levelNumber} has no map data`)
      return createFallbackLevel()
    }

    currentLevel.value = level

    // Parse the level data from the map
    parseLevel(level.map)

    return level
  }

  /**
   * Parse level tiles and create data structures
   */
  const parseLevel = (level) => {
    levelData.tiles = level.tiles
    levelData.width = level.width
    levelData.height = level.height
    levelData.playerStart = level.playerStart

    // Clear previous data
    levelData.walls.clear()
    levelData.floors.clear()
    levelData.tileTypes.clear()
    levelData.tileStates.clear()
    levelData.chests = []

    // Parse tiles and collect 'C' positions
    const chestPositionsFromMap = []
    for (let y = 0; y < level.tiles.length; y++) {
      const row = level.tiles[y]
      for (let x = 0; x < row.length; x++) {
        const char = row[x]
        const key = `${x},${y}`

        // Get tile type from character using tileConfig
        const tileType = getTileTypeFromChar(char)
        const tileConf = getTileConfig(tileType)

        // Store tile type
        levelData.tileTypes.set(key, tileType)

        // Initialize state for stateful tiles
        if (tileConf.hasState) {
          const defaultState = getTileDefaultState(tileType)
          levelData.tileStates.set(key, defaultState)
        }

        // Determine if this is a wall or floor for backward compatibility
        if (tileType === 'wall') {
          levelData.walls.add(key)
        } else if (tileType !== 'empty') {
          // Any non-empty, non-wall tile is considered "floor" for rendering
          levelData.floors.set(key, tileType)
        }

        // Handle special markers
        if (char === 'C') {
          // Chest marker
          chestPositionsFromMap.push({ x, y })
        }
      }
    }

    // If level has a chests array with items defined, use it
    if (level.chests && level.chests.length > 0) {
      level.chests.forEach(chestConfig => {
        levelData.chests.push({
          gridX: chestConfig.x,
          gridY: chestConfig.y,
          items: chestConfig.items || []
        })
      })
    } else {
      // Fallback: use positions from 'C' tiles with default type
      chestPositionsFromMap.forEach(pos => {
        levelData.chests.push({
          gridX: pos.x,
          gridY: pos.y,
          type: 'basic' // Default chest type
        })
      })
    }
  }

  /**
   * Seeded random number generator for consistent patterns
   */
  const seededRandom = (x, y) => {
    const seed = x * 73856093 ^ y * 19349663
    return Math.abs(Math.sin(seed) * 10000) | 0
  }

  /**
   * Check if a position has a wall
   */
  const isWall = (gridX, gridY) => {
    const key = `${gridX},${gridY}`
    return levelData.walls.has(key)
  }

  /**
   * Check if a position is walkable
   */
  const isWalkable = (gridX, gridY) => {
    // Check if within level bounds
    if (gridX < 0 || gridX >= levelData.width || gridY < 0 || gridY >= levelData.height) {
      return false
    }

    const key = `${gridX},${gridY}`
    const tileType = levelData.tileTypes.get(key)

    if (!tileType) return false

    // Get current state for stateful tiles
    const state = levelData.tileStates.get(key)

    // Use tileConfig to determine walkability
    return isTileWalkable(tileType, state)
  }

  /**
   * Get the floor tile type at a position
   */
  const getFloorTile = (gridX, gridY) => {
    const key = `${gridX},${gridY}`
    return levelData.floors.get(key) || 'empty'
  }

  /**
   * Get the tile type at a position
   */
  const getTileType = (gridX, gridY) => {
    const key = `${gridX},${gridY}`
    return levelData.tileTypes.get(key) || 'empty'
  }

  /**
   * Get the current state of a tile at a position
   */
  const getTileState = (gridX, gridY) => {
    const key = `${gridX},${gridY}`
    return levelData.tileStates.get(key) || null
  }

  /**
   * Set the state of a tile at a position
   */
  const setTileState = (gridX, gridY, state) => {
    const key = `${gridX},${gridY}`
    const tileType = levelData.tileTypes.get(key)
    const tileConf = getTileConfig(tileType)

    // Only allow state changes for stateful tiles
    if (tileConf && tileConf.hasState && tileConf.states[state]) {
      levelData.tileStates.set(key, state)
      return true
    }

    return false
  }

  /**
   * Get the sprite to render for a tile at a position
   */
  const getTileSpriteAt = (gridX, gridY) => {
    const tileType = getTileType(gridX, gridY)
    const state = getTileState(gridX, gridY)
    return getTileSprite(tileType, state)
  }

  /**
   * Get all tiles in a visible area
   */
  const getVisibleTiles = (centerX, centerY, radiusX, radiusY) => {
    const tiles = {
      walls: [],
      floors: []
    }

    const minX = Math.max(0, centerX - radiusX)
    const maxX = Math.min(levelData.width - 1, centerX + radiusX)
    const minY = Math.max(0, centerY - radiusY)
    const maxY = Math.min(levelData.height - 1, centerY + radiusY)

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${y}`

        if (levelData.walls.has(key)) {
          tiles.walls.push({ x, y, type: 'wall' })
        } else if (levelData.floors.has(key)) {
          tiles.floors.push({ x, y, type: levelData.floors.get(key) })
        }
      }
    }

    return tiles
  }

  /**
   * Create a fallback level if loading fails
   */
  const createFallbackLevel = () => {
    return {
      level: 1,
      name: 'Fallback Level',
      width: 20,
      height: 15,
      playerStart: { x: 10, y: 7 },
      tiles: Array(15).fill('.'.repeat(20)),
      spawns: { goblin: [] },
      killGoal: 5
    }
  }

  return {
    currentLevel,
    levelData,
    loadLevel,
    isWall,
    isWalkable,
    getFloorTile,
    getVisibleTiles,
    getTileType,
    getTileState,
    setTileState,
    getTileSpriteAt
  }
}

export default useLevelLoader