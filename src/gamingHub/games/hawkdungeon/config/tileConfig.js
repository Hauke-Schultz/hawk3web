// Tile configuration for HawkDungeon
// Defines all tile types, their properties, and behaviors

/**
 * Tile configuration object
 * Each tile type can have the following properties:
 * - sprite: The sprite key from spriteConfig to use for rendering
 * - walkable: Boolean - whether the player/monsters can walk through this tile
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
    walkable: false
  },

  // Door tile - has states (closed/open)
  door: {
    hasState: true,
    defaultState: 'closed',
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
  'W': 'wall',       // Wall
  'D': 'door',       // Door

  // Traps
  '^': 'trap',       // Trap (hidden by default)

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

export default tileConfig
