// Chest configuration for HawkDungeon
// Defines chest types, loot tables, and spawn behavior

export const chestConfig = {
  // Basic chest with health restore
  basic: {
    type: 'basic',
    loot: [
      { type: 'health', count: 3, chance: 1.0 } // 100% chance to drop 3 health (restore only)
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Treasure chest with multiple item types
  treasure: {
    type: 'treasure',
    loot: [
      { type: 'health', count: 2, chance: 0.8 }, // 80% chance for 2 health
      { type: 'mana', count: 1, chance: 0.5 } // 50% chance for 1 mana
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Rich chest with many items
  rich: {
    type: 'rich',
    loot: [
      { type: 'health', count: 5, chance: 1.0 }, // 100% chance for 5 health
      { type: 'mana', count: 2, chance: 0.7 } // 70% chance for 2 mana
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Epic chest with permanent upgrades
  epic: {
    type: 'epic',
    loot: [
      { type: 'healthPotion', count: 1, chance: 1.0 }, // 100% chance for 1 health potion (permanent max health +1)
      { type: 'manaPotion', count: 1, chance: 1.0 }, // 100% chance for 1 mana potion (permanent max mana +1)
      { type: 'health', count: 2, chance: 1.0 } // 100% chance for 2 health (restore)
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  }
}

export default chestConfig