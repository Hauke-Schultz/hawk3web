// Monster AI and spawning system
import { ref } from 'vue'
import { monsterConfig } from '../config/monsterConfig'
import { levelConfig } from '../config/levelConfig'

export function useMonsterAI(knight, monsters, gameState, items, levelLoader, bloodSplatterCallback = null, npcSystem = null) {
  let nextMonsterId = 0
  let spawnTimer = 0
  let currentSpawnRate = 5
  let bossPhaseActive = false
  let initialDialogueCompleted = false // Track if initial dialogue is done

  // Helper function to check if a grid position is occupied
  const isPositionOccupied = (gridX, gridY, excludeMonster = null) => {
    // Check if position has a wall
    if (levelLoader && !levelLoader.isWalkable(gridX, gridY)) {
      return true
    }

    // Check if knight is at this position (current position)
    if (knight.gridX === gridX && knight.gridY === gridY) {
      return true
    }

    // Check if knight is moving to this position (target position)
    if (knight.targetGridX === gridX && knight.targetGridY === gridY) {
      return true
    }

    // Check if any monster is at this position OR moving to this position
    return monsters.value.some(monster => {
      // Skip the monster we're checking for (to avoid self-collision)
      if (excludeMonster && monster.id === excludeMonster.id) {
        return false
      }

      if (monster.state === 'dead') {
        return false
      }

      // Get monster grid size (default 1x1, boss is 2x2)
      const monsterWidth = monster.gridWidth || 1
      const monsterHeight = monster.gridHeight || 1

      // Check all tiles occupied by this monster
      for (let dy = 0; dy < monsterHeight; dy++) {
        for (let dx = 0; dx < monsterWidth; dx++) {
          const monsterTileX = monster.gridX + dx
          const monsterTileY = monster.gridY + dy

          // Check current position
          if (monsterTileX === gridX && monsterTileY === gridY) {
            return true
          }

          // Check target position (if monster is moving)
          if (monster.isMovingToTarget) {
            const targetTileX = monster.targetGridX + dx
            const targetTileY = monster.targetGridY + dy
            if (targetTileX === gridX && targetTileY === gridY) {
              return true
            }
          }
        }
      }

      return false
    })
  }

  const update = (deltaTime) => {
    const levelCfg = levelConfig[gameState.level]

    // Check if enemy spawning is paused by NPC dialogue
    const isSpawningPaused = npcSystem && npcSystem.enemySpawningPaused?.value

    // Check if there are NPCs that require initial dialogue completion
    const hasInitialDialogueNPC = npcSystem && npcSystem.npcs.value.some(npc => npc.requireInitialDialogue)

    // If initial dialogue is required but not completed, don't spawn
    if (hasInitialDialogueNPC && !initialDialogueCompleted && !isSpawningPaused) {
      // Check if dialogue was completed
      const npc = npcSystem.npcs.value.find(npc => npc.requireInitialDialogue)
      if (npc && npc.dialogueCompleted) {
        initialDialogueCompleted = true
        console.log('Initial dialogue completed - monsters will now spawn!')
      }
    }

    // Only spawn normal enemies if:
    // 1. NOT in boss phase
    // 2. NOT paused by active NPC dialogue
    // 3. Initial dialogue completed (if required)
    const canSpawn = !bossPhaseActive &&
                     !isSpawningPaused &&
                     (!hasInitialDialogueNPC || initialDialogueCompleted)

    if (canSpawn) {
      // Update spawn timer
      spawnTimer += deltaTime

      if (spawnTimer >= currentSpawnRate && monsters.value.length < levelCfg.maxEnemies) {
        spawnMonster()
        spawnTimer = 0
        currentSpawnRate = levelCfg.spawnRate
      }
    }

    // Update all monsters
    monsters.value.forEach(monster => {
      updateMonster(monster, deltaTime)
    })
  }

  const spawnMonster = (forceBoss = false) => {
    const levelCfg = levelConfig[gameState.level]

    // Determine which monster type to spawn
    let monsterType = levelCfg.enemyType

    // If forcing boss spawn or in boss phase, spawn from bossTypes
    if (forceBoss || bossPhaseActive) {
      if (levelCfg.bossTypes && Array.isArray(levelCfg.bossTypes)) {
        monsterType = levelCfg.bossTypes[Math.floor(Math.random() * levelCfg.bossTypes.length)]
      }
    }
    // Otherwise, spawn normal enemies
    else if (levelCfg.enemyTypes && Array.isArray(levelCfg.enemyTypes)) {
      monsterType = levelCfg.enemyTypes[Math.floor(Math.random() * levelCfg.enemyTypes.length)]
    }

    const config = monsterConfig[monsterType]

    // Get monster size (default 1x1, boss is 2x2)
    const monsterWidth = config.gridWidth || 1
    const monsterHeight = config.gridHeight || 1

    // Helper to check if all tiles for a large monster are free
    const isAreaFree = (x, y) => {
      for (let dy = 0; dy < monsterHeight; dy++) {
        for (let dx = 0; dx < monsterWidth; dx++) {
          if (isPositionOccupied(x + dx, y + dy)) {
            return false
          }
        }
      }
      return true
    }

    // Try to find a free spawn position on a floor tile (max 20 attempts)
    let spawnX, spawnY
    let attempts = 0
    const maxAttempts = 20
    const spawnDistance = 5 // tiles away from knight (reduced from 10 for faster gameplay)

    do {
      const angle = Math.random() * Math.PI * 2
      spawnX = Math.round(knight.gridX + Math.cos(angle) * spawnDistance)
      spawnY = Math.round(knight.gridY + Math.sin(angle) * spawnDistance)
      attempts++
    } while (!isAreaFree(spawnX, spawnY) && attempts < maxAttempts)

    // If we couldn't find a free position after max attempts, don't spawn
    if (!isAreaFree(spawnX, spawnY)) {
      return
    }

    const monster = {
      id: `monster-${nextMonsterId++}`,
      type: monsterType,
      isBoss: forceBoss || bossPhaseActive, // Mark as boss if spawned in boss phase
      gridX: spawnX,
      gridY: spawnY,
      gridWidth: monsterWidth, // Grid size (1x1 for normal, 2x2 for boss)
      gridHeight: monsterHeight,
      targetGridX: spawnX, // Target position for smooth movement
      targetGridY: spawnY,
      renderX: spawnX, // Interpolated rendering position
      renderY: spawnY,
      moveProgress: 0, // 0 to 1 for interpolation
      isMovingToTarget: false,
      health: config.health,
      maxHealth: config.health,
      damage: config.damage,
      moveSpeed: config.moveSpeed,
      attackCheckInterval: config.attackCheckInterval,
      attackChance: config.attackChance,
      facingDirection: 'right',
      animationFrame: 0,
      animationTimer: 0,
      moveTimer: 0,
      state: 'walking',
      lootCoins: config.lootCoins,
      lootDropChance: config.lootDropChance,
      attackTimer: 0, // Timer for next attack check
      deathAnimationProgress: 0, // 0 to 1 for death animation
      deathAnimationStartTime: null // Time when death animation started
    }

    monsters.value.push(monster)
  }

  const updateMonster = (monster, deltaTime) => {
    // Update death animation if monster is dead
    if (monster.state === 'dead') {
      if (!monster.deathAnimationStartTime) {
        monster.deathAnimationStartTime = performance.now()
      }
      const elapsed = performance.now() - monster.deathAnimationStartTime
      monster.deathAnimationProgress = Math.min(elapsed / 1000, 1) // 1000ms animation
      return
    }

    // Update smooth movement interpolation
    if (monster.isMovingToTarget) {
      const moveDuration = 1 / monster.moveSpeed // Duration in seconds
      monster.moveProgress += deltaTime / moveDuration

      if (monster.moveProgress >= 1) {
        // Movement complete
        monster.renderX = monster.targetGridX
        monster.renderY = monster.targetGridY
        monster.gridX = monster.targetGridX
        monster.gridY = monster.targetGridY
        monster.isMovingToTarget = false
        monster.moveProgress = 0
      } else {
        // Smooth interpolation with easing
        const eased = easeInOutQuad(monster.moveProgress)
        const startX = monster.gridX
        const startY = monster.gridY
        monster.renderX = startX + (monster.targetGridX - startX) * eased
        monster.renderY = startY + (monster.targetGridY - startY) * eased
      }
    }

    // Update animation
    monster.animationTimer += deltaTime * 1000

    // Check if monster is moving
    const isMoving = monster.isMovingToTarget

    if (isMoving) {
      // Walking animation: cycle through all 8 frames
      if (monster.animationTimer >= 100) {
        monster.animationFrame = (monster.animationFrame + 1) % 8
        monster.animationTimer = 0
      }
    } else {
      // Idle animation: alternate between frames 0 and 1
      if (monster.animationTimer >= 400) { // Slower idle animation (400ms per frame)
        monster.animationFrame = monster.animationFrame === 0 ? 1 : 0
        monster.animationTimer = 0
      }
    }

    // Update attack timer
    monster.attackTimer += deltaTime

    // Try to initiate new movement
    if (!monster.isMovingToTarget) {
      monster.moveTimer += deltaTime
      const moveInterval = 1 / monster.moveSpeed

      if (monster.moveTimer >= moveInterval) {
        moveTowardsKnight(monster)
        monster.moveTimer = 0
      }
    }
  }

  // Easing function for smooth movement
  const easeInOutQuad = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  const moveTowardsKnight = (monster) => {
    const dx = knight.gridX - monster.gridX
    const dy = knight.gridY - monster.gridY

    // Get monster size (default 1x1, boss is 2x2)
    const monsterWidth = monster.gridWidth || 1
    const monsterHeight = monster.gridHeight || 1

    // Helper to check if all tiles for the new position are free
    const isTargetAreaFree = (targetX, targetY) => {
      for (let dy = 0; dy < monsterHeight; dy++) {
        for (let dx = 0; dx < monsterWidth; dx++) {
          if (isPositionOccupied(targetX + dx, targetY + dy, monster)) {
            return false
          }
        }
      }
      return true
    }

    let newX = monster.gridX
    let newY = monster.gridY
    let newDirection = monster.facingDirection

    // Try to move in the axis with greater distance (4-axis movement)
    if (Math.abs(dx) > Math.abs(dy)) {
      // Try to move horizontally first
      if (dx > 0) {
        newX = monster.gridX + 1
        newDirection = 'right'
      } else {
        newX = monster.gridX - 1
        newDirection = 'left'
      }

      // If horizontal move is blocked, try vertical move instead
      if (!isTargetAreaFree(newX, newY)) {
        newX = monster.gridX // Reset X
        if (dy > 0) {
          newY = monster.gridY + 1
          // Don't change direction for vertical movement
        } else if (dy < 0) {
          newY = monster.gridY - 1
          // Don't change direction for vertical movement
        }
      }
    } else {
      // Try to move vertically first
      if (dy > 0) {
        newY = monster.gridY + 1
        // Don't change direction for vertical movement
      } else {
        newY = monster.gridY - 1
        // Don't change direction for vertical movement
      }

      // If vertical move is blocked, try horizontal move instead
      if (!isTargetAreaFree(newX, newY)) {
        newY = monster.gridY // Reset Y
        if (dx > 0) {
          newX = monster.gridX + 1
          newDirection = 'right'
        } else if (dx < 0) {
          newX = monster.gridX - 1
          newDirection = 'left'
        }
      }
    }

    // Only move if the target area is free (excluding this monster) and not already at target
    if (isTargetAreaFree(newX, newY) && (newX !== monster.gridX || newY !== monster.gridY)) {
      // Set target position for smooth interpolation
      monster.targetGridX = newX
      monster.targetGridY = newY
      monster.isMovingToTarget = true
      monster.moveProgress = 0

      // Only update facing direction if it was changed (horizontal movement)
      if (newDirection !== monster.facingDirection) {
        monster.facingDirection = newDirection
      }
    }
    // If both moves are blocked, monster stays in place
  }

  const removeMonster = (monsterId) => {
    const index = monsters.value.findIndex(m => m.id === monsterId)
    if (index !== -1) {
      monsters.value.splice(index, 1)
    }
  }

  const damageMonster = (monster, damage) => {
    monster.health -= damage

    if (monster.health <= 0) {
      monster.state = 'dead'
      monster.deathAnimationStartTime = performance.now()
      monster.deathAnimationProgress = 0

      // Add blood stain at monster's death position
      if (levelLoader && levelLoader.addBloodStain) {
        // Round to grid position to ensure it's placed correctly
        const bloodX = Math.round(monster.gridX)
        const bloodY = Math.round(monster.gridY)

        // Trigger animated blood splatter effect
        if (bloodSplatterCallback) {
          bloodSplatterCallback(bloodX, bloodY, monster.isBoss)
        }
      }

      // Track kills separately for bosses
      if (monster.isBoss) {
        gameState.bossKills += 1
        console.log(`Boss defeated! Boss kills: ${gameState.bossKills}`)
      } else {
        gameState.kills += 1
      }

      gameState.coins += monster.lootCoins

      // Drop items after 300ms delay (let death animation start first)
      setTimeout(() => {
        dropLoot(monster, items)
      }, 300)

      // Remove monster after death animation (1000ms)
      setTimeout(() => {
        removeMonster(monster.id)
      }, 1000)

      return true
    }

    return false
  }

  const dropLoot = (monster, items) => {
    // Check if there's already an item at this position
    const hasItemAtPosition = items.value.some(item =>
      item.gridX === monster.gridX && item.gridY === monster.gridY
    )

    // Don't spawn items if position is already occupied
    if (hasItemAtPosition) {
      return
    }

    // Check for heart drop
    if (Math.random() < monster.lootDropChance.heart) {
      const heartItem = {
        id: `heart-${Date.now()}-${Math.random()}`,
        type: 'heart',
        gridX: monster.gridX,
        gridY: monster.gridY,
        spawnTime: Date.now(),
        lifetime: 60000 // 60 seconds in ms
      }
      items.value.push(heartItem)
      return // Only drop one item per monster
    }

    // Check for mana potion drop (only if no heart was dropped)
    if (Math.random() < monster.lootDropChance.manaPotion) {
      const manaPotionItem = {
        id: `manaPotion-${Date.now()}-${Math.random()}`,
        type: 'manaPotion',
        gridX: monster.gridX,
        gridY: monster.gridY,
        spawnTime: Date.now(),
        lifetime: 60000 // 60 seconds in ms
      }
      items.value.push(manaPotionItem)
    }
  }

  const startBossPhase = () => {
    bossPhaseActive = true

    // Kill all non-boss monsters immediately
    monsters.value.forEach(monster => {
      if (!monster.isBoss && monster.state !== 'dead') {
        monster.state = 'dead'
        monster.deathAnimationStartTime = performance.now()
        monster.deathAnimationProgress = 0

        // Remove after death animation (1000ms)
        setTimeout(() => {
          removeMonster(monster.id)
        }, 1000)
      }
    })

    // Spawn the boss after a short delay (let normal monsters die first)
    setTimeout(() => {
      spawnMonster(true) // Force boss spawn
      console.log('Boss has appeared!')
    }, 1500)
  }

  return {
    update,
    spawnMonster,
    removeMonster,
    damageMonster,
    startBossPhase
  }
}

export default useMonsterAI