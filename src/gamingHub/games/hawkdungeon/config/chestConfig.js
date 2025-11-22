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
  },

  // Gem chest with various gems
  gem: {
    type: 'gem',
    loot: [
      { type: 'ruby', count: 1, chance: 0.7 }, // 70% chance for 2 rubies
      { type: 'emerald', count: 1, chance: 0.7 }, // 70% chance for 2 emeralds
      { type: 'sapphire', count: 1, chance: 0.7 }, // 70% chance for 2 sapphires
      { type: 'diamond', count: 1, chance: 0.3 } // 30% chance for 1 diamond
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Diamond chest with precious items
  diamond_chest: {
    type: 'diamond_chest',
    loot: [
      { type: 'diamond', count: 1, chance: 1.0 }, // 100% chance for 3 diamonds
      { type: 'ruby', count: 1, chance: 0.9 }, // 50% chance for 1 ruby
      { type: 'emerald', count: 1, chance: 0.9 } // 50% chance for 1 emerald
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Wealthy chest with coins and gems
  wealthy: {
    type: 'wealthy',
    loot: [
      { type: 'coin', count: 10, chance: 1.0 }, // 100% chance for 10 coins
      { type: 'ruby', count: 1, chance: 0.6 }, // 60% chance for 1 ruby
      { type: 'emerald', count: 1, chance: 0.6 }, // 60% chance for 1 emerald
      { type: 'sapphire', count: 1, chance: 0.6 } // 60% chance for 1 sapphire
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  },

  // Coin chest with lots of coins
  coin: {
    type: 'coin',
    loot: [
      { type: 'coin', count: 20, chance: 1.0 } // 100% chance for 20 coins
    ],
    spriteClosed: 'chest_closed',
    spriteOpen: 'chest_open'
  }
}

export default chestConfig