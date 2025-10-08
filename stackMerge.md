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
├── GameCanvas.vue          # Canvas rendering component
├── GameHeader.vue          # Score, level, perfect counter
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
**Status:** Not Started
**Goal:** Set up game data in localStorage and create config file

**Files:**
- `useLocalStorage.js` - Add stackMerge data structure
- `stackConfig.js` - Create level configurations

**Tasks:**
- [ ] Add `stackMerge` object to gameData structure
- [ ] Define 6 levels with target heights
- [ ] Configure speed progression
- [ ] Set up color palette for blocks

**Data Structure:**
```javascript
stackMerge: {
  levels: {
    1: { completed: false, stars: 0, bestHeight: 0, bestScore: 0, perfectPercent: 0 },
    2: { completed: false, stars: 0, bestHeight: 0, bestScore: 0, perfectPercent: 0 },
    3: { completed: false, stars: 0, bestHeight: 0, bestScore: 0, perfectPercent: 0 },
    4: { completed: false, stars: 0, bestHeight: 0, bestScore: 0, perfectPercent: 0 },
    5: { completed: false, stars: 0, bestHeight: 0, bestScore: 0, perfectPercent: 0 },
    6: { completed: false, stars: 0, bestHeight: 0, bestScore: 0, perfectPercent: 0 }
  },
  highScore: 0,
  totalStacks: 0,
  totalPerfectStacks: 0,
  bestCombo: 0,
  totalStars: 0,
  saveState: null
}
```

---

#### ✅ **Step 2: Basic Game Component & Routing**
**Status:** Not Started
**Goal:** Create main game component and navigation

**Files:**
- `StackMerge.vue` - Main game component skeleton
- `router/index.js` - Add route
- `GamingPage.vue` - Add game tile

**Tasks:**
- [ ] Create Vue component with script setup
- [ ] Add game route to router
- [ ] Add StackMerge tile to GamingPage
- [ ] Create level selection interface

---

#### ✅ **Step 3: Canvas Rendering Setup**
**Status:** Not Started
**Goal:** Set up HTML5 Canvas for game rendering

**Files:**
- `GameCanvas.vue` - Canvas component
- `StackMerge.vue` - Integrate canvas

**Tasks:**
- [ ] Create responsive canvas element
- [ ] Set up rendering loop with requestAnimationFrame
- [ ] Implement viewport camera system
- [ ] Add basic grid/background rendering

---

### **Phase 2: Core Game Logic** (Steps 4-6)

#### ✅ **Step 4: Block Class & Movement**
**Status:** Not Started
**Goal:** Create moving block with collision detection

**Files:**
- `Block.js` - Block entity class
- `StackEngine.js` - Game engine core
- `GameCanvas.vue` - Render blocks

**Tasks:**
- [ ] Create Block class (position, size, speed, direction)
- [ ] Implement horizontal movement logic
- [ ] Add block rendering on canvas
- [ ] Create stack array to hold placed blocks

---

#### ✅ **Step 5: Collision Detection & Stacking**
**Status:** Not Started
**Goal:** Implement tap-to-stack mechanic with overlap calculation

**Files:**
- `StackEngine.js` - Add collision logic
- `stackHelpers.js` - Overlap calculation functions

**Tasks:**
- [ ] Detect tap/click/spacebar input
- [ ] Calculate overlap between moving and previous block
- [ ] Handle perfect stack (100% overlap)
- [ ] Handle partial stack (trim block to overlap)
- [ ] Handle miss (game over)
- [ ] Spawn next block on successful stack

---

#### ✅ **Step 6: Score & Combo System**
**Status:** Not Started
**Goal:** Add scoring with perfect stack combo multiplier

**Files:**
- `StackEngine.js` - Add scoring logic
- `GameHeader.vue` - Display score/combo

**Tasks:**
- [ ] Track score (1 point per block + combo bonus)
- [ ] Track perfect stacks consecutively
- [ ] Calculate combo multiplier (2x, 3x, 4x, etc.)
- [ ] Display current combo streak
- [ ] Reset combo on non-perfect stack

---

### **Phase 3: Level System & Progression** (Steps 7-9)

#### ✅ **Step 7: Level Completion & Star Rating**
**Status:** Not Started
**Goal:** Implement level targets and star calculation

**Files:**
- `StackEngine.js` - Level completion logic
- `useLocalStorage.js` - Save level stats

