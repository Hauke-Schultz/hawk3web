// Tile configuration for HawkDungeon
// Defines all tile types, their properties, and behaviors

import { spriteConfig } from './spriteConfig.js'

/**
 * Tile configuration object
 * Each tile type can have the following properties:
 * - sprite: The sprite key from spriteConfig to use for rendering
 * - walkable: Boolean - whether the player/monsters can walk through this tile
 *
 * Note: Tile types (barrier, interactive, hazard, etc.) and states are now
 * centrally defined in spriteConfig.js for better extensibility:
 * - Tile types can be accessed via getTileSpriteType() function
 * - Tile states are defined in the sprite's 'states' property
 * - Use tileHasStates(), getTileStates(), getTileState() to work with states
 * - Use getTileDamage() to get damage values for hazard tiles
 */
export const tileConfig = {
  // Empty/void tile
  empty: {
    sprite: null,
    walkable: false
  },

  // Basic floor tile (fallback)
  floor: {
    sprite: '.',
    walkable: true
  },

  // Floor variations
  floor1: {
    sprite: '.',
    walkable: true
  },

  floor2: {
    sprite: ',',
    walkable: true
  },

  floor3: {
    sprite: ':',
    walkable: true
  },

  // Wall tile
  wall: {
    sprite: 'W',
    walkable: false
  },

  // Pillar tile
  pillar: {
    sprite: 'K',
    walkable: false
  },

  // Mana Wall tile (animated)
  manaWall: {
    sprite: 'manaWall',
    walkable: false,
    animated: true
  },

  // Health Wall tile (animated)
  healthWall: {
    sprite: 'healthWall',
    walkable: false,
    animated: true
  },

  // Door tile - states defined in spriteConfig.js
  door: {
    sprite: 'D'
  },

  // Trap tile - states defined in spriteConfig.js
  trap: {
    sprite: '^'
  },

  // Mana Fountain - animated, restores mana
  manaFountain: {
    sprite: 'manaFountain', // Animated sprite
    walkable: true,
    animated: true,
    restoresMana: true, // Special property
    manaRestore: 'full' // Restores full mana
  },

  // Health Fountain - animated, restores health
  healthFountain: {
    sprite: 'healthFountain', // Animated sprite
    walkable: true,
    animated: true,
    restoresHealth: true, // Special property
    healthRestore: 'full' // Restores full health
  },

  // Add more tile types here as needed
  // Example for future expansion:
  //
  // water: {
  //   sprite: 'water',
  //   walkable: false
  // },
  //
  // bridge: {
  //   sprite: 'bridge',
  //   walkable: true
  // }
}

/**
 * Mapping of level map characters to tile types
 * This allows the level designer to use simple characters in the map string
 */
export const tileCharacterMap = {
  // Floor variations
  '.': 'floor1',     // Floor type 1
  ',': 'floor2',     // Floor type 2
  ':': 'floor3',     // Floor type 3

  // Walls and doors
  'W': 'wall',         // Wall
  'K': 'pillar',       // Pillar (permanent blocking)
  'A': 'manaWall',     // Mana Wall (animated)
  'B': 'healthWall',   // Health Wall (animated)
  'D': 'door',         // Door

  // Traps
  '^': 'trap',       // Trap (hidden by default)

  // Fountains
  'M': 'manaFountain',    // Mana fountain (restores mana)
  'Q': 'manaFountain',    // Mana fountain (alternative mapping)
  'H': 'healthFountain',  // Health fountain (restores health)

  // Special markers (render as floor underneath)
  'C': 'floor1',     // Chest (floor underneath, chest is rendered separately)
  'P': 'floor1',     // Player start (floor underneath)
  'G': 'floor1',     // Goblin spawn (floor underneath)

  // Empty space
  ' ': 'empty',      // Empty/void

  // Add more character mappings here as needed
  // Example:
  // '~': 'water',
  // '=': 'bridge',
}

/**
 * Get tile configuration for a tile type
 * @param {string} tileType - The tile type identifier
 * @returns {object} The tile configuration
 */
export const getTileConfig = (tileType) => {
  return tileConfig[tileType] || tileConfig.empty
}

/**
 * Get tile type from a map character
 * @param {string} char - The character from the map
 * @returns {string} The tile type
 */
export const getTileTypeFromChar = (char) => {
  return tileCharacterMap[char] || 'empty'
}

/**
 * Check if a tile type is walkable
 * @param {string} tileType - The tile type identifier
 * @param {string} state - The current state (for stateful tiles)
 * @returns {boolean} Whether the tile is walkable
 */
