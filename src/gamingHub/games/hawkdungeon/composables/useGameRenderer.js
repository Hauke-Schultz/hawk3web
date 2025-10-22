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
    drawItems(centerX, centerY)

    // Draw monsters
    drawMonsters(centerX, centerY)

    // Draw knight (always at center)
    drawKnight(centerX, centerY)

    // Draw attack hitbox in foreground (after knight)
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

    // Calculate animation progress (0 to 1) based on creation time
    if (!hitbox.createdAt) {
      hitbox.createdAt = performance.now()
    }
    const elapsed = performance.now() - hitbox.createdAt
    const progress = Math.min(elapsed / 300, 1) // 300ms animation

    // Draw sword with swing animation FIRST (behind effect)
    drawSwordSwing(centerX, centerY, hitbox, progress)

    // Draw JUICY animated attack effect ON TOP
    ctx.save()

    // Position circle closer to player
    const relativeX = (hitbox.gridX - knight.gridX) * TILE_SIZE
    const relativeY = (hitbox.gridY - knight.gridY) * TILE_SIZE
    const circleCenterX = centerX + relativeX
    const circleCenterY = centerY + relativeY

    // Much larger and more dynamic circle
    const maxRadius = TILE_SIZE * 1.2 // 20% bigger!
    const radius = maxRadius * progress
    const alpha = 0.85 * (1 - progress) // Start more opaque

    // Multiple gradient layers for JUICE
    // Layer 1: Outer explosive glow
    const outerGradient = ctx.createRadialGradient(
      circleCenterX, circleCenterY, 0,
      circleCenterX, circleCenterY, radius * 1.3
    )
    outerGradient.addColorStop(0, `rgba(255, 255, 150, ${alpha * 0.9})`)
    outerGradient.addColorStop(0.3, `rgba(255, 220, 100, ${alpha * 0.7})`)
    outerGradient.addColorStop(0.6, `rgba(255, 180, 50, ${alpha * 0.4})`)
    outerGradient.addColorStop(1, `rgba(255, 100, 0, 0)`)

    ctx.fillStyle = outerGradient
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 1.3, 0, Math.PI * 2)
    ctx.fill()

    // Layer 2: Middle impact ring
    const middleGradient = ctx.createRadialGradient(
      circleCenterX, circleCenterY, radius * 0.3,
      circleCenterX, circleCenterY, radius * 0.8
    )
    middleGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
    middleGradient.addColorStop(0.5, `rgba(255, 230, 100, ${alpha * 0.6})`)
    middleGradient.addColorStop(1, `rgba(255, 150, 0, 0)`)

    ctx.fillStyle = middleGradient
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 0.8, 0, Math.PI * 2)
    ctx.fill()

    // Layer 3: Bright core flash
    const coreAlpha = alpha * (1 - progress * 0.5) // Flash brighter early
    ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 0.25, 0, Math.PI * 2)
    ctx.fill()

    // Add impact "shockwave" lines radiating out
    if (progress < 0.5) { // Only in first half
      const shockwaveAlpha = alpha * (1 - progress * 2)
      ctx.strokeStyle = `rgba(255, 255, 200, ${shockwaveAlpha})`
      ctx.lineWidth = 3

      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2
        const startDist = radius * 0.3
        const endDist = radius * 0.9

        ctx.beginPath()
        ctx.moveTo(
          circleCenterX + Math.cos(angle) * startDist,
          circleCenterY + Math.sin(angle) * startDist
        )
        ctx.lineTo(
          circleCenterX + Math.cos(angle) * endDist,
          circleCenterY + Math.sin(angle) * endDist
        )
        ctx.stroke()
      }
    }

    ctx.restore()
  }

  const drawSwordSwing = (centerX, centerY, hitbox, progress) => {
    ctx.save()

    // Sword dimensions (16x28 scaled by 4)
    const swordWidth = 16 * 4
    const swordHeight = 28 * 4

    // Position sword closer to knight (about 0.4 tiles away instead of 1 full tile)
    const distance = TILE_SIZE * 0.4

    // Calculate base angle based on facing direction
    let baseAngle = 0
    let swordX = centerX
    let swordY = centerY
    let flipX = false

    switch (knight.facingDirection) {
      case 'right':
        baseAngle = 0
        swordX = centerX + distance
        swordY = centerY
        flipX = false
        break
      case 'left':
        // Mirror the right swing for left direction
        baseAngle = 0
        swordX = centerX - distance
        swordY = centerY
        flipX = true // Flip horizontally
        break
      case 'up':
        baseAngle = -Math.PI / 2
        swordX = centerX
        swordY = centerY - distance
        break
      case 'down':
        baseAngle = Math.PI / 2
        swordX = centerX
        swordY = centerY + distance
        break
    }

    // Swing animation: 0° -> 80° -> 0° (ease in-out)
    const swingAngle = Math.sin(progress * Math.PI) * (80 * Math.PI / 180)
    const totalAngle = baseAngle + swingAngle

    // Move to sword position
    ctx.translate(swordX, swordY)

    // Apply horizontal flip for left direction
    if (flipX) {
      ctx.scale(-1, 1)
    }

    // Rotate around the grip (bottom of sword)
    ctx.rotate(totalAngle)

    // Draw sword (pivot point is at the grip/bottom)
    // Offset so the grip is at the rotation point
    const swordDrawX = -swordWidth / 2
    const swordDrawY = -swordHeight // Sword extends upward from grip

    drawTile(ctx, hitbox.weapon, swordDrawX, swordDrawY)

    ctx.restore()
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