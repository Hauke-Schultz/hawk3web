# 🏗️ StackMerge - Implementation Plan

## 🎮 Game Mechanics Overview

### Core Gameplay
**StackMerge** is a precision timing game where players build a tower by stacking moving blocks.

**How it works:**
1. A block moves horizontally back and forth on screen
2. Player taps/clicks to drop the block
3. If block aligns perfectly with previous block → Perfect stack (block stays full size)
4. If block partially overlaps → Only overlapping part continues (rest falls off)
5. If block misses completely → Game Over
6. Each successful stack = +1 point
7. Goal: Stack as high as possible

### Difficulty Progression
- **Speed increases** as tower grows taller
- **Block size** can optionally decrease slightly
- **Movement distance** can increase at higher levels

### Level Structure (6 Levels + Endless)
- **Level 1-5:** Fixed target heights (e.g., 10, 15, 20, 25, 30 blocks)
- **Level 6:** Endless mode - stack until failure
- **Star Rating:** Based on perfect stacks percentage
    - ⭐ 1 Star: Complete level
    - ⭐⭐ 2 Stars: 60%+ perfect stacks
    - ⭐⭐⭐ 3 Stars: 80%+ perfect stacks

### Special Features
- **Perfect Stack Combo:** Consecutive perfect stacks increase score multiplier
- **Color Progression:** Block colors change as tower grows (visual reward)
- **Camera Follow:** Viewport smoothly follows tower height
- **Physics-Free:** Pure timing/collision detection (no Matter.js needed)

---

## 📁 Required Files & Structure

### New Files to Create

```
src/gamingHub/games/stackmerge/
├── StackMerge.vue          # Main game component
├── StackMergeLevels.vue    # Level selection interface
├── GameCanvas.vue          # Canvas rendering component
├── Block.js                # Block class with position/size
├── StackEngine.js          # Core game logic & collision detection
├── stackConfig.js          # Level configs, colors, speeds
└── stackHelpers.js         # Helper functions (overlap calculation, etc.)
```

### Files to Modify

```
src/gamingHub/
├── views/
│   └── GamingPage.vue          # Add StackMerge to game list
├── composables/
│   └── useLocalStorage.js      # Add stackMerge game data structure
├── config/
│   └── achievementsConfig.js   # Add StackMerge achievements
└── router/index.js             # Add StackMerge route

src/locales/
├── en.js                       # Add English translations
└── de.js                       # Add German translations
```

---

## 🗓️ Step-by-Step Roadmap

### **Phase 1: Foundation & Setup** (Steps 1-3)

#### ✅ **Step 1: Data Structure & Configuration**
**Goal:** Set up game data in localStorage and create config file

**Files:**
- `useLocalStorage.js` - Add stackMerge data structure
- `stackConfig.js` - Create level configurations

**Tasks:**
- [x] Add `stackMerge` object to gameData structure
- [x] Define 6 levels with target heights
- [x] Configure speed progression
- [x] Set up color palette for blocks

---

#### ✅ **Step 2: Basic Game Component & Routing**
**Goal:** Create main game component and navigation

**Files:**
- `StackMerge.vue` - Main game component skeleton
- `router/index.js` - Add route

**Tasks:**
- [x] Create Vue component with script setup
- [x] Add game route to router
- [x] Create level selection interface

---

#### ✅ **Step 3: Canvas Rendering Setup**
**Goal:** Set up HTML5 Canvas for game rendering

**Files:**
- `GameCanvas.vue` - Canvas component
- `StackMerge.vue` - Integrate canvas

**Tasks:**
- [x] Create responsive canvas element
- [x] Set up rendering loop with requestAnimationFrame
- [x] Implement viewport camera system
- [x] Add basic grid/background rendering

---

### **Phase 2: Core Game Logic** (Steps 4-6)

#### ✅ **Step 4: Block Class & Movement**
**Goal:** Create moving block with collision detection

**Files:**
- `Block.js` - Block entity class
- `StackEngine.js` - Game engine core
- `GameCanvas.vue` - Render blocks

**Tasks:**
- [x] Create Block class (position, size, speed, direction)
- [x] Implement horizontal movement logic
- [x] Add block rendering on canvas
- [x] Create stack array to hold placed blocks

---

#### ✅ **Step 5: Collision Detection & Stacking**
**Goal:** Implement tap-to-stack mechanic with overlap calculation

**Files:**
- `StackEngine.js` - Add collision logic
- `stackHelpers.js` - Overlap calculation functions

**Tasks:**
- [x] Detect tap/click/spacebar input
- [x] Calculate overlap between moving and previous block
- [x] Handle perfect stack (100% overlap)
- [x] Handle partial stack (trim block to overlap)
- [x] Handle miss (game over)
- [x] Spawn next block on successful stack

---

#### ✅ **Step 6: Score & Combo System**
**Goal:** Add scoring with perfect stack combo multiplier

**Files:**
- `StackEngine.js` - Add scoring logic

**Tasks:**
- [x] Track score (1 point per block + combo bonus)
- [x] Track perfect stacks consecutively
- [x] Calculate combo multiplier (2x, 3x, 4x, etc.)
- [x] Display current combo streak
- [x] Reset combo on non-perfect stack

---

### **Phase 3: Level System & Progression** (Steps 7-9)

#### ✅ **Step 7: Level Completion & Star Rating**
**Goal:** Implement level targets and star calculation

**Tasks:**
- [x] Check if level target height reached
- [x] Calculate perfect stack percentage
- [x] Determine star rating (1-3 stars)
- [x] Save best score, best height, perfect %
- [x] Show GameCompletedModal with results

---

#### ✅ **Step 8: Endless Mode**
**Goal:** Create level 6 endless mode

**Tasks:**
- [x] Remove height limit for level 6
- [x] Progressive speed increase over time
- [x] Milestone rewards (every 10 blocks)
- [x] Track personal best height
- [x] Time-based play tracking

---

#### ✅ **Step 9: Difficulty Progression**
**Goal:** Make game harder as tower grows

**Tasks:**
- [x] Increase movement speed gradually

---

### **Phase 4: Visual Polish & Effects**

#### ✅ **Step 10: Animations & Visual Feedback**
**Status:** Not Started
**Goal:** Add satisfying visual effects

**Tasks:**
- [ ] Perfect stack flash/glow effect
- [ ] Combo counter pop animation

---

### **Phase 5: Integration & Features**

#### ✅ **Step 11: Achievements Integration**
**Status:** Not Started
**Goal:** Add StackMerge-specific achievements

**Tasks:**
- [ ] Stack 10, 25, 50 blocks total
- [ ] Get 10 perfect stacks in a row
- [ ] Complete all levels with 3 stars
- [ ] Reach height 50 in endless mode
- [ ] Get combo 5x, 10x, 15x

**Achievement Ideas:**
- "First Stack" - Stack your first block
- "Tower Builder" - Stack 10 blocks total
- "Architect" - Stack 25 blocks total
- "Skyscraper" - Stack 50 blocks total
- "Perfect Streak" - Get 5 perfect stacks in a row
- "Perfectionist" - Get 10 perfect stacks in a row
- "Level Master" - Complete all levels with 3 stars
- "Endless Champion" - Reach height 30 in endless mode
- "Sky Limit" - Reach height 50 in endless mode
