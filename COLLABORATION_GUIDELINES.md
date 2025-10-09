# 🤝 Collaboration Guidelines

> **Quick Links:** [README](./README.md) | [Project Context](./PROJECT_CONTEXT.md) | [Roadmap](./ROADMAP.md)

This document defines the development workflow and coding standards for the Hawk3 Gaming Platform.

## 📋 Working Process

### 1. Task Confirmation Protocol

**Before any action:**
1. ✅ Claude clearly states what task will be performed
2. ⏸️ Wait for user confirmation
3. ✅ User confirms the task
4. ▶️ Claude proceeds with implementation

**Purpose:** Prevents incorrect implementations and ensures alignment

**Example:**
```
Claude: "I will add a new button to the app header (App.vue lines 25-30) 
        with icon and hover states. This involves modifying the template 
        section and adding CSS classes. Should I proceed?"

User: "Yes, go ahead"

Claude: [Shows specific changes]
```

### 2. Code Modification Approach

#### ⚠️ NEVER Use Artifacts for Code Changes
- **Why:** Browser compatibility issues
- **Instead:** Show changes directly in chat as numbered lists
- **Exception:** Complete small files (<400 lines) for download only

#### Change Display Format

**For Small Changes (1-5 modifications):**

```markdown
## 📝 **FileName.vue - Change List**

### **1. Script Section - Add Variable**
// Line 25: Add after existing variable
const newVariable = ref(false)

### **2. Template Section - Replace Element**
<!-- OLD (Line 45): -->
<old-element />

<!-- NEW: -->
<new-element :prop="value" />

### **3. Style Section - Add CSS**
// Add at end of style block:
.new-class {
  property: value;
}
```

**For Large Changes (6+ modifications):**

```markdown
## 🎯 **ComponentName.vue - Complete Section Updates**

### **1. Script Setup Section**
// Replace lines 10-25 with:
<script setup>
import { ref, computed } from 'vue'
import { useLocalStorage } from '@/composables/useLocalStorage'

const { gameData, updatePlayer } = useLocalStorage()
const playerName = computed(() => gameData.player.name)
</script>

### **2. Template Section - New Feature Block**
// Insert after line 50:
<div class="feature">
  <h3>{{ t('feature.title') }}</h3>
  <button @click="handleAction">{{ t('feature.action') }}</button>
</div>
```

#### Best Practices
- ✅ Use clear section headers
- ✅ Number each change for easy reference
- ✅ Provide line number context
- ✅ Show OLD → NEW for modifications
- ✅ Use code blocks with syntax highlighting
- ❌ Don't show entire files unless necessary
- ❌ Don't make too many changes at once

### 3. Incremental Development

**Philosophy:** Small steps, tested frequently

1. **Break Down Tasks**
    - Divide features into small, implementable chunks
    - Each chunk should be testable independently
    - Typical chunk: 3-5 file changes max

2. **Implementation Cycle**
   ```
   Plan → Present Changes → User Implements → Test → Next Chunk
   ```

3. **Pause Points**
    - After each logical feature completion
    - When user needs to test functionality
    - Before moving to next major component

4. **Avoid Overwhelm**
    - Don't present 10+ changes at once
    - Allow time for implementation and testing
    - Be ready to debug if issues arise

## 🛠️ Technical Preferences

### Vue 3 Standards

**Always Use:**
```vue
<script setup>
// Composition API with script setup syntax
import { ref, computed, watch } from 'vue'

// Props
const props = defineProps({
  data: Object,
  title: String
})

// Emits
const emit = defineEmits(['update', 'close'])

// Reactive data
const isActive = ref(false)

// Computed properties
const displayName = computed(() => props.data?.name || 'Default')
</script>
```

### Code Comments

**All comments MUST be in English:**
```javascript
// ✅ CORRECT
const maxAttempts = 3 // Maximum number of attempts allowed

// ❌ WRONG
const maxAttempts = 3 // Maximale Anzahl der Versuche
```

### SCSS + BEM Methodology

**Component Structure:**
```vue
<style lang="scss" scoped>
.component-name {
  // Block styles
  
  &__element {
    // Element styles
    
    &--modifier {
      // Modifier styles
    }
  }
  
  // Responsive
  @media (min-width: 768px) {
    // Tablet and up
  }
}
</style>
```

