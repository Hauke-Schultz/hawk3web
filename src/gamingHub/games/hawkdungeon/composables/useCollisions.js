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

      // Check if knight and monster are on same grid tile
      if (knight.gridX === monster.gridX && knight.gridY === monster.gridY) {
        damageKnight(monster.damage)
        damageCooldown = DAMAGE_COOLDOWN_TIME
      }
    })
  }

  const checkAttackMonsterCollisions = () => {
    const hitbox = attackHitbox.value
    if (!hitbox) return

    monsters.value.forEach(monster => {
      if (monster.state === 'dead') return

      // Check if attack hitbox overlaps with monster
      if (hitbox.gridX === monster.gridX && hitbox.gridY === monster.gridY) {
        monsterAI.damageMonster(monster, hitbox.damage)
      }
    })
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