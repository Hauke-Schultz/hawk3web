export const levelConfig = {
  1: {
    level: 1,
    name: 'Entrance Hall',
    description: 'First steps into the dungeon',
    enemyTypes: ['goblin', 'orc'], // Mixed enemy types
    bossTypes: ['boss'],
    spawnRate: 5, // Seconds between spawns
    maxEnemies: 5,
    killGoal: 5,
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
        'W:.,..W,.:W',
        'W.K:,.D:.,W',
        'W,:^..W.,:W',
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
        '...........',
        '........o..',
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
        'dddff......',
        'ddf........',
        'df....tttt.',
        'ff.........',
        'f.n........',
        '..........f',
        '.......bttf',
        '........fdd',
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
    name: 'Goblin Swarm',
    description: 'Deeper into darkness',
    enemyType: 'goblin',
    spawnRate: 4,
    maxEnemies: 8,
    killGoal: 75,
    hasBoss: false,
    difficulty: 'medium',
    rewards: {
      coins: 150,
      exp: 75
    }
  },

  3: {
    level: 3,
    name: 'The Horde',
    description: 'Face the goblin horde',
    enemyType: 'goblin',
    spawnRate: 3,
    maxEnemies: 12,
    killGoal: 100,
    hasBoss: false,
    difficulty: 'medium',
    rewards: {
      coins: 200,
      exp: 100
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