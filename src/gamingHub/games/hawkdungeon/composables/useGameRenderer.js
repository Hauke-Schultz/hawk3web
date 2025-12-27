// Game renderer composable
import { watch, onMounted } from 'vue'
import { useSpriteManager } from './useSpriteManager'
import { TILE_SIZE, SPRITE_SCALE, spriteConfig } from '../config/spriteConfig'

export function useGameRenderer(canvasRef, gameState, knight, monsters, items, attackHitbox, dungeonOffset, lockedDoorFlash, levelLoader, chestSystem, bloodSplatters) {
  const { loadSpritesheet, drawSprite, drawTile, drawAnimatedTile, getAnimatedTileConfig, isLoaded } = useSpriteManager()

  let ctx = null
  let canvasWidth = 0
  let canvasHeight = 0

  let animationFrameId = null

  // Animation state for fountains
  let fountainAnimationFrame = 0
  let fountainAnimationTimer = 0

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

  let lastRenderTime = 0

  const renderLoop = (currentTime = 0) => {
    const deltaTime = currentTime - lastRenderTime
    lastRenderTime = currentTime

    // Update fountain animation (200ms per frame)
    fountainAnimationTimer += deltaTime
    if (fountainAnimationTimer >= 200) {
      fountainAnimationFrame = (fountainAnimationFrame + 1) % 3 // 3 frames
      fountainAnimationTimer = 0
    }

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

    // Draw under layer decorations (below player/enemies)
    drawUnderLayer(centerX, centerY)

    // Draw chests
    drawChests(centerX, centerY)

    // Draw items
    drawItems(centerX, centerY)

    // Draw monsters
    drawMonsters(centerX, centerY)

    // Draw knight (always at center)
    drawKnight(centerX, centerY)

    // Draw attack direction indicator
    drawAttackDirectionIndicator(centerX, centerY)

    // Draw over layer decorations (above player/enemies)
    drawOverLayer(centerX, centerY)

    // Draw damage effect if knight is hit
    if (knight.isHit) {
      drawDamageEffect(centerX, centerY)
    }

    // Draw attack hitbox(es) in foreground (after knight)
    const hitbox = attackHitbox()
    if (hitbox?.active && hitbox.hitboxes) {
      // Calculate progress for attack animation
      if (!hitbox.createdAt) {
        hitbox.createdAt = performance.now()
      }

      // Different animation durations based on weapon
      const isAxe = hitbox.weapon === 'axe'
      const isSpearWeapon = hitbox.weapon === 'spear'
      // Longer animation durations for better visibility
      const animationDuration = isAxe ? 800 : (isSpearWeapon ? 600 : 500) // Axe: 800ms, Spear: 600ms, Sword: 500ms

      const elapsed = performance.now() - hitbox.createdAt
      const progress = Math.min(elapsed / animationDuration, 1)

      // Draw weapon animation based on weapon type
      const isSpear = hitbox.weapon === 'spear'

      if (hitbox.charged && isAxe) {
        // Draw 2-hit zigzag animation for charged axe attack
        drawChargedAxeSwing(centerX, centerY, hitbox, progress)
      } else if (hitbox.charged && isSpear) {
        // Draw multi-thrust animation for charged spear attack
        drawChargedSpearThrust(centerX, centerY, hitbox, progress)
      } else if (hitbox.charged) {
        // Draw spinning animation for charged sword attack
        drawSpinningSword(centerX, centerY, hitbox, progress)
      } else if (isAxe) {
        // Draw axe-specific swing animation for normal axe attack
        drawAxeSwing(centerX, centerY, hitbox, progress)
      } else if (isSpear) {
        // Draw spear thrust animation for normal spear attack
        drawSpearThrust(centerX, centerY, hitbox, progress)
      } else {
        // Draw sword swing animation for sword
        drawSwordSwing(centerX, centerY, hitbox, progress)
      }

      // Draw attack effects for all hitboxes
      hitbox.hitboxes.forEach(pos => {
        drawAttackHitboxAt(centerX, centerY, hitbox, pos.x, pos.y)
      })
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

    // First pass: Draw floors and non-wall tiles
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const worldTileX = startTileX + x
        const worldTileY = startTileY + y

        // Skip tiles outside level bounds
        if (worldTileX < 0 || worldTileX >= levelLoader.levelData.width ||
            worldTileY < 0 || worldTileY >= levelLoader.levelData.height) {
          continue
        }

        // Calculate screen position using world coordinates + dungeonOffset
        const worldX = worldTileX * TILE_SIZE
        const worldY = worldTileY * TILE_SIZE
        const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
        const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

        // Get tile type and sprite
        const tileType = levelLoader.getTileType(worldTileX, worldTileY)

        // Skip walls and barriers (draw them in second pass) and empty tiles
        if (tileType === 'wall' || tileType === 'pillar' || tileType === 'manaWall' || tileType === 'healthWall' || tileType === 'empty') {
          continue
        }

        // Get the sprite for this tile (considering its current state)
        const sprite = levelLoader.getTileSpriteAt(worldTileX, worldTileY)

        // Draw the tile
        if (sprite) {
          // Check if this tile type is animated (fountain)
          const isAnimatedFountain = tileType === 'manaFountain' || tileType === 'healthFountain'

          if (isAnimatedFountain) {
            // Draw animated fountain
            drawAnimatedTile(ctx, sprite, fountainAnimationFrame, drawX, drawY)
          } else {
            // Check if this is a locked door that should flash red
            const isLockedDoor = tileType === 'door' &&
                                 lockedDoorFlash &&
                                 lockedDoorFlash.active &&
                                 lockedDoorFlash.gridX === worldTileX &&
                                 lockedDoorFlash.gridY === worldTileY

            if (isLockedDoor) {
              // Draw locked door with red flash effect
              ctx.save()
              ctx.filter = 'brightness(1.5) saturate(3) hue-rotate(-60deg) contrast(1.5)'
              drawTile(ctx, sprite, drawX, drawY)
              ctx.restore()
            } else {
              // Draw normal tile
              drawTile(ctx, sprite, drawX, drawY)
            }
          }
        }
      }
    }

    // Second pass: Draw walls on top
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const worldTileX = startTileX + x
        const worldTileY = startTileY + y

        // Skip tiles outside level bounds
        if (worldTileX < 0 || worldTileX >= levelLoader.levelData.width ||
            worldTileY < 0 || worldTileY >= levelLoader.levelData.height) {
          continue
        }

        // Calculate screen position using world coordinates + dungeonOffset
        const worldX = worldTileX * TILE_SIZE
        const worldY = worldTileY * TILE_SIZE
        const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
        const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

        // Draw barriers (walls, pillars) if present
        const tileType = levelLoader.getTileType(worldTileX, worldTileY)
        if (tileType === 'wall') {
          drawTile(ctx, 'W', drawX, drawY)
        } else if (tileType === 'pillar') {
          drawTile(ctx, 'K', drawX, drawY)
        } else if (tileType === 'manaWall') {
          // Draw animated mana wall
          drawAnimatedTile(ctx, 'manaWall', fountainAnimationFrame, drawX, drawY)
        } else if (tileType === 'healthWall') {
          // Draw animated health wall
          drawAnimatedTile(ctx, 'healthWall', fountainAnimationFrame, drawX, drawY)
        }
      }
    }
  }

  const drawUnderLayer = (centerX, centerY) => {
    if (!levelLoader) return

    // Calculate visible tile range
    const tilesX = Math.ceil(canvasWidth / TILE_SIZE) + 2
    const tilesY = Math.ceil(canvasHeight / TILE_SIZE) + 2

    const knightWorldX = knight.gridX
    const knightWorldY = knight.gridY

    const startTileX = knightWorldX - Math.ceil(tilesX / 2)
    const startTileY = knightWorldY - Math.ceil(tilesY / 2)

    // Draw under layer decorations
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const worldTileX = startTileX + x
        const worldTileY = startTileY + y

        // Skip tiles outside level bounds
        if (worldTileX < 0 || worldTileX >= levelLoader.levelData.width ||
            worldTileY < 0 || worldTileY >= levelLoader.levelData.height) {
          continue
        }

        let tileChar = null

        // First check for dynamic decorations (they override static ones)
        const dynamicDeco = levelLoader.getDynamicUnderDecoration(worldTileX, worldTileY)
        if (dynamicDeco) {
          tileChar = dynamicDeco
        } else {
          // Get character from static underLayer
          const underLayer = levelLoader.levelData.underLayer
          if (underLayer && underLayer[worldTileY]) {
            tileChar = underLayer[worldTileY][worldTileX]
          }
        }

        // Skip empty/transparent tiles
        if (!tileChar || tileChar === '.') continue

        // Get sprite config for this decoration
        const decoSprite = spriteConfig.underLayerDecorations[tileChar]
        if (!decoSprite) continue

        // Calculate screen position
        const worldX = worldTileX * TILE_SIZE
        const worldY = worldTileY * TILE_SIZE
        const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
        const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

        // Draw the decoration sprite
        drawTile(ctx, tileChar, drawX, drawY, 'underLayer')
      }
    }

    // Draw blood splatters after under layer decorations
    drawBloodSplatters(centerX, centerY)
  }

  const drawBloodSplatters = (centerX, centerY) => {
    if (!bloodSplatters || !bloodSplatters.value) return

    const currentTime = performance.now()
    const fadeOutDuration = 10000 // 10 seconds

    // Remove expired splatters (older than fadeOutDuration)
    bloodSplatters.value = bloodSplatters.value.filter(splatter => {
      const age = currentTime - splatter.createdAt
      return age < fadeOutDuration
    })

    // Draw each active splatter
    bloodSplatters.value.forEach(splatter => {
      const age = currentTime - splatter.createdAt

      // Calculate opacity (stay at 1.0 for first 7 seconds, then fade out over 3 seconds)
      let opacity = 1.0
      if (age > 7000) {
        opacity = 1.0 - ((age - 7000) / 3000)
      }
      opacity = Math.max(0, Math.min(1, opacity))

      // Calculate screen position
      const worldX = splatter.gridX * TILE_SIZE
      const worldY = splatter.gridY * TILE_SIZE
      const drawX = centerX + worldX + dungeonOffset.x
      const drawY = centerY + worldY + dungeonOffset.y

      // Draw each pixel in the splatter
      splatter.pixels.forEach(pixel => {
        const pixelX = drawX + pixel.x
        const pixelY = drawY + pixel.y

        ctx.fillStyle = `rgba(${pixel.red}, ${pixel.green}, ${pixel.blue}, ${pixel.alpha * opacity})`
        ctx.fillRect(
          Math.round(pixelX - pixel.size / 2),
          Math.round(pixelY - pixel.size / 2),
          pixel.size,
          pixel.size
        )
      })
    })
  }

  const drawOverLayer = (centerX, centerY) => {
    if (!levelLoader) return

    // Calculate visible tile range
    const tilesX = Math.ceil(canvasWidth / TILE_SIZE) + 2
    const tilesY = Math.ceil(canvasHeight / TILE_SIZE) + 2

    const knightWorldX = knight.gridX
    const knightWorldY = knight.gridY

    const startTileX = knightWorldX - Math.ceil(tilesX / 2)
    const startTileY = knightWorldY - Math.ceil(tilesY / 2)

    // Draw over layer decorations
    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const worldTileX = startTileX + x
        const worldTileY = startTileY + y

        // Skip tiles outside level bounds
        if (worldTileX < 0 || worldTileX >= levelLoader.levelData.width ||
            worldTileY < 0 || worldTileY >= levelLoader.levelData.height) {
          continue
        }

        let tileChar = null

        // First check for dynamic decorations (they override static ones)
        const dynamicDeco = levelLoader.getDynamicOverDecoration(worldTileX, worldTileY)
        if (dynamicDeco) {
          tileChar = dynamicDeco
        } else {
          // Get character from static overLayer
          const overLayer = levelLoader.levelData.overLayer
          if (overLayer && overLayer[worldTileY]) {
            tileChar = overLayer[worldTileY][worldTileX]
          }
        }

        // Skip empty/transparent tiles
        if (!tileChar || tileChar === '.') continue

        // Get sprite config for this decoration
        const decoSprite = spriteConfig.overLayerDecorations[tileChar]
        if (!decoSprite) continue

        // Calculate screen position
        const worldX = worldTileX * TILE_SIZE
        const worldY = worldTileY * TILE_SIZE
        const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
        const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

        // Check if this decoration is animated
        if (decoSprite.animated) {
          // Draw animated decoration (e.g., torch)
          drawAnimatedTile(ctx, decoSprite.animated, fountainAnimationFrame, drawX, drawY)
        } else {
          // Draw static decoration sprite
          drawTile(ctx, tileChar, drawX, drawY, 'overLayer')
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

  const drawAttackDirectionIndicator = (centerX, centerY) => {
    // Don't show indicator during attack
    if (knight.isAttacking) return

    ctx.save()

    // Calculate position based on attack direction
    let indicatorX = centerX
    let indicatorY = centerY

    const offset = TILE_SIZE * 0.7 // Distance from knight center

    switch (knight.direction) {
      case 'up':
        indicatorY -= offset
        break
      case 'down':
        indicatorY += offset
        break
      case 'left':
        indicatorX -= offset
        break
      case 'right':
        indicatorX += offset
        break
    }

    // Pulsing animation
    const time = performance.now()
    const pulseScale = 0.8 + Math.sin(time / 200) * 0.2 // Pulse between 0.6 and 1.0
    const pulseAlpha = 0.6 + Math.sin(time / 200) * 0.3 // Alpha between 0.3 and 0.9

    const baseRadius = 6
    const radius = baseRadius * pulseScale

    // Outer glow (yellow-white)
    const outerGradient = ctx.createRadialGradient(
      indicatorX, indicatorY, 0,
      indicatorX, indicatorY, radius * 2.5
    )
    outerGradient.addColorStop(0, `rgba(255, 255, 150, ${pulseAlpha * 0.8})`)
    outerGradient.addColorStop(0.4, `rgba(255, 230, 100, ${pulseAlpha * 0.5})`)
    outerGradient.addColorStop(1, 'rgba(255, 200, 50, 0)')

    ctx.fillStyle = outerGradient
    ctx.beginPath()
    ctx.arc(indicatorX, indicatorY, radius * 2.5, 0, Math.PI * 2)
    ctx.fill()

    // Inner bright core (white)
    const innerGradient = ctx.createRadialGradient(
      indicatorX, indicatorY, 0,
      indicatorX, indicatorY, radius
    )
    innerGradient.addColorStop(0, `rgba(255, 255, 255, ${pulseAlpha})`)
    innerGradient.addColorStop(0.7, `rgba(255, 255, 200, ${pulseAlpha * 0.8})`)
    innerGradient.addColorStop(1, `rgba(255, 230, 100, ${pulseAlpha * 0.3})`)

    ctx.fillStyle = innerGradient
    ctx.beginPath()
    ctx.arc(indicatorX, indicatorY, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()
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

      // Get sprite size - boss is 2x2 tiles
      const spriteWidth = (monster.gridWidth || 1) * TILE_SIZE
      const spriteHeight = (monster.gridHeight || 1) * TILE_SIZE

      // Convert world coordinates to screen coordinates using dungeonOffset
      const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)

      // Adjust Y position for sprite height
      let offsetY = 0
      if (monster.type === 'goblin') {
        offsetY = (TILE_SIZE - 24 * SPRITE_SCALE) / 2
      } else if (monster.type === 'orc') {
        offsetY = (TILE_SIZE - 24 * SPRITE_SCALE) / 2
      } else if (monster.type.includes('boss')) {
        // Boss sprite is centered on the 2x2 grid
        offsetY = 0
      }
      const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2) + offsetY

      const flipX = monster.facingDirection === 'left'

      // Calculate death animation offset and clip
      // For death animation, use actual sprite height from config
      let actualSpriteHeight = TILE_SIZE
      if (monster.type === 'goblin' || monster.type === 'orc') {
        actualSpriteHeight = 24 * SPRITE_SCALE
      } else if (monster.type.includes('boss')) {
        actualSpriteHeight = 46 * SPRITE_SCALE // Boss sprite height from spriteConfig
      }

      let deathClipHeight = actualSpriteHeight
      let deathClipOffsetY = 0

      if (monster.state === 'dead' && monster.deathAnimationProgress !== undefined) {
        // Shrink visible height from full to 0 (clips from bottom)
        deathClipHeight = actualSpriteHeight * (1 - monster.deathAnimationProgress)
        // Clip from bottom by moving clip rect down
        deathClipOffsetY = actualSpriteHeight * monster.deathAnimationProgress
      }

      // Apply hit filter or death effect for monsters
      if (monster.isHit || monster.state === 'dead') {
        ctx.save()

        if (monster.state === 'dead') {
          // Death animation: grayscale (black and white)
          ctx.filter = 'grayscale(1)'

          // Set up clipping for death animation - clip from bottom
          if (deathClipHeight > 0) {
            ctx.beginPath()
            // Clip rect moves down as monster sinks
            // Use sprite width for clipping (boss is 2x wide)
            const clipWidth = (monster.type.includes('boss')) ? spriteWidth : TILE_SIZE
            ctx.rect(drawX, drawY + deathClipOffsetY, clipWidth, deathClipHeight)
            ctx.clip()

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
        } else {
          // Hit animation: bright red flash
          ctx.filter = 'brightness(1.8) saturate(3) hue-rotate(-20deg) contrast(1.5)'

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
        // Position health bar centered above the monster
        // For boss (2x2), center the health bar over the 2-tile width
        const healthBarX = monster.type.includes('boss') ? drawX + TILE_SIZE / 2 : drawX
        drawHealthBar(healthBarX, drawY - 12, monster.health, monster.maxHealth)
      }
    })
  }

  const drawChests = (centerX, centerY) => {
    if (!chestSystem) return
    const chestsList = chestSystem.chests.value
    if (!chestsList) return

    chestsList.forEach(chest => {
      // Calculate absolute world position
      const worldX = chest.gridX * TILE_SIZE
      const worldY = chest.gridY * TILE_SIZE

      // Convert world coordinates to screen coordinates using dungeonOffset
      const drawX = centerX + worldX + dungeonOffset.x - (TILE_SIZE / 2)
      const drawY = centerY + worldY + dungeonOffset.y - (TILE_SIZE / 2)

      // Draw chest sprite based on open/closed state
      const spriteType = chest.isOpen ? chest.config.spriteOpen : chest.config.spriteClosed
      drawTile(ctx, spriteType, drawX, drawY)
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

      // For weapon items, use weaponName as tileType
      const tileType = item.type === 'weapon' && item.weaponName ? item.weaponName : item.type
      drawTile(ctx, tileType, drawX, drawY)
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

    // Different animation durations based on weapon
    const isAxe = hitbox.weapon === 'axe'
    const isSpearWeapon = hitbox.weapon === 'spear'
    // Longer animation durations for better visibility
    const animationDuration = isAxe ? 800 : (isSpearWeapon ? 600 : 500) // Axe: 800ms, Spear: 600ms, Sword: 500ms

    const elapsed = performance.now() - hitbox.createdAt
    const progress = Math.min(elapsed / animationDuration, 1)

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

    // Different colors based on weapon type
    const isAxe = hitbox.weapon === 'axe'
    const isSpear = hitbox.weapon === 'spear'

    if (isAxe) {
      // AXE: Red/Orange/Dark fire effect (powerful cleaving strike)
      // Layer 1: Outer explosive glow - dark red/orange
      const outerGradient = ctx.createRadialGradient(
          circleCenterX, circleCenterY, 0,
          circleCenterX, circleCenterY, radius * 1.3
      )
      outerGradient.addColorStop(0, `rgba(255, 100, 50, ${alpha * 0.9})`)
      outerGradient.addColorStop(0.3, `rgba(220, 50, 30, ${alpha * 0.7})`)
      outerGradient.addColorStop(0.6, `rgba(180, 30, 10, ${alpha * 0.4})`)
      outerGradient.addColorStop(1, `rgba(100, 0, 0, 0)`)

      ctx.fillStyle = outerGradient
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 1.3, 0, Math.PI * 2)
      ctx.fill()

      // Layer 2: Middle impact ring - bright red
      const middleGradient = ctx.createRadialGradient(
          circleCenterX, circleCenterY, radius * 0.3,
          circleCenterX, circleCenterY, radius * 0.8
      )
      middleGradient.addColorStop(0, `rgba(255, 150, 100, ${alpha})`)
      middleGradient.addColorStop(0.5, `rgba(255, 80, 50, ${alpha * 0.6})`)
      middleGradient.addColorStop(1, `rgba(200, 50, 0, 0)`)

      ctx.fillStyle = middleGradient
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 0.8, 0, Math.PI * 2)
      ctx.fill()

      // Layer 3: Bright core flash - orange-white
      const coreAlpha = alpha * (1 - progress * 0.5)
      ctx.fillStyle = `rgba(255, 200, 150, ${coreAlpha})`
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 0.25, 0, Math.PI * 2)
      ctx.fill()

      // Add impact "shockwave" lines - red/orange
      if (progress < 0.5) {
        const shockwaveAlpha = alpha * (1 - progress * 2)
        ctx.strokeStyle = `rgba(255, 100, 50, ${shockwaveAlpha})`
        ctx.lineWidth = 4

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
    } else if (isSpear) {
      // SPEAR: Orange/Amber effect (piercing thrust)
      // Layer 1: Outer explosive glow - orange
      const outerGradient = ctx.createRadialGradient(
          circleCenterX, circleCenterY, 0,
          circleCenterX, circleCenterY, radius * 1.3
      )
      outerGradient.addColorStop(0, `rgba(255, 165, 50, ${alpha * 0.9})`)
      outerGradient.addColorStop(0.3, `rgba(255, 140, 30, ${alpha * 0.7})`)
      outerGradient.addColorStop(0.6, `rgba(255, 100, 0, ${alpha * 0.4})`)
      outerGradient.addColorStop(1, `rgba(200, 80, 0, 0)`)

      ctx.fillStyle = outerGradient
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 1.3, 0, Math.PI * 2)
      ctx.fill()

      // Layer 2: Middle impact ring - bright orange
      const middleGradient = ctx.createRadialGradient(
          circleCenterX, circleCenterY, radius * 0.3,
          circleCenterX, circleCenterY, radius * 0.8
      )
      middleGradient.addColorStop(0, `rgba(255, 200, 100, ${alpha})`)
      middleGradient.addColorStop(0.5, `rgba(255, 140, 50, ${alpha * 0.6})`)
      middleGradient.addColorStop(1, `rgba(255, 100, 0, 0)`)

      ctx.fillStyle = middleGradient
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 0.8, 0, Math.PI * 2)
      ctx.fill()

      // Layer 3: Bright core flash - orange-white
      const coreAlpha = alpha * (1 - progress * 0.5)
      ctx.fillStyle = `rgba(255, 220, 150, ${coreAlpha})`
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 0.25, 0, Math.PI * 2)
      ctx.fill()

      // Add piercing lines (directional thrust lines)
      if (progress < 0.5) {
        const shockwaveAlpha = alpha * (1 - progress * 1.7)
        ctx.strokeStyle = `rgba(255, 140, 50, ${shockwaveAlpha})`
        ctx.lineWidth = 3

        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
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
    } else {
      // SWORD: Yellow/Gold effect (original)
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
      const coreAlpha = alpha * (1 - progress * 0.5)
      ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha})`
      ctx.beginPath()
      ctx.arc(circleCenterX, circleCenterY, radius * 0.25, 0, Math.PI * 2)
      ctx.fill()

      // Add impact "shockwave" lines
      if (progress < 0.5) {
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
    }

    ctx.restore()
  }

  const drawChargedAxeSwing = (centerX, centerY, hitbox, progress) => {
    ctx.save()

    // Axe dimensions (16x28 scaled by 4)
    const axeWidth = 16 * 4
    const axeHeight = 28 * 4

    // Position axe slightly away from knight based on attack direction
    const distance = TILE_SIZE * 0.3

    // Position based on attack direction
    let axeX = centerX
    let axeY = centerY

    switch (knight.direction) {
      case 'up':
        axeY = centerY - distance
        break
      case 'down':
        axeY = centerY + distance
        break
      case 'left':
        axeX = centerX - distance
        break
      case 'right':
        axeX = centerX + distance
        break
    }

    // Base angle and flip based on FACING direction (not attack direction)
    let baseAngle = 0
    let flipX = false

    if (knight.facingDirection === 'left') {
      baseAngle = 0
      flipX = true
    } else {
      // right
      baseAngle = 0
      flipX = false
    }

    let swingAngle = 0
    let offsetY = 0 // Immer vertikaler Offset (hoch/runter schwingen)

    const swingAmplitude = 80 * (Math.PI / 180) // ±80° für deutlicheren Swing

    // Zwei DEUTLICH getrennte Schläge (vertikal schwingen, unabhängig von Angriffsrichtung)
    if (progress < 0.25) {
      // Schlag 1: Von Mitte nach OBEN
      const strikeProgress = progress / 0.25
      const easeOut = 1 - Math.pow(1 - strikeProgress, 3)
      swingAngle = -swingAmplitude * easeOut
      offsetY = -TILE_SIZE * 0.6 * easeOut
    } else if (progress < 0.5) {
      // Schlag 2: Von OBEN nach UNTEN (großer Schwung)
      const strikeProgress = (progress - 0.25) / 0.25
      const easeInOut = strikeProgress < 0.5
        ? 2 * strikeProgress * strikeProgress
        : 1 - Math.pow(-2 * strikeProgress + 2, 2) / 2

      // Von -80° zu +80° = 160° Schwung
      swingAngle = -swingAmplitude + (swingAmplitude * 2) * easeInOut
      offsetY = -TILE_SIZE * 0.6 + (TILE_SIZE * 1.2) * easeInOut
    } else {
      // Recovery: Von UNTEN zurück zur Mitte
      const recoveryProgress = (progress - 0.5) / 0.5
      const easeIn = recoveryProgress * recoveryProgress

      swingAngle = swingAmplitude * (1 - easeIn)
      offsetY = TILE_SIZE * 0.6 * (1 - easeIn)
    }

    // Apply offset
    axeY += offsetY

    const totalAngle = baseAngle + swingAngle

    // Move to axe position
    ctx.translate(axeX, axeY)

    // Apply horizontal flip for left direction
    if (flipX) {
      ctx.scale(-1, 1)
    }

    // Rotate around the grip (bottom of axe)
    ctx.rotate(totalAngle)

    // Draw axe (pivot point at the grip/bottom)
    const axeDrawX = -axeWidth / 2
    const axeDrawY = -axeHeight

    drawTile(ctx, hitbox.weapon, axeDrawX, axeDrawY)

    ctx.restore()
  }

  const drawAxeSwing = (centerX, centerY, hitbox, progress) => {
    ctx.save()

    // Axe dimensions (16x28 scaled by 4)
    const axeWidth = 16 * 4
    const axeHeight = 28 * 4

    // Position axe slightly away from knight based on attack direction
    const distance = TILE_SIZE * 0.3

    // Position based on attack direction
    let axeX = centerX
    let axeY = centerY

    switch (knight.direction) {
      case 'up':
        axeY = centerY - distance
        break
      case 'down':
        axeY = centerY + distance
        break
      case 'left':
        axeX = centerX - distance
        break
      case 'right':
        axeX = centerX + distance
        break
    }

    // Base angle and flip based on FACING direction (not attack direction)
    let baseAngle = 0
    let flipX = false

    if (knight.facingDirection === 'left') {
      baseAngle = 0
      flipX = true
    } else {
      // right
      baseAngle = 0
      flipX = false
    }

    // Three-phase animation:
    // Phase 1 (0-0.15): Quick wind-up upward -20°
    // Phase 2 (0.15-0.5): Fast downward swing to +60° (vertical swing)
    // Phase 3 (0.5-1.0): Slow pull back to 0°
    let swingAngle = 0
    let verticalDistance = 0

    if (progress < 0.15) {
      // Wind-up phase: quick pull back upward
      const windupProgress = progress / 0.15
      const easeWindup = 1 - Math.pow(1 - windupProgress, 2)
      swingAngle = -20 * (Math.PI / 180) * easeWindup
      verticalDistance = -TILE_SIZE * 0.1 * easeWindup // Pull back slightly upward
    } else if (progress < 0.5) {
      // Strike phase: fast swing downward
      const strikeProgress = (progress - 0.15) / 0.35
      const easeStrike = 1 - Math.pow(1 - strikeProgress, 3) // Fast ease out
      const windupOffset = -20 * (Math.PI / 180)
      const forwardSwing = 60 * (Math.PI / 180)
      swingAngle = windupOffset + (forwardSwing - windupOffset) * easeStrike
      verticalDistance = TILE_SIZE * 0.4 * easeStrike // Push downward
    } else {
      // Recovery phase: slow pull back
      const recoveryProgress = (progress - 0.5) / 0.5
      const easeRecovery = recoveryProgress * recoveryProgress // Slow ease in
      const currentAngle = 60 * (Math.PI / 180)
      swingAngle = currentAngle * (1 - easeRecovery)
      const currentDistance = TILE_SIZE * 0.4
      verticalDistance = currentDistance * (1 - easeRecovery)
    }

    // Apply vertical movement (always up/down, regardless of attack direction)
    axeY += verticalDistance

    const totalAngle = baseAngle + swingAngle

    // Move to axe position
    ctx.translate(axeX, axeY)

    // Apply horizontal flip for left direction
    if (flipX) {
      ctx.scale(-1, 1)
    }

    // Rotate around the grip (bottom of axe)
    ctx.rotate(totalAngle)

    // Draw axe (pivot point at the grip/bottom)
    const axeDrawX = -axeWidth / 2
    const axeDrawY = -axeHeight

    drawTile(ctx, hitbox.weapon, axeDrawX, axeDrawY)

    ctx.restore()
  }

  const drawSpearThrust = (centerX, centerY, hitbox, progress) => {
    ctx.save()

    // Spear dimensions (16x28 scaled by 4)
    const spearWidth = 16 * 4
    const spearHeight = 28 * 4

    // Position based on attack direction
    let spearX = centerX
    let spearY = centerY

    // Base angle and flip based on FACING direction
    let baseAngle = 0
    let flipX = knight.facingDirection === 'left'

    // Fast thrust animation:
    // Phase 1 (0-0.2): Quick pull back
    // Phase 2 (0.2-0.6): Fast thrust forward
    // Phase 3 (0.6-1.0): Pull back to ready position
    let thrustDistance = 0

    if (progress < 0.2) {
      // Pull back phase
      const pullbackProgress = progress / 0.2
      const easePullback = pullbackProgress * pullbackProgress
      thrustDistance = -TILE_SIZE * 0.15 * easePullback
    } else if (progress < 0.6) {
      // Thrust forward phase
      const thrustProgress = (progress - 0.2) / 0.4
      const easeThrust = 1 - Math.pow(1 - thrustProgress, 3)
      thrustDistance = TILE_SIZE * 0.7 * easeThrust
    } else {
      // Pull back phase
      const recoverProgress = (progress - 0.6) / 0.4
      const easeRecover = recoverProgress * recoverProgress
      thrustDistance = TILE_SIZE * 0.7 * (1 - easeRecover)
    }

    // Apply thrust in the attack direction
    // Rotate 90 degrees clockwise from original orientation
    switch (knight.direction) {
      case 'up':
        spearY = centerY - thrustDistance
        baseAngle = 0 // Changed from -Math.PI / 2
        break
      case 'down':
        spearY = centerY + thrustDistance
        baseAngle = Math.PI // Changed from Math.PI / 2
        break
      case 'left':
        spearX = centerX - thrustDistance
        baseAngle = -Math.PI / 2 // Changed from Math.PI
        break
      case 'right':
        spearX = centerX + thrustDistance
        baseAngle = Math.PI / 2 // Changed from 0
        break
    }

    // Move to spear position
    ctx.translate(spearX, spearY)

    // Apply horizontal flip for left facing
    if (flipX && (knight.direction === 'up' || knight.direction === 'down')) {
      ctx.scale(-1, 1)
    }

    // Rotate based on attack direction
    ctx.rotate(baseAngle)

    // Draw spear
    const spearDrawX = -spearWidth / 2
    const spearDrawY = -spearHeight

    drawTile(ctx, hitbox.weapon, spearDrawX, spearDrawY)

    ctx.restore()
  }

  const drawChargedSpearThrust = (centerX, centerY, hitbox, progress) => {
    ctx.save()

    // Spear dimensions (16x28 scaled by 4)
    const spearWidth = 16 * 4
    const spearHeight = 28 * 4

    // Position based on attack direction
    let spearX = centerX
    let spearY = centerY

    // Base angle and flip based on FACING direction
    let baseAngle = 0
    let flipX = knight.facingDirection === 'left'

    // Triple thrust animation (3 schnelle Stöße)
    // Verwende Sinus-Welle für 3 schnelle Vor-und-Zurück Bewegungen
    const thrustCycles = 3
    const thrustWave = Math.sin(progress * thrustCycles * Math.PI)

    // Nur vorwärts stoßen (keine negativen Werte)
    const thrustDistance = Math.max(0, thrustWave) * TILE_SIZE * 0.8

    // Apply thrust in the attack direction
    // Rotate 90 degrees clockwise from original orientation
    switch (knight.direction) {
      case 'up':
        spearY = centerY - thrustDistance
        baseAngle = 0 // Changed from -Math.PI / 2
        break
      case 'down':
        spearY = centerY + thrustDistance
        baseAngle = Math.PI // Changed from Math.PI / 2
        break
      case 'left':
        spearX = centerX - thrustDistance
        baseAngle = -Math.PI / 2 // Changed from Math.PI
        break
      case 'right':
        spearX = centerX + thrustDistance
        baseAngle = Math.PI / 2 // Changed from 0
        break
    }

    // Move to spear position
    ctx.translate(spearX, spearY)

    // Apply horizontal flip for left facing
    if (flipX && (knight.direction === 'up' || knight.direction === 'down')) {
      ctx.scale(-1, 1)
    }

    // Rotate based on attack direction
    ctx.rotate(baseAngle)

    // Draw spear
    const spearDrawX = -spearWidth / 2
    const spearDrawY = -spearHeight

    drawTile(ctx, hitbox.weapon, spearDrawX, spearDrawY)

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

  const drawHealthBar = (x, y, current, max) => {
    // Sprite width minus 8px (TILE_SIZE = 64px - 8px = 56px)
    const barWidth = TILE_SIZE - 16
    // Inner bar height: 4px
    const barHeight = 4
    // 4px border
    const borderWidth = 4

    const percentage = current / max

    // Draw black border (4px all around)
    ctx.fillStyle = '#000000'
    ctx.fillRect(
      x - borderWidth + 8,
      y - borderWidth,
      barWidth + (borderWidth * 2),
      barHeight + (borderWidth * 2)
    )

    // Draw dark gray background inside border
    ctx.fillStyle = '#1a1a1a'
    ctx.fillRect(x + 8, y, barWidth, barHeight)

    // Draw health bar with color based on percentage
    let healthColor
    if (percentage > 0.6) {
      healthColor = '#44ff44' // Green
    } else if (percentage > 0.3) {
      healthColor = '#ffaa44' // Orange
    } else {
      healthColor = '#ff4444' // Red
    }

    ctx.fillStyle = healthColor
    ctx.fillRect(x + 8, y, barWidth * percentage, barHeight)
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