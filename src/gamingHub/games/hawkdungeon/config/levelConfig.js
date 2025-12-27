export const levelConfig = {
  1: {
    level: 1,
    name: 'Entrance Hall',
    description: 'First steps into the dungeon',
    enemyTypes: ['goblin', 'orc'], // Mixed enemy types
    bossTypes: ['boss_orc'],
    spawnRate: 5, // Seconds between spawns
    maxEnemies: 5,
    killGoal: 1,
    hasBoss: true, // Boss appears after killGoal reached
    difficulty: 'easy',
    rewards: {
      coins: 100,
      exp: 50
    },
    map: {
      name: 'Entrance Hall',
      description: 'A simple rectangular room with some obstacles',
      width: 11,
      height: 14,
      playerStart: {
        x: 4,
        y: 4
      },
      tiles: [
        '           ',
        'WWWWWWAWWWW',
        'W.,.,:M..:W',
        'W.:C.,:,:.W',
        'W,:^,.WWWWW',
        'W:.,...,.:W',
        'W.K:,..:.,W',
        'W,:^....,:W',
        'W.:.:.WBWWW',
        'W,C..:,H^.W',
        'W:^,,.,.,:W',
        'W.,:.:..:,W',
        'WWWWWWWWWWW'
      ],
      // Layer unter Spieler/Feinden (z.B. Bodendeko wie Totenschädel, Blutflecken)
      // '.' = transparent/leer, andere Zeichen = Deko-Tiles
      underLayer: [
        '...........',
        '.....b.....',
        '...b.s..o..',
        '...........',
        '...........',
        '...........',
        '...........',
        '..k........',
        '...........',
        '...........',
        '...........',
        '...........',
        '...........'
      ],
      // Layer über Spieler/Feinden (z.B. Spinnenweben)
      // '.' = transparent/leer, andere Zeichen = Deko-Tiles
      overLayer: [
        'ttttttatttt',
        'dddffF.F...',
        'ddf........',
        'df....ttttF',
        'ff.........',
        'f.n........',
        '..........f',
        '.......bttf',
        'F.......fdd',
        '........ffd',
        '.........ff',
        '.tttttttttf',
        '...........'
      ],
      chests: [
        {
          x: 3,
          y: 3,
          items: [
            { type: 'key' },
            { type: 'health', count: 1 },
            { type: 'healthPotion', count: 1 },
            { type: 'ruby', count: 3 },
          ]
        },
        {
          x: 8,
          y: 6,
          items: [
            { type: 'weapon', name: 'axe' },
            { type: 'weapon', name: 'spear' },
            { type: 'mana', count: 1 },
            { type: 'manaPotion', count: 1 }
          ]
        },
        {
          x: 4,
          y: 6,
          items: [
            { type: 'diamond', count: 1 },
            { type: 'ruby', count: 1 },
            { type: 'emerald', count: 1 },
            { type: 'sapphire', count: 1 },
            { type: 'coin', count: 1 }
          ]
        }
      ],
      killGoal: 5,
    }
  },

  2: {
    level: 2,
    name: 'The Catacombs',
    description: 'Navigate through the ancient catacombs',
    enemyTypes: ['goblin', 'orc'], // Mixed enemy types
    bossTypes: ['boss_zombie'],
    spawnRate: 4, // Seconds between spawns
    maxEnemies: 8,
    killGoal: 20,
    hasBoss: true, // Boss appears after killGoal reached
    difficulty: 'medium',
    rewards: {
      coins: 150,
      exp: 75
    },
    map: {
      name: 'The Catacombs',
      description: 'A multi-room dungeon with locked doors and hidden treasures',
      width: 19,
      height: 21,
      playerStart: {
        x: 2,
        y: 2
      },
      tiles: [
        '                   ',
        'WWWWWWAWWWWWWWWWWWW',
        'W.,:.,M,:.W......:W',
        'W^:.,C.,:,D,::^,.,W',
        'W.,:.:.,:,W.,:.C.:W',
        'W:.,.^..,.WWDWWWWWW',
        'WWWDWWWWWWW.,.:..:W',
        'W:.,:.W::,..,^.::.W',
        'W.,C.:W:C,..,:,.:.W',
        'W:.^.,W.,.:..:.,:.W',
        'WWWWWWW:.,.:^.:.:.W',
        'W.:,^^W.:.,.:.:.,.W',
        'W,^C^.D.,.,:WWWWWWW',
        'W.:^^.W:,.,:W:.,:.W',
        'WWBWWWW.:.,.W,C.,:W',
        'W:H,:.W:,.:.W^.:.,W',
        'W.,C:.W,.:.,D:.,:.W',
        'W^.:.,W.:,:.W.,:.,W',
        'W:..:.WWWWWAW.:,.:W',
        'W.,,:.,:,:,M.^.,:,W',
        'WWWWWWWWWWWWWWWWWWW'
      ],
      // Under Layer - Bodendeko
      underLayer: [
        '.b....b............',
        '............b......',
        'b..b.s..o..........',
        '...................',
        '...................',
        '...................',
        '...................',
        '...........b.......',
        '..b................',
        '...................',
        '...........s.......',
        '...................',
        '...................',
        '...................',
        '...................',
        '........o..........',
        '...................',
        '...................',
        '..........b........',
        '......s............',
        '...................'
      ],
      // Over Layer - Spinnenweben etc.
      overLayer: [
        'ttttttbtttttttttttt',
        'ddf................',
        'df.................',
        'f..................',
        '...........t.ttttt.',
        '.tt.tttttt.........',
        '.....fddfdf........',
        '......ffff.........',
        '...................',
        '.ttttt.............',
        '...................',
        '............ttttttf',
        '...............ffdf',
        '.tbttt........ffddd',
        '...............ffdd',
        '...............ffdd',
        '................ffd',
        '.......tttta.......',
        '...................',
        '...................',
        '...................'
      ],
      chests: [
        // Chest 1 - Starting room (contains key for first door)
        {
          x: 5,
          y: 3,
          items: [
            { type: 'key' },
            { type: 'diamond', count: 1 },
            { type: 'ruby', count: 1 },
            { type: 'emerald', count: 1 },
          ]
        },
        // Chest 2 - Left corridor (contains key for second area)
        {
          x: 3,
          y: 8,
          items: [
            { type: 'key' },
            { type: 'mana', count: 1 },
            { type: 'ruby', count: 2 }
          ]
        },
        // Chest 3 - Middle room (weapons and gems)
        {
          x: 8,
          y: 8,
          items: [
            { type: 'key' },
            { type: 'weapon', name: 'axe' },
          ]
        },
        // Chest 4 - Right side (key for boss room)
        {
          x: 15,
          y: 4,
          items: [
            { type: 'key' },
            { type: 'diamond', count: 1 },
            { type: 'ruby', count: 1 },
            { type: 'health', count: 1 }
          ]
        },
        // Chest 5 - Lower left (special items)
        {
          x: 4,
          y: 16,
          items: [
            { type: 'manaPotion', count: 2 },
            { type: 'weapon', name: 'spear' },
            { type: 'ruby', count: 1 },
            { type: 'emerald', count: 1 },
            { type: 'key' },
          ]
        },
        // Chest 6 - Lower right (final rewards before boss)
        {
          x: 13,
          y: 14,
          items: [
            { type: 'health', count: 1 },
            { type: 'mana', count: 1 },
            { type: 'diamond', count: 1 },
            { type: 'ruby', count: 1 },
            { type: 'key' },
          ]
        },
        {
          x: 3,
          y: 12,
          items: [
            { type: 'key' },
            { type: 'ruby', count: 6 }
          ]
        },
      ],
    }
  },

  3: {
    level: 3,
    name: 'The Crypts',
    description: 'Descend into the haunted crypts',
    enemyTypes: ['goblin', 'orc'], // All enemy types
    bossTypes: ['boss_zombie'],
    spawnRate: 3, // Faster spawns
    maxEnemies: 10,
    killGoal: 30,
    hasBoss: true,
    difficulty: 'medium',
    rewards: {
      coins: 250,
      exp: 125
    },
    map: {
      name: 'The Crypts',
      description: 'A vast crypt with multiple chambers and dark secrets',
      width: 21,
      height: 23,
      playerStart: {
        x: 2,
        y: 2
      },
      tiles: [
        '                     ',
        'WWWWWWWWAWWWWWWWWWWWW',
        'W.:,.,M,:.W........:W',
        'W^:.,C.:,.D,::^,C,.,W',
        'W.,:.:.,:,W.,:.:.:.W',
        'W:.,.^..,.WWWDWWWWWWW',
        'WWWDWWWWWW..:,:..:.:W',
        'W:.,:.W::,C.,^.::^.:W',
        'W.,C.:W:.,:.,:,.:..,W',
        'W:.^.,W.,.:^.:.,:.:.W',
        'WWWWWWW:.,.:..:.:.,.W',
        'W.:,:.WWDWWWWWWWWWWWW',
        'W,^C^.W:.,.:W.,:.C.:W',
        'W.:^..D:.,.,W^.:.,:.W',
        'WWWWWWW.,.:.W:.,:.:.W',
        'W:.,C^W:,.:.WWDWWWWWW',
        'W.,^:.W,.C.,W:.:,^.:W',
        'W^.^.,D.:,^.W.,.,.:.W',
        'W:..:.W:.,.,W^.,.C.:W',
        'W.^^C.WWDWWWW.:^.:.,W',
        'W.,H:.,:,M,:.^.,:,.,W',
        'WWWWWWWWWWWWWWWWWWWWW'
      ],
      // Under Layer - Bodendeko
      underLayer: [
        '.....................',
        '.b.........b.........',
        '.......s..o..........',
        'b....................',
        '.....................',
        '.....................',
        '.....................',
        '.....k.......b.......',
        '..b..................',
        '.....................',
        '............s........',
        '.....................',
        '.........k...........',
        '.....................',
        '.....................',
        '.b.......o...........',
        '..k..................',
        '.....................',
        '........b............',
        '......s..............',
        '.....................',
        '.....................'
      ],
      // Over Layer - Spinnenweben etc.
      overLayer: [
        'tttttttttatttttttttt.',
        'ddf..................',
        'df...................',
        'f....................',
        '............t.tttttt.',
        '.tt.tttttt...........',
        '.....fddfdf..........',
        '......ffff...........',
        '.....................',
        '.ttttt...............',
        '.....................',
        '..............ttttttt',
        '.................ffdf',
        '.tbttt...........ffdd',
        '..................ffd',
        '..................ffd',
        '.................ffdd',
        '.......ttttttttt.....',
        '.....................',
        '.....................',
        '.....................',
        '.....................'
      ],
      chests: [
        // Chest 1 - Starting room (first key)
        {
          x: 5,
          y: 3,
          items: [
            { type: 'key' },
            { type: 'health', count: 1 },
            { type: 'ruby', count: 2 },
            { type: 'emerald', count: 1 }
          ]
        },
        // Chest 2 - Left corridor
        {
          x: 3,
          y: 8,
          items: [
            { type: 'key' },
            { type: 'mana', count: 1 },
            { type: 'sapphire', count: 2 },
            { type: 'topaz', count: 1 }
          ]
        },
        // Chest 3 - Upper right area
        {
          x: 16,
          y: 3,
          items: [
            { type: 'key' },
            { type: 'healthPotion', count: 1 },
            { type: 'diamond', count: 1 }
          ]
        },
        // Chest 4 - Middle left
        {
          x: 4,
          y: 12,
          items: [
            { type: 'key' },
            { type: 'weapon', name: 'axe' },
            { type: 'amethyst', count: 2 }
          ]
        },
        // Chest 5 - Middle right
        {
          x: 16,
          y: 12,
          items: [
            { type: 'key' },
            { type: 'manaPotion', count: 2 },
            { type: 'ruby', count: 3 }
          ]
        },
        // Chest 6 - Lower left corridor
        {
          x: 3,
          y: 15,
          items: [
            { type: 'key' },
            { type: 'health', count: 2 },
            { type: 'emerald', count: 2 }
          ]
        },
        // Chest 7 - Lower middle
        {
          x: 7,
          y: 16,
          items: [
            { type: 'weapon', name: 'spear' },
            { type: 'diamond', count: 1 },
            { type: 'topaz', count: 2 }
          ]
        },
        // Chest 8 - Lower right before boss
        {
          x: 15,
          y: 18,
          items: [
            { type: 'key' },
            { type: 'health', count: 2 },
            { type: 'mana', count: 2 },
            { type: 'ruby', count: 4 }
          ]
        },
        // Chest 9 - Secret lower left
        {
          x: 5,
          y: 19,
          items: [
            { type: 'healthPotion', count: 2 },
            { type: 'manaPotion', count: 2 },
            { type: 'diamond', count: 2 }
          ]
        }
      ],
      killGoal: 30,
    }
  },

  4: {
    level: 4,
    name: 'Boss Fight',
    description: 'Face the Orc Warrior',
    enemyType: 'goblin',
    spawnRate: 2,
    maxEnemies: 15,
    killGoal: 1, // Just defeat the boss
    hasBoss: true,
    bossHealth: 15,
    difficulty: 'boss',
    rewards: {
      coins: 500,
      exp: 250
    }
  },

  5: {
    level: 5,
    name: 'Veteran Challenge',
    description: 'Test your skills',
    enemyType: 'goblin',
    spawnRate: 1,
    maxEnemies: 20,
    killGoal: 150,
    hasBoss: false,
    difficulty: 'hard',
    rewards: {
      coins: 300,
      exp: 150
    }
  },

  6: {
    level: 6,
    name: 'Endless Mode',
    description: 'Survive as long as you can',
    enemyType: 'goblin',
    spawnRate: 1, // Scaling spawn rate
    maxEnemies: 999, // Unlimited
    killGoal: 999999, // Endless mode
    hasBoss: false,
    endless: true,
    difficulty: 'endless',
    milestoneRewards: [50, 100, 150, 200, 250, 300],
    starSystem: {
      maxKills: 300,
      progressPerKill: 1
    },
    rewards: {
      coins: 0, // Dynamic
      exp: 0 // Dynamic
    },
    difficultyScaling: {
      spawnRateDecrease: 0.1, // Decrease by 0.1s every interval
      healthIncrease: 0.1, // +10% health every interval
      damageIncrease: 0.1, // +10% damage every interval
      scalingInterval: 30 // Scale every 30 seconds
    }
  }
}

// Helper function to get level config
export const getLevelConfig = (levelNumber) => {
  return levelConfig[levelNumber] || levelConfig[1]
}

export default levelConfig