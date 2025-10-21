// Monster AI and spawning system
import { ref } from 'vue'
import { monsterConfig } from '../config/monsterConfig'
import { levelConfig } from '../config/levelConfig'

export function useMonsterAI(knight, monsters, gameState) {
  let nextMonsterId = 0
  let spawnTimer = 0
  let currentSpawnRate = 5

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

    // Random spawn position around knight (off-screen)
    const spawnDistance = 10 // tiles away from knight
    const angle = Math.random() * Math.PI * 2
    const spawnX = knight.gridX + Math.cos(angle) * spawnDistance
    const spawnY = knight.gridY + Math.sin(angle) * spawnDistance

    const monster = {
      id: `monster-${nextMonsterId++}`,
      type: monsterType,
      gridX: Math.round(spawnX),
      gridY: Math.round(spawnY),
      health: config.health,
      maxHealth: config.health,
      damage: config.damage,
      moveSpeed: config.moveSpeed,
      facingDirection: 'right',
      animationFrame: 0,
      animationTimer: 0,
      moveTimer: 0,
      state: 'walking',
      lootCoins: config.lootCoins,
      lootDropChance: config.lootDropChance
    }

    monsters.value.push(monster)
  }

  const updateMonster = (monster, deltaTime) => {
    if (monster.state === 'dead') return

    // Update animation
    monster.animationTimer += deltaTime * 1000

    if (monster.animationTimer >= 100) {
      monster.animationFrame = (monster.animationFrame + 1) % 8
      monster.animationTimer = 0
    }

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

    // Move in the axis with greater distance (4-axis movement)
    if (Math.abs(dx) > Math.abs(dy)) {
      // Move horizontally
      if (dx > 0) {
        monster.gridX += 1
        monster.facingDirection = 'right'
      } else {
        monster.gridX -= 1
        monster.facingDirection = 'left'
      }
    } else {
      // Move vertically
      if (dy > 0) {
        monster.gridY += 1
        monster.facingDirection = 'down'
      } else {
        monster.gridY -= 1
        monster.facingDirection = 'up'
      }
    }
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

      // Remove monster after death animation
      setTimeout(() => {
        removeMonster(monster.id)
      }, 300)

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