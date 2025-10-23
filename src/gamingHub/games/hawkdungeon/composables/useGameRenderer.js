// Game renderer composable
import { watch, onMounted } from 'vue'
import { useSpriteManager } from './useSpriteManager'
import { TILE_SIZE, SPRITE_SCALE } from '../config/spriteConfig'

export function useGameRenderer(canvasRef, gameState, knight, monsters, items, attackHitbox, dungeonOffset, levelLoader) {
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

    // Draw damage effect if knight is hit
    if (knight.isHit) {
      drawDamageEffect(centerX, centerY)
    }

    // Draw attack hitbox(es) in foreground (after knight)
    const hitbox = attackHitbox()
    if (hitbox?.active) {
      if (hitbox.charged) {
        // Calculate progress for charged attack animation
        if (!hitbox.createdAt) {
          hitbox.createdAt = performance.now()
        }
        const elapsed = performance.now() - hitbox.createdAt
        const progress = Math.min(elapsed / 300, 1)

        // Draw spinning sword animation for charged attack
        drawSpinningSword(centerX, centerY, hitbox, progress)

        // Draw multiple hitboxes for charged attack
        hitbox.hitboxes.forEach(pos => {
          drawAttackHitboxAt(centerX, centerY, hitbox, pos.x, pos.y)
        })
      } else {
        // Draw single hitbox for normal attack
        drawAttackHitbox(centerX, centerY, hitbox)
      }
    }
  }

  const drawDungeon = (centerX, centerY) => {
    if (!levelLoader) return

    // Calculate visible tile range based on canvas size and dungeon offset
    const tilesX = Math.ceil(canvasWidth / TILE_SIZE) + 2 // Extra tiles for smooth scrolling
    const tilesY = Math.ceil(canvasHeight / TILE_SIZE) + 2

    // Calculate which tiles are visible
    const knightWorldX = knight.gridX
    const knightWorldY = knight.gridY

    const startTileX = knightWorldX - Math.ceil(tilesX / 2)
    const startTileY = knightWorldY - Math.ceil(tilesY / 2)

    // First pass: Draw floors
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const worldTileX = startTileX + x
        const worldTileY = startTileY + y

        // Calculate screen position using world coordinates + dungeonOffset
        const worldX = worldTileX * TILE_SIZE
        const worldY = worldTileY * TILE_SIZE
        const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
        const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

        // Get floor tile from level or use default
        const floorType = levelLoader.getFloorTile(worldTileX, worldTileY)
        drawTile(ctx, floorType, drawX, drawY)
      }
    }

    // Second pass: Draw walls on top
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const worldTileX = startTileX + x
        const worldTileY = startTileY + y

        // Calculate screen position using world coordinates + dungeonOffset
        const worldX = worldTileX * TILE_SIZE
        const worldY = worldTileY * TILE_SIZE
        const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
        const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

        // Draw wall if present
        if (levelLoader.isWall(worldTileX, worldTileY)) {
          drawTile(ctx, 'wall', drawX, drawY)
        }
      }
    }
  }

  const drawKnight = (centerX, centerY) => {
    // Knight is always drawn at center
    const drawX = centerX - (TILE_SIZE / 2)
    const drawY = centerY - TILE_SIZE // Knight is 32px tall, center on bottom

    const flipX = knight.facingDirection === 'left'

    // Apply damage filter if knight is hit
    if (knight.isHit) {
      ctx.save()

      // Apply CSS-like filters that only affect visible pixels
      // Combination of: brightness (flash), saturate (red tint), hue-rotate (shift to red)
      ctx.filter = 'brightness(1.5) saturate(2) hue-rotate(-10deg) contrast(1.2)'

      drawSprite(
        ctx,
        'knight',
        knight.animationFrame,
        drawX,
        drawY,
        flipX,
        false
      )

      ctx.restore()
    } else {
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
  }

  const drawMonsters = (centerX, centerY) => {
    const monstersList = monsters()
    if (!monstersList) return

    monstersList.forEach(monster => {
      // Use renderX/renderY for smooth interpolated position, fall back to gridX/gridY
      const renderPosX = monster.renderX ?? monster.gridX
      const renderPosY = monster.renderY ?? monster.gridY

      // Calculate absolute screen position based on render position and dungeon offset
      const worldX = renderPosX * TILE_SIZE
      const worldY = renderPosY * TILE_SIZE

      // Convert world coordinates to screen coordinates using dungeonOffset
      const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
      // Adjust Y position for sprite height (center sprite on tile bottom)
      const spriteHeight = monster.type === 'goblin' ? 20 * SPRITE_SCALE : TILE_SIZE
      const drawY = centerY + worldY + dungeonOffset.y - (spriteHeight / 2) + ((TILE_SIZE - spriteHeight) / 2)

      const flipX = monster.facingDirection === 'left'

      // Apply hit filter or death effect for monsters
      if (monster.isHit || monster.state === 'dead') {
        ctx.save()

        if (monster.state === 'dead') {
          // Death animation: grayscale (black and white)
          ctx.filter = 'grayscale(1)'
        } else {
          // Hit animation: bright red flash
          ctx.filter = 'brightness(1.8) saturate(3) hue-rotate(-20deg) contrast(1.5)'
        }

        drawSprite(
          ctx,
          monster.type,
          monster.animationFrame || 0,
          drawX,
          drawY,
          flipX,
          false
        )

        ctx.restore()
      } else {
        drawSprite(
          ctx,
          monster.type,
          monster.animationFrame || 0,
          drawX,
          drawY,
          flipX,
          false
        )
      }

      // Don't draw health bar for dead monsters
      if (monster.state !== 'dead') {
        drawHealthBar(drawX, drawY - 5, TILE_SIZE, monster.health, monster.maxHealth)
      }
    })
  }

  const drawItems = (centerX, centerY) => {
    const itemsList = items()
    if (!itemsList) return

    itemsList.forEach(item => {
      // Calculate absolute world position
      const worldX = item.gridX * TILE_SIZE
      const worldY = item.gridY * TILE_SIZE

      // Convert world coordinates to screen coordinates using dungeonOffset
      const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
      const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

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

    // Draw attack effect at hitbox position
    drawAttackEffect(centerX, centerY, hitbox, progress, hitbox.gridX, hitbox.gridY)
  }

  const drawAttackHitboxAt = (centerX, centerY, hitbox, gridX, gridY) => {
    if (!hitbox || !hitbox.active) return

    // Calculate animation progress (0 to 1) based on creation time
    if (!hitbox.createdAt) {
      hitbox.createdAt = performance.now()
    }
    const elapsed = performance.now() - hitbox.createdAt
    const progress = Math.min(elapsed / 300, 1) // 300ms animation

    // Draw attack effect at specified position
    drawAttackEffect(centerX, centerY, hitbox, progress, gridX, gridY)
  }

  const drawAttackEffect = (centerX, centerY, hitbox, progress, gridX, gridY) => {
    ctx.save()

    // Position circle at specified grid position
    const relativeX = (gridX - knight.gridX) * TILE_SIZE
    const relativeY = (gridY - knight.gridY) * TILE_SIZE
    const circleCenterX = centerX + relativeX
    const circleCenterY = centerY + relativeY

    const maxRadius = TILE_SIZE * 1.2 // 20% bigger!
    const radius = maxRadius * progress
    const alpha = 0.85 * (1 - progress) // Start more opaque

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

  const drawSpinningSword = (centerX, centerY, hitbox, progress) => {
    ctx.save()

    // Sword dimensions (16x28 scaled by 4)
    const swordWidth = 16 * 4
    const swordHeight = 28 * 4

    // Position sword at knight's center
    const swordX = centerX
    const swordY = centerY

    // Determine rotation direction based on facing direction
    // Left: counter-clockwise (negative rotation)
    // Right/Up/Down: clockwise (positive rotation)
    const rotationDirection = knight.facingDirection === 'left' ? -1 : 1

    // Full 360° rotation with grip staying at bottom
    // Rotate around the grip point which stays fixed
    const rotationAngle = progress * Math.PI * 2 * rotationDirection // 0 to ±2π (360°)

    // Move to sword position (knight's center, where grip is)
    ctx.translate(swordX, swordY)

    // Rotate around the grip (bottom of sword)
    ctx.rotate(rotationAngle)

    // Draw sword (pivot point at the grip/bottom)
    // Offset so the grip is at the rotation point
    const swordDrawX = -swordWidth / 2
    const swordDrawY = -swordHeight // Sword extends upward from grip

    // Add slight fade in/out for smoother visual
    const fadeAlpha = Math.sin(progress * Math.PI) // Fade in and out during spin
    ctx.globalAlpha = 0.7 + (fadeAlpha * 0.3)

    drawTile(ctx, hitbox.weapon, swordDrawX, swordDrawY)

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

    // Two-phase swing animation:
    // Phase 1 (0-0.3): Wind up backward -30°
    // Phase 2 (0.3-1.0): Fast swing forward to +80° and back
    let swingAngle = 0

    if (progress < 0.3) {
      // Wind-up phase: ease into -30°
      const windupProgress = progress / 0.3
      const easeWindup = 1 - Math.pow(1 - windupProgress, 2) // Ease out
      swingAngle = -30 * (Math.PI / 180) * easeWindup
    } else {
      // Strike phase: quick swing from -30° to +80° and back
      const strikeProgress = (progress - 0.3) / 0.7
      const strikeSwing = Math.sin(strikeProgress * Math.PI) * (80 * Math.PI / 180)
      const windupOffset = -30 * (Math.PI / 180)
      swingAngle = windupOffset + strikeSwing - (windupOffset * strikeProgress)
    }

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

  const drawDamageEffect = (centerX, centerY) => {
    // Track when the damage effect started
    if (!knight.hitStartTime) {
      knight.hitStartTime = performance.now()
    }

    const elapsed = performance.now() - knight.hitStartTime
    const progress = Math.min(elapsed / 300, 1) // 300ms animation (same as isHit duration)

    // Reset hitStartTime when animation is complete
    if (progress >= 1) {
      knight.hitStartTime = null
      return
    }

    ctx.save()

    // Draw BLOODY impact effect centered on knight
    const circleCenterX = centerX
    const circleCenterY = centerY

    // Expanding blood splash effect
    const maxRadius = TILE_SIZE * 1.5
    const radius = maxRadius * progress
    const alpha = 0.9 * (1 - progress) // Fade out

    // Layer 1: Outer blood splash
    const outerGradient = ctx.createRadialGradient(
      circleCenterX, circleCenterY, 0,
      circleCenterX, circleCenterY, radius * 1.3
    )
    outerGradient.addColorStop(0, `rgba(200, 0, 0, ${alpha * 0.9})`)
    outerGradient.addColorStop(0.3, `rgba(180, 0, 0, ${alpha * 0.7})`)
    outerGradient.addColorStop(0.6, `rgba(150, 0, 0, ${alpha * 0.4})`)
    outerGradient.addColorStop(1, `rgba(100, 0, 0, 0)`)

    ctx.fillStyle = outerGradient
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 1.3, 0, Math.PI * 2)
    ctx.fill()

    // Layer 2: Middle dark red impact
    const middleGradient = ctx.createRadialGradient(
      circleCenterX, circleCenterY, radius * 0.2,
      circleCenterX, circleCenterY, radius * 0.8
    )
    middleGradient.addColorStop(0, `rgba(255, 0, 0, ${alpha})`)
    middleGradient.addColorStop(0.5, `rgba(200, 0, 0, ${alpha * 0.7})`)
    middleGradient.addColorStop(1, `rgba(150, 0, 0, 0)`)

    ctx.fillStyle = middleGradient
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 0.8, 0, Math.PI * 2)
    ctx.fill()

    // Layer 3: Bright center flash (white-red)
    const coreAlpha = alpha * (1 - progress * 0.5)
    ctx.fillStyle = `rgba(255, 100, 100, ${coreAlpha})`
    ctx.beginPath()
    ctx.arc(circleCenterX, circleCenterY, radius * 0.25, 0, Math.PI * 2)
    ctx.fill()

    // Add blood splatter lines radiating out
    if (progress < 0.6) {
      const splatterAlpha = alpha * (1 - progress * 1.5)
      ctx.strokeStyle = `rgba(200, 0, 0, ${splatterAlpha})`
      ctx.lineWidth = 4

      // Random-looking splatter (using deterministic angles)
      for (let i = 0; i < 12; i++) {
        const angle = (i / 12) * Math.PI * 2 + (i % 3) * 0.2 // Slight offset for organic look
        const startDist = radius * 0.2
        const endDist = radius * 1.1

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
  watch([() => knight.animationFrame, () => knight.gridX, () => knight.gridY, () => knight.isHit, monsters, items, attackHitbox, dungeonOffset], () => {
    render()
  }, { deep: true })

  return {
    initialize,
    render
  }
}

export default useGameRenderer