// Sprite sheet configuration for HawkDungeon
// All sprites are based on 16x16 pixel tiles in the spritesheet
// But displayed at 4x scale (64x64) for better visibility

export const SPRITE_SIZE = 16 // Original sprite size in spritesheet
export const SPRITE_SCALE = 4 // Scale factor for display
export const TILE_SIZE = SPRITE_SIZE * SPRITE_SCALE // 64px display size

export const spriteConfig = {
  // Knight character (1 wide × 2 high = 16×32 px)
  knight: {
    width: 16,
    height: 32,
    walk: {
      frames: 8,
      frameWidth: 16,
      frameHeight: 32,
      frameDuration: 100, // milliseconds per frame
      startX: 128,
      startY: 74
    }
  },

  // Goblin enemy (1 wide × 1 high = 16×24 px)
  goblin: {
    width: 16,
    height: 24,
    walk: {
      frames: 8,
      frameWidth: 16,
      frameHeight: 24,
      frameDuration: 100,
      startX: 368,
      startY: 158
    }
  },

  // Orc enemy (1 wide × 1 high = 16×28 px)
  orc: {
    width: 16,
    height: 24,
    walk: {
      frames: 8,
      frameWidth: 16,
      frameHeight: 24,
      frameDuration: 100,
      startX: 368,
      startY: 182
    }
  },

  // Boss enemy (1 wide × 1 high = 16×16 px)
  boss: {
    width: 16,
    height: 16,
    walk: {
      frames: 8,
      frameWidth: 16,
      frameHeight: 16,
      frameDuration: 100,
      startX: 368,
      startY: 96
    }
  },

  // Weapons
  weapons: {
    sword: {
      width: 16,
      height: 28,
      x: 304,
      y: 68
    },
    axe: {
      width: 16,
      height: 16,
      x: 293,
      y: 34
    }
  },

  // Items (16×16 px each)
  items: {
    heart: {
      width: 16,
      height: 16,
      x: 288,
      y: 368
    },
    manaPotion: {
      width: 16,
      height: 16,
      x: 320,
      y: 224
    }
  },

  // Dungeon tiles (16×16 px each)
  dungeon: {
    floor: { width: 16, height: 16, x: 16, y: 64 },
    wall: { width: 16, height: 16, x: 16, y: 16 }
  }
}

export default spriteConfig