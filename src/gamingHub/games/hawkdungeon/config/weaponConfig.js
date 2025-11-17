// Weapon configuration for HawkDungeon
// attackPattern: Array of {dx, dy} offsets from player position for each direction
// dx/dy are relative grid positions (e.g., {dx: 1, dy: 0} means 1 tile to the right)

export const weaponConfig = {
  sword: {
    name: 'Sword',
    damage: 1,
    cooldown: 0.5, // Seconds
    icon: '⚔️',
    // Normal attack: 1 tile in direction + 1 tile above + 1 tile below (3 tiles total)
    attackPattern: {
      up: [
        { dx: 0, dy: -1 },  // forward (up)
        { dx: -1, dy: -1 }, // left diagonal
        { dx: 1, dy: -1 }   // right diagonal
      ],
      down: [
        { dx: 0, dy: 1 },   // forward (down)
        { dx: -1, dy: 1 },  // left diagonal
        { dx: 1, dy: 1 }    // right diagonal
      ],
      left: [
        { dx: -1, dy: 0 },  // forward (left)
        { dx: -1, dy: -1 }, // up diagonal
        { dx: -1, dy: 1 }   // down diagonal
      ],
      right: [
        { dx: 1, dy: 0 },   // forward (right)
        { dx: 1, dy: -1 },  // up diagonal
        { dx: 1, dy: 1 }    // down diagonal
      ]
    },
    // Charged attack: Cross pattern (3 tiles in cross)
    chargedAttackPattern: {
      up: [
        { dx: 0, dy: -1 },  // up
        { dx: -1, dy: -1 }, // left diagonal
        { dx: 1, dy: -1 },  // right diagonal
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 }    // right
      ],
      down: [
        { dx: 0, dy: 1 },   // down
        { dx: -1, dy: 1 },  // left diagonal
        { dx: 1, dy: 1 },   // right diagonal
        { dx: -1, dy: 0 },  // left
        { dx: 1, dy: 0 }    // right
      ],
      left: [
        { dx: -1, dy: 0 },  // left
        { dx: -1, dy: -1 }, // up diagonal
        { dx: -1, dy: 1 },  // down diagonal
        { dx: 0, dy: -1 },  // up
        { dx: 0, dy: 1 }    // down
      ],
      right: [
        { dx: 1, dy: 0 },   // right
        { dx: 1, dy: -1 },  // up diagonal
        { dx: 1, dy: 1 },   // down diagonal
        { dx: 0, dy: -1 },  // up
        { dx: 0, dy: 1 }    // down
      ]
    },
    mana: {
      regenInterval: 10, // Seconds between mana regeneration
      chargedAttackCost: 1 // Mana cost for charged attack
    },
    health: {
      regenInterval: 10 // Seconds between health regeneration
    }
  },

  axe: {
    name: 'Axe',
    damage: 2,
    cooldown: 0.8,
    icon: '🪓',
    // Normal attack: 2x2 area in front (4 tiles total) - more powerful than sword
    attackPattern: {
      up: [
        { dx: 0, dy: -1 },  // forward
        { dx: -1, dy: -1 }, // left diagonal
        { dx: 1, dy: -1 },  // right diagonal
        { dx: 0, dy: -2 }   // 2 tiles forward
      ],
      down: [
        { dx: 0, dy: 1 },   // forward
        { dx: -1, dy: 1 },  // left diagonal
        { dx: 1, dy: 1 },   // right diagonal
        { dx: 0, dy: 2 }    // 2 tiles forward
      ],
      left: [
        { dx: -1, dy: 0 },  // forward
        { dx: -1, dy: -1 }, // up diagonal
        { dx: -1, dy: 1 },  // down diagonal
        { dx: -2, dy: 0 }   // 2 tiles forward
      ],
      right: [
        { dx: 1, dy: 0 },   // forward
        { dx: 1, dy: -1 },  // up diagonal
        { dx: 1, dy: 1 },   // down diagonal
        { dx: 2, dy: 0 }    // 2 tiles forward
      ]
    },
    // Charged attack: Large 3x3 area (9 tiles)
    chargedAttackPattern: {
      up: [
        { dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: 0, dy: -2 }, { dx: -1, dy: -2 }, { dx: 1, dy: -2 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 0 }
      ],
      down: [
        { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
        { dx: 0, dy: 2 }, { dx: -1, dy: 2 }, { dx: 1, dy: 2 },
        { dx: -1, dy: 0 }, { dx: 1, dy: 0 }, { dx: 0, dy: 0 }
      ],
      left: [
        { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
        { dx: -2, dy: 0 }, { dx: -2, dy: -1 }, { dx: -2, dy: 1 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 0 }
      ],
      right: [
        { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 },
        { dx: 2, dy: 0 }, { dx: 2, dy: -1 }, { dx: 2, dy: 1 },
        { dx: 0, dy: -1 }, { dx: 0, dy: 1 }, { dx: 0, dy: 0 }
      ]
    },
    mana: {
      regenInterval: 12,
      chargedAttackCost: 2
    },
    health: {
      regenInterval: 8
    }
  },

  spear: {
    name: 'Spear',
    damage: 2,
    cooldown: 0.6,
    icon: '🗡️',
    // Normal attack: Straight line 2 tiles deep (2 tiles total) - long reach
    attackPattern: {
      up: [
        { dx: 0, dy: -1 },  // 1 tile forward
        { dx: -1, dy: -1 }, // left diagonal
        { dx: 1, dy: -1 },  // right diagonal
        { dx: 0, dy: -2 }   // 2 tiles forward
      ],
      down: [
        { dx: 0, dy: 1 },   // 1 tile forward
        { dx: -1, dy: 1 },  // left diagonal
        { dx: 1, dy: 1 },   // right diagonal
        { dx: 0, dy: 2 }    // 2 tiles forward
      ],
      left: [
        { dx: -1, dy: 0 },  // 1 tile forward
        { dx: -1, dy: -1 }, // up diagonal
        { dx: -1, dy: 1 },  // down diagonal
        { dx: -2, dy: 0 }   // 2 tiles forward
      ],
      right: [
        { dx: 1, dy: 0 },   // 1 tile forward
        { dx: 1, dy: -1 },  // up diagonal
        { dx: 1, dy: 1 },   // down diagonal
        { dx: 2, dy: 0 }    // 2 tiles forward
      ]
    },
    // Charged attack: Wide piercing line (3 tiles wide, 2 deep = 6 tiles)
    chargedAttackPattern: {
      up: [
        { dx: 0, dy: -1 }, { dx: -1, dy: -1 }, { dx: 1, dy: -1 },
        { dx: 0, dy: -2 }, { dx: -1, dy: -2 }, { dx: 1, dy: -2 }
      ],
      down: [
        { dx: 0, dy: 1 }, { dx: -1, dy: 1 }, { dx: 1, dy: 1 },
        { dx: 0, dy: 2 }, { dx: -1, dy: 2 }, { dx: 1, dy: 2 }
      ],
      left: [
        { dx: -1, dy: 0 }, { dx: -1, dy: -1 }, { dx: -1, dy: 1 },
        { dx: -2, dy: 0 }, { dx: -2, dy: -1 }, { dx: -2, dy: 1 }
      ],
      right: [
        { dx: 1, dy: 0 }, { dx: 1, dy: -1 }, { dx: 1, dy: 1 },
        { dx: 2, dy: 0 }, { dx: 2, dy: -1 }, { dx: 2, dy: 1 }
      ]
    },
    mana: {
      regenInterval: 8,
      chargedAttackCost: 1
    },
    health: {
      regenInterval: 12
    }
  },
}

export const ATTACK_COOLDOWN = 0.5 // Default attack cooldown in seconds

export default weaponConfig