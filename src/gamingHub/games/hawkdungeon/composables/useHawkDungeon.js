// Main game logic composable for HawkDungeon
import { ref, reactive, computed } from 'vue'
import { levelConfig } from '../config/levelConfig'
import { weaponConfig } from '../config/weaponConfig'
import { TILE_SIZE } from '../config/spriteConfig'
import { useMonsterAI } from './useMonsterAI'
import { useCollisions } from './useCollisions'
import { useLevelLoader } from './useLevelLoader'
import { useChest } from './useChest'
import { useTileInteractions } from './useTileInteractions'
import { WEAPON_SOCKET_COUNT, calculateGemBonuses } from '../config/gemConfig'

export function useHawkDungeon() {
  // Game state
  const gameState = reactive({
    level: 1,
    currentHealth: 10,
    maxHealth: 10,
    currentMana: 5,
    maxMana: 5,
    score: 0,
    kills: 0,
    killGoal: 5,
    coins: 0,
    experience: 0,
    weapon: 'sword', // Current equipped weapon
    weapons: [
      { name: 'sword', sockets: [null, null, null] } // Weapon inventory with socket system
    ], // Weapons player owns (starts with sword with 3 empty sockets)
    inventory: [], // General inventory for keys, quest items, etc.
    facingDirection: 'right',
    isRunning: false,
    isPaused: false,
    bossPhase: false, // True when boss phase is active
    bossKills: 0 // Track boss kills separately
  })

  // Knight state
  const knight = reactive({
    gridX: 0, // Grid position (center of screen)
    gridY: 0,
    targetGridX: 0, // Target grid position when moving
    targetGridY: 0,
    screenX: 0, // Screen position (pixels)
    screenY: 0,
    animationState: 'idle', // idle, walking, attacking
    animationFrame: 0,
    facingDirection: 'right', // Only left/right for sprite rendering
    direction: 'right', // Last movement direction (up, down, left, right) - used for attacks
    isMoving: false,
    isAttacking: false,
    movementQueue: []
  })

  // Monsters array
  const monsters = ref([])

  // Items array
  const items = ref([])

  // Attack hitbox
  const attackHitbox = ref(null)

  // Chest system
  const levelLoader = useLevelLoader()
  const chestSystem = useChest(items, levelLoader)

  // Tile interaction system (initialized after levelLoader)
  let tileInteractions = null

  // Attack cooldown
  const attackCooldown = ref(0)

  // Dungeon offset (for background scrolling)
  const dungeonOffset = reactive({
    x: 0,
    y: 0
  })

  // Locked door flash effect
  const lockedDoorFlash = reactive({
    active: false,
    gridX: -1,
    gridY: -1
  })

  // Game loop
  let gameLoopId = null
  let lastFrameTime = 0
  const targetFPS = 60
  const frameTime = 1000 / targetFPS

  // Animation timing
  let animationTimer = 0
  const ANIMATION_FRAME_DURATION = 100 // ms per frame

  // Movement timing
  let movementTimer = 0
  const MOVEMENT_DURATION = 800 // 800ms for full step (8 frames × 100ms)

  // Current movement interpolation
  let isMovingToTarget = false
  let moveStartPos = { x: 0, y: 0 }
  let moveTargetPos = { x: 0, y: 0 }
  let moveProgress = 0

  // Mana regeneration timer
  let manaRegenTimer = 0
  const manaRegenProgress = ref(0)

  // Health regeneration timer
  let healthRegenTimer = 0
  const healthRegenProgress = ref(0)

  // Blood splatter callback
  let bloodSplatterCallback = null

  const startGame = () => {
    gameState.isRunning = true
    gameState.level = 1
    gameState.currentHealth = 10
    gameState.maxHealth = 10
    gameState.kills = 0
    gameState.bossKills = 0
    gameState.bossPhase = false
    gameState.killGoal = levelConfig[1].killGoal
    gameState.inventory = [] // Reset inventory

    // Center knight on screen
    knight.gridX = 0
    knight.gridY = 0
    knight.targetGridX = 0
    knight.targetGridY = 0
    knight.screenX = 0
    knight.screenY = 0

    // Initialize systems
    initializeSystems()

    // Start game loop
    lastFrameTime = performance.now()
    gameLoop()
  }

  const stopGame = () => {
    gameState.isRunning = false
    if (gameLoopId) {
      cancelAnimationFrame(gameLoopId)
      gameLoopId = null
    }
  }

  const gameLoop = (currentTime = performance.now()) => {
    if (!gameState.isRunning) return

    const deltaTime = currentTime - lastFrameTime

    if (deltaTime >= frameTime) {
      update(deltaTime)
      lastFrameTime = currentTime - (deltaTime % frameTime)
    }

    gameLoopId = requestAnimationFrame(gameLoop)
  }

  const update = (deltaTime) => {
    const dt = deltaTime / 1000 // Convert to seconds

    // Update attack cooldown
    if (attackCooldown.value > 0) {
      attackCooldown.value = Math.max(0, attackCooldown.value - dt)
    }

    // Update mana regeneration (with gem bonuses applied)
    const weapon = getWeaponStats(gameState.weapon)
    if (weapon && weapon.mana) {
      if (gameState.currentMana < gameState.maxMana) {
        manaRegenTimer += dt
        manaRegenProgress.value = (manaRegenTimer / weapon.mana.regenInterval) * 100
        if (manaRegenTimer >= weapon.mana.regenInterval) {
          gameState.currentMana = Math.min(gameState.maxMana, gameState.currentMana + 1)
          manaRegenTimer = 0
          manaRegenProgress.value = 0
          console.log(`Mana regenerated: ${gameState.currentMana}/${gameState.maxMana}`)
        }
      } else {
        // Reset timer when mana is full
        manaRegenTimer = 0
        manaRegenProgress.value = 0
      }
    }

    // Update health regeneration
    if (weapon.health) {
      if (gameState.currentHealth < gameState.maxHealth) {
        healthRegenTimer += dt
        healthRegenProgress.value = (healthRegenTimer / weapon.health.regenInterval) * 100
        if (healthRegenTimer >= weapon.health.regenInterval) {
          gameState.currentHealth = Math.min(gameState.maxHealth, gameState.currentHealth + 1)
          healthRegenTimer = 0
          healthRegenProgress.value = 0
          console.log(`Health regenerated: ${gameState.currentHealth}/${gameState.maxHealth}`)
        }
      } else {
        // Reset timer when health is full
        healthRegenTimer = 0
        healthRegenProgress.value = 0
      }
    }

    // Update knight movement
    updateKnightMovement(dt)

    // Update knight animation
    updateKnightAnimation(deltaTime)

    // Update monsters
    updateMonsters(dt)

    // Update items
    updateItems(dt)

    // Check collisions
    checkCollisions()

    // Check chest interactions
    checkChestInteractions()

    // Check level completion
    checkLevelCompletion()
  }

  const updateKnightMovement = (dt) => {
    // Process movement queue
    if (knight.movementQueue.length > 0 && !isMovingToTarget) {
      const direction = knight.movementQueue.shift()
      startMovement(direction)
    }

    // Interpolate movement to target
    if (isMovingToTarget) {
      moveProgress += dt / (MOVEMENT_DURATION / 1000)

      if (moveProgress >= 1) {
        // Movement complete
        knight.gridX = moveTargetPos.x
        knight.gridY = moveTargetPos.y
        knight.targetGridX = moveTargetPos.x
        knight.targetGridY = moveTargetPos.y
        dungeonOffset.x = -knight.gridX * TILE_SIZE
        dungeonOffset.y = -knight.gridY * TILE_SIZE
        isMovingToTarget = false
        moveProgress = 0
        knight.isMoving = false
        knight.animationState = 'idle'
        knight.animationFrame = 0

        // Check for traps and fountains after movement is complete
        checkForTraps()
        checkForFountains()
      } else {
        // Smooth interpolation
        const eased = easeInOutQuad(moveProgress)
        const currentX = moveStartPos.x + (moveTargetPos.x - moveStartPos.x) * eased
        const currentY = moveStartPos.y + (moveTargetPos.y - moveStartPos.y) * eased
        dungeonOffset.x = -currentX * TILE_SIZE
        dungeonOffset.y = -currentY * TILE_SIZE
      }
    }
  }

  // Check if player stepped on a trap and trigger damage
  const checkForTraps = () => {
    if (!levelLoader) return

    const tileType = levelLoader.getTileType(knight.gridX, knight.gridY)
    const tileState = levelLoader.getTileState(knight.gridX, knight.gridY)

    // Check if player is standing on any trap (hidden or triggered)
    if (tileType === 'trap') {
      // Apply damage to player (1 damage for traps)
      const damage = 1

      if (collisionSystem) {
        collisionSystem.damageKnight(damage)
      }

      // If trap was hidden, reveal it (change state to triggered, so it shows spikes)
      if (tileState === 'hidden') {
        levelLoader.setTileState(knight.gridX, knight.gridY, 'triggered')
        console.log(`Player stepped on hidden trap! Revealed and took ${damage} damage`)
      } else {
        console.log(`Player stepped on visible trap! Took ${damage} damage`)
      }
    }
  }

  // Check if player stepped on a fountain and restore mana/health
  const checkForFountains = () => {
    if (!levelLoader) return

    const tileType = levelLoader.getTileType(knight.gridX, knight.gridY)

    // Check if player is standing on a mana fountain
    if (tileType === 'manaFountain') {
      // Restore mana to max
      if (gameState.currentMana < gameState.maxMana) {
        gameState.currentMana = gameState.maxMana
        console.log('Mana fully restored by fountain!')
      }
    }

    // Check if player is standing on a health fountain
    if (tileType === 'healthFountain') {
      // Restore health to max
      if (gameState.currentHealth < gameState.maxHealth) {
        gameState.currentHealth = gameState.maxHealth
        console.log('Health fully restored by fountain!')
      }
    }
  }

  const startMovement = (direction) => {
    // Update facing direction only for horizontal movements (left/right)
    if (direction === 'left' || direction === 'right') {
      knight.facingDirection = direction
    }

    // Update the last movement direction (for attacks in all 4 directions)
    knight.direction = direction

    moveStartPos.x = knight.gridX
    moveStartPos.y = knight.gridY

    // Calculate target position
    let targetX = knight.gridX
    let targetY = knight.gridY

    switch (direction) {
      case 'up':
        targetY = knight.gridY - 1
        break
      case 'down':
        targetY = knight.gridY + 1
        break
      case 'left':
        targetX = knight.gridX - 1
        break
      case 'right':
        targetX = knight.gridX + 1
        break
    }

    // Check if target position is walkable
    const isWalkableInitial = levelLoader.isWalkable(targetX, targetY)

    if (!isWalkableInitial) {
      // Not walkable - check if it's a door that can be opened
      if (tileInteractions) {
        const tileType = levelLoader.getTileType(targetX, targetY)
        const tileState = levelLoader.getTileState(targetX, targetY)

        console.log(`Blocked position: (${targetX}, ${targetY}), Type: ${tileType}, State: ${tileState}`)

        if (tileType === 'door' && tileState === 'closed') {
          // Try to open the door with a key
          const result = tileInteractions.openDoor(targetX, targetY, true)

          console.log(`Door open attempt result:`, result)

          if (result.success) {
            console.log(result.message)
            // Door was opened, verify it's now walkable
            const nowWalkable = levelLoader.isWalkable(targetX, targetY)
            console.log(`After opening, door is walkable: ${nowWalkable}`)

            if (!nowWalkable) {
              console.error('Door opened but still not walkable!')
              return
            }
            // Continue with movement (fall through to movement code)
          } else {
            // No key or failed to open
            console.log(result.message)

            // Trigger red flash effect on locked door
            lockedDoorFlash.active = true
            lockedDoorFlash.gridX = targetX
            lockedDoorFlash.gridY = targetY
            setTimeout(() => {
              lockedDoorFlash.active = false
            }, 300)

            return
          }
        } else {
          // Not a door or already open, just blocked
          console.log(`Not a closable door, blocked by: ${tileType}`)
          return
        }
      } else {
        return
      }
    }

    // Check if target position is occupied by a monster (current or target position)
    const isBlocked = monsters.value.some(monster => {
      if (monster.state === 'dead') return false

      // Get monster grid size (default 1x1, boss is 2x2)
      const monsterWidth = monster.gridWidth || 1
      const monsterHeight = monster.gridHeight || 1

      // Check all tiles occupied by this monster
      for (let dy = 0; dy < monsterHeight; dy++) {
        for (let dx = 0; dx < monsterWidth; dx++) {
          // Check monster's current position
          if (monster.gridX + dx === targetX && monster.gridY + dy === targetY) {
            return true
          }

          // Check monster's target position if it's moving
          if (monster.isMovingToTarget &&
              monster.targetGridX + dx === targetX &&
              monster.targetGridY + dy === targetY) {
            return true
          }
        }
      }

      return false
    })

    // If blocked by a monster, don't move
    if (isBlocked) {
      return
    }

    // Movement is allowed - set up the animation
    knight.isMoving = true
    knight.animationState = 'walking'
    knight.animationFrame = 0

    moveTargetPos.x = targetX
    moveTargetPos.y = targetY

    // Update target position so monsters can see where we're moving
    knight.targetGridX = targetX
    knight.targetGridY = targetY

    isMovingToTarget = true
    moveProgress = 0
  }

  const updateKnightAnimation = (deltaTime) => {
    animationTimer += deltaTime

    if (knight.animationState === 'walking') {
      if (animationTimer >= ANIMATION_FRAME_DURATION) {
        knight.animationFrame = (knight.animationFrame + 1) % 8
        animationTimer = 0
      }
    } else if (knight.animationState === 'idle') {
      // Idle animation: alternate between frames 0 and 1
      if (animationTimer >= ANIMATION_FRAME_DURATION * 4) { // Slower idle animation (400ms per frame)
        knight.animationFrame = knight.animationFrame === 0 ? 1 : 0
        animationTimer = 0
      }
    }
  }

  // Initialize AI, collision, and level systems
  let monsterAI = null
  let collisionSystem = null
  let gameOverCallback = null
  let levelCompletionCallback = null

  const initializeSystems = () => {
    // Load the level from levelConfig
    levelLoader.loadLevel(gameState.level)

    // Initialize tile interaction system
    tileInteractions = useTileInteractions(levelLoader, gameState)

    // Set knight starting position from level data
    knight.gridX = levelLoader.levelData.playerStart.x
    knight.gridY = levelLoader.levelData.playerStart.y
    knight.targetGridX = knight.gridX
    knight.targetGridY = knight.gridY
    dungeonOffset.x = -knight.gridX * TILE_SIZE
    dungeonOffset.y = -knight.gridY * TILE_SIZE

    // Clear and spawn chests from level data
    chestSystem.clearChests()
    // Spawn all chests marked with 'C' in the level map
    if (levelLoader.levelData.chests && levelLoader.levelData.chests.length > 0) {
      levelLoader.levelData.chests.forEach(chestData => {
        // Use custom items if defined, otherwise use chest type
        const chestTypeOrItems = chestData.items ? chestData.items : (chestData.type || 'basic')
        chestSystem.createChest(chestData.gridX, chestData.gridY, chestTypeOrItems)
      })
      console.log(`Spawned ${levelLoader.levelData.chests.length} chests from level data`)
    }

    monsterAI = useMonsterAI(knight, monsters, gameState, items, levelLoader, bloodSplatterCallback)
    collisionSystem = useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI, gameOverCallback, unlockWeapon, switchWeapon)
  }

  const setGameOverCallback = (callback) => {
    gameOverCallback = callback
    // Reinitialize collision system with new callback if already initialized
    if (collisionSystem && monsterAI) {
      collisionSystem = useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI, gameOverCallback, unlockWeapon, switchWeapon)
    }
  }

  const setLevelCompletionCallback = (callback) => {
    levelCompletionCallback = callback
  }

  const setBloodSplatterCallback = (callback) => {
    bloodSplatterCallback = callback
    // Reinitialize monster AI with new callback if already initialized
    if (monsterAI) {
      monsterAI = useMonsterAI(knight, monsters, gameState, items, levelLoader, bloodSplatterCallback)
    }
  }

  let levelCompleted = false
  let bossPhaseTriggered = false

  const checkLevelCompletion = () => {
    const levelCfg = levelConfig[gameState.level]

    // Check if we should trigger boss phase
    if (!bossPhaseTriggered && !gameState.bossPhase && levelCfg.hasBoss && gameState.kills >= gameState.killGoal) {
      bossPhaseTriggered = true
      gameState.bossPhase = true

      // Kill all normal monsters and spawn boss
      if (monsterAI) {
        monsterAI.startBossPhase()
      }

      console.log('Boss phase started! All normal enemies eliminated.')
      return
    }

    // Check if level is completed
    // For levels with boss: need to kill boss
    // For levels without boss: need to reach killGoal
    if (!levelCompleted) {
      const isComplete = levelCfg.hasBoss
        ? (gameState.bossPhase && gameState.bossKills > 0) // Boss defeated
        : (gameState.kills >= gameState.killGoal) // Normal level goal reached

      if (isComplete) {
        levelCompleted = true
        if (levelCompletionCallback) {
          levelCompletionCallback()
        }
      }
    }
  }

  const updateMonsters = (dt) => {
    if (monsterAI) {
      monsterAI.update(dt)
    }
  }

  const updateItems = (dt) => {
    // Remove expired items (items that have exceeded their lifetime)
    const currentTime = Date.now()
    items.value = items.value.filter(item => {
      const age = currentTime - item.spawnTime
      return age < item.lifetime
    })
  }

  const checkCollisions = () => {
    if (collisionSystem) {
      collisionSystem.update(0.016) // Approximate 60fps
    }
  }

  const checkChestInteractions = () => {
    chestSystem.checkChestInteraction(knight.gridX, knight.gridY)
  }

  const easeInOutQuad = (t) => {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }

  const handleMove = (direction) => {
    // If direction changed, clear queue and add new direction
    const lastDirection = knight.movementQueue[knight.movementQueue.length - 1]

    if (lastDirection && lastDirection !== direction) {
      // Direction changed - clear queue and add new direction
      knight.movementQueue = [direction]
    } else if (knight.movementQueue.length < 2) {
      // Same direction or empty queue - add to queue if not full
      knight.movementQueue.push(direction)
    }
  }

  const handleStopMove = () => {
    knight.movementQueue = []
  }

  const handleAttack = (attackData = { charged: false }) => {
    if (attackCooldown.value > 0 || knight.isAttacking) return

    // Create attack hitbox(es) with gem bonuses applied
    const weapon = getWeaponStats(gameState.weapon)

    // Check mana cost for charged attack
    if (attackData.charged) {
      const manaCost = weapon.mana?.chargedAttackCost || 0
      if (gameState.currentMana < manaCost) {
        console.log('Not enough mana for charged attack!')
        return
      }
      // Consume mana for charged attack
      gameState.currentMana -= manaCost
      console.log(`Mana consumed: -${manaCost}, remaining: ${gameState.currentMana}/${gameState.maxMana}`)
    }

    knight.isAttacking = true
    attackCooldown.value = weapon.cooldown

    // Get attack pattern based on weapon and direction
    const hitboxes = getAttackHitboxes(attackData.charged)

    attackHitbox.value = {
      active: true,
      charged: attackData.charged,
      hitboxes: hitboxes,
      damage: weapon.damage,
      weapon: gameState.weapon
    }

    console.log('Attack hitbox created:', attackHitbox.value)

    // Remove hitbox after attack animation
    setTimeout(() => {
      console.log('Removing attack hitbox')
      attackHitbox.value = null
      knight.isAttacking = false
    }, 300)
  }

  const getAttackHitboxes = (isCharged = false) => {
    const weapon = getWeaponStats(gameState.weapon)
    const direction = knight.direction

    // Get the appropriate pattern (charged or normal)
    const pattern = isCharged
      ? weapon.chargedAttackPattern?.[direction]
      : weapon.attackPattern?.[direction]

    if (!pattern) {
      console.warn(`No attack pattern found for weapon ${gameState.weapon} in direction ${direction}`)
      return []
    }

    // Convert pattern offsets to absolute grid positions
    const hitboxes = pattern.map(offset => ({
      x: knight.gridX + offset.dx,
      y: knight.gridY + offset.dy
    }))

    return hitboxes
  }

  const switchWeapon = (weaponName) => {
    // Check if weapon is in inventory
    const hasWeapon = gameState.weapons.some(w => w.name === weaponName)
    if (hasWeapon) {
      gameState.weapon = weaponName
      console.log(`Switched to ${weaponName}`)
    } else {
      console.warn(`Weapon ${weaponName} not in inventory`)
    }
  }

  const unlockWeapon = (weaponName) => {
    // Check if weapon already unlocked
    if (gameState.weapons.some(w => w.name === weaponName)) {
      console.log(`Weapon ${weaponName} already unlocked`)
      return false
    }

    // Check if weapon exists in config
    if (!weaponConfig[weaponName]) {
      console.warn(`Weapon ${weaponName} does not exist`)
      return false
    }

    // Add weapon to inventory with empty sockets
    gameState.weapons.push({
      name: weaponName,
      sockets: Array(WEAPON_SOCKET_COUNT).fill(null)
    })
    console.log(`🎉 Unlocked new weapon: ${weaponName}!`)
    return true
  }

  /**
   * Socket a gem into a weapon
   * @param {string} weaponName - Name of the weapon
   * @param {number} socketIndex - Index of the socket (0-2)
   * @param {string} gemType - Type of gem (e.g., 'ruby', 'sapphire')
   * @returns {boolean} - True if successful
   */
  const socketGem = (weaponName, socketIndex, gemType) => {
    // Find the weapon
    const weapon = gameState.weapons.find(w => w.name === weaponName)
    if (!weapon) {
      console.warn(`Weapon ${weaponName} not found in inventory`)
      return false
    }

    // Validate socket index
    if (socketIndex < 0 || socketIndex >= WEAPON_SOCKET_COUNT) {
      console.warn(`Invalid socket index: ${socketIndex}`)
      return false
    }

    // Check if socket is already occupied
    if (weapon.sockets[socketIndex] !== null) {
      console.warn(`Socket ${socketIndex} is already occupied`)
      return false
    }

    // Check if player has the gem in inventory
    const gemItem = gameState.inventory.find(item => item.type === gemType)
    if (!gemItem) {
      console.warn(`Gem ${gemType} not found in inventory`)
      return false
    }

    // Socket the gem
    weapon.sockets[socketIndex] = gemType

    // Remove one gem from inventory
    if (gemItem.count && gemItem.count > 1) {
      // Stackable item with count > 1: decrease count by 1
      gemItem.count -= 1
    } else {
      // Single item or count === 1: remove from inventory
      const gemIndex = gameState.inventory.findIndex(item => item.type === gemType)
      gameState.inventory.splice(gemIndex, 1)
    }

    console.log(`✨ Socketed ${gemType} into ${weaponName} at socket ${socketIndex}`)
    return true
  }

  /**
   * Remove a gem from a weapon socket
   * @param {string} weaponName - Name of the weapon
   * @param {number} socketIndex - Index of the socket (0-2)
   * @returns {boolean} - True if successful
   */
  const unsocketGem = (weaponName, socketIndex) => {
    // Find the weapon
    const weapon = gameState.weapons.find(w => w.name === weaponName)
    if (!weapon) {
      console.warn(`Weapon ${weaponName} not found in inventory`)
      return false
    }

    // Validate socket index
    if (socketIndex < 0 || socketIndex >= WEAPON_SOCKET_COUNT) {
      console.warn(`Invalid socket index: ${socketIndex}`)
      return false
    }

    // Check if socket has a gem
    const gemType = weapon.sockets[socketIndex]
    if (gemType === null) {
      console.warn(`Socket ${socketIndex} is empty`)
      return false
    }

    // Remove the gem from socket
    weapon.sockets[socketIndex] = null

    // Add gem back to inventory (stackable)
    const existingGem = gameState.inventory.find(item => item.type === gemType)
    if (existingGem) {
      // Gem already exists in inventory, increase count
      existingGem.count = (existingGem.count || 1) + 1
      existingGem.stackable = true // Ensure stackable flag is set
    } else {
      // Gem doesn't exist, add new stackable item
      gameState.inventory.push({
        type: gemType,
        name: gemType,
        stackable: true,
        count: 1
      })
    }

    console.log(`Removed ${gemType} from ${weaponName} at socket ${socketIndex}`)
    return true
  }

  /**
   * Get the effective stats for a weapon including gem bonuses
   * @param {string} weaponName - Name of the weapon
   * @returns {object} - Weapon stats with gem bonuses applied
   */
  const getWeaponStats = (weaponName) => {
    const baseStats = weaponConfig[weaponName]
    if (!baseStats) return null

    // Find the weapon in inventory to get its gems
    const weapon = gameState.weapons.find(w => w.name === weaponName)
    if (!weapon) return baseStats

    // Calculate gem bonuses
    const gemBonuses = calculateGemBonuses(weapon.sockets)

    // Apply bonuses to base stats
    return {
      ...baseStats,
      damage: baseStats.damage + gemBonuses.damage,
      cooldown: Math.max(0.1, baseStats.cooldown + gemBonuses.cooldown), // Min 0.1s cooldown
      mana: {
        ...baseStats.mana,
        regenInterval: Math.max(1, baseStats.mana.regenInterval + gemBonuses.manaRegen),
        chargedAttackCost: Math.max(0, baseStats.mana.chargedAttackCost + gemBonuses.manaCost)
      },
      health: {
        ...baseStats.health,
        regenInterval: Math.max(1, baseStats.health.regenInterval + gemBonuses.healthRegen)
      }
    }
  }

  /**
   * Example: Interact with a tile in front of the knight
   * This can be called when the player presses an "interact" button (e.g., 'E' key)
   */
  const handleInteract = () => {
    if (!tileInteractions) return

    const result = tileInteractions.autoInteract(knight.gridX, knight.gridY, knight.direction)

    if (result.success) {
      console.log(result.message)
    }

    return result
  }

  /**
   * Example: Open all doors when boss phase starts (without requiring keys)
   */
  const openAllDoors = () => {
    if (!tileInteractions) return 0
    const count = tileInteractions.openAllDoors(false) // false = no key required
    console.log(`Opened ${count} doors`)
    return count
  }

  return {
    gameState,
    knight,
    monsters,
    items,
    attackHitbox,
    attackCooldown,
    dungeonOffset,
    lockedDoorFlash,
    levelLoader,
    chestSystem,
    tileInteractions,
    manaRegenProgress,
    healthRegenProgress,
    handleAttack,
    handleMove,
    handleStopMove,
    handleInteract,
    switchWeapon,
    unlockWeapon,
    socketGem,
    unsocketGem,
    getWeaponStats,
    openAllDoors,
    startGame,
    stopGame,
    setGameOverCallback,
    setLevelCompletionCallback,
    setBloodSplatterCallback
  }
}

export default useHawkDungeon