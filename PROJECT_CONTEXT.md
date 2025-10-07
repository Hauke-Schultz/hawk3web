# Hawk3 Gaming Platform - Project Context

## Project Structure

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
│   │   ├── fruitmerge/
│   │   └── nummerge/
│   └── views/           # Main pages (Profile, Shop, Trophy, Settings)
├── locales/             # i18n translations (en.js, de.js)
├── router/              # Vue Router configuration
├── views/               # Top-level pages (Home, About)
└── style.css            # Global CSS variables and styles

## Key Technologies

- Vue 3 + Composition API (script setup)
- Vite for build and development
- SCSS with BEM methodology
- LocalStorage for data persistence
- Matter.js for physics engine (FruitMerge game)
- Vue Router for navigation
- PWA with custom service worker

## Core Systems

### Data Management
- useLocalStorage: Central data store with localStorage persistence
    - Player data (name, avatar, coins, diamonds, inventory)
    - Game progress (levels, scores, stars)
    - Achievements and rewards
    - Gift system data
    - Mystery box tracking
    - Daily reward counters

- useInventory: Item management
    - Shop items (cosmetics, consumables)
    - Mystery box items (exclusive cosmetics)
    - Gift items (sendable/receivable)
    - Power-ups (hammer, undo)
    - Item equipping and activation

- useI18n: Internationalization
    - English and German translations
    - Dynamic language switching
    - Locale-specific formatting (dates, numbers, time)

### Key Features

1. Games System
    - Memory Game (6 levels)
    - FruitMerge Game (5 levels + endless)
    - NumMerge Game (5 levels + endless)
    - Star rating system (1-3 stars per level)
    - Save/Restore game states
    - Screenshot system for high scores

2. Achievement System
    - 30+ achievements across categories
    - Automatic reward distribution (coins + diamonds)
    - Rarity system (common to legendary)
    - Categories: general, gaming, memory, fruitMerge, numMerge, special

3. Economy System
    - Coins and Diamonds currency
    - Transaction history tracking
    - Reward calculations with multipliers
    - Shop purchases and refunds

4. Daily Rewards
    - Daily bonus claim
    - Mini-games (Three Shells, Slot Machine, Whack-a-Mole)
    - Mystery Box unlock (every 5 daily rewards)
    - Streak tracking

5. Gift System
    - Send gifts to friends (1 per day limit)
    - Receive gifts (3 per day limit)
    - Gift code generation and validation
    - 7-day expiration on gift codes
    - Gift history tracking

6. Shop System
    - Categories: Profile, Items, Utilities, Gifts
    - Rarity-based items
    - Purchase confirmation modals
    - Inventory management

7. PWA Features
    - Offline support
    - App installation
    - Badge API for notifications
    - Service worker with custom caching

## Design Principles

### Mobile-First Design
- Base width: 375px
- Touch-friendly targets: minimum 44px
- Optimized for portrait orientation
- Progressive enhancement for larger screens

### Theme System
- Dark theme (default)
- Light theme
- CSS custom properties for theming
- Smooth transitions between themes

### Accessibility
- ARIA labels on interactive elements
- Keyboard navigation support
- Focus states on all interactive elements
- Screen reader friendly

## Common Patterns

### Reactive Data Pattern
const { gameData, updatePlayer } = useLocalStorage()
const playerName = computed({
get: () => gameData.player.name,
set: (value) => updatePlayer({ name: value })
})

### Component Communication
// Parent to Child: Props
<ChildComponent :data="gameData" :player="player" />

// Child to Parent: Emits
emit('update', newValue)
emit('claim-reward', rewardData)

### Translation Pattern
const { t } = useI18n()
// In template
{{ t('key.path') }}
{{ t('key.with.params', { count: 5 }) }}

### LocalStorage Data Access
const { gameData, updatePlayer, addItemToInventory } = useLocalStorage()
// Read
const coins = gameData.player.coins
// Write
updatePlayer({ coins: newAmount })

## Styling Conventions

### CSS Variables
- Colors: --primary-color, --success-color, --warning-color, etc.
- Spacing: --space-1 to --space-16 (0.25rem to 4rem)
- Typography: --font-size-xs to --font-size-4xl
- Border radius: --border-radius-sm to --border-radius-2xl

### BEM Naming
.block__element--modifier

Examples:
.game-card
.game-card__header
.game-card__header--active
.btn--primary
.btn--ghost

### Responsive Design
Mobile-first approach with max-width media queries
@media (max-width: 375px) { ... }

## Game Data Structure

gameData = {
player: {
name: string,
avatar: string,
level: number,
coins: number,
diamonds: number,
inventory: {
items: {},
equipped: {},
activeBoosts: []
},
gifts: {
sentToday: number,
receivedToday: number,
lastSentDate: string,
lastReceivedDate: string,
sentGifts: [],
receivedGifts: [],
redeemedCodes: []
}
},
games: {
memory: { levels: {}, highScore, stars, ... },
fruitMerge: { levels: {}, highScore, stars, ... },
numMerge: { levels: {}, highScore, stars, ... }
},
achievements: [],
currency: {
transactions: [],
dailyRewards: { lastClaimed, counter },
mysteryBoxes: { lastClaimed, totalClaimed, pendingMysteryBox }
},
settings: {
theme: 'dark' | 'light',
language: 'en' | 'de',
fontSize: 'small' | 'medium' | 'large'
}
}

## Current Development Focus

- Gift System improvements (Profile display)
- Mystery Box item management
- Screenshot features for games
- Achievement system enhancements
- PWA badge notifications
- Performance optimizations

## Important Files Reference

Core Systems:
- src/gamingHub/composables/useLocalStorage.js (Central data management)
- src/composables/useI18n.js (Translations)
- src/router/index.js (Navigation)

Key Components:
- src/gamingHub/components/Header.vue (App header with navigation)
- src/gamingHub/views/Profile.vue (Player profile and inventory)
- src/gamingHub/views/Shop.vue (Shop and gift system)
- src/views/Home.vue (Main dashboard)

Configurations:
- src/gamingHub/config/achievementsConfig.js (All achievements)
- src/gamingHub/config/giftConfig.js (Gift system rules)
- src/gamingHub/config/mysteryBoxConfig.js (Mystery box items)
- src/gamingHub/config/shopConfig.js (Shop items and categories)

## Notes for AI Assistance

When requesting changes:
1. Specify which system/feature is affected
2. Provide relevant file paths
3. Mention if translations need updates
4. Indicate if localStorage structure changes
5. Note any breaking changes to existing saves