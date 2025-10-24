// Main game logic composable for HawkDungeon
import { ref, reactive, computed } from 'vue'
import { levelConfig } from '../config/levelConfig'
import { weaponConfig } from '../config/weaponConfig'
import { TILE_SIZE } from '../config/spriteConfig'
import { useMonsterAI } from './useMonsterAI'
import { useCollisions } from './useCollisions'
import { useLevelLoader } from './useLevelLoader'
import { useChest } from './useChest'

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
    weapon: 'sword',
    facingDirection: 'right',
    isRunning: false,
    isPaused: false
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
    facingDirection: 'right',
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

  // Attack cooldown
  const attackCooldown = ref(0)

  // Dungeon offset (for background scrolling)
  const dungeonOffset = reactive({
    x: 0,
    y: 0
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

  const startGame = () => {
    gameState.isRunning = true
    gameState.level = 1
    gameState.currentHealth = 10
    gameState.maxHealth = 10
    gameState.kills = 0
    gameState.killGoal = levelConfig[1].killGoal

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

  const startMovement = (direction) => {
    // Only update facing direction for horizontal movements
    // Vertical movements (up/down) preserve the current horizontal facing direction
    if (direction === 'left' || direction === 'right') {
      knight.facingDirection = direction
    }

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

    // Check if target position has a wall
    if (!levelLoader.isWalkable(targetX, targetY)) {
      return
    }

    // Check if target position is occupied by a monster (current or target position)
    const isBlocked = monsters.value.some(monster => {
      if (monster.state === 'dead') return false

      // Check monster's current position
      if (monster.gridX === targetX && monster.gridY === targetY) {
        return true
      }

      // Check monster's target position if it's moving
      if (monster.isMovingToTarget &&
          monster.targetGridX === targetX &&
          monster.targetGridY === targetY) {
        return true
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

  const initializeSystems = () => {
    // Load the level from levelConfig
    levelLoader.loadLevel(gameState.level)

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

    monsterAI = useMonsterAI(knight, monsters, gameState, items, levelLoader)
    collisionSystem = useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI, gameOverCallback)
  }

  const setGameOverCallback = (callback) => {
    gameOverCallback = callback
    // Reinitialize collision system with new callback if already initialized
    if (collisionSystem && monsterAI) {
      collisionSystem = useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI, gameOverCallback)
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
    // Add to movement queue if not already moving or queue is small
    if (knight.movementQueue.length < 2) {
      knight.movementQueue.push(direction)
    }
  }

  const handleStopMove = () => {
    knight.movementQueue = []
  }

  const handleAttack = (attackData = { charged: false }) => {
    if (attackCooldown.value > 0 || knight.isAttacking) return

    knight.isAttacking = true
    attackCooldown.value = weaponConfig[gameState.weapon].cooldown

    // Create attack hitbox(es)
    const weapon = weaponConfig[gameState.weapon]

    if (attackData.charged) {
      // Charged attack: create 3 hitboxes in cross pattern
      const hitboxes = getChargedAttackHitboxes()

      attackHitbox.value = {
        active: true,
        charged: true,
        hitboxes: hitboxes,
        damage: weapon.damage,
        weapon: gameState.weapon
      }
    } else {
      // Normal attack: single hitbox
      const hitboxPos = getAttackHitboxPosition()

      attackHitbox.value = {
        active: true,
        charged: false,
        gridX: hitboxPos.x,
        gridY: hitboxPos.y,
        damage: weapon.damage,
        weapon: gameState.weapon
      }
    }

    console.log('Attack hitbox created:', attackHitbox.value)

    // Remove hitbox after attack animation
    setTimeout(() => {
      console.log('Removing attack hitbox')
      attackHitbox.value = null
      knight.isAttacking = false
    }, 300)
  }

  const getAttackHitboxPosition = () => {
    const pos = { x: knight.gridX, y: knight.gridY }

    switch (knight.facingDirection) {
      case 'up':
        pos.y -= 1
        break
      case 'down':
        pos.y += 1
        break
      case 'left':
        pos.x -= 1
        break
      case 'right':
        pos.x += 1
        break
    }

    return pos
  }

  const getChargedAttackHitboxes = () => {
    // Returns 3 hitbox positions in cross pattern based on facing direction
    const hitboxes = []

    switch (knight.facingDirection) {
      case 'up':
        // Up: attack up, left, right
        hitboxes.push({ x: knight.gridX, y: knight.gridY - 1 })
        hitboxes.push({ x: knight.gridX - 1, y: knight.gridY })
        hitboxes.push({ x: knight.gridX + 1, y: knight.gridY })
        break
      case 'down':
        // Down: attack down, left, right
        hitboxes.push({ x: knight.gridX, y: knight.gridY + 1 })
        hitboxes.push({ x: knight.gridX - 1, y: knight.gridY })
        hitboxes.push({ x: knight.gridX + 1, y: knight.gridY })
        break
      case 'left':
        // Left: attack left, up, down
        hitboxes.push({ x: knight.gridX - 1, y: knight.gridY })
        hitboxes.push({ x: knight.gridX, y: knight.gridY - 1 })
        hitboxes.push({ x: knight.gridX, y: knight.gridY + 1 })
        break
      case 'right':
        // Right: attack right, up, down
        hitboxes.push({ x: knight.gridX + 1, y: knight.gridY })
        hitboxes.push({ x: knight.gridX, y: knight.gridY - 1 })
        hitboxes.push({ x: knight.gridX, y: knight.gridY + 1 })
        break
    }

    return hitboxes
  }

  return {
    gameState,
    knight,
    monsters,
    items,
    attackHitbox,
    attackCooldown,
    dungeonOffset,
    levelLoader,
    chestSystem,
    handleAttack,
    handleMove,
    handleStopMove,
    startGame,
    stopGame,
    setGameOverCallback
  }
}

export default useHawkDungeon