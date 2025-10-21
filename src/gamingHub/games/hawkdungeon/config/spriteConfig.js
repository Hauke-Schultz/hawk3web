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
      // Sprite sheet coordinates (will be updated when we map the actual spritesheet)
      startX: 0,
      startY: 0
    }
  },

  // Goblin enemy (1 wide × 2 high = 16×32 px)
  goblin: {
    width: 16,
    height: 32,
    walk: {
      frames: 8,
      frameWidth: 16,
      frameHeight: 32,
      frameDuration: 100,
      startX: 0,
      startY: 32
    }
  },

  // Boss enemy (2 wide × 2 high = 32×32 px)
  boss: {
    width: 32,
    height: 32,
    walk: {
      frames: 8,
      frameWidth: 32,
      frameHeight: 32,
      frameDuration: 100,
      startX: 0,
      startY: 64
    }
  },

  // Weapons (1 tile = 16×16 px)
  weapons: {
    sword: {
      width: 16,
      height: 16,
      x: 128,
      y: 0
    },
    axe: {
      width: 16,
      height: 16,
      x: 144,
      y: 0
    }
  },

  // Items (16×16 px each)
  items: {
    heart: {
      width: 16,
      height: 16,
      x: 128,
      y: 16
    },
    manaPotion: {
      width: 16,
      height: 16,
      x: 144,
      y: 16
    }
  },

  // Dungeon tiles (16×16 px each)
  dungeon: {
    floor: {
      width: 16,
      height: 16,
      x: 160,
      y: 0
    },
    wall: {
      width: 16,
      height: 16,
      x: 176,
      y: 0
    }
  }
}

export default spriteConfig