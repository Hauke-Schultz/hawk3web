import { Block } from './Block.js'
import { calculateOverlap, calculateStackScore, calculateEndlessStars, getEndlessStarProgress  } from './stackHelpers.js'
import { STACK_CONFIG, getColorForHeight, calculateSpeed } from './stackConfig.js'

/**
 * StackEngine - Core game logic for StackMerge
 */
export class StackEngine {
  constructor(levelConfig) {
    this.levelConfig = levelConfig
    this.levelNumber = levelConfig.level || 1

    // Game state
    this.isRunning = false
    this.isPaused = false

    // Tower state
    this.placedBlocks = []
    this.currentBlock = null
    this.height = 0

    // Stats
    this.score = 0
    this.perfectStacks = 0
    this.totalStacks = 0
    this.currentCombo = 0
    this.maxCombo = 0

    // Animation
    this.lastUpdateTime = 0
    this.fallingPieces = []

    // Canvas dimensions
    this.canvasWidth = STACK_CONFIG.canvas.baseWidth
    this.canvasHeight = STACK_CONFIG.canvas.baseHeight

    console.log('🎮 StackEngine initialized for level', this.levelNumber)
  }

  /**
   * Start the game
   */
  start() {
    this.isRunning = true
    this.isPaused = false
    this.reset()
    this.spawnBlock()
    console.log('▶️ Game started')
  }

  /**
   * Reset game state
   */
  reset() {
    this.placedBlocks = []
    this.currentBlock = null
    this.height = 0
    this.score = 0
    this.perfectStacks = 0
    this.totalStacks = 0
    this.currentCombo = 0
    this.maxCombo = 0
    this.fallingPieces = []
    this.lastUpdateTime = performance.now()
  }

  /**
   * Pause the game
   */
  pause() {
    this.isPaused = true
    if (this.currentBlock) {
      this.currentBlock.stop()
    }
  }

  /**
   * Resume the game
   */
  resume() {
    this.isPaused = false
    if (this.currentBlock && !this.currentBlock.isPlaced) {
      const speed = calculateSpeed(this.levelNumber, this.height)
      this.currentBlock.startMoving(speed, this.currentBlock.direction)
    }
    this.lastUpdateTime = performance.now()
  }

  /**
   * Stop the game
   */
  stop() {
    this.isRunning = false
    this.isPaused = false
  }

  /**
   * Update game state
   * @param {number} currentTime - Current timestamp
   * @returns {Object} - Update result
   */
  update(currentTime) {
    if (!this.isRunning || this.isPaused) {
      return { needsRender: false }
    }

    const deltaTime = (currentTime - this.lastUpdateTime) / 1000 // Convert to seconds
    this.lastUpdateTime = currentTime

    // Update current moving block
    if (this.currentBlock && this.currentBlock.isMoving) {
      this.currentBlock.update(deltaTime, this.canvasWidth)
    }

    // Update falling pieces
    this.updateFallingPieces(deltaTime)

    return { needsRender: true }
  }

  /**
   * Spawn a new block
   */
  spawnBlock() {
    const blockColor = getColorForHeight(this.height + 1)
    const blockHeight = STACK_CONFIG.canvas.blockHeight

    // GEÄNDERT: Block-Breite basiert auf letztem platzierten Block
    let blockWidth

    if (this.placedBlocks.length === 0) {
      // Erster Block: Verwende Standard-Breite
      blockWidth = STACK_CONFIG.canvas.baseBlockWidth
    } else {
      // Alle weiteren Blöcke: Übernehme Breite vom letzten Block
      const lastBlock = this.placedBlocks[this.placedBlocks.length - 1]
      blockWidth = lastBlock.width
    }

    // Calculate Y position (von unten nach oben)
    const startY = STACK_CONFIG.canvas.blockStartY - (this.height * blockHeight)

    let startX
    let direction

    if (Math.random() > 0.5) {
      startX = -blockWidth
      direction = 1
    } else {
      startX = this.canvasWidth
      direction = -1
    }

    // Create new block
    this.currentBlock = new Block(startX, startY, blockWidth, blockHeight, blockColor)

    // Start moving
    const speed = calculateSpeed(this.levelNumber, this.height)
    this.currentBlock.startMoving(speed, direction)

    console.log(`🎯 Block #${this.height + 1} spawned from ${direction === 1 ? 'LEFT' : 'RIGHT'}, width: ${blockWidth}px, Y: ${startY}`)
  }

