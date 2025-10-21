# 🏰 Hawk Dungeon - Game Documentation

> **Status:** Pre-Development | **Version:** 0.1.0 (Planning)

## 📖 Game Overview

**Hawk Dungeon** is an action RPG mini-game where players control a knight fighting through dungeon levels using a virtual joystick and attack button system.

### 🎮 Core Concept
- **Knight** positioned in center of screen (static visual position)
- **4-Axis Movement** - Up, Down, Left, Right only (no diagonals)
- **Grid-Based Movement** - Each step moves exactly 16 pixels (1 tile)
- **Virtual Joystick** (bottom-right) controls movement direction
- **Dynamic Dungeon** background scrolls based on movement
- **Monsters** (Goblins) spawn and move toward knight
- **Attack Button** (bottom-left) for combat
- **Progressive Difficulty** through 6 levels + endless mode

---

## 🎨 Sprite Sheet Structure

### Base Tile System
**Format:** Tileset with 16x16 pixel base tiles

**Asset Categories:**
- 🏰 **Dungeon Tileset** - Stone walls, floors, doors
- 🧑‍🗡️ **Knight Player** - Single walk animation (8 frames, side-facing)
- 👹 **Goblin Enemies** - Single walk animation (8 frames, side-facing)
- 🐉 **Boss Enemy** - Single walk animation (8 frames, side-facing, 2×2 tile)
- ⚔️ **Weapons** - Sword and Axe (1 tile wide)
- 🎁 **Items** - Hearts, Mana Potions, collectibles
- ✨ **Effects** - Hit effects, particle sprites

### Sprite Dimensions

```
Base Unit: 16x16 pixels (1 tile)

Knight (Player):
  - Dimensions: 1 wide × 2 high (16×32 px)
  - Walk animation: 8 frames (side-facing, moving right)
  - Animation: Single sequence for all directions
  - Sprite flipping: Horizontal flip for left movement
  - Up/Down: Use same right-facing sprite (no flip)
  
Goblin (Regular Enemy):
  - Dimensions: 1 wide × 2 high (16×32 px)
  - Walk animation: 8 frames (side-facing, moving right)
  - Animation: Single sequence for all directions
  - Sprite flipping: Horizontal flip for left movement
  - Up/Down: Use same right-facing sprite (no flip)
  
Boss Enemy (Orc Warrior):
  - Dimensions: 2 wide × 2 high (32×32 px)
  - Walk animation: 8 frames (side-facing, moving right)
  - Animation: Single sequence for all directions
  - Sprite flipping: Horizontal flip for left movement
  - Up/Down: Use same right-facing sprite (no flip)

Weapons:
  - Sword: 1 wide × 1 high (16×16 px)
  - Axe: 1 wide × 1 high (16×16 px)
  - Attack range: Extends to 1 adjacent tile in facing direction
```

---

## 🎬 Animation System

### Knight/Goblin/Boss Animation

**Single Walk Sequence (8 frames):**
```
[Frame 0] [Frame 1] [Frame 2] [Frame 3] [Frame 4] [Frame 5] [Frame 6] [Frame 7]
  (idle)  (foot L)  (both)    (foot R)  (both)    (foot L)  (both)    (foot R)

Total: 8 frames = one complete step animation
Frame duration: ~100ms per frame = 800ms full step cycle
One step distance: 16 pixels (1 tile)
```

**Animation Logic:**
```javascript
// Single animation sequence works for all directions
walkAnimation = {
  frameCount: 8,
  frameWidth: 16,
  frameHeight: 32,
  frameDuration: 100  // milliseconds
}

// Direction determination:
if (movingRight) {
  // Use sprite as-is, no flip
  spriteScale = { x: 1, y: 1 }
}
if (movingLeft) {
  // Mirror sprite horizontally
  spriteScale = { x: -1, y: 1 }
}
if (movingUp || movingDown) {
  // Use same sprite, no flip
  spriteScale = { x: 1, y: 1 }
  // Visual distinction: Up/Down still uses side-facing sprite
}
```

### Animation States

**Knight States:**
- `idle` - Standing still (first frame, no animation)
- `walking` - Movement active (8-frame cycle)
- `attacking` - Attack animation (weapon visible)
- `hit` - Taking damage (CSS filter animation)

**Goblin States:**
- `idle` - Standing still (first frame)
- `walking` - Approaching knight (8-frame cycle)
- `hit` - Taking damage (CSS filter animation)
- `dead` - Death animation/removal

**Boss States:**
- `idle` - Standing still
- `walking` - Approaching knight (8-frame cycle)
- `hit` - Taking damage (CSS filter animation)
- `dead` - Death sequence

