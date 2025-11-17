// Sprite sheet configuration for HawkDungeon
// All sprites are based on 16x16 pixel tiles in the spritesheet
// But displayed at 4x scale (64x64) for better visibility

export const SPRITE_SIZE = 16 // Original sprite size in spritesheet
export const SPRITE_SCALE = 4 // Scale factor for display
export const TILE_SIZE = SPRITE_SIZE * SPRITE_SCALE // 64px display size

export const spriteConfig = {
  // Knight character (16×32 px)
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

  // Goblin enemy (16×24 px)
  goblin: {
    width: 16,
    height: 24,
    walk: {
      frames: 4,
      frameWidth: 16,
      frameHeight: 24,
      frameDuration: 100,
      startX: 368,
      startY: 158
    }
  },

  // Orc enemy (16×24 px)
  orc: {
    width: 16,
    height: 24,
    walk: {
      frames: 4,
      frameWidth: 16,
      frameHeight: 24,
      frameDuration: 100,
      startX: 368,
      startY: 182
    }
  },

  // Boss enemy (32×46 px)
  boss: {
    width: 32,
    height: 46,
    walk: {
      frames: 4,
      frameWidth: 32,
      frameHeight: 46,
      frameDuration: 100,
      startX: 16,
      startY: 337
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
      height: 28,
      x: 336,
      y: 68
    },
    spear: {
      width: 16,
      height: 32,
      x: 304,
      y: 160
    }
  },

  // Items (16×16 px each)
  items: {
    health: {
      width: 16,
      height: 16,
      x: 288,
      y: 352
    },
    healthPotion: {
      width: 16,
      height: 16,
      x: 288,
      y: 336
    },
    mana: {
      width: 16,
      height: 16,
      x: 304,
      y: 352
    },
    manaPotion: {
      width: 16,
      height: 16,
      x: 304,
      y: 336
    },
    key: {
      width: 16,
      height: 16,
      x: 288,
      y: 304
    },
    chest_closed: {
      width: 16,
      height: 16,
      x: 304,
      y: 400
    },
    chest_open: {
      width: 16,
      height: 16,
      x: 336,
      y: 400
    }
  },

  // Dungeon tiles (16×16 px each)
  dungeon: {
    floor: { width: 16, height: 16, x: 16, y: 64 },
    door: { width: 16, height: 16, x: 0, y: 48 },
    wall: { width: 16, height: 16, x: 32 , y: 16 },
  }
}

export default spriteConfig