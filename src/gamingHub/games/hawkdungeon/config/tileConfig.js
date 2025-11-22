// Tile configuration for HawkDungeon
// Defines all tile types, their properties, and behaviors

/**
 * Tile configuration object
 * Each tile type can have the following properties:
 * - sprite: The sprite key from spriteConfig to use for rendering
 * - walkable: Boolean - whether the player/monsters can walk through this tile
 * - blockType: String - categorizes the tile's blocking behavior:
 *   - 'permanent': Cannot be changed or removed (walls, pillars)
 *   - 'interactive': Can change state between blocking/non-blocking (doors)
 *   - 'hazard': Walkable but deals damage (traps)
 * - hasState: Boolean - whether this tile can have different states (e.g., open/closed)
 * - states: Object - different states the tile can be in (if hasState is true)
 *   - Each state has:
 *     - sprite: The sprite to use for this state
 *     - walkable: Whether this tile is walkable in this state
 * - defaultState: String - the initial state for tiles with states
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
    walkable: false,
    blockType: 'permanent' // Cannot be changed or removed
  },

  // Pillar tile
  pillar: {
    sprite: 'K',
    walkable: false,
    blockType: 'permanent' // Cannot be changed or removed
  },

  // Mana Wall tile (animated)
  manaWall: {
    sprite: 'manaWall',
    walkable: false,
    blockType: 'permanent',
    animated: true
  },

  // Health Wall tile (animated)
  healthWall: {
    sprite: 'healthWall',
    walkable: false,
    blockType: 'permanent',
    animated: true
  },

  // Door tile - has states (closed/open)
  door: {
    hasState: true,
    defaultState: 'closed',
    blockType: 'interactive', // Can change state between blocking and non-blocking
    states: {
      closed: {
        sprite: 'D',
        walkable: false
      },
      open: {
        sprite: '.', // Open door looks like floor
        walkable: true
      }
    }
  },

  // Trap tile - has states (hidden/triggered)
  trap: {
    hasState: true,
    defaultState: 'hidden',
    blockType: 'hazard', // Walkable but deals damage
    states: {
      hidden: {
        sprite: '^', // Hidden trap (slightly visible)
        walkable: true,
        damage: 1 // Damage when stepped on
      },
      triggered: {
        sprite: 'T', // Triggered trap shows spikes
        walkable: true, // Player can walk over triggered trap
        damage: 1 // Still deals damage after triggered (visible spikes)
      }
    }
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

  // For stateful tiles, check the specific state
  if (config.hasState && state) {
    return config.states[state]?.walkable ?? false
  }

  // For non-stateful tiles, check the walkable property
  return config.walkable ?? false
}

/**
 * Get the sprite for a tile
 * @param {string} tileType - The tile type identifier
 * @param {string} state - The current state (for stateful tiles)
 * @returns {string|null} The sprite key from spriteConfig, or null if no sprite
 */
export const getTileSprite = (tileType, state = null) => {
  const config = getTileConfig(tileType)

  if (!config) return null

  // For stateful tiles, get the sprite from the specific state
  if (config.hasState && state) {
    return config.states[state]?.sprite ?? null
  }

  // For non-stateful tiles, return the sprite directly
  return config.sprite ?? null
}

/**
 * Get the default state for a tile type
 * @param {string} tileType - The tile type identifier
 * @returns {string|null} The default state, or null if tile has no states
 */
export const getTileDefaultState = (tileType) => {
  const config = getTileConfig(tileType)
  return config?.defaultState ?? null
}

/**
 * Get the block type for a tile type
 * @param {string} tileType - The tile type identifier
 * @returns {string|null} The block type ('permanent', 'interactive', 'hazard'), or null
 */
export const getTileBlockType = (tileType) => {
  const config = getTileConfig(tileType)
  return config?.blockType ?? null
}

/**
 * Check if a tile is permanently blocking (cannot be changed)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is permanently blocking
 */
export const isPermanentBlock = (tileType) => {
  return getTileBlockType(tileType) === 'permanent'
}

/**
 * Check if a tile is interactive (can change state)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is interactive
 */
export const isInteractiveTile = (tileType) => {
  return getTileBlockType(tileType) === 'interactive'
}

/**
 * Check if a tile is a hazard (walkable but deals damage)
 * @param {string} tileType - The tile type identifier
 * @returns {boolean} True if tile is a hazard
 */
export const isHazardTile = (tileType) => {
  return getTileBlockType(tileType) === 'hazard'
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