### Hit Animation System

**Damage Feedback (CSS Filters):**
```css
@keyframes hitFlash {
  0% {
    filter: brightness(1) hue-rotate(0deg);
  }
  25% {
    filter: brightness(1.5) hue-rotate(0deg);
  }
  50% {
    filter: brightness(1) hue-rotate(0deg);
  }
  75% {
    filter: brightness(1.5) hue-rotate(0deg);
  }
  100% {
    filter: brightness(1) hue-rotate(0deg);
  }
}

.character.hit {
  animation: hitFlash 0.3s ease-out;
}
```

**Hit Effect:**
- Duration: 300ms
- Effect: Brightness flash (white flash)
- Triggers on collision with monster or taking damage
- Can stack for multiple rapid hits

---

## 🎮 Gameplay Systems

### 1. Movement System

**4-Axis Movement:**
- **Up** - Move 16 pixels up
- **Down** - Move 16 pixels down
- **Left** - Move 16 pixels left (sprite flipped)
- **Right** - Move 16 pixels right

**Grid-Based Movement:**
```javascript
// All movement happens in 16-pixel steps
moveDistance = 16  // pixels per step

// Movement input triggers:
// - Start animation frame from current position
// - Interpolate to target position (100ms over 8 frames)
// - End position locked to 16-pixel grid
```

**Knight Movement:**
- Knight remains in **screen center** visually
- Virtual joystick controls movement **direction**
- Dungeon background scrolls **opposite** to movement
- Each step: Exactly 16 pixels
- Animation: 8-frame walk cycle per step
- No diagonal movement (4-axis only)

**Joystick Controls:**
- 4-directional input only (Up, Down, Left, Right)
- Touch-based or pointer-based input
- Visual feedback: Joystick indicator shows direction
- Movement continues while joystick is held

**Animation Synchronization:**
```javascript
// When movement input detected:
if (joystickDirection === 'up') {
  targetY -= 16
  currentAnimation = 'walking'
  spriteFlip = false
  animateStep()  // Play 8-frame walk
}
if (joystickDirection === 'down') {
  targetY += 16
  currentAnimation = 'walking'
  spriteFlip = false
  animateStep()
}
if (joystickDirection === 'left') {
  targetX -= 16
  currentAnimation = 'walking'
  spriteFlip = true  // Horizontal flip
  animateStep()
}
if (joystickDirection === 'right') {
  targetX += 16
  currentAnimation = 'walking'
  spriteFlip = false
  animateStep()
}

// animateStep() plays 8 frames, each 100ms = 800ms total per step
```

### 2. Combat System

**Attack Mechanics:**
- Attack button triggers knight attack
- Weapon appears in front of knight
- Attack range: 1 tile in facing direction
- Attack cooldown: 0.5 seconds
- Damage: Based on weapon type

**Weapon System:**

| Weapon | Damage | Range | Notes |
|--------|--------|-------|-------|
| **Sword** | 1 | 1 tile | Basic weapon |
| **Axe** | 2 | 1 tile | Stronger damage |

**Attack Pattern:**
```javascript
// Attack hitbox based on facing direction:
if (facingRight) {
  // Affects tiles: current tile + 1 right
  hitPositions = [knight.x + 16]
}
if (facingLeft) {
  // Affects tiles: current tile + 1 left
  hitPositions = [knight.x - 16]
}
if (facingUp) {
  // Affects tiles: current tile + 1 up
  hitPositions = [knight.y - 16]
}
if (facingDown) {
  // Affects tiles: current tile + 1 down
  hitPositions = [knight.y + 16]
}

// All monsters in hit positions take damage
```

**Attack Animation:**
```javascript
attackAnimation = {
  duration: 300,  // milliseconds
  frames: 3,      // windup, strike, recovery
  frameDuration: 100
}

// During attack:
// Frame 1: Weapon appears (100ms)
// Frame 2: Weapon strikes (100ms)
// Frame 3: Weapon disappears (100ms)
```

**Weapon Positioning:**
```javascript
// Weapon appears 1 tile ahead of knight
if (facingDirection === 'right') {
  weaponX = knightX + 16
  weaponY = knightY
}
if (facingDirection === 'left') {
  weaponX = knightX - 16
  weaponY = knightY
  // Also flip weapon horizontally
}
if (facingDirection === 'up') {
  weaponX = knightX
  weaponY = knightY - 16
}
if (facingDirection === 'down') {
  weaponX = knightX
  weaponY = knightY + 16
}
```

### 3. Monster System

**Monster Types:**

