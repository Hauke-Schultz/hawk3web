# 🎮 Hawk3 Gaming Platform - Project Context

> **Quick Links:** [README](./README.md) | [Collaboration Guidelines](./COLLABORATION_GUIDELINES.md) | [Roadmap](./ROADMAP.md)

This document provides technical context for AI assistance and developers working on the Hawk3 platform.

## 📁 Project Structure

```
src/
├── components/          # Reusable Vue components (Icon, InstallPrompt)
├── composables/         # Vue composables (useI18n, useServiceWorker)
├── gamingHub/
│   ├── components/      # Game-specific components (Header, CurrencyDisplay, Modals)
│   ├── composables/     # Game logic (useLocalStorage, useInventory, useShop)
│   ├── config/          # Game configurations & constants
│   │   ├── achievementsConfig.js
│   │   ├── giftConfig.js
│   │   ├── mysteryBoxConfig.js
│   │   ├── shopConfig.js
│   │   └── comboConfig.js
│   ├── games/           # Individual games
│   │   ├── memory/
│   │   ├── hawkfruit/
│   │   └── hawkdoubleup/
│   └── views/           # Main pages (Profile, Shop, Trophy, Settings)
├── locales/             # i18n translations (en.js, de.js)
├── router/              # Vue Router configuration
├── views/               # Top-level pages (Home, About)
└── style.css            # Global CSS variables and styles
```

## 🛠️ Key Technologies

- **Vue 3** - Composition API with `<script setup>` syntax
- **Vite** - Build tool and dev server
- **SCSS** - CSS preprocessor with BEM methodology
- **Matter.js** - Physics engine for HawkFruit game
- **Vue Router** - Client-side routing
- **LocalStorage** - Data persistence layer
- **PWA** - Service worker with custom caching strategy

## 🎯 Core Systems Overview

### 1. Data Management (`useLocalStorage.js`)

Central data store handling all game state, player data, and persistence.

**Key Responsibilities:**
- Player profile (name, avatar, level, currencies)
- Game progress (levels, scores, stars, save states)
- Achievements and rewards
- Inventory and shop purchases
- Gift system tracking
- Daily rewards and mystery boxes
- Transaction history

**Common Patterns:**
```javascript
const { gameData, updatePlayer, addItemToInventory } = useLocalStorage()

// Read
const coins = gameData.player.coins

// Write
updatePlayer({ coins: newAmount })
addItemToInventory('item-id', 'cosmetic')
```

### 2. Inventory System (`useInventory.js`)

Manages item ownership, equipping, and activation.

**Item Categories:**
- **Cosmetics** - Avatars, themes, card frames
- **Consumables** - Power-ups (hammer, undo)
- **Mystery Box Items** - Exclusive cosmetics
- **Gift Items** - Sendable/receivable items

**Usage:**
```javascript
const { inventory, equipItem, activateBoost } = useInventory()

equipItem('avatar-1')
activateBoost('hammer', 60) // 60 second duration
```

### 3. Internationalization (`useI18n.js`)

English and German language support with dynamic switching.

**Usage:**
```javascript
const { t, locale } = useI18n()

// Simple translation
{{ t('menu.home') }}

// With parameters
{{ t('shop.price', { amount: 100 }) }}

// Date/time formatting
{{ t('time.minutesAgo', { minutes: 5 }) }}
```

### 4. Shop System (`useShop.js`)

Handles purchases, refunds, and shop item management.

**Categories:**
- Profile (avatars, themes)
- Items (cosmetics, consumables)
- Utilities (power-ups)
- Gifts (sendable items)

**Features:**
- Rarity system (common → legendary)
- Purchase confirmation modals
- Automatic inventory updates
- Transaction logging

### 5. Achievement System (`achievementsConfig.js`)

30+ achievements across categories with automatic reward distribution.

