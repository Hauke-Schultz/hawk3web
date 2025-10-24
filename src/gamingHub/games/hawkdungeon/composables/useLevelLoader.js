// Level loader and manager for HawkDungeon
import { ref, reactive } from 'vue'
import { levelConfig } from '../config/levelConfig'

export function useLevelLoader() {
  const currentLevel = ref(null)
  const levelData = reactive({
    tiles: [],
    walls: new Set(),
    floors: new Map(),
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
    levelData.spawns = level.spawns || {}

    // Clear previous data
    levelData.walls.clear()
    levelData.floors.clear()
    levelData.chests = []

    // Parse tiles
    for (let y = 0; y < level.tiles.length; y++) {
      const row = level.tiles[y]
      for (let x = 0; x < row.length; x++) {
        const tile = row[x]
        const key = `${x},${y}`

        switch (tile) {
          case 'W':
            levelData.walls.add(key)
            break
          case '.':
            levelData.floors.set(key, 'floor')
            break
          case 'D':
            // Door (currently treated as walkable)
            levelData.floors.set(key, 'floor')
            break
          case 'G':
            // Goblin spawn marker (floor underneath)
            levelData.floors.set(key, 'floor')
            break
          case 'P':
            // Player start marker (floor underneath)
            levelData.floors.set(key, 'floor')
            break
          case 'C':
            // Chest marker (floor underneath)
            levelData.floors.set(key, 'floor')
            levelData.chests.push({
              gridX: x,
              gridY: y,
              type: 'basic' // Default chest type, can be customized
            })
            break
        }
      }
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

    // Check if it's not a wall
    return !isWall(gridX, gridY)
  }

  /**
   * Get the floor tile type at a position
   */
  const getFloorTile = (gridX, gridY) => {
    const key = `${gridX},${gridY}`
    return levelData.floors.get(key) || 'floor'
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
    getVisibleTiles
  }
}

export default useLevelLoader