// Chest configuration for HawkDungeon
// Defines chest types, loot tables, and spawn behavior

export const chestConfig = {
  // Basic chest with hearts
  basic: {
    type: 'basic',
    loot: [
      { type: 'heart', count: 3, chance: 1.0 } // 100% chance to drop 3 hearts
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Treasure chest with multiple item types
  treasure: {
    type: 'treasure',
    loot: [
      { type: 'heart', count: 2, chance: 0.8 }, // 80% chance for 2 hearts
      { type: 'manaPotion', count: 1, chance: 0.5 } // 50% chance for 1 mana potion
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Rich chest with many items
  rich: {
    type: 'rich',
    loot: [
      { type: 'heart', count: 5, chance: 1.0 }, // 100% chance for 5 hearts
      { type: 'manaPotion', count: 2, chance: 0.7 } // 70% chance for 2 mana potions
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  }
}

export default chestConfig