| Type | Size | Health | Behavior | Loot |
|------|------|--------|----------|------|
| **Goblin** | 1×2 | 2 | Walks toward knight | 5 coins |
| **Boss** | 2×2 | 15 | Walks toward knight | 100 coins |

**Monster Behavior:**
- Spawn at screen edges (outside viewport)
- Path toward knight (always center)
- Move 16 pixels at a time (grid-based like knight)
- Movement speed: 1 step per 1 second (configurable)
- Deal damage on collision with knight
- Drop loot when defeated
- Hit animation on taking damage

**Monster AI:**
```javascript
// Per movement cycle:
1. Calculate direction to knight
2. Move 16 pixels in that direction
3. Play 8-frame walk animation
4. Check collision with knight
5. Check collision with attack hitbox
6. Update health if hit
7. Trigger hit animation if damaged
8. Remove if health <= 0
```

**Monster Animation:**
```javascript
// Monsters use same logic as knight
if (directionToKnight === 'right') {
  spriteFlip = false
}
if (directionToKnight === 'left') {
  spriteFlip = true  // Flip for left movement
}
if (directionToKnight === 'up' || 'down') {
  spriteFlip = false  // No flip for up/down
}
```

### 4. Hero Progression

**Knight Stats:**
```javascript
knight = {
  health: 10,           // Maximum health
  currentHealth: 10,    // Current HP
  mana: 5,              // Maximum mana
  currentMana: 5,       // Current mana
  weapon: 'sword',      // Equipped weapon
  attackCooldown: 0.5,  // Seconds between attacks
  facingDirection: 'right'  // Up, Down, Left, Right
}
```

**Experience & Leveling:**
- Gain experience by defeating monsters
- Reach experience threshold to level up
- Health increases with level (+2 per level)
- Weapon unlocks at certain levels
- Max level: 10

### 5. Item System

**Item Types:**

#### ❤️ Heart (Life Item)
- Restores 1 health point
- Spawned after defeating enemies (~30% chance)
- Single-use collectible
- 16×16 pixel sprite
- Auto-pickup on collision with knight

#### 🧪 Mana Potion
- Restores all mana (5 points)
- Spawned occasionally by defeated enemies (~10% chance)
- Single-use collectible
- 16×16 pixel sprite
- Auto-pickup on collision with knight

**Item Mechanics:**
- Items spawn on tile where enemy was defeated
- Items stay on screen for 60 seconds
- Auto-collect when knight occupies same tile
- Visual feedback: Item pickup animation
- Stack-based tracking in inventory

---

## 📊 Level Progression

### Level Structure

| Level | Enemy Type | Spawn Rate | Max Enemies | Goal | Boss |
|-------|-----------|-----------|-------------|------|------|
| **1** | Goblin | 1/5sec | 5 | 50 kills | No |
| **2** | Goblin | 1/4sec | 8 | 75 kills | No |
| **3** | Goblin | 1/3sec | 12 | 100 kills | No |
| **4** | Goblin | 1/2sec | 15 | Defeat Boss | Boss |
| **5** | Goblin | 1/sec | 20 | 150 kills | No |
| **6** | Goblin | Scaling | Unlimited | Score building | No |

### Endless Mode (Level 6)
- Continuous goblin spawning
- Spawn rate increases every 30 seconds
- Goblin health/damage scales gradually
- Target: Maximize survival time and score
- Difficulty curve: +10% spawn rate every 30 sec

---

## 🏆 Achievement & Progression

### Level Completion Stars
```javascript
stars = {
  1: "Defeated all enemies",
  2: "Took less than 50% damage",
  3: "Completed in under target time"
}

// Time targets by level (seconds):
timeLimits = {
  1: 120,   // 2 minutes
  2: 120,
  3: 150,   // 2:30
  4: 180,   // 3 minutes (boss)
  5: 180,
  6: null   // Endless has no time limit
}
```

### Potential Achievements
- "First Blood" - Defeat first goblin
- "Monster Slayer" - Defeat 100 goblins total
- "Untouchable" - Complete level without taking damage
- "Speed Runner" - Complete level under target time
- "Endless Survivor" - Survive 5 minutes in endless mode
- "Boss Killer" - Defeat the Orc Warrior
- "Perfect Strikes" - Hit 5 enemies with single attack
- "Weapon Master" - Equip all weapons

---

## 🎨 UI Layout

### Screen Layout (Mobile 375px width)

