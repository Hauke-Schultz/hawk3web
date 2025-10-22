// Main game logic composable for HawkDungeon
import { ref, reactive, computed } from 'vue'
import { levelConfig } from '../config/levelConfig'
import { weaponConfig } from '../config/weaponConfig'
import { TILE_SIZE } from '../config/spriteConfig'
import { useMonsterAI } from './useMonsterAI'
import { useCollisions } from './useCollisions'

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
    killGoal: 50,
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
    knight.facingDirection = direction

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

    // Check if target position is occupied by a monster
    const isBlocked = monsters.value.some(monster =>
      monster.state !== 'dead' &&
      monster.gridX === targetX &&
      monster.gridY === targetY
    )

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
    if (knight.animationState === 'walking') {
      animationTimer += deltaTime

      if (animationTimer >= ANIMATION_FRAME_DURATION) {
        knight.animationFrame = (knight.animationFrame + 1) % 8
        animationTimer = 0
      }
    }
  }

  // Initialize AI and collision systems
  let monsterAI = null
  let collisionSystem = null

  const initializeSystems = () => {
    monsterAI = useMonsterAI(knight, monsters, gameState)
    collisionSystem = useCollisions(knight, monsters, items, attackHitbox, gameState, monsterAI)
  }

  const updateMonsters = (dt) => {
    if (monsterAI) {
      monsterAI.update(dt)
    }
  }

  const updateItems = (dt) => {
    // Items don't need updates yet (static for now)
  }

  const checkCollisions = () => {
    if (collisionSystem) {
      collisionSystem.update(0.016) // Approximate 60fps
    }
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
    handleAttack,
    handleMove,
    handleStopMove,
    startGame,
    stopGame
  }
}

export default useHawkDungeon