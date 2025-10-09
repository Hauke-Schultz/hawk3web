/**
 * Block class representing a stackable block
 */
export class Block {
  constructor(x, y, width, height, color) {
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.color = color
    this.speed = 0
    this.direction = 1 // 1 = right, -1 = left
    this.isMoving = false
    this.isPlaced = false
  }

  /**
   * Update block position based on movement
   * @param {number} deltaTime - Time since last update
   * @param {number} canvasWidth - Width of canvas for boundary checking
   */
  update(deltaTime, canvasWidth) {
    if (!this.isMoving) return

    const movement = this.speed * this.direction * deltaTime
    this.x += movement

    // Bounce at edges
    if (this.x <= 0) {
      this.x = 0
      this.direction = 1
    } else if (this.x + this.width >= canvasWidth) {
      this.x = canvasWidth - this.width
      this.direction = -1
    }
  }

  /**
   * Start moving the block
   * @param {number} speed - Movement speed
   * @param {number} direction - Initial direction (1 or -1)
   */
  startMoving(speed, direction = 1) {
    this.speed = speed
    this.direction = direction
    this.isMoving = true
  }

  /**
   * Stop the block from moving
   */
  stop() {
    this.isMoving = false
    this.speed = 0
  }

  /**
   * Place the block (make it part of the tower)
   */
  place() {
    this.stop()
    this.isPlaced = true
  }

  /**
   * Get the block's center X position
   * @returns {number}
   */
  getCenterX() {
    return this.x + this.width / 2
  }

  /**
   * Get the block's bounds for collision detection
   * @returns {Object}
   */
  getBounds() {
    return {
      left: this.x,
      right: this.x + this.width,
      top: this.y,
      bottom: this.y + this.height
    }
  }

  /**
   * Clone the block
   * @returns {Block}
   */
  clone() {
    const clone = new Block(this.x, this.y, this.width, this.height, this.color)
    clone.speed = this.speed
    clone.direction = this.direction
    clone.isMoving = this.isMoving
    clone.isPlaced = this.isPlaced
    return clone
  }
}