**Tasks:**
- [ ] Check if level target height reached
- [ ] Calculate perfect stack percentage
- [ ] Determine star rating (1-3 stars)
- [ ] Save best score, best height, perfect %
- [ ] Show GameCompletedModal with results

---

#### ✅ **Step 8: Endless Mode**
**Status:** Not Started
**Goal:** Create level 6 endless mode

**Files:**
- `stackConfig.js` - Endless mode config
- `StackEngine.js` - Endless mode logic

**Tasks:**
- [ ] Remove height limit for level 6
- [ ] Progressive speed increase over time
- [ ] Milestone rewards (every 10 blocks)
- [ ] Track personal best height
- [ ] Time-based play tracking

---

#### ✅ **Step 9: Difficulty Progression**
**Status:** Not Started
**Goal:** Make game harder as tower grows

**Files:**
- `StackEngine.js` - Dynamic difficulty
- `stackConfig.js` - Difficulty curves

**Tasks:**
- [ ] Increase movement speed gradually
- [ ] Optionally reduce block width at milestones
- [ ] Increase movement distance range
- [ ] Add visual feedback for difficulty increase

---

### **Phase 4: Visual Polish & Effects** (Steps 10-11)

#### ✅ **Step 10: Animations & Visual Feedback**
**Status:** Not Started
**Goal:** Add satisfying visual effects

**Files:**
- `GameCanvas.vue` - Animation rendering
- `StackEngine.js` - Animation triggers

**Tasks:**
- [ ] Perfect stack flash/glow effect
- [ ] Block drop animation with easing
- [ ] Falling pieces animation (trimmed parts)
- [ ] Tower shake on non-perfect stack
- [ ] Combo counter pop animation
- [ ] Color gradient progression

---

#### ✅ **Step 11: Camera & Viewport**
**Status:** Not Started
**Goal:** Smooth camera follow as tower grows

**Files:**
- `GameCanvas.vue` - Camera system

**Tasks:**
- [ ] Smooth scroll to keep moving block visible
- [ ] Center tower in viewport
- [ ] Zoom out slightly as tower grows tall
- [ ] Add parallax background (optional)

---

### **Phase 5: Integration & Features** (Steps 12-13)

#### ✅ **Step 12: Achievements Integration**
**Status:** Not Started
**Goal:** Add StackMerge-specific achievements

**Files:**
- `achievementsConfig.js` - New achievements
- `useLocalStorage.js` - Achievement checks

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

---

#### ✅ **Step 13: Internationalization**
**Status:** Not Started
**Goal:** Add translations (EN + DE)

**Files:**
- `en.js` - English translations
- `de.js` - German translations

**Tasks:**
- [ ] Game title and description
- [ ] UI text (score, perfect, combo, height)
- [ ] Level names
- [ ] Achievement names/descriptions
- [ ] Tutorial text
- [ ] Completion messages

---

## 🔗 Integration into Existing Systems

### 1. LocalStorage Integration
Add to gameData structure with levels, stats, and save state

### 2. Achievement System
new achievements across stacking milestones, perfect streaks, height records, combos, and level completion

### 3. Shop Integration (Optional Future)
- Perfect Guide - Visual alignment helper
- Slow-Mo - Reduce speed temporarily
- Second Chance - One free miss per game

### 4. Navigation Integration
Add StackMerge tile to GamingPage with red/orange theme

### 5. Router Integration
Add `/games/stackmerge` route

---

## 🎨 Technical Details

### Canvas Rendering
- **No Matter.js** - Pure 2D canvas rendering
- **Fixed timestep** - Consistent game speed
- **Double buffering** - Smooth animation
- **Responsive** - Scales to 375px base width

### Performance
- Render only visible blocks
- Simple rectangle collision
- Optimized requestAnimationFrame
- Clear only necessary areas

### Mobile Optimization
- Full screen tap area
- Touch feedback
- Portrait-only
- 60fps smooth
- Minimal memory

---

## 📋 Progress Tracking

**Phase 1: Foundation** - 0/3 steps completed
**Phase 2: Core Logic** - 0/3 steps completed
**Phase 3: Level System** - 0/3 steps completed
**Phase 4: Polish** - 0/2 steps completed
**Phase 5: Integration** - 0/2 steps completed

**Overall Progress: 0/16 steps (0%)**
