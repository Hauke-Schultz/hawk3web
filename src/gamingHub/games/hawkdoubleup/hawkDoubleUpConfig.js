
export const GRID_CONFIG = {
  // Grid Dimensions
  rows: 4,
  cols: 4,

  // Board Dimensions
  boardWidth: 320,
  boardHeight: 400,

  // Cell Calculations
  cellSize: 70,
  cellGap: 6,

  // Board Padding
  paddingX: 8,
  paddingY: 8,

  // Touch Standards
  minTouchTarget: 44,
}

export const GRID_UTILS = {
  // Convert grid position to pixel coordinates
  gridToPixel: (row, col) => ({
    x: GRID_CONFIG.paddingX + (col * (GRID_CONFIG.cellSize + GRID_CONFIG.cellGap)),
    y: GRID_CONFIG.paddingY + (row * (GRID_CONFIG.cellSize + GRID_CONFIG.cellGap))
  }),

  // Convert pixel coordinates to grid position
  pixelToGrid: (x, y) => ({
    row: Math.floor((y - GRID_CONFIG.paddingY) / (GRID_CONFIG.cellSize + GRID_CONFIG.cellGap)),
    col: Math.floor((x - GRID_CONFIG.paddingX) / (GRID_CONFIG.cellSize + GRID_CONFIG.cellGap))
  }),

  // Check if grid position is valid
  isValidPosition: (row, col) => {
    return row >= 0 && row < GRID_CONFIG.rows &&
        col >= 0 && col < GRID_CONFIG.cols;
  }
}

