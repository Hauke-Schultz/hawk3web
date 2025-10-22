// Game renderer composable
import { watch, onMounted } from 'vue'
import { useSpriteManager } from './useSpriteManager'
import { TILE_SIZE } from '../config/spriteConfig'

export function useGameRenderer(canvasRef, gameState, knight, monsters, items, attackHitbox, dungeonOffset) {
  const { loadSpritesheet, drawSprite, drawTile, isLoaded } = useSpriteManager()

  let ctx = null
  let canvasWidth = 0
  let canvasHeight = 0

  let animationFrameId = null

  const initialize = async () => {
    if (!canvasRef.value) return

    ctx = canvasRef.value.getContext('2d')
    canvasWidth = canvasRef.value.width
    canvasHeight = canvasRef.value.height

    // Disable image smoothing for crisp pixel art
    ctx.imageSmoothingEnabled = false
    ctx.webkitImageSmoothingEnabled = false
    ctx.mozImageSmoothingEnabled = false
    ctx.msImageSmoothingEnabled = false

    // Load spritesheet
    await loadSpritesheet()

    // Start continuous render loop
    renderLoop()
  }

  const renderLoop = () => {
    render()
    animationFrameId = requestAnimationFrame(renderLoop)
  }

  const render = () => {
    if (!ctx || !isLoaded.value) return

    // Clear canvas
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(0, 0, canvasWidth, canvasHeight)

    // Calculate center of screen
    const centerX = canvasWidth / 2
    const centerY = canvasHeight / 2

    // Draw dungeon background
    drawDungeon(centerX, centerY)

    // Draw items
    //drawItems(centerX, centerY)

    // Draw monsters
    drawMonsters(centerX, centerY)

    // Draw knight (always at center)
    drawKnight(centerX, centerY)

    // Draw attack hitbox
    const hitbox = attackHitbox()
    if (hitbox?.active) {
      drawAttackHitbox(centerX, centerY, hitbox)
    }
  }

  const drawDungeon = (centerX, centerY) => {
    // Draw a 7x7 grid of floor tiles
    const GRID_SIZE = 7
    const tilesX = GRID_SIZE
    const tilesY = GRID_SIZE

    const offsetX = dungeonOffset.x % TILE_SIZE
    const offsetY = dungeonOffset.y % TILE_SIZE

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const drawX = x * TILE_SIZE + offsetX
        const drawY = y * TILE_SIZE + offsetY

        // Alternate between floor tiles for texture
        const tileType = ((x + y) % 2 === 0) ? 'floor' : 'floor'
        drawTile(ctx, tileType, drawX, drawY)
      }
    }
  }

  const drawKnight = (centerX, centerY) => {
    // Knight is always drawn at center
    const drawX = centerX - (TILE_SIZE / 2)
    const drawY = centerY - TILE_SIZE // Knight is 32px tall, center on bottom

    const flipX = knight.facingDirection === 'left'

    drawSprite(
      ctx,
      'knight',
      knight.animationFrame,
      drawX,
      drawY,
      flipX,
      false
    )
  }

  const drawMonsters = (centerX, centerY) => {
    const monstersList = monsters()
    if (!monstersList) return

    monstersList.forEach(monster => {
      // Calculate absolute screen position based on grid position and dungeon offset
      const worldX = monster.gridX * TILE_SIZE
      const worldY = monster.gridY * TILE_SIZE

      // Convert world coordinates to screen coordinates using dungeonOffset
      const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
      const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

      const flipX = monster.facingDirection === 'left'

      drawSprite(
        ctx,
        monster.type,
        monster.animationFrame || 0,
        drawX,
        drawY,
        flipX,
        false
      )

      // Draw health bar centered above the monster
      drawHealthBar(drawX, drawY - 5, TILE_SIZE, monster.health, monster.maxHealth)
    })
  }

  const drawItems = (centerX, centerY) => {
    const itemsList = items()
    if (!itemsList) return

    itemsList.forEach(item => {
      const relativeX = (item.gridX - knight.gridX) * TILE_SIZE
      const relativeY = (item.gridY - knight.gridY) * TILE_SIZE

      const drawX = centerX + relativeX - (TILE_SIZE / 2)
      const drawY = centerY + relativeY - (TILE_SIZE / 2)

      drawTile(ctx, item.type, drawX, drawY)
    })
  }

  const drawAttackHitbox = (centerX, centerY, hitbox) => {
    if (!hitbox || !hitbox.active) return

    const relativeX = (hitbox.gridX - knight.gridX) * TILE_SIZE
    const relativeY = (hitbox.gridY - knight.gridY) * TILE_SIZE

    const drawX = centerX + relativeX - (TILE_SIZE / 2)
    const drawY = centerY + relativeY - (TILE_SIZE / 2)

    // Calculate animation progress (0 to 1) based on creation time
    if (!hitbox.createdAt) {
      hitbox.createdAt = performance.now()
    }
    const elapsed = performance.now() - hitbox.createdAt
    const progress = Math.min(elapsed / 300, 1) // 300ms animation

    // Draw animated attack circle effect
    ctx.save()

    // Circle expands and fades out
    const maxRadius = TILE_SIZE / 2
    const radius = maxRadius * progress
    const alpha = 0.6 * (1 - progress) // Fade from 0.6 to 0

    // Circle center
    const circleCenterX = drawX + TILE_SIZE / 2
    const circleCenterY = drawY + TILE_SIZE / 2

    // Outer glow
    const gradient = ctx.createRadialGradient(
      circleCenterX, circleCenterY, 0,
      circleCenterX, circleCenterY, radius
    )
    gradient.addColorStop(0, `rgba(255, 255, 100, ${alpha})`)
    gradient.addColorStop(0.5, `rgba(255, 200, 50, ${alpha * 0.5})`)
    gradient.addColorStop(1, `rgba(255, 150, 0, 0)`)

    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius, 0, Math.PI * 2)
    ctx.fill()

    // Inner circle
    ctx.fillStyle = `rgba(255, 255, 200, ${alpha * 0.8})`
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 0.3, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Draw weapon sprite on top
    drawTile(ctx, hitbox.weapon, drawX, drawY)
  }

  const drawHealthBar = (x, y, width, current, max) => {
    const barHeight = 3
    const percentage = current / max

    // Background
    ctx.fillStyle = '#333333'
    ctx.fillRect(x, y, width, barHeight)

    // Health
    ctx.fillStyle = percentage > 0.5 ? '#44ff44' : percentage > 0.25 ? '#ffaa44' : '#ff4444'
    ctx.fillRect(x, y, width * percentage, barHeight)
  }

  // Watch for changes and re-render
  watch([() => knight.animationFrame, () => knight.gridX, () => knight.gridY, monsters, items, attackHitbox, dungeonOffset], () => {
    render()
  }, { deep: true })

  return {
    initialize,
    render
  }
}

export default useGameRenderer