export const isTileWalkable = (tileType, state = null) => {
  const config = getTileConfig(tileType)

  if (!config) return false

  // Check if tile has states defined in spriteConfig
  if (state && tileHasStates(tileType)) {
    const stateConfig = getTileState(tileType, state)
    if (stateConfig && stateConfig.walkable !== undefined) {
      return stateConfig.walkable
    }
  }

  // For non-stateful tiles, check the walkable property in tileConfig
  return config.walkable ?? false
}

/**
 * Resolve a sprite reference (could be a string key or coordinates object)
 * @param {string|object} sprite - The sprite (string key like '.' or object like {x: 0, y: 48})
 * @returns {string|object} Resolved sprite (string key or coordinates object)
 */
const resolveSpriteReference = (sprite) => {
  // If it's an object with coordinates, return it as-is
  if (typeof sprite === 'object' && sprite !== null && sprite.x !== undefined && sprite.y !== undefined) {
    return sprite
  }

  // If it's a string, it might be a reference to another tile
  // Check if we can find it in spriteConfig
  if (typeof sprite === 'string') {
    const spriteDefinition = getSpriteDefinition(sprite)
    if (spriteDefinition) {
      // Return the string key so it can be looked up during rendering
      return sprite
    }
  }

  return sprite
}

/**
 * Get the sprite for a tile
 * @param {string} tileType - The tile type identifier
 * @param {string} state - The current state (for stateful tiles)
 * @returns {string|object|null} The sprite key from spriteConfig, coordinates {x, y}, or null if no sprite
 */
export const getTileSprite = (tileType, state = null) => {
  const config = getTileConfig(tileType)

  if (!config) return null

  // Check if tile has states defined in spriteConfig
  if (state && tileHasStates(tileType)) {
    const stateConfig = getTileState(tileType, state)
    if (stateConfig && stateConfig.sprite) {
      return resolveSpriteReference(stateConfig.sprite)
    }
  }

  // For non-stateful tiles, return the sprite directly
  return config.sprite ?? null
}

/**
 * Get the sprite definition from spriteConfig
 * @param {string} spriteKey - The sprite key (can be a tile character or animated sprite name)
 * @returns {object|null} The sprite definition, or null
 */
export const getSpriteDefinition = (spriteKey) => {
  // Check in tiles
  if (spriteConfig.tiles[spriteKey]) {
    return spriteConfig.tiles[spriteKey]
  }

  // Check in animated tiles
  if (spriteConfig.animatedTiles[spriteKey]) {
    return spriteConfig.animatedTiles[spriteKey]
  }

  return null
}

/**
 * Check if a sprite has states defined in spriteConfig
 * @param {string} spriteKey - The sprite key
 * @returns {boolean} True if sprite has states
 */
export const spriteHasStates = (spriteKey) => {
  const sprite = getSpriteDefinition(spriteKey)
  return !!(sprite?.states)
}

/**
 * Get the default state for a sprite from spriteConfig
 * @param {string} spriteKey - The sprite key
 * @returns {string|null} The default state, or null if no states
 */
export const getSpriteDefaultState = (spriteKey) => {
  const sprite = getSpriteDefinition(spriteKey)
  return sprite?.defaultState ?? null
}

/**
 * Get all states for a sprite from spriteConfig
 * @param {string} spriteKey - The sprite key
 * @returns {object|null} The states object, or null if no states
 */
export const getSpriteStates = (spriteKey) => {
  const sprite = getSpriteDefinition(spriteKey)
  return sprite?.states ?? null
}

/**
 * Get a specific state definition for a sprite from spriteConfig
 * @param {string} spriteKey - The sprite key
 * @param {string} stateName - The state name
 * @returns {object|null} The state definition, or null
 */
export const getSpriteState = (spriteKey, stateName) => {
  const states = getSpriteStates(spriteKey)
  return states?.[stateName] ?? null
}

/**
 * Get the default state for a tile type
 * @param {string} tileType - The tile type identifier
 * @returns {string|null} The default state, or null if tile has no states
 */
export const getTileDefaultState = (tileType) => {
  const config = getTileConfig(tileType)
  if (!config?.sprite) return null

  // Check if sprite has states defined
  return getSpriteDefaultState(config.sprite)
}

/**
 * Check if a tile type has states
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile has states
 */
export const tileHasStates = (tileType) => {
  const config = getTileConfig(tileType)
  if (!config?.sprite) return false

  return spriteHasStates(config.sprite)
}

/**
 * Get all states for a tile type
 * @param {string} tileType - The tile type identifier
 * @returns {object|null} The states object from spriteConfig, or null
 */
