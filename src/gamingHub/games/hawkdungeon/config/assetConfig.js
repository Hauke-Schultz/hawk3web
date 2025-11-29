// Central asset configuration for HawkDungeon
// This file defines which sprite sheets to use for different game elements
// Making it easy to switch to new versions or different sprite sets

/**
 * Asset configuration
 *
 * Each asset type (tiles, player, enemies, bosses, items, weapons) can have its own sprite sheet.
 * This makes it easy to update individual asset types without affecting others.
 *
 * To use a new sprite version:
 * 1. Export the sprite from HawkPaint to public/dungeon/{category}/
 * 2. Update the corresponding path in this config
 * 3. Update sprite coordinates in spriteConfig.js if needed
 *
 * Example:
 *   tiles: '/dungeon/tiles-v2.png'  // Updated to version 2
 */
export const assetConfig = {
  // Tile sprites for maps (floors, walls, doors, etc.)
  tiles: '/dungeon/tiles-v1.png',

  // Player character sprite
  player: '/dungeon/player-v1.png',

  // Enemy sprites (goblins, orcs, etc.)
  enemies: '/dungeon/spritesheet.png',

  // Boss sprites (large enemies)
  bosses: '/dungeon/spritesheet.png',

  // Item sprites (potions, keys, gems, etc.)
  items: '/dungeon/spritesheet.png',

  // Weapon sprites (swords, axes, spears, etc.)
  weapons: '/dungeon/spritesheet.png',

  // Fallback to old combined spritesheet for sprites not yet split
  combined: '/dungeon/spritesheet.png'
}

/**
 * Get the appropriate sprite sheet path for a given sprite type
 * @param {string} spriteType - The type of sprite (e.g., 'knight', 'goblin', 'floor1')
 * @returns {string} Path to the sprite sheet containing this sprite
 */
export function getSpriteSheetPath(spriteType) {
  // Map sprite types to asset categories
  const spriteTypeMap = {
    // Players
    knight: 'player',
    warrior: 'player',
    mage: 'player',

    // Enemies
    goblin: 'enemies',
    orc: 'enemies',
    skeleton: 'enemies',

    // Bosses
    boss: 'bosses',
    dragon: 'bosses',
    demon: 'bosses',

    // Items (handled separately in getTileCategory)
    // Weapons (handled separately in getTileCategory)
  }

  // Check if sprite type has a direct mapping
  if (spriteTypeMap[spriteType]) {
    return assetConfig[spriteTypeMap[spriteType]]
  }

  // Default to combined spritesheet or tiles
  return assetConfig.combined || assetConfig.tiles
}

/**
 * Get the asset category for a tile/item/weapon
 * Used by the sprite manager to determine which sprite sheet to load
 * @param {string} category - Category type ('tiles', 'items', 'weapons', etc.)
 * @returns {string} Path to the sprite sheet
 */
export function getTileCategory(category) {
  return assetConfig[category] || assetConfig.tiles
}

/**
 * Preload all sprite sheets
 * Returns an array of all sprite sheet paths that need to be loaded
 * @returns {string[]} Array of sprite sheet paths
 */
export function getAllSpriteSheets() {
  const sheets = []

  // Add all non-null sprite sheets
  Object.values(assetConfig).forEach(path => {
    if (path && !sheets.includes(path)) {
      sheets.push(path)
    }
  })

  return sheets
}

export default assetConfig
