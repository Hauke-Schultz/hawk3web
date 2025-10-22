// Monster AI and spawning system
import { ref } from 'vue'
import { monsterConfig } from '../config/monsterConfig'
import { levelConfig } from '../config/levelConfig'

export function useMonsterAI(knight, monsters, gameState) {
  let nextMonsterId = 0
  let spawnTimer = 0
  let currentSpawnRate = 5

  // Helper function to check if a grid position is occupied
  const isPositionOccupied = (gridX, gridY) => {
    // Check if knight is at this position (current position)
    if (knight.gridX === gridX && knight.gridY === gridY) {
      return true
    }

    // Check if knight is moving to this position (target position)
    if (knight.targetGridX === gridX && knight.targetGridY === gridY) {
      return true
    }

    // Check if any monster is at this position
    return monsters.value.some(monster =>
      monster.state !== 'dead' &&
      monster.gridX === gridX &&
      monster.gridY === gridY
    )
  }

  const update = (deltaTime) => {
    // Update spawn timer
    spawnTimer += deltaTime

    const levelCfg = levelConfig[gameState.level]

    if (spawnTimer >= currentSpawnRate && monsters.value.length < levelCfg.maxEnemies) {
      spawnMonster()
      spawnTimer = 0
      currentSpawnRate = levelCfg.spawnRate
    }

    // Update all monsters
    monsters.value.forEach(monster => {
      updateMonster(monster, deltaTime)
    })
  }

  const spawnMonster = () => {
    const levelCfg = levelConfig[gameState.level]
    const monsterType = levelCfg.enemyType
    const config = monsterConfig[monsterType]

    // Try to find a free spawn position (max 10 attempts)
    let spawnX, spawnY
    let attempts = 0
    const maxAttempts = 10
    const spawnDistance = 10 // tiles away from knight

    do {
      const angle = Math.random() * Math.PI * 2
      spawnX = Math.round(knight.gridX + Math.cos(angle) * spawnDistance)
      spawnY = Math.round(knight.gridY + Math.sin(angle) * spawnDistance)
      attempts++
    } while (isPositionOccupied(spawnX, spawnY) && attempts < maxAttempts)

    // If we couldn't find a free position after max attempts, don't spawn
    if (isPositionOccupied(spawnX, spawnY)) {
      return
    }

    const monster = {
      id: `monster-${nextMonsterId++}`,
      type: monsterType,
      gridX: spawnX,
      gridY: spawnY,
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
      attackTimer: 0 // Timer for next attack check
    }

    monsters.value.push(monster)
  }

  const updateMonster = (monster, deltaTime) => {
    if (monster.state === 'dead') return

    // Update animation
    monster.animationTimer += deltaTime * 1000

    // Check if monster is moving (position changed recently)
    const previousX = monster.previousGridX ?? monster.gridX
    const previousY = monster.previousGridY ?? monster.gridY
    const isMoving = (previousX !== monster.gridX || previousY !== monster.gridY)

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

    // Store previous position for next frame
    monster.previousGridX = monster.gridX
    monster.previousGridY = monster.gridY

    // Update attack timer
    monster.attackTimer += deltaTime

    // Update movement
    monster.moveTimer += deltaTime

    const moveInterval = 1 / monster.moveSpeed

    if (monster.moveTimer >= moveInterval) {
      moveTowardsKnight(monster)
      monster.moveTimer = 0
    }
  }

  const moveTowardsKnight = (monster) => {
    const dx = knight.gridX - monster.gridX
    const dy = knight.gridY - monster.gridY

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
      if (isPositionOccupied(newX, newY)) {
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
      if (isPositionOccupied(newX, newY)) {
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

    // Only move if the target position is free
    if (!isPositionOccupied(newX, newY)) {
      monster.gridX = newX
      monster.gridY = newY
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
      gameState.kills += 1
      gameState.coins += monster.lootCoins

      // Drop items based on chance
      dropLoot(monster)

      // Remove monster after death animation (1000ms)
      setTimeout(() => {
        removeMonster(monster.id)
      }, 1000)

      return true
    }

    return false
  }

  const dropLoot = (monster) => {
    // This will be handled by the items system
    // For now, just coins are added
  }

  return {
    update,
    spawnMonster,
    removeMonster,
    damageMonster
  }
}

export default useMonsterAI