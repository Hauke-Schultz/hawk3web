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
      x: 320,
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

  // Animated tiles (16×16 px each)
  animatedTiles: {
    manaFountain: {
      width: 16,
      height: 16,
      animation: {
        frames: 3,
        frameWidth: 16,
        frameHeight: 16,
        frameDuration: 200, // milliseconds per frame (slower animation)
        startX: 64,
        startY: 64
      }
    },
    healthFountain: {
      width: 16,
      height: 16,
      animation: {
        frames: 3,
        frameWidth: 16,
        frameHeight: 16,
        frameDuration: 200,
        startX: 64,
        startY: 32
      }
    },
    manaWall: {
      width: 16,
      height: 16,
      animation: {
        frames: 3,
        frameWidth: 16,
        frameHeight: 16,
        frameDuration: 200,
        startX: 64,
        startY: 48
      }
    },
    healthWall: {
      width: 16,
      height: 16,
      animation: {
        frames: 3,
        frameWidth: 16,
        frameHeight: 16,
        frameDuration: 200,
        startX: 64,
        startY: 16
      }
    }
  },

  // Dungeon tiles (16×16 px each)
  // Map characters are used as keys for easy mapping
  tiles: {
    // Floor variations
    '.': { width: 16, height: 16, x: 16, y: 64, name: 'floor1' },     // Floor type 1
    ',': { width: 16, height: 16, x: 32, y: 64, name: 'floor2' },     // Floor type 2
    ':': { width: 16, height: 16, x: 48, y: 64, name: 'floor3' },     // Floor type 3

    // Walls and doors
    'W': { width: 16, height: 16, x: 32, y: 16, name: 'wall' },       // Wall
    'K': { width: 16, height: 16, x: 96, y: 96, name: 'pillar' },     // Pillar
    'D': { width: 16, height: 16, x: 0, y: 48, name: 'door' },        // Door

    // Objects
    'C': { width: 16, height: 16, x: 304, y: 400, name: 'chest' },    // Chest (closed)

    // Traps
    '^': { width: 16, height: 16, x: 16, y: 192, name: 'trap_hidden' },     // Hidden trap
    'T': { width: 16, height: 16, x: 64, y: 192, name: 'trap_triggered' },  // Triggered trap (visible spikes)
  },

  // Under Layer decorations (rendered BELOW player/enemies)
  // These are transparent tiles that appear on the floor
  underLayerDecorations: {
    'b': { width: 16, height: 16, x: 288, y: 432, name: 'blood' },         // Blood (Blutfleck)
    's': { width: 16, height: 16, x: 288, y: 432, name: 'skull1' },        // Skull (Totenschädel)
    'o': { width: 16, height: 16, x: 272, y: 416, name: 'skull2' },        // Skull two
    'k': { width: 16, height: 16, x: 96, y: 112, name: 'pillar_bottom' },
    '.': null  // Transparent/empty
  },

  // Over Layer decorations (rendered ABOVE player/enemies)
  // These are transparent tiles like cobwebs, hanging decorations
  overLayerDecorations: {
    'w': { width: 16, height: 16, x: 304, y: 400, name: 'cobweb' },        // Cobweb (Spinnennetz)
    'a': { width: 16, height: 16, x: 64, y: 0, name: 'healthHead' },       // HealthHorns (Hörner)
    'b': { width: 16, height: 16, x: 80, y: 0, name: 'manaHead' },         // ManaHorns (Hörner)
    't': { width: 16, height: 16, x: 48, y: 0, name: 'wallTop' },          // WallTop (Mauer oben)
    'd': { width: 16, height: 16, x: 80, y: 160, name: 'spider1' },        // spider web more
    'f': { width: 16, height: 16, x: 96, y: 160, name: 'spider2' },        // spider web less
    'v': { width: 16, height: 16, x: 48, y: 144, name: 'vines1' },          // Vines (Ranken)
    'r': { width: 16, height: 16, x: 64, y: 144, name: 'vines2' },          // Vines (Ranken)
    'h': { width: 16, height: 16, x: 48, y: 128, name: 'hanging_deco' },   // Hanging decoration
    'l': { width: 16, height: 16, x: 64, y: 128, name: 'light_beam' },     // Light beam (Lichtstrahl)
    'n': { width: 16, height: 16, x: 96, y: 80, name: 'pillar_top' },
    '.': null  // Transparent/empty
  }
}

export default spriteConfig