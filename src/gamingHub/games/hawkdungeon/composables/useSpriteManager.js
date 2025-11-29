// Sprite manager for loading and rendering sprites
import { ref } from 'vue'
import { spriteConfig, SPRITE_SIZE, SPRITE_SCALE, TILE_SIZE } from '../config/spriteConfig'
import { assetConfig, getTileCategory } from '../config/assetConfig'

export function useSpriteManager() {
  // Store multiple spritesheets in a map
  const spritesheets = ref(new Map())
  const isLoaded = ref(false)

  // Load a single spritesheet
  const loadSingleSpritesheet = (path) => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        spritesheets.value.set(path, img)
        resolve(img)
      }
      img.onerror = () => reject(`Failed to load sprite: ${path}`)
      img.src = path
    })
  }

  // Load all required spritesheets
  const loadSpritesheet = async () => {
    try {
      // Load the main tiles spritesheet (required)
      await loadSingleSpritesheet(assetConfig.tiles)

      // Load combined spritesheet as fallback (if exists)
      if (assetConfig.combined) {
        await loadSingleSpritesheet(assetConfig.combined)
      }

      // Load other spritesheets (optional, won't fail if missing)
      const optionalSheets = [
        assetConfig.player,
        assetConfig.enemies,
        assetConfig.bosses,
        assetConfig.items,
        assetConfig.weapons
      ].filter(path => path && path !== assetConfig.tiles && path !== assetConfig.combined)

      // Load optional sheets but don't fail if they're missing
      await Promise.allSettled(
        optionalSheets.map(path => loadSingleSpritesheet(path))
      )

      isLoaded.value = true
      return spritesheets.value
    } catch (error) {
      console.error('Failed to load spritesheets:', error)
      throw error
    }
  }

  // Get the appropriate spritesheet for a sprite type
  const getSpritesheet = (category = 'tiles') => {
    const path = getTileCategory(category)
    // Try to get the specific spritesheet, fall back to combined, then tiles
    return spritesheets.value.get(path) ||
           spritesheets.value.get(assetConfig.combined) ||
           spritesheets.value.get(assetConfig.tiles)
  }

  // Draw a sprite frame with scaling
  const drawSprite = (ctx, spriteType, frame, x, y, flipX = false, flipY = false) => {
    if (!isLoaded.value) return

    const config = getSpriteConfig(spriteType)
    if (!config) return

    // Determine which spritesheet to use (players vs enemies vs bosses)
    let category = 'tiles'
    if (spriteType === 'knight' || spriteType === 'warrior' || spriteType === 'mage') {
      category = 'player'
    } else if (spriteType === 'goblin' || spriteType === 'orc' || spriteType === 'skeleton') {
      category = 'enemies'
    } else if (spriteType === 'boss' || spriteType === 'dragon' || spriteType === 'demon') {
      category = 'bosses'
    }

    const sheet = getSpritesheet(category)
    if (!sheet) return

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
        sheet,
        sourceX, sourceY, frameWidth, frameHeight,
        0, 0, scaledWidth, scaledHeight
      )
    } else {
      ctx.drawImage(
        sheet,
        sourceX, sourceY, frameWidth, frameHeight,
        x, y, scaledWidth, scaledHeight
      )
    }

    ctx.restore()
  }

  // Draw a tile (non-animated sprite) with scaling
  const drawTile = (ctx, tileType, x, y, layer = 'main') => {
    if (!isLoaded.value) return

    let config = null
    let category = 'tiles'

    // Handle different sprite formats:
    // 1. String like '.' or 'W' - look up in spriteConfig
    // 2. Object like {x: 0, y: 48} - use as direct coordinates
    if (typeof tileType === 'object' && tileType !== null && tileType.x !== undefined && tileType.y !== undefined) {
      // Direct coordinates from state sprite definition
      config = {
        width: 16,  // Default tile size
        height: 16,
        x: tileType.x,
        y: tileType.y
      }
    } else if (typeof tileType === 'string') {
      // Look up sprite by key
      config = getTileConfig(tileType, layer)

      // Determine category based on layer or tile type
      if (layer === 'items' || spriteConfig.items?.[tileType]) {
        category = 'items'
      } else if (layer === 'weapons' || spriteConfig.weapons?.[tileType]) {
        category = 'weapons'
      }
    }

    if (!config) return

    const sheet = getSpritesheet(category)
    if (!sheet) return

    const { width, height, x: sourceX, y: sourceY } = config

    // Calculate scaled dimensions
    const scaledWidth = width * SPRITE_SCALE
    const scaledHeight = height * SPRITE_SCALE

    ctx.drawImage(
      sheet,
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

  // Draw an animated tile with scaling
  const drawAnimatedTile = (ctx, tileType, frame, x, y) => {
    if (!isLoaded.value) return

    const config = getAnimatedTileConfig(tileType)
    if (!config) return

    const sheet = getSpritesheet('tiles')
    if (!sheet) return

    const { frameWidth, frameHeight, startX, startY } = config
    const sourceX = startX + (frame * frameWidth)
    const sourceY = startY

    // Calculate scaled dimensions
    const scaledWidth = frameWidth * SPRITE_SCALE
    const scaledHeight = frameHeight * SPRITE_SCALE

    ctx.drawImage(
      sheet,
      sourceX, sourceY, frameWidth, frameHeight,
      x, y, scaledWidth, scaledHeight
    )
  }

  // Get animated tile configuration from spriteConfig
  const getAnimatedTileConfig = (tileType) => {
    if (spriteConfig.animatedTiles && spriteConfig.animatedTiles[tileType]) {
      const config = spriteConfig.animatedTiles[tileType]
      return {
        frameWidth: config.animation.frameWidth,
        frameHeight: config.animation.frameHeight,
        startX: config.animation.startX,
        startY: config.animation.startY,
        frames: config.animation.frames,
        frameDuration: config.animation.frameDuration
      }
    }

    return null
  }

  // Get tile configuration from spriteConfig
  const getTileConfig = (tileType, layer = 'main') => {
    // Check layer-specific decorations first
    if (layer === 'underLayer' && spriteConfig.underLayerDecorations && spriteConfig.underLayerDecorations[tileType]) {
      return spriteConfig.underLayerDecorations[tileType]
    }

    if (layer === 'overLayer' && spriteConfig.overLayerDecorations && spriteConfig.overLayerDecorations[tileType]) {
      return spriteConfig.overLayerDecorations[tileType]
    }

    // Check tiles (map characters like '.', ',', ':', 'W', 'D', 'C')
    if (spriteConfig.tiles && spriteConfig.tiles[tileType]) {
      return spriteConfig.tiles[tileType]
    }

    // Check weapons
    if (spriteConfig.weapons && spriteConfig.weapons[tileType]) {
      return spriteConfig.weapons[tileType]
    }

    // Check items
    if (spriteConfig.items && spriteConfig.items[tileType]) {
      return spriteConfig.items[tileType]
    }

    console.warn(`Tile type "${tileType}" not found in spriteConfig for layer "${layer}"`)
    return null
  }

  return {
    spritesheets,
    isLoaded,
    loadSpritesheet,
    getSpritesheet,
    drawSprite,
    drawTile,
    drawAnimatedTile,
    getAnimatedTileConfig
  }
}

export default useSpriteManager