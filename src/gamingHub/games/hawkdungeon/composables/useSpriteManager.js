// Sprite manager for loading and rendering sprites
import { ref } from 'vue'
import { spriteConfig, TILE_SIZE } from '../config/spriteConfig'
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

  // Draw a sprite frame
  const drawSprite = (ctx, spriteType, frame, x, y, flipX = false, flipY = false) => {
    if (!isLoaded.value || !spritesheet.value) return

    const config = getSpriteConfig(spriteType)
    if (!config) return

    const { frameWidth, frameHeight, startX, startY } = config
    const sourceX = startX + (frame * frameWidth)
    const sourceY = startY

    ctx.save()

    // Apply transformations if flipping
    if (flipX || flipY) {
      ctx.translate(x + frameWidth / 2, y + frameHeight / 2)
      ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1)
      ctx.translate(-frameWidth / 2, -frameHeight / 2)
      ctx.drawImage(
        spritesheet.value,
        sourceX, sourceY, frameWidth, frameHeight,
        0, 0, frameWidth, frameHeight
      )
    } else {
      ctx.drawImage(
        spritesheet.value,
        sourceX, sourceY, frameWidth, frameHeight,
        x, y, frameWidth, frameHeight
      )
    }

    ctx.restore()
  }

  // Draw a tile (non-animated sprite)
  const drawTile = (ctx, tileType, x, y) => {
    if (!isLoaded.value || !spritesheet.value) return

    const config = getTileConfig(tileType)
    if (!config) return

    const { width, height, x: sourceX, y: sourceY } = config

    ctx.drawImage(
      spritesheet.value,
      sourceX, sourceY, width, height,
      x, y, width, height
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
          startY: 68,
          frames: 8
        }
      case 'goblin':
        return {
          frameWidth: 16,
          frameHeight: 16,
          startX: 368,
          startY: 80,
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
        return { width: 16, height: 16, x: 16, y: 80 }
      case 'sword':
        return { width: 16, height: 16, x: 293, y: 18 }
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