  /**
   * Drop the current block (player input)
   * @returns {Object} - Drop result
   */
  dropBlock() {
    if (!this.currentBlock || this.currentBlock.isPlaced) {
      return { success: false, reason: 'no_block' }
    }

    // Stop the block
    this.currentBlock.stop()

    // Check if this is the first block
    if (this.placedBlocks.length === 0) {
      return this.placeFirstBlock()
    }

    // Get the last placed block
    const lastBlock = this.placedBlocks[this.placedBlocks.length - 1]

    // Calculate overlap
    const overlapResult = calculateOverlap(this.currentBlock, lastBlock)

    if (!overlapResult.hasOverlap) {
      // Complete miss - Game Over
      return {
        success: false,
        reason: 'miss',
        gameOver: true
      }
    }

    // Calculate score
    const stackScore = calculateStackScore(
        overlapResult.isPerfect,
        this.currentCombo,
        STACK_CONFIG.gameplay.baseScore
    )

    // Update combo
    if (overlapResult.isPerfect) {
      this.currentCombo++
      this.perfectStacks++
      if (this.currentCombo > this.maxCombo) {
        this.maxCombo = this.currentCombo
      }
    } else {
      this.currentCombo = 0
    }

    // Update stats
    this.score += stackScore
    this.totalStacks++
    this.height++

    // Handle trimming if not perfect
    if (!overlapResult.isPerfect) {
      this.trimBlock(overlapResult)
    }

    // Place the block
    this.currentBlock.x = overlapResult.newX
    this.currentBlock.width = overlapResult.newWidth
    this.currentBlock.place()
    this.placedBlocks.push(this.currentBlock)

    // Check level completion
    const levelComplete = this.checkLevelComplete()

    console.log(`📦 Block placed - Height: ${this.height}, Score: ${this.score}, Combo: ${this.currentCombo}x`)

    // Spawn next block
    if (!levelComplete) {
      setTimeout(() => this.spawnBlock(), 200) // Small delay
    }

    return {
      success: true,
      isPerfect: overlapResult.isPerfect,
      score: stackScore,
      combo: this.currentCombo,
      height: this.height,
      levelComplete
    }
  }

  /**
   * Place the first block (always perfect)
   * @returns {Object}
   */
  placeFirstBlock() {
    this.currentBlock.place()
    this.placedBlocks.push(this.currentBlock)
    this.height++
    this.totalStacks++
    this.perfectStacks++ // First block is always perfect
    this.currentCombo = 1
    this.score += STACK_CONFIG.gameplay.baseScore + STACK_CONFIG.gameplay.perfectBonus

    console.log('📦 First block placed perfectly')

    setTimeout(() => this.spawnBlock(), 200)

    return {
      success: true,
      isPerfect: true,
      score: STACK_CONFIG.gameplay.baseScore + STACK_CONFIG.gameplay.perfectBonus,
      combo: 1,
      height: 1,
      levelComplete: false
    }
  }