**BEM Examples:**
```css
/* Block */
.game-card { }

/* Elements */
.game-card__header { }
.game-card__title { }
.game-card__body { }

/* Modifiers */
.game-card--active { }
.game-card__header--large { }
```

### Mobile-First Approach

**Priority: 375px width viewport**

```css
/* Base styles - Mobile (375px) */
.element {
  font-size: 1rem;
  padding: 1rem;
}

/* Tablet and up */
@media (min-width: 768px) {
  .element {
    font-size: 1.125rem;
    padding: 1.5rem;
  }
}

/* Desktop */
@media (min-width: 1024px) {
  .element {
    font-size: 1.25rem;
    padding: 2rem;
  }
}
```

**Touch Targets:**
- Minimum size: 44x44px
- Comfortable spacing: 8px between elements
- Easy-to-tap buttons and interactive elements

**Performance:**
- Optimize CSS for mobile
- Minimize reflows and repaints
- Use CSS transforms for animations
- Lazy load images when possible

## 📝 Communication Style

### Task Planning

**Clear Structure:**
1. **State the Goal**
    - What feature/fix is being implemented
    - Why it's needed
    - What the user will experience

2. **List Specific Steps**
    - Numbered list of changes
    - Which files are affected
    - What sections need modification

3. **Wait for Confirmation**
    - Don't proceed without approval
    - Allow questions and clarifications
    - Be ready to adjust plan

4. **Execute One Step at a Time**
    - Present changes incrementally
    - Pause for implementation
    - Continue when ready

### Code Review Process

**Present Changes Clearly:**
```markdown
## Changes Required for [Feature Name]

### File: src/components/Example.vue

**Change 1: Add new prop**
// Line 5: Add to defineProps
isActive: {
  type: Boolean,
  default: false
}

**Change 2: Add computed property**
// Line 15: Add after existing computed
const displayClass = computed(() => 
  props.isActive ? 'active' : 'inactive'
)

**Reasoning:** This allows parent components to control the active state
dynamically, improving reusability.
```

### Progress Tracking

**Document as You Go:**
- Update CHANGELOG.md for each feature
- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Update ROADMAP.md when completing planned features
- Keep README.md current with latest features

## 🎯 Quality Standards

### Before Implementation Checklist

- [ ] Task clearly defined and confirmed
- [ ] Changes broken into manageable steps
- [ ] Code follows Vue 3 Composition API patterns
- [ ] BEM methodology for CSS classes
- [ ] Comments in English
- [ ] Mobile-first responsive design
- [ ] Documentation updates planned

### During Implementation Checklist

- [ ] One feature/change at a time
- [ ] Clear line-by-line modifications
- [ ] Proper error handling
- [ ] Mobile-optimized (375px base)
- [ ] Touch-friendly (min 44px targets)
- [ ] Performance considered
- [ ] Translations added (EN + DE)
- [ ] TypeScript-style prop validation

### After Implementation Checklist

- [ ] Feature tested and working
- [ ] No console errors
- [ ] Mobile responsive verified
- [ ] Translations complete
- [ ] Documentation updated
- [ ] CHANGELOG.md entry added
- [ ] localStorage compatibility verified
- [ ] Ready for next iteration

## 🔄 Example Workflow

### Simple Feature Addition

**1. User Request:**
```
"Add a new settings toggle for notifications"
```

**2. Claude Response:**
```
I will add a notification toggle to the Settings page. This involves:
1. Adding a new setting to localStorage (settings.notifications)
2. Creating a toggle component in Settings.vue (line 45)
3. Adding translations for EN and DE
4. Updating the settings interface

Should I proceed?
```

**3. User Confirmation:**
```
"Yes, go ahead"
```

**4. Claude Implementation:**
```markdown
## 📝 Settings.vue - Add Notification Toggle

### 1. Script Section - Add Reactive Property
// Line 12: Add after existing settings
const notificationsEnabled = computed({
  get: () => gameData.settings.notifications ?? true,
  set: (value) => updateSettings({ notifications: value })
})

### 2. Template Section - Add Toggle UI
// Line 45: Add after theme toggle
<div class="setting-row">
  <label>{{ t('settings.notifications') }}</label>
  <input 
    type="checkbox" 
    v-model="notificationsEnabled"
    class="setting-row__toggle"
  />
</div>
```

**5. User Implementation:** User adds the code

**6. Testing:** User tests the feature

**7. Next Steps:** Claude asks if ready for additional features

### Complex Feature Addition