```
┌─────────────────────────────┐
│ ❤️ 10/10 │ Lvl 1 │ 0/50 💰  │  <- Top Bar (Stats)
├─────────────────────────────┤
│                             │
│         [Stone Dungeon]     │
│     [Goblin]     [Goblin]   │
│                             │
│        [🧑‍🗡️ Knight]          │
│                             │
│     [Goblin]     [Goblin]   │
├─────────────────────────────┤
│ [Attack]        [Joystick]  │  <- Control Bar
│ [⚔️ Cool]      [4-Axis]    │
└─────────────────────────────┘
```

### HUD Elements

**Top Bar (Stats):**
- ❤️ Health display (current/max with hearts)
- 📊 Current level number
- 💰 Kill counter with goal (e.g., "0/50")

**Bottom Left (Attack):**
- Large red button for attack action
- Cooldown indicator (visual)
- Shows equipped weapon icon
- Text: "ATTACK"

**Bottom Right (Joystick):**
- 4-directional joystick (Up, Down, Left, Right only)
- Circular control area
- Outer ring shows cardinal directions
- Visual feedback for current direction

---

## 💾 Data Structure

### Game State
```javascript
dungeonGameData = {
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
  facingDirection: 'right',  // Up, Down, Left, Right
  inventory: {
    hearts: 0,
    manaPotions: 0
  },
  stats: {
    totalKills: 0,
    totalPlayTime: 0,
    bestScore: 0,
    levelBestTimes: {},
    levelStars: {}
  }
}
```

### Goblin Instance
```javascript
goblin = {
  id: unique_id,
  gridX: grid_x,        // Grid position
  gridY: grid_y,
  health: 2,
  maxHealth: 2,
  moveSpeed: 1,         // Tiles per second
  damage: 1,
  animationFrameIndex: 0,
  facingDirection: 'right',  // Direction toward knight
  state: 'walking'      // walking, hit, dead
}
```

### Boss Instance
```javascript
boss = {
  id: 'boss-1',
  gridX: grid_x,
  gridY: grid_y,
  health: 15,
  maxHealth: 15,
  moveSpeed: 0.5,       // Slower movement
  damage: 3,
  animationFrameIndex: 0,
  facingDirection: 'right',
  state: 'walking'      // walking, hit, dead
}
```

### Knight State
```javascript
knight = {
  gridX: screenCenterGridX,  // Always center
  gridY: screenCenterGridY,  // Always center
  health: 10,
  mana: 5,
  weapon: 'sword',
  facingDirection: 'right',  // Last movement direction
  animationState: 'idle',    // idle, walking, attacking
  animationFrameIndex: 0,
  attackCooldownRemaining: 0,
  isAttacking: false,
  isMoving: false
}
```

### Attack Hitbox
```javascript
attackHitbox = {
  active: false,
  gridX: knight_grid_x,  // Depends on facing direction
  gridY: knight_grid_y,
  weapon: 'sword',  // sword or axe
  damage: 1         // weapon damage
}
```

---

## 🎯 Control Scheme

### Touch Controls
- **Joystick** (Bottom-Right): Drag to move (4 directions only), release to stop
- **Attack Button** (Bottom-Left): Tap to attack (affects 1 tile in facing direction)

### Keyboard Controls (PC Testing)
- **W / Up Arrow**: Move up
- **S / Down Arrow**: Move down
- **A / Left Arrow**: Move left
- **D / Right Arrow**: Move right
- **Spacebar / Enter**: Attack
- **One input at a time** (4-axis system, no simultaneous directions)

---

## 🔧 Technical Implementation

### Core Systems to Implement

1. **Grid-Based Movement Engine**
    - All positions on 16-pixel grid
    - Movement in 16-pixel steps
    - Step animations synchronized to movement
    - Queue-based input handling

2. **Sprite Animation System**
    - Single 8-frame animation sequence
    - Horizontal flip for left-facing
    - No flip for up/down (same sprite used)
    - Frame timing (100ms per frame)

3. **Game Loop**
   ```javascript
   gameLoop() {
     // 1. Handle input (queue movement input)
     // 2. Process current step (animate to next grid tile)
     // 3. Update animation frames (100ms per frame)
     // 4. Update monster movements
     // 5. Check collisions (knight-monster, attack-monster)
     // 6. Update attack cooldown
     // 7. Render frame
   }
   ```

4. **Collision Detection**
    - Knight-Monster collision on same grid tile (deals damage)
    - Attack hitbox-Monster collision (monster takes damage)
    - Knight-Item collision on same tile (auto-pickup)
    - Grid-based collision (discrete, not continuous)

5. **Monster Spawning**
    - Random spawn points at screen edges (grid-aligned)
    - Spawn rate per level
    - Maximum concurrent enemies limit
    - Type distribution