  /**
   * Trim the block and create falling piece
   * @param {Object} overlapResult
   */
  trimBlock(overlapResult) {
    const lastBlock = this.placedBlocks[this.placedBlocks.length - 1]

    // Determine which side was trimmed
    let trimmedPiece = null

    if (this.currentBlock.x < lastBlock.x) {
      // Left side trimmed
      const trimWidth = lastBlock.x - this.currentBlock.x
      trimmedPiece = {
        x: this.currentBlock.x,
        y: this.currentBlock.y,
        width: trimWidth,
        height: this.currentBlock.height,
        color: this.currentBlock.color,
        velocityY: 0,
        opacity: 1
      }
    } else if (this.currentBlock.x + this.currentBlock.width > lastBlock.x + lastBlock.width) {
      // Right side trimmed
      const trimStart = lastBlock.x + lastBlock.width
      const trimWidth = (this.currentBlock.x + this.currentBlock.width) - trimStart
      trimmedPiece = {
        x: trimStart,
        y: this.currentBlock.y,
        width: trimWidth,
        height: this.currentBlock.height,
        color: this.currentBlock.color,
        velocityY: 0,
        opacity: 1
      }
    }

    if (trimmedPiece) {
      this.fallingPieces.push(trimmedPiece)
      console.log('✂️ Block trimmed, piece falling')
    }
  }

  /**
   * Update falling pieces animation
   * @param {number} deltaTime
   */
  updateFallingPieces(deltaTime) {
    const gravity = 500 // pixels per second squared

    this.fallingPieces = this.fallingPieces.filter(piece => {
      // Apply gravity
      piece.velocityY += gravity * deltaTime
      piece.y += piece.velocityY * deltaTime

      // Fade out
      piece.opacity -= deltaTime * 2

      // Remove if off screen or fully faded
      return piece.y < this.canvasHeight + 100 && piece.opacity > 0
    })
  }

  /**
   * Check if level is complete
   * @returns {boolean}
   */
  checkLevelComplete() {
    const targetHeight = this.levelConfig.targetHeight

    // Endless mode never completes via this function
    if (targetHeight === Infinity) {
      return false
    }

    return this.height >= targetHeight
  }


  /**
   * Check if milestone reached in endless mode
   * @returns {Object|null}
   */
  checkEndlessMilestone() {
    if (this.levelConfig.targetHeight !== Infinity) return null
    if (!this.levelConfig.milestoneRewards) return null

    const milestones = this.levelConfig.milestoneRewards
    const currentHeight = this.height

    // Check if current height is a milestone
    if (milestones.includes(currentHeight)) {
      const bonusCoins = currentHeight * 5 // 5 coins per block reached
      const bonusDiamonds = Math.floor(currentHeight / 10) // 1 diamond per 10 blocks

      return {
        height: currentHeight,
        coins: bonusCoins,
        diamonds: bonusDiamonds,
        message: `Milestone: ${currentHeight} blocks!`
      }
    }

    return null
  }

  /**
   * Get endless mode statistics
   * @returns {Object}
   */
  getEndlessStats() {
    if (this.levelConfig.targetHeight !== Infinity) return null

    const stars = calculateEndlessStars(this.height)
    const progress = getEndlessStarProgress(this.height)

    return {
      height: this.height,
      stars,
      progress: progress.progress,
      nextStarAt: progress.nextStarAt,
      blocksToNextStar: progress.blocksToNextStar,
      isMaxStars: progress.isMaxStars
    }
  }

  /**
   * Get current game state
   * @returns {Object}
   */
  getState() {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      height: this.height,
      score: this.score,
      perfectStacks: this.perfectStacks,
      totalStacks: this.totalStacks,
      currentCombo: this.currentCombo,
      maxCombo: this.maxCombo,
      placedBlocks: this.placedBlocks,
      currentBlock: this.currentBlock,
      fallingPieces: this.fallingPieces
    }
  }

  /**
   * Get camera offset for viewport
   * @returns {number}
   */
  getCameraOffset() {
    if (this.height === 0) return 0

    const blockHeight = STACK_CONFIG.canvas.blockHeight
    const followThreshold = 5

    if (this.height <= followThreshold) {
      return 0
    }
    const targetOffset = (this.height - followThreshold) * blockHeight

    return targetOffset
  }
}