export const NUMBER_TYPES = {
  NUM_2: {
    index: 1,
    type: 'NUM_2',
    number: 2,
    radius: 18,
    nextType: 'NUM_4',
    color: '#eee4da',
    textColor: '#776e65',
    scoreValue: 2,
    gradient: ['#eee4da', '#ede0c8'],
    sparkleColor: '#8f7a66',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_4: {
    index: 2,
    type: 'NUM_4',
    number: 4,
    radius: 20,
    nextType: 'NUM_8',
    color: '#ede0c8',
    textColor: '#776e65',
    scoreValue: 4,
    gradient: ['#ede0c8', '#e6d5b7'],
    sparkleColor: '#8f7a66',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_7: {
    index: 15,
    type: 'NUM_7',
    number: 7,
    radius: 21,
    nextType: 'NUM_6',
    color: '#4c1ff4',
    textColor: '#f9f6f2',
    scoreValue: 7,
    gradient: ['#4c1ff4', '#3a0bd1'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
    isSpecial: true,
    decreases: true,
  },
  NUM_6: {
    index: 16,
    type: 'NUM_6',
    number: 6,
    radius: 20,
    nextType: null,
    color: '#6049b6',
    textColor: '#f9f6f2',
    scoreValue: 6,
    gradient: ['#6049b6', '#8e24aa'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
    isSpecial: true,
    decreases: true,
  },
  NUM_5: {
    index: 17,
    type: 'NUM_5',
    number: 5,
    radius: 19,
    nextType: null,
    color: '#6d6881',
    textColor: '#f9f6f2',
    scoreValue: 5,
    gradient: ['#6d6881', '#8e8a99'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
    isSpecial: true,
    decreases: true,
  },
  NUM_8: {
    index: 3,
    type: 'NUM_8',
    number: 8,
    radius: 22,
    nextType: 'NUM_16',
    color: '#f2b179',
    textColor: '#f9f6f2',
    scoreValue: 8,
    gradient: ['#f2b179', '#ec9853'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_16: {
    index: 4,
    type: 'NUM_16',
    number: 16,
    radius: 24,
    nextType: 'NUM_32',
    color: '#f59563',
    textColor: '#f9f6f2',
    scoreValue: 16,
    gradient: ['#f59563', '#f57c5f'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_32: {
    index: 5,
    type: 'NUM_32',
    number: 32,
    radius: 26,
    nextType: 'NUM_64',
    color: '#f67c5f',
    textColor: '#f9f6f2',
    scoreValue: 32,
    gradient: ['#f67c5f', '#f65e3b'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_64: {
    index: 6,
    type: 'NUM_64',
    number: 64,
    radius: 28,
    nextType: 'NUM_128',
    color: '#f65e3b',
    textColor: '#f9f6f2',
    scoreValue: 64,
    gradient: ['#f65e3b', '#edcf72'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_128: {
    index: 7,
    type: 'NUM_128',
    number: 128,
    radius: 30,
    nextType: 'NUM_256',
    color: '#edcf72',
    textColor: '#f9f6f2',
    scoreValue: 128,
    gradient: ['#edcf72', '#edcc61'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-lg)',
    fontWeight: 'bold',
  },
  NUM_256: {
    index: 8,
    type: 'NUM_256',
    number: 256,
    radius: 32,
    nextType: 'NUM_512',
    color: '#edcc61',
    textColor: '#f9f6f2',
    scoreValue: 256,
    gradient: ['#edcc61', '#edc850'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'bold',
  },
  NUM_512: {
    index: 9,
    type: 'NUM_512',
    number: 512,
    radius: 34,
    nextType: 'NUM_1024',
    color: '#edc850',
    textColor: '#f9f6f2',
    scoreValue: 512,
    gradient: ['#edc850', '#edc53f'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'bold',
  },
  NUM_1024: {
    index: 10,
    type: 'NUM_1024',
    number: 1024,
    radius: 36,
    nextType: 'NUM_2048',
    color: '#edc53f',
    textColor: '#f9f6f2',
    scoreValue: 1024,
    gradient: ['#edc53f', '#edc22e'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'bold',
  },
  NUM_2048: {
    index: 11,
    type: 'NUM_2048',
    number: 2048,
    radius: 38,
    nextType: 'NUM_4096',
    color: '#edc22e',
    textColor: '#f9f6f2',
    scoreValue: 2048,
    gradient: ['#edc22e', '#3c3a32'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'bold',
  },
  NUM_4096: {
    index: 12,
    type: 'NUM_4096',
    number: 4096,
    radius: 40,
    nextType: 'NUM_8192',
    color: '#3c3a32',
    textColor: '#f9f6f2',
    scoreValue: 4096,
    gradient: ['#3c3a32', '#000000'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'bold',
  },
  NUM_8192: {
    index: 13,
    type: 'NUM_8192',
    number: 8192,
    radius: 42,
    nextType: null,
    color: '#000000',
    textColor: '#f9f6f2',
    scoreValue: 8192,
    gradient: ['#000000', '#000000'],
    sparkleColor: '#f9f6f2',
    fontSize: 'var(--font-size-base)',
    fontWeight: 'bold',
  }
}

// Level Goal Configuration
export const HAWK_DOUBLE_UP_LEVELS = {
	1: {
    targetNum: 'NUM_128',
    randomNumbers: [2, 2, 2, 4],
    starThresholds: {
      1: { score: 100, moves: 20 },
      2: { score: 200, moves: 15 },
      3: { score: 300, moves: 10 },
    },
	},
  2: {
    targetNum: 'NUM_256',
    randomNumbers: [2, 2, 2, 4],
    starThresholds: {
      1: { score: 300, moves: 25 },
      2: { score: 500, moves: 20 },
      3: { score: 800, moves: 15 },
    },
  },
  3: {
    targetNum: 'NUM_512',
    randomNumbers: [2, 2, 2, 4],
    starThresholds: {
      1: { score: 500, moves: 30 },
      2: { score: 800, moves: 25 },
      3: { score: 1200, moves: 20 },
    },
  },
  4: {
    targetNum: 'NUM_1024',
    randomNumbers: [2, 2, 2, 4],
    starThresholds: {
      1: { score: 800, moves: 35 },
      2: { score: 1200, moves: 30 },
      3: { score: 1600, moves: 25 },
    },
  },
  5: {
    targetNum: 'NUM_2048',
    randomNumbers: [2, 2, 2, 4],
    starThresholds: {
      1: { score: 1200, moves: 40 },
      2: { score: 1800, moves: 35 },
      3: { score: 2400, moves: 30 },
    },
  },
  6: {
    targetFruit: null,
    randomNumbers: [2, 2, 2, 4],
    specialNumbers: ['NUM_7'],
    number7SpawnChance: 0.05,
    starThresholds: {
      1: { score: 1600, moves: 45 },
      2: { score: 2400, moves: 40 },
      3: { score: 3200, moves: 35 },
    },
    isEndless: true,
    endless: {
      scoreMilestones: [2000, 5000, 15000, 35000],
      timeMilestones: [300, 600, 900, 1200],
      mergeMilestones: [30, 80, 200, 500]
    }
  }
};

export const hawkDoubleUpConfig = {
	gameId: 'hawkDoubleUp',
  gameTitle: 'Hawk Double Up',
  gameDescription: 'Merge numbers to reach the target score!',
  gameIcon: 'hawk-double-up',
  levels: Object.values(HAWK_DOUBLE_UP_LEVELS).map((level, index) => ({
    level: index + 1,
    ...level
  }))
}