export const getTileStates = (tileType) => {
  const config = getTileConfig(tileType)
  if (!config?.sprite) return null

  return getSpriteStates(config.sprite)
}

/**
 * Get a specific state for a tile type
 * @param {string} tileType - The tile type identifier
 * @param {string} stateName - The state name
 * @returns {object|null} The state definition, or null
 */
export const getTileState = (tileType, stateName) => {
  const config = getTileConfig(tileType)
  if (!config?.sprite) return null

  return getSpriteState(config.sprite, stateName)
}

/**
 * Get damage value for a tile in a specific state
 * @param {string} tileType - The tile type identifier
 * @param {string} stateName - The state name
 * @returns {number} The damage value, or 0 if none
 */
export const getTileDamage = (tileType, stateName = null) => {
  if (!stateName) return 0

  const stateConfig = getTileState(tileType, stateName)
  return stateConfig?.damage ?? 0
}

/**
 * Get the sprite type from spriteConfig for a sprite key
 * @param {string} spriteKey - The sprite key (can be a tile character or animated sprite name)
 * @returns {string|null} The sprite type ('barrier', 'interactive', 'hazard', 'floor', 'container'), or null
 */
export const getSpriteType = (spriteKey) => {
  // Check in tiles
  if (spriteConfig.tiles[spriteKey]) {
    return spriteConfig.tiles[spriteKey].type ?? null
  }

  // Check in animated tiles
  if (spriteConfig.animatedTiles[spriteKey]) {
    return spriteConfig.animatedTiles[spriteKey].type ?? null
  }

  return null
}

/**
 * Get the sprite-defined type for a tile (looks up the sprite and returns its type)
 * @param {string} tileType - The tile type identifier
 * @returns {string|null} The sprite type ('barrier', 'interactive', 'hazard', 'floor', 'container'), or null
 */
export const getTileSpriteType = (tileType) => {
  const config = getTileConfig(tileType)
  if (!config || !config.sprite) return null

  return getSpriteType(config.sprite)
}

/**
 * Check if a tile is a barrier (permanently blocking)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is a barrier
 */
export const isBarrierTile = (tileType) => {
  return getTileSpriteType(tileType) === 'barrier'
}

/**
 * Check if a tile is interactive (can change state or be interacted with)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is interactive
 */
export const isInteractiveTile = (tileType) => {
  return getTileSpriteType(tileType) === 'interactive'
}

/**
 * Check if a tile is a hazard (walkable but deals damage)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is a hazard
 */
export const isHazardTile = (tileType) => {
  return getTileSpriteType(tileType) === 'hazard'
}

/**
 * Check if a tile is a container (like chests)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is a container
 */
export const isContainerTile = (tileType) => {
  return getTileSpriteType(tileType) === 'container'
}

/**
 * Layer type enumeration
 */
export const LayerType = {
  MAIN: 'main',
  UNDER: 'under',
  OVER: 'over'
}

/**
 * Get all layers from a map configuration
 * @param {object} mapConfig - The map configuration from levelConfig
 * @returns {object} Object containing all layer arrays
 */
export const getMapLayers = (mapConfig) => {
  return {
    main: mapConfig.tiles || [],
    under: mapConfig.underLayer || [],
    over: mapConfig.overLayer || []
  }
}

/**
 * Get a tile character from a specific layer at coordinates
 * @param {object} mapConfig - The map configuration from levelConfig
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @param {string} layerType - The layer type (use LayerType enum)
 * @returns {string|null} The character at that position, or null if out of bounds
 */
export const getTileAtPosition = (mapConfig, x, y, layerType = LayerType.MAIN) => {
  let layer

  switch (layerType) {
    case LayerType.MAIN:
      layer = mapConfig.tiles
      break
    case LayerType.UNDER:
      layer = mapConfig.underLayer
      break
    case LayerType.OVER:
      layer = mapConfig.overLayer
      break
    default:
      return null
  }

  if (!layer || y < 0 || y >= layer.length) return null

  const row = layer[y]
  if (!row || x < 0 || x >= row.length) return null

  return row[x]
}

/**
 * Check if a layer has any decorations
 * @param {object} mapConfig - The map configuration from levelConfig
 * @param {string} layerType - The layer type to check
 * @returns {boolean} True if the layer exists and has decorations
 */
export const hasLayer = (mapConfig, layerType) => {
  switch (layerType) {
    case LayerType.UNDER:
      return !!mapConfig.underLayer
    case LayerType.OVER:
      return !!mapConfig.overLayer
    case LayerType.MAIN:
      return !!mapConfig.tiles
    default:
      return false
  }
}

export default tileConfig
