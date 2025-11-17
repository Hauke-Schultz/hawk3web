// Collision detection system
export function useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI, gameOverCallback = null, unlockWeapon = null) {
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

      // Get monster grid size (default 1x1, boss is 2x2)
      const monsterWidth = monster.gridWidth || 1
      const monsterHeight = monster.gridHeight || 1

      // Check if knight is within melee range of any of the monster's grid tiles
      let inRange = false
      for (let dy = 0; dy < monsterHeight; dy++) {
        for (let dx = 0; dx < monsterWidth; dx++) {
          const monsterTileX = monster.gridX + dx
          const monsterTileY = monster.gridY + dy

          const distanceX = Math.abs(knight.gridX - monsterTileX)
          const distanceY = Math.abs(knight.gridY - monsterTileY)
          const manhattanDistance = distanceX + distanceY

          // Check if monster tile is within melee range (1 tile away in 4 directions)
          // This includes: directly on same tile (0,0), or adjacent tiles (1,0), (0,1)
          if (manhattanDistance <= 1) {
            inRange = true
            break
          }
        }
        if (inRange) break
      }

      if (inRange) {
        // Check if it's time for an attack check (every attackCheckInterval)
        if (monster.attackTimer >= monster.attackCheckInterval) {
          // Reset timer
          monster.attackTimer = 0

          // Roll for attack chance
          if (Math.random() < monster.attackChance) {
            damageKnight(monster.damage)
            damageCooldown = DAMAGE_COOLDOWN_TIME
          }
        }
      } else {
        // Reset attack timer when not in range
        monster.attackTimer = 0
      }
    })
  }

  const checkAttackMonsterCollisions = () => {
    const hitbox = attackHitbox.value
    if (!hitbox) return

    // Initialize hitMonsters set on first check of this attack
    if (!hitbox.hitMonsters) {
      hitbox.hitMonsters = new Set()
    }

    let hitSomething = false

    // Get all hitbox positions (always an array now with new weapon system)
    const hitboxPositions = hitbox.hitboxes || []

    // Check each hitbox position against all monsters
    hitboxPositions.forEach(pos => {
      monsters.value.forEach(monster => {
        if (monster.state === 'dead') return
        if (hitbox.hitMonsters.has(monster.id)) return // Already hit by this attack

        // Get monster grid size (default 1x1, boss is 2x2)
        const monsterWidth = monster.gridWidth || 1
        const monsterHeight = monster.gridHeight || 1

        // Check if attack hitbox overlaps with any of the monster's grid tiles
        let hit = false
        for (let dy = 0; dy < monsterHeight; dy++) {
          for (let dx = 0; dx < monsterWidth; dx++) {
            const monsterTileX = monster.gridX + dx
            const monsterTileY = monster.gridY + dy

            if (pos.x === monsterTileX && pos.y === monsterTileY) {
              hit = true
              break
            }
          }
          if (hit) break
        }

        if (hit) {
          const killed = monsterAI.damageMonster(monster, hitbox.damage)
          hitSomething = true
          hitbox.hitMonsters.add(monster.id)

          // Mark monster as hit for visual effect
          monster.isHit = true
          setTimeout(() => {
            if (monster.state !== 'dead') {
              monster.isHit = false
            }
          }, 200)
        }
      })
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
      case 'health':
        gameState.currentHealth = Math.min(
          gameState.maxHealth,
          gameState.currentHealth + 1
        )
        console.log(`Health collected! Health restored: ${gameState.currentHealth}/${gameState.maxHealth}`)
        break

      case 'healthPotion':
        gameState.maxHealth = Math.min(20, gameState.maxHealth + 1)
        gameState.currentHealth = Math.min(gameState.maxHealth, gameState.currentHealth + 1)
        console.log(`Health Potion collected! Max Health increased to: ${gameState.maxHealth}, Health: ${gameState.currentHealth}/${gameState.maxHealth}`)
        break

      case 'mana':
        gameState.currentMana = Math.min(
          gameState.maxMana,
          gameState.currentMana + 1
        )
        console.log(`Mana collected! Mana restored: ${gameState.currentMana}/${gameState.maxMana}`)
        break

      case 'manaPotion':
        gameState.maxMana = Math.min(10, gameState.maxMana + 1)
        gameState.currentMana = Math.min(gameState.maxMana, gameState.currentMana + 1)
        console.log(`Mana Potion collected! Max Mana increased to: ${gameState.maxMana}, Mana: ${gameState.currentMana}/${gameState.maxMana}`)
        break

      case 'weapon':
        if (item.weaponName && unlockWeapon) {
          const success = unlockWeapon(item.weaponName)
          if (success) {
            console.log(`🎉 New weapon unlocked: ${item.weaponName}!`)
          }
        }
        break
    }
  }

  const handleGameOver = () => {
    gameState.isRunning = false

    // Call game over callback if provided
    if (gameOverCallback) {
      gameOverCallback()
    }
  }

  return {
    update,
    damageKnight,
    collectItem
  }
}

export default useCollisions