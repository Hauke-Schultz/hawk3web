// Collision detection system
export function useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI) {
  let damageCooldown = 0
  const DAMAGE_COOLDOWN_TIME = 1 // 1 second invincibility after hit

  const update = (deltaTime) => {
    // Update damage cooldown
    if (damageCooldown > 0) {
      damageCooldown -= deltaTime
    }

    // Check knight-monster collisions
    checkKnightMonsterCollisions()

    // Check attack-monster collisions
    if (attackHitbox.value?.active) {
      checkAttackMonsterCollisions()
    }

    // Check knight-item collisions
    checkKnightItemCollisions()
  }

  const checkKnightMonsterCollisions = () => {
    if (damageCooldown > 0) return // Knight is invincible

    monsters.value.forEach(monster => {
      if (monster.state === 'dead') return

      // Calculate Manhattan distance (distance in grid units)
      const distanceX = Math.abs(knight.gridX - monster.gridX)
      const distanceY = Math.abs(knight.gridY - monster.gridY)
      const manhattanDistance = distanceX + distanceY

      // Check if monster is within melee range (1 tile away in 4 directions)
      // This includes: directly on same tile (0,0), or adjacent tiles (1,0), (0,1)
      if (manhattanDistance <= 1) {
        damageKnight(monster.damage)
        damageCooldown = DAMAGE_COOLDOWN_TIME
      }
    })
  }

  const checkAttackMonsterCollisions = () => {
    const hitbox = attackHitbox.value
    if (!hitbox) return

    let hitSomething = false

    monsters.value.forEach(monster => {
      if (monster.state === 'dead') return

      // Check if attack hitbox overlaps with monster
      if (hitbox.gridX === monster.gridX && hitbox.gridY === monster.gridY) {
        const killed = monsterAI.damageMonster(monster, hitbox.damage)
        hitSomething = true

        // Mark monster as hit for visual effect
        monster.isHit = true
        setTimeout(() => {
          if (monster.state !== 'dead') {
            monster.isHit = false
          }
        }, 200)
      }
    })

    // Mark hitbox with hit status for animation intensity
    if (hitbox) {
      hitbox.didHit = hitSomething
    }
  }

  const checkKnightItemCollisions = () => {
    items.value.forEach((item, index) => {
      // Check if knight and item are on same grid tile
      if (knight.gridX === item.gridX && knight.gridY === item.gridY) {
        collectItem(item)
        items.value.splice(index, 1)
      }
    })
  }

  const damageKnight = (damage) => {
    gameState.currentHealth = Math.max(0, gameState.currentHealth - damage)

    // Trigger hit animation
    knight.isHit = true
    setTimeout(() => {
      knight.isHit = false
    }, 300)

    // Check for game over
    if (gameState.currentHealth <= 0) {
      handleGameOver()
    }
  }

  const collectItem = (item) => {
    switch (item.type) {
      case 'heart':
        gameState.currentHealth = Math.min(
          gameState.maxHealth,
          gameState.currentHealth + 1
        )
        break

      case 'manaPotion':
        gameState.currentMana = gameState.maxMana
        break
    }
  }

  const handleGameOver = () => {
    gameState.isRunning = false
    // TODO: Show game over screen
    console.log('Game Over!')
  }

  return {
    update,
    damageKnight,
    collectItem
  }
}

export default useCollisions