6. **Hit Animation System**
    - CSS filter-based damage flash
    - Duration: 300ms
    - Brightness increase effect
    - Applies to knight and monsters

---

## 📁 Component Structure (Vue 3)

```
src/gamingHub/games/hawkdungeon/
├── HawkDungeon.vue             # Main game component
├── components/
│   ├── GameCanvas.vue          # Grid rendering system
│   ├── JoystickControl.vue     # 4-directional joystick
│   ├── AttackButton.vue        # Attack action button
│   ├── GameHUD.vue             # Health, score, level display
│   ├── AnimatedSprite.vue      # Reusable sprite animator
│   └── LevelSelection.vue      # Level picker
├── composables/
│   ├── useHawkDungeon.js       # Core game logic
│   ├── useMonsterAI.js         # Monster behavior & spawning
│   ├── useCollisions.js        # Grid-based collision detection
│   ├── useSpriteManager.js     # Sprite extraction & animation
│   ├── useGridMovement.js      # Grid-based movement system
│   └── useHitAnimation.js      # CSS filter hit effects
├── config/
│   ├── spriteConfig.js         # Sprite sheet coordinates
│   ├── monsterConfig.js        # Monster definitions
│   ├── levelConfig.js          # Level settings
│   ├── weaponConfig.js         # Weapon stats (Sword, Axe)
│   └── achievementsConfig.js   # Game achievements
└── assets/
    └── spritesheet.png         # Your sprite image
```

---

## 📝 Development Phases

### Phase 1: Core Gameplay
- [ ] Game loop setup with grid system
- [ ] Sprite sheet loading and 8-frame animation
- [ ] Knight rendering with 4-axis movement
- [ ] Grid-based movement (16-pixel steps)
- [ ] Sprite flipping (left/right facing)
- [ ] Dungeon background scrolling
- [ ] Goblin spawning and grid-based AI
- [ ] Basic attack system (Sword)
- [ ] Weapon positioning and attack detection
- [ ] Monster damage and collision
- [ ] Level 1 implementation

### Phase 2: Polish & Items
- [ ] Hit animation with CSS filters
- [ ] Health system with visual display
- [ ] Mana Potion system
- [ ] Heart item spawning and collection
- [ ] Axe weapon implementation
- [ ] Cooldown visualization
- [ ] Sound effects

### Phase 3: Progression
- [ ] All level implementations (1-6)
- [ ] Level completion detection
- [ ] Star rating system
- [ ] Boss enemy implementation
- [ ] Experience and leveling
- [ ] Save/Restore system

### Phase 4: Balance & Endless
- [ ] Difficulty curve tuning
- [ ] Endless mode implementation
- [ ] Statistics tracking
- [ ] Achievement system integration
- [ ] Performance optimization
- [ ] Final testing

---

## 🎨 Sprite Sheet Mapping

### Knight Animation
```javascript
knight: {
  width: 16,
  height: 32,
  walk: {
    frames: 8,
    frameWidth: 16,
    frameHeight: 32,
    frameDuration: 100,  // milliseconds
    sequence: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  flipped: false  // Set to true for left movement
}
```

### Goblin Animation
```javascript
goblin: {
  width: 16,
  height: 32,
  walk: {
    frames: 8,
    frameWidth: 16,
    frameHeight: 32,
    frameDuration: 100,
    sequence: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  flipped: false  // Set to true for left movement
}
```

### Boss Animation
```javascript
boss: {
  width: 32,
  height: 32,
  walk: {
    frames: 8,
    frameWidth: 32,
    frameHeight: 32,
    frameDuration: 100,
    sequence: [0, 1, 2, 3, 4, 5, 6, 7]
  },
  flipped: false  // Set to true for left movement
}
```

### Weapons
```javascript
weapons: {
  sword: {
    width: 16,
    height: 16,
    damage: 1,
    spriteIndex: 0
  },
  axe: {
    width: 16,
    height: 16,
    damage: 2,
    spriteIndex: 1
  }
}
```

### Items
```javascript
items: {
  heart: {
    width: 16,
    height: 16,
    effect: 'heal-1',
    spriteIndex: 0
  },
  manaPotion: {
    width: 16,
    height: 16,
    effect: 'restore-mana',
    spriteIndex: 1
  }
}
```

---

## 📚 Related Documentation

- **[COLLABORATION_GUIDELINES.md](./COLLABORATION_GUIDELINES.md)** - Development workflow
- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Project architecture
- **[ROADMAP.md](./ROADMAP.md)** - Version timeline

---

**Built with ❤️ for dungeon crawlers** | Grid-based pixel art action | Pure 4-axis gameplay