**1. User Request:**
```
"Add a new achievement for completing all games with 3 stars"
```

**2. Claude Response:**
```
I will add a "Perfect Score" achievement. This involves:
1. Adding achievement definition to achievementsConfig.js
2. Adding check logic to useLocalStorage.js
3. Adding translations (EN + DE)
4. Testing the auto-check system

This is a 4-file change. Should I proceed?
```

**3. Implementation in Phases:**

**Phase 1: Configuration**
```markdown
## achievementsConfig.js - Add New Achievement

// Add to achievements array (line 245):
{
  id: 'perfect-score-all',
  category: 'special',
  rarity: 'legendary',
  ...
}
```

User implements → Tests → Confirms

**Phase 2: Logic**
```markdown
## useLocalStorage.js - Add Check Function

// Add to checkAutoAchievements (line 450):
const checkPerfectScoreAll = () => {
  const allGames = ['memory', 'hawkFruit', 'hawkDoubleUp']
  const allPerfect = allGames.every(game => 
    gameData.games[game].totalStars === 18
  )
  if (allPerfect) unlockAchievement('perfect-score-all')
}
```

User implements → Tests → Confirms

**Phase 3: Translations**
```markdown
## en.js + de.js - Add Achievement Text

// en.js (line 234):
'perfect-score-all': {
  name: 'Ultimate Master',
  description: 'Complete all games with perfect 3-star scores'
}

// de.js (line 234):
'perfect-score-all': {
  name: 'Ultimativer Meister',
  description: 'Schließe alle Spiele mit perfekten 3-Sterne-Bewertungen ab'
}
```

User implements → Final testing → Complete!

## 📦 Working with Large Repositories

### Request Format for AI Assistance

**Provide Clear Context:**

1. **Task Description**
    - Clear goal and expected outcome
    - User-facing behavior changes
    - Technical requirements

2. **Relevant Files**
    - Only files that need changes
    - Configuration files if affected
    - Related components for context

3. **Context Information**
    - Which system/feature is affected
    - Current vs desired behavior
    - Constraints or dependencies

4. **Translation Requirements**
    - New translation keys needed?
    - Which locales? (en.js, de.js)

5. **Data Structure Impact**
    - localStorage changes?
    - Migration needed?
    - Existing save compatibility?

### File Categories

See [PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md) for complete file structure reference.

**Core Systems:**
- Data Management: `useLocalStorage.js`, `useInventory.js`, `useShop.js`
- Routing: `router/index.js`
- i18n: `useI18n.js`, `locales/*.js`
- PWA: `useServiceWorker.js`, `sw-custom.js`

**UI Components:**
- Reusable: `components/Icon.vue`, `components/InstallPrompt.vue`
- Game Components: `gamingHub/components/*.vue`
- Modals: Various modal components

**Views/Pages:**
- Top Level: `views/Home.vue`, `views/About.vue`
- Gaming Hub: `gamingHub/views/*.vue`

**Configuration Files:**
- Game Config: `gamingHub/config/*.js`

### Efficient Workflow

**For Small Changes (1-2 files):**
- Send full file content or relevant sections
- Specify exact lines if possible
- Include brief context

**For Medium Changes (3-5 files):**
- Reference PROJECT_CONTEXT.md
- Send relevant file sections
- Describe file connections

**For Large Changes (6+ files):**
- Reference PROJECT_CONTEXT.md
- Send file list with descriptions
- AI will request specific files as needed

## 🎓 Best Practices Summary

### DO ✅
- Confirm tasks before proceeding
- Show changes in clear, numbered lists
- Break features into small chunks
- Use BEM methodology for CSS
- Write comments in English
- Follow mobile-first approach
- Update documentation
- Test after each change
- Use Vue 3 Composition API patterns

### DON'T ❌
- Use artifacts for code changes
- Make too many changes at once
- Skip user confirmation
- Forget translations (EN + DE)
- Ignore mobile optimization (375px)
- Use German comments
- Skip error handling
- Forget localStorage compatibility

## 📚 Related Documentation

- **[PROJECT_CONTEXT.md](./PROJECT_CONTEXT.md)** - Technical reference and architecture
- **[ROADMAP.md](./ROADMAP.md)** - Feature timeline and version history
- **[README.md](./README.md)** - Project overview and quick start

---

**Following these guidelines ensures efficient collaboration, maintainable code, and consistent quality across the Hawk3 Gaming Platform.**