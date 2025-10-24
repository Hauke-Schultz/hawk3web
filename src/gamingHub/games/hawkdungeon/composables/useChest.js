// Chest system composable
import { ref } from 'vue'
import { chestConfig } from '../config/chestConfig'

export function useChest(items, levelLoader) {
  // Array to store all chests in the level
  const chests = ref([])

  // Chest ID counter
  let nextChestId = 0

  /**
   * Create a chest at a specific grid position
   * @param {number} gridX - Grid X position
   * @param {number} gridY - Grid Y position
   * @param {string|Array} chestTypeOrItems - Type of chest (basic, treasure, rich) OR array of items
   * @returns {object} The created chest object
   */
  const createChest = (gridX, gridY, chestTypeOrItems = 'basic') => {
    let config
    let customItems = null

    // Check if chestTypeOrItems is an array (custom items)
    if (Array.isArray(chestTypeOrItems)) {
      customItems = chestTypeOrItems
      config = {
        type: 'custom',
        loot: customItems.map(item => ({
          type: item.type,
          count: item.count,
          chance: 1.0 // 100% chance for custom items
        })),
        spriteClosed: 'chest_closed',
        spriteOpen: 'chest_open'
      }
    } else {
      // It's a chest type string
      config = chestConfig[chestTypeOrItems]
      if (!config) {
        console.error(`Unknown chest type: ${chestTypeOrItems}`)
        return null
      }
    }

    const chest = {
      id: `chest-${nextChestId++}`,
      gridX,
      gridY,
      type: customItems ? 'custom' : chestTypeOrItems,
      isOpen: false,
      config
    }

    chests.value.push(chest)
    return chest
  }

  /**
   * Open a chest and spawn items around it
   * @param {object} chest - The chest to open
   * @param {number} knightGridX - Knight's grid X position (for distance checking)
   * @param {number} knightGridY - Knight's grid Y position (for distance checking)
   */
  const openChest = (chest, knightGridX, knightGridY) => {
    if (chest.isOpen) return // Already opened

    // Check if knight is adjacent to chest (within 1 tile)
    const distanceX = Math.abs(chest.gridX - knightGridX)
    const distanceY = Math.abs(chest.gridY - knightGridY)
    const manhattanDistance = distanceX + distanceY

    if (manhattanDistance > 1) {
      console.log('Too far from chest to open')
      return // Too far
    }

    // Mark chest as open
    chest.isOpen = true

    // Spawn loot items around the chest
    spawnLootItems(chest)
  }

  /**
   * Spawn loot items around a chest
   * @param {object} chest - The chest to spawn loot from
   */
  const spawnLootItems = (chest) => {
    const lootTable = chest.config.loot
    const itemsToSpawn = []

    // Roll for each loot entry
    lootTable.forEach(lootEntry => {
      if (Math.random() <= lootEntry.chance) {
        // Add this many items
        for (let i = 0; i < lootEntry.count; i++) {
          itemsToSpawn.push(lootEntry.type)
        }
      }
    })

    console.log(`Chest opened! Spawning ${itemsToSpawn.length} items:`, itemsToSpawn)

    // Find free tiles around the chest
    const freePositions = findFreePositionsAroundChest(chest)

    // Spawn items on free tiles
    itemsToSpawn.forEach((itemType, index) => {
      if (index < freePositions.length) {
        const pos = freePositions[index]
        spawnItem(itemType, pos.x, pos.y)
      } else {
        console.warn('Not enough free tiles around chest for all items')
      }
    })
  }

  /**
   * Find free walkable tiles around a chest
   * @param {object} chest - The chest
   * @returns {Array} Array of {x, y} positions
   */
  const findFreePositionsAroundChest = (chest) => {
    const positions = []

    // Define all 8 surrounding tiles (including diagonals)
    const offsets = [
      { x: -1, y: 0 },  // Left
      { x: 1, y: 0 },   // Right
      { x: 0, y: -1 },  // Up
      { x: 0, y: 1 },   // Down
      { x: -1, y: -1 }, // Top-left
      { x: 1, y: -1 },  // Top-right
      { x: -1, y: 1 },  // Bottom-left
      { x: 1, y: 1 }    // Bottom-right
    ]

    offsets.forEach(offset => {
      const checkX = chest.gridX + offset.x
      const checkY = chest.gridY + offset.y

      // Check if position is walkable and not occupied
      if (levelLoader.isWalkable(checkX, checkY) && !isPositionOccupied(checkX, checkY)) {
        positions.push({ x: checkX, y: checkY })
      }
    })

    return positions
  }

  /**
   * Check if a position is occupied by an item
   * @param {number} x - Grid X
   * @param {number} y - Grid Y
   * @returns {boolean} True if occupied
   */
  const isPositionOccupied = (x, y) => {
    return items.value.some(item => item.gridX === x && item.gridY === y)
  }

  /**
   * Spawn an item at a specific position
   * @param {string} type - Item type (heart, manaPotion)
   * @param {number} gridX - Grid X position
   * @param {number} gridY - Grid Y position
   */
  const spawnItem = (type, gridX, gridY) => {
    const item = {
      id: `item-${Date.now()}-${Math.random()}`,
      type,
      gridX,
      gridY,
      spawnTime: Date.now(),
      lifetime: 60000 // 60 seconds
    }

    items.value.push(item)
    console.log(`Item spawned: ${type} at (${gridX}, ${gridY})`)
  }

  /**
   * Check if knight is on a chest and try to open it
   * @param {number} knightGridX - Knight's grid X
   * @param {number} knightGridY - Knight's grid Y
   */
  const checkChestInteraction = (knightGridX, knightGridY) => {
    chests.value.forEach(chest => {
      if (!chest.isOpen && chest.gridX === knightGridX && chest.gridY === knightGridY) {
        openChest(chest, knightGridX, knightGridY)
      }
    })
  }

  /**
   * Clear all chests (for level reset)
   */
  const clearChests = () => {
    chests.value = []
    nextChestId = 0
  }

  return {
    chests,
    createChest,
    openChest,
    checkChestInteraction,
    clearChests
  }
}

export default useChest