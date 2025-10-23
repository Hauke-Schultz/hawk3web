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

  // Get sprite configuration from spriteConfig
  const getSpriteConfig = (spriteType) => {
    const config = spriteConfig[spriteType]

    if (!config || !config.walk) {
      console.warn(`Sprite type "${spriteType}" not found in spriteConfig`)
      return null
    }

    return {
      frameWidth: config.walk.frameWidth,
      frameHeight: config.walk.frameHeight,
      startX: config.walk.startX,
      startY: config.walk.startY,
      frames: config.walk.frames
    }
  }

  // Get tile configuration from spriteConfig
  const getTileConfig = (tileType) => {
    // Check dungeon tiles
    if (spriteConfig.dungeon[tileType]) {
      return spriteConfig.dungeon[tileType]
    }

    // Check dungeon tiles with floor variants
    if (tileType.startsWith('floor')) {
      return spriteConfig.dungeon[tileType] || spriteConfig.dungeon.floor
    }

    // Check weapons
    if (spriteConfig.weapons[tileType]) {
      return spriteConfig.weapons[tileType]
    }

    // Check items
    if (spriteConfig.items[tileType]) {
      return spriteConfig.items[tileType]
    }

    console.warn(`Tile type "${tileType}" not found in spriteConfig`)
    return null
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