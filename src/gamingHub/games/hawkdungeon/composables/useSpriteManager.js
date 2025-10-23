// Sprite manager for loading and rendering sprites
import { ref } from 'vue'
import { spriteConfig, SPRITE_SIZE, SPRITE_SCALE, TILE_SIZE } from '../config/spriteConfig'
import spritesheetUrl from '../assets/spritesheet.png'

export function useSpriteManager() {
  const spritesheet = ref(null)
  const isLoaded = ref(false)

  // Load spritesheet
  const loadSpritesheet = () => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        spritesheet.value = img
        isLoaded.value = true
        resolve(img)
      }
      img.onerror = reject
      img.src = spritesheetUrl
    })
  }

  // Draw a sprite frame with scaling
  const drawSprite = (ctx, spriteType, frame, x, y, flipX = false, flipY = false) => {
    if (!isLoaded.value || !spritesheet.value) return

    const config = getSpriteConfig(spriteType)
    if (!config) return

    const { frameWidth, frameHeight, startX, startY } = config
    const sourceX = startX + (frame * frameWidth)
    const sourceY = startY

    // Calculate scaled dimensions
    const scaledWidth = frameWidth * SPRITE_SCALE
    const scaledHeight = frameHeight * SPRITE_SCALE

    ctx.save()

    // Apply transformations if flipping
    if (flipX || flipY) {
      ctx.translate(x + scaledWidth / 2, y + scaledHeight / 2)
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
      ctx.translate(-scaledWidth / 2, -scaledHeight / 2)
      ctx.drawImage(
        spritesheet.value,
        sourceX, sourceY, frameWidth, frameHeight,
        0, 0, scaledWidth, scaledHeight
      )
    } else {
      ctx.drawImage(
        spritesheet.value,
        sourceX, sourceY, frameWidth, frameHeight,
        x, y, scaledWidth, scaledHeight
      )
    }

    ctx.restore()
  }

  // Draw a tile (non-animated sprite) with scaling
  const drawTile = (ctx, tileType, x, y) => {
    if (!isLoaded.value || !spritesheet.value) return

    const config = getTileConfig(tileType)
    if (!config) return

    const { width, height, x: sourceX, y: sourceY } = config

    // Calculate scaled dimensions
    const scaledWidth = width * SPRITE_SCALE
    const scaledHeight = height * SPRITE_SCALE

    ctx.drawImage(
      spritesheet.value,
      sourceX, sourceY, width, height,
      x, y, scaledWidth, scaledHeight
    )
  }

  // Get sprite configuration based on type
  const getSpriteConfig = (spriteType) => {
    switch (spriteType) {
      case 'knight':
        return {
          frameWidth: 16,
          frameHeight: 32,
          startX: 128,
          startY: 74,
          frames: 8
        }
      case 'goblin':
        return {
          frameWidth: 16,
          frameHeight: 16,
          startX: 368,
          startY: 162,
          frames: 8
        }
      case 'boss':
        return {
          frameWidth: 16,
          frameHeight: 16,
          startX: 368,
          startY: 96,
          frames: 8
        }
      default:
        return null
    }
  }

  // Get tile configuration
  const getTileConfig = (tileType) => {
    switch (tileType) {
      case 'floor':
        return { width: 16, height: 16, x: 16, y: 64 }
      case 'wall':
        return { width: 16, height: 16, x: 16, y: 16 }
      case 'sword':
        return { width: 16, height: 28, x: 304, y: 68 }
      case 'axe':
        return { width: 16, height: 16, x: 293, y: 34 }
      case 'heart':
        return { width: 16, height: 16, x: 288, y: 368 }
      case 'manaPotion':
        return { width: 16, height: 16, x: 320, y: 224 }
      default:
        return null
    }
  }

  return {
    spritesheet,
    isLoaded,
    loadSpritesheet,
    drawSprite,
    drawTile
  }
}

export default useSpriteManager