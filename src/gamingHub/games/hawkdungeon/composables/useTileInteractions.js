// Tile interaction system for HawkDungeon
// Handles player interactions with interactive tiles (doors, traps, etc.)

/**
 * Composable for handling tile interactions
 * @param {object} levelLoader - The level loader instance
 * @param {object} gameState - The game state object
 */
export function useTileInteractions(levelLoader, gameState) {
  /**
   * Check if player has a key in inventory
   * @returns {boolean} True if player has at least one key
   */
  const hasKey = () => {
    if (!gameState.inventory) return false
    return gameState.inventory.some(item => item.type === 'key')
  }

  /**
   * Use a key from inventory (remove one key)
   * @returns {boolean} True if key was used, false if no key available
   */
  const useKey = () => {
    if (!gameState.inventory) return false
    const keyIndex = gameState.inventory.findIndex(item => item.type === 'key')
    if (keyIndex !== -1) {
      gameState.inventory.splice(keyIndex, 1)
      return true
    }
    return false
  }

  /**
   * Toggle a door between open and closed states
   * @param {number} gridX - X position of the door
   * @param {number} gridY - Y position of the door
   * @param {boolean} requireKey - Whether a key is required to open the door
   * @returns {object} Result object with success status and message
   */
  const toggleDoor = (gridX, gridY, requireKey = true) => {
    const tileType = levelLoader.getTileType(gridX, gridY)

    if (tileType !== 'door') {
      return { success: false, message: 'Not a door' }
    }

    const currentState = levelLoader.getTileState(gridX, gridY)

    // If door is closed and we're trying to open it
    if (currentState === 'closed') {
      // Check if key is required and if player has one
      if (requireKey && !hasKey()) {
        return { success: false, message: 'You need a key to open this door!' }
      }

      // Use the key if required
      if (requireKey) {
        useKey()
      }

      // Open the door
      const success = levelLoader.setTileState(gridX, gridY, 'open')
      return { success, message: success ? '🔑 Door unlocked and opened!' : 'Failed to open door' }
    } else {
      // Close the door (no key needed to close)
      const success = levelLoader.setTileState(gridX, gridY, 'closed')
      return { success, message: success ? 'Door closed!' : 'Failed to close door' }
    }
  }

  /**
   * Open a door
   * @param {number} gridX - X position of the door
   * @param {number} gridY - Y position of the door
   * @param {boolean} requireKey - Whether a key is required to open the door
   * @returns {object} Result object with success status and message
   */
  const openDoor = (gridX, gridY, requireKey = true) => {
    const tileType = levelLoader.getTileType(gridX, gridY)

    if (tileType !== 'door') {
      return { success: false, message: 'Not a door' }
    }

    const currentState = levelLoader.getTileState(gridX, gridY)

    // Check if already open
    if (currentState === 'open') {
      return { success: true, message: 'Door is already open' }
    }

    // Check if key is required and if player has one
    if (requireKey && !hasKey()) {
      return { success: false, message: 'You need a key to open this door!' }
    }

    // Use the key if required
    if (requireKey) {
      useKey()
    }

    const success = levelLoader.setTileState(gridX, gridY, 'open')
    return { success, message: success ? '🔑 Door unlocked and opened!' : 'Failed to open door' }
  }

  /**
   * Close a door
   * @param {number} gridX - X position of the door
   * @param {number} gridY - Y position of the door
   * @returns {object} Result object with success status and message
   */
  const closeDoor = (gridX, gridY) => {
    const tileType = levelLoader.getTileType(gridX, gridY)

    if (tileType !== 'door') {
      return { success: false, message: 'Not a door' }
    }

    const success = levelLoader.setTileState(gridX, gridY, 'closed')
    return { success, message: success ? 'Door closed!' : 'Failed to close door' }
  }

  /**
   * Check if there's a door adjacent to the player
   * @param {number} playerX - Player's X position
   * @param {number} playerY - Player's Y position
   * @returns {object|null} Door position if found, null otherwise
   */
  const findAdjacentDoor = (playerX, playerY) => {
    const adjacentPositions = [
      { x: playerX - 1, y: playerY }, // Left
      { x: playerX + 1, y: playerY }, // Right
      { x: playerX, y: playerY - 1 }, // Up
      { x: playerX, y: playerY + 1 }  // Down
    ]

    for (const pos of adjacentPositions) {
      const tileType = levelLoader.getTileType(pos.x, pos.y)
      if (tileType === 'door') {
        return {
          gridX: pos.x,
          gridY: pos.y,
          state: levelLoader.getTileState(pos.x, pos.y)
        }
      }
    }

    return null
  }

  /**
   * Interact with a tile at a position (open door, trigger trap, etc.)
   * @param {number} gridX - X position of the tile
   * @param {number} gridY - Y position of the tile
   * @param {boolean} requireKey - Whether a key is required for doors
   * @returns {object} Result of the interaction
   */
  const interactWithTile = (gridX, gridY, requireKey = true) => {
    const tileType = levelLoader.getTileType(gridX, gridY)

    switch (tileType) {
      case 'door':
        const result = toggleDoor(gridX, gridY, requireKey)
        const currentState = levelLoader.getTileState(gridX, gridY)
        return {
          success: result.success,
          tileType: 'door',
          action: result.success ? (currentState === 'open' ? 'opened' : 'closed') : 'none',
          message: result.message
        }

      // Add more tile types here in the future
      // case 'trap':
      //   ...

      default:
        return {
          success: false,
          tileType: tileType,
          action: 'none',
          message: 'Nothing to interact with'
        }
    }
  }

  /**
   * Auto-interact with adjacent tiles (for use with an action button)
   * @param {number} playerX - Player's X position
   * @param {number} playerY - Player's Y position
   * @param {string} direction - Direction the player is facing
   * @param {boolean} requireKey - Whether a key is required for doors
   * @returns {object} Result of the interaction
   */
  const autoInteract = (playerX, playerY, direction, requireKey = true) => {
    // Calculate position in front of player
    let targetX = playerX
    let targetY = playerY

    switch (direction) {
      case 'up':
        targetY -= 1
        break
      case 'down':
        targetY += 1
        break
      case 'left':
        targetX -= 1
        break
      case 'right':
        targetX += 1
        break
    }

    return interactWithTile(targetX, targetY, requireKey)
  }

  /**
   * Open all doors in the level (for boss phase or level completion)
   * @param {boolean} requireKey - Whether keys are required (false for events like boss phase)
   */
  const openAllDoors = (requireKey = false) => {
    const { levelData } = levelLoader
    let doorsOpened = 0

    // Iterate through all tile positions
    levelData.tileTypes.forEach((tileType, key) => {
      if (tileType === 'door') {
        const [x, y] = key.split(',').map(Number)
        const result = openDoor(x, y, requireKey)
        if (result.success) {
          doorsOpened++
        }
      }
    })

    return doorsOpened
  }

  return {
    hasKey,
    useKey,
    toggleDoor,
    openDoor,
    closeDoor,
    findAdjacentDoor,
    interactWithTile,
    autoInteract,
    openAllDoors
  }
}

export default useTileInteractions
