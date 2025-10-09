# 🎮 Hawk3 Gaming Platform

A modern mobile-first gaming platform built with Vue 3, featuring multiple mini-games, achievements, economy system, and PWA support.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🎯 Current Features (v0.3.3+)

### Games
- **Memory Game** - 6 levels with card matching and combo system
- **HawkFruit** - Physics-based merge game (5 levels + endless mode)
    - Special fruits: Mold, Bomb, Rainbow, Next fruit preview
- **NumMerge** - 2048-style number merging (5 levels + endless mode)
    - Special tile: 7-tile that decreases each move
- **Mini-Games** - Three Shells, Slot Machine, Whack-a-Mole

### Core Systems
- **Achievement System** - 30+ achievements with coin/diamond rewards
- **Shop & Inventory** - Cosmetics, power-ups, utilities with rarity system
- **Daily Rewards** - Interactive mini-games for daily bonuses
- **Mystery Boxes** - Exclusive cosmetic items (unlocked every 5 daily rewards)
- **Gift System** - Send and receive gifts with friends (daily limits)
- **Currency Economy** - Coins and diamonds with transaction tracking
- **Screenshot System** - Save and share game moments with watermarks

### Technical Features
- **PWA Support** - Install as app, offline functionality, badge notifications
- **Theme System** - Dark/Light mode with smooth transitions
- **Internationalization** - Full English/German language support
- **Save/Restore** - Auto-save game states across sessions
- **Mobile-First** - Optimized for 375px viewport with touch controls

## 🛠️ Tech Stack

- **Vue 3** - Composition API with `<script setup>`
- **Vite** - Fast development and optimized builds
- **SCSS** - BEM methodology for styling
- **Matter.js** - Physics engine for HawkFruit
- **Vue Router** - Client-side navigation
- **PWA** - Progressive Web App with service worker

## 📚 Documentation

- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Project structure, systems, and technical reference
- **[COLLABORATION_GUIDELINES.md](./COLLABORATION_GUIDELINES.md)** - Development workflow and coding standards
- **[ROADMAP.md](./ROADMAP.md)** - Feature timeline, version history, and future plans

## 🎨 Design Principles

- **Mobile-First** - Base width 375px, progressive enhancement
- **Touch-Friendly** - Minimum 44px interactive elements
- **Performance** - Optimized loading and smooth animations
- **Accessibility** - Semantic HTML, ARIA labels, keyboard navigation
- **BEM Methodology** - Consistent CSS class naming

## 🌍 Browser Support

- Modern browsers with ES6+ support
- PWA features require HTTPS in production
- Optimized for mobile Safari and Chrome

## 📦 Project Structure

```
src/
├── components/          # Reusable UI components
├── composables/         # Vue composables (i18n, service worker)
├── gamingHub/
│   ├── components/      # Game-specific components
│   ├── composables/     # Game logic (storage, inventory, shop)
│   ├── config/          # Game configurations
│   ├── games/           # Individual game implementations
│   └── views/           # Main pages (Profile, Shop, Trophy, Settings)
├── locales/             # i18n translations (en.js, de.js)
├── router/              # Vue Router configuration
└── views/               # Top-level pages (Home, About)
```

## 🤝 Contributing

Please read [COLLABORATION_GUIDELINES.md](./COLLABORATION_GUIDELINES.md) for:
- Task confirmation protocol
- Code modification approach
- Incremental development process
- Communication style and quality standards

## 📈 Development Status

**Current Version:** 0.3.3+ (Gift System implemented)

**Next Up (v0.3.4):** Enhancements and polish

**Upcoming (v0.4.0):** Social & Competition features

See [ROADMAP.md](./ROADMAP.md) for detailed feature timeline.

---

**Built with ❤️ for gaming enthusiasts** | Mobile-optimized | PWA-enabled | Fully offline-capable