**Categories:**
- General (profile, daily activities)
- Gaming (cross-game achievements)
- Memory Game specific
- HawkFruit specific
- HawkDoubleUp specific
- Special achievements

**Rarity Levels:**
- Common (10 coins)
- Uncommon (25 coins)
- Rare (50 coins + 5 diamonds)
- Epic (100 coins + 10 diamonds)
- Legendary (250 coins + 25 diamonds)

### 6. Gift System (`giftConfig.js`)

Send and receive gifts with friends.

**Rules:**
- Send limit: 1 gift per day
- Receive limit: 3 gifts per day
- Code expiration: 7 days
- Unique redemption: Each code can only be used once

**Tracking:**
- Sent gift history
- Received gift history
- Redeemed code validation
- Daily limit reset

### 7. Daily Rewards System

Interactive reward claiming with mini-games.

**Components:**
- Daily bonus claim (resets at midnight)
- Mini-games: Three Shells, Slot Machine, Whack-a-Mole
- Mystery Box unlock (every 5 daily rewards)
- Streak tracking

### 8. Mystery Box System (`mysteryBoxConfig.js`)

Special cosmetic items not available in shop.

**Features:**
- Exclusive items with unique designs
- Unlock every 5 daily rewards
- Rarity-based item distribution
- Pending box notification

### 9. Screenshot System

Capture and share game moments.

**Features:**
- Game state preservation
- Metadata tracking (score, time, date)
- Watermark with logo and timestamp
- Clipboard sharing
- Gallery view in level selection

## 🎮 Game-Specific Systems

### Memory Game
- 6 levels with increasing difficulty
- Card matching mechanics
- Combo system with multipliers
- Star rating (time-based)
- Save/restore game states

### HawkFruit
- 5 levels + endless mode
- Matter.js physics engine
- Special fruits: Mold, Bomb, Rainbow
- Next fruit preview
- Fruit selection (diamond cost)
- Height-based game over
- Screenshot integration

### HawkDoubleUp
- 5 levels + endless mode
- 2048-style mechanics (2→4→8...→2048)
- 4x4 grid with WASD/Arrow/Swipe controls
- Special 7-tile mechanic
- Undo power-up integration
- Progressive difficulty

## 📊 Data Structure

```javascript
gameData = {
  player: {
    name: string,
    avatar: string,
    level: number,
    coins: number,
    diamonds: number,
    inventory: {
      items: { [id]: { type, rarity, purchaseDate } },
      equipped: { avatars: string, themes: string },
      activeBoosts: [{ id, expiresAt }]
    },
    gifts: {
      sentToday: number,
      receivedToday: number,
      lastSentDate: string,
      lastReceivedDate: string,
      sentGifts: [],
      receivedGifts: []
    }
  },
  games: {
    memory: {
      levels: { 1: { completed, stars, bestTime, bestMoves } },
      highScore: number,
      totalStars: number,
      saveState: { level, cards, ... }
    },
    hawkFruit: {
      levels: { 1: { completed, stars, bestScore, bestTime } },
      highScore: number,
      totalStars: number,
      saveState: { level, fruits, score, ... },
      screenshots: []
    },
    hawkDoubleUp: {
      levels: { 1: { completed, stars, bestScore, bestMoves } },
      highScore: number,
      totalStars: number,
      saveState: { level, grid, score, ... },
      screenshots: []
    }
  },
  achievements: [
    { id, unlockedAt, rewardClaimed }
  ],
  currency: {
    transactions: [{ type, amount, reason, timestamp }],
    dailyRewards: {
      lastClaimed: string,
      counter: number
    },
    mysteryBoxes: {
      lastClaimed: string,
      totalClaimed: number,
      pendingMysteryBox: boolean
    }
  },
  settings: {
    theme: 'dark' | 'light',
    language: 'en' | 'de',
    fontSize: 'small' | 'medium' | 'large'
  },
  cards: {
    [cardId]: { read: boolean }
  }
}
```

## 🎨 Styling System

### CSS Variables
```css
/* Colors */
--primary-color: #4F46E5
--success-color: #10B981
--warning-color: #F59E0B
--danger-color: #EF4444

  /* Spacing */
--space-1: 0.25rem  /* 4px */
               --space-4: 1rem     /* 16px */
                           --space-8: 2rem     /* 32px */

                                         /* Typography */
                                       --font-size-sm: 0.875rem
                                                            --font-size-base: 1rem
                                                                               --font-size-lg: 1.125rem

                                                                                                      /* Border Radius */
                                                                                                    --border-radius-md: 0.5rem
                                                                                                                           --border-radius-lg: 0.75rem
```

### BEM Naming Convention
```css
.block__element--modifier

  /* Examples */
.game-card
.game-card__header
.game-card__header--active
.btn--primary
.btn--ghost
```

### Responsive Breakpoints
```css
/* Mobile-first approach */
@media (max-width: 375px) { /* Small phones */ }
@media (min-width: 376px) { /* Standard phones */ }
@media (min-width: 768px) { /* Tablets */ }
@media (min-width: 1024px) { /* Desktop */ }
```

## 🔑 Important Files Reference

### Core Systems
- `src/gamingHub/composables/useLocalStorage.js` - Central data management
- `src/gamingHub/composables/useInventory.js` - Item management
- `src/gamingHub/composables/useShop.js` - Shop logic
- `src/composables/useI18n.js` - Translations
- `src/composables/useServiceWorker.js` - PWA functionality
- `src/router/index.js` - Navigation routes

### Key Components
- `src/gamingHub/components/Header.vue` - App header with navigation
- `src/gamingHub/components/CurrencyDisplay.vue` - Coins/diamonds display
- `src/gamingHub/views/Profile.vue` - Player profile and inventory
- `src/gamingHub/views/Shop.vue` - Shop and gift system
- `src/gamingHub/views/Trophy.vue` - Achievement display
- `src/views/Home.vue` - Main dashboard

### Configurations
- `src/gamingHub/config/achievementsConfig.js` - All achievements
- `src/gamingHub/config/giftConfig.js` - Gift system rules
- `src/gamingHub/config/mysteryBoxConfig.js` - Mystery box items
- `src/gamingHub/config/shopConfig.js` - Shop items and categories
- `src/gamingHub/config/comboConfig.js` - Combo system settings

### Game Files
- `src/gamingHub/games/memory/` - Memory game implementation
- `src/gamingHub/games/hawkfruit/` - HawkFruit with Matter.js
- `src/gamingHub/games/hawkdoubleup/` - HawkDoubleUp implementation

### Localization
- `src/locales/en.js` - English translations
- `src/locales/de.js` - German translations

## 💡 Development Guidelines

For coding standards, workflow, and collaboration practices, see:
- **[COLLABORATION_GUIDELINES.md](./COLLABORATION_GUIDELINES.md)** - Complete development process

For feature planning and version history, see:
- **[ROADMAP.md](./ROADMAP.md)** - Version timeline and future features

For project overview and quick start, see:
- **[README.md](./README.md)** - Getting started guide

## 🔧 Common Tasks

### Adding a New Achievement
1. Add to `achievementsConfig.js`
2. Update translations in `en.js` and `de.js`
3. Implement check logic in `useLocalStorage.js`

### Adding a Shop Item
1. Add to `shopConfig.js`
2. Update translations
3. Test purchase flow
4. Verify inventory integration

### Adding a Translation
1. Add key to `en.js`
2. Add key to `de.js`
3. Use with `t('key.path')` in components

### Modifying Game Logic
1. Locate game folder in `src/gamingHub/games/`
2. Update game component
3. Test save/restore functionality
4. Update achievement checks if needed

---

**Last Updated:** v0.3.3+ | **For AI Assistance:** Provide relevant sections when requesting changes