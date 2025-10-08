/**
 * Calculate overlap between two blocks
 * @param {Object} movingBlock - The block being dropped
 * @param {Object} baseBlock - The block being stacked on
 * @returns {Object} - Overlap information
 */
export const calculateOverlap = (movingBlock, baseBlock) => {
  // Calculate horizontal overlap
  const leftOverlap = Math.max(0,
      Math.min(movingBlock.x + movingBlock.width, baseBlock.x + baseBlock.width) -
      Math.max(movingBlock.x, baseBlock.x)
  )

  // Calculate overlap percentage
  const overlapPercentage = (leftOverlap / movingBlock.width) * 100

  // Determine if perfect (within threshold)
  const isPerfect = overlapPercentage >= 95 // 95%+ is perfect

  // Calculate new block dimensions after trim
  const newX = Math.max(movingBlock.x, baseBlock.x)
  const newWidth = leftOverlap

  return {
    overlap: leftOverlap,
    overlapPercentage,
    isPerfect,
    newX,
    newWidth,
    hasOverlap: leftOverlap > 0
  }
}

/**
 * Calculate score based on stack quality and combo
 * @param {boolean} isPerfect - Was the stack perfect?
 * @param {number} comboLevel - Current combo level
 * @param {number} baseScore - Base score per stack
 * @returns {number} - Total score earned
 */
export const calculateStackScore = (isPerfect, comboLevel, baseScore = 10) => {
  let score = baseScore

  // Perfect bonus
  if (isPerfect) {
    score += 5
  }

  // Combo multiplier (increases with each perfect stack)
  if (comboLevel > 1) {
    score = Math.floor(score * (1 + (comboLevel - 1) * 0.5))
  }

  return score
}

/**
 * Determine star rating based on perfect stack percentage
 * @param {number} perfectCount - Number of perfect stacks
 * @param {number} totalCount - Total number of stacks
 * @returns {number} - Star rating (1-3)
 */
export const calculateStarRating = (perfectCount, totalCount) => {
  if (totalCount === 0) return 0

  const perfectPercentage = (perfectCount / totalCount) * 100

  if (perfectPercentage >= 80) return 3
  if (perfectPercentage >= 60) return 2
  return 1
}

/**
 * Check if block position is within canvas bounds
 * @param {Object} block - Block to check
 * @param {number} canvasWidth - Canvas width
 * @param {number} canvasHeight - Canvas height
 * @returns {boolean} - True if within bounds
 */
export const isBlockInBounds = (block, canvasWidth, canvasHeight) => {
  return (
      block.x >= 0 &&
      block.x + block.width <= canvasWidth &&
      block.y >= 0 &&
      block.y + block.height <= canvasHeight
  )
}

/**
 * Animate falling piece (trimmed portion)
 * @param {Object} piece - Piece to animate
 * @param {Function} callback - Called when animation complete
 */
export const animateFallingPiece = (piece, callback) => {
  const duration = 500 // ms
  const startY = piece.y
  const endY = piece.y + 200 // Fall distance
  const startTime = Date.now()

  const animate = () => {
    const elapsed = Date.now() - startTime
    const progress = Math.min(elapsed / duration, 1)

    // Easing function (accelerate)
    const easedProgress = progress * progress

    piece.y = startY + (endY - startY) * easedProgress
    piece.opacity = 1 - progress

    if (progress < 1) {
      requestAnimationFrame(animate)
    } else {
      callback()
    }
  }

  animate()
}

/**
 * Format time in MM:SS format
 * @param {number} seconds - Time in seconds
 * @returns {string} - Formatted time string
 */
export const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Interpolate between two values
 * @param {number} start - Start value
 * @param {number} end - End value
 * @param {number} progress - Progress (0-1)
 * @returns {number} - Interpolated value
 */
export const lerp = (start, end, progress) => {
  return start + (end - start) * progress
}

/**
 * Get difficulty multiplier based on current height
 * @param {number} height - Current tower height
 * @param {Object} config - Stack configuration
 * @returns {number} - Speed multiplier
 */
export const getDifficultyMultiplier = (height, config) => {
  const milestoneInterval = config.progression?.milestoneInterval || 10
  const speedIncrease = config.progression?.speedIncrease || 0.05

  const milestones = Math.floor(height / milestoneInterval)
  return 1 + (milestones * speedIncrease)
}

/**
 * Calculate star rating for endless mode based on height reached
 * Progressive system: 1% per block, 3 stars at 100 blocks
 * @param {number} height - Current tower height
 * @returns {number} - Star rating (0-3)
 */
export const calculateEndlessStars = (height) => {
  if (height <= 0) return 0

  const maxHeight = 100 // 3 stars at 100 blocks
  const progress = Math.min((height / maxHeight) * 100, 100) // Cap at 100%

  // Progressive star system
  if (progress >= 100) return 3 // 100 blocks = 3 stars
  if (progress >= 67) return 2   // 67 blocks = 2 stars
  if (progress >= 34) return 1   // 34 blocks = 1 star
  return 0
}

/**
 * Get star progress percentage for endless mode
 * @param {number} height - Current tower height
 * @returns {Object} - Progress info
 */
export const getEndlessStarProgress = (height) => {
  const maxHeight = 100
  const progress = Math.min((height / maxHeight) * 100, 100)
  const currentStars = calculateEndlessStars(height)

  // Calculate blocks needed for next star
  let nextStarAt = 0
  if (currentStars === 0) nextStarAt = 34
  else if (currentStars === 1) nextStarAt = 67
  else if (currentStars === 2) nextStarAt = 100

  const blocksToNextStar = Math.max(0, nextStarAt - height)

  return {
    progress: Math.round(progress),
    currentStars,
    nextStarAt,
    blocksToNextStar,
    isMaxStars: currentStars >= 3
  }
}