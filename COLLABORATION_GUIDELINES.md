# 🤝 Collaboration Guidelines

## 📋 Working Process

### 1. Task Confirmation Protocol
- **Before any action**: Claude must clearly state what task will be performed
- **Wait for confirmation**: User must confirm the task before Claude proceeds
- **Purpose**: Prevents incorrect implementations and ensures alignment

### 2. Code Modification Approach

#### Code Change Display Method
- **NEVER use artifacts for code changes** - Browser compatibility issues
- **ALWAYS show changes directly in chat** as numbered lists
- **Use clear section headers** for each file/area being modified
- **Artifacts only for small complete files** - Maximum 400 lines, for download purposes only

#### Small Changes Format:
```
## 📝 **FileName.vue - Änderungsliste**

### **1. Section Name - Action Description**
// Zeile X: Beschreibung der Änderung
OLD CODE → NEW CODE

### **2. Section Name - Action Description**  
// Nach Zeile Y hinzufügen:
NEW CODE BLOCK
```

#### Large Changes Format:
- **Show complete sections** when modifications are extensive
- **Use clear headings** for each modification area
- **Number each change** for easy reference
- **Provide line number context** where possible

#### Example Format:
```
## 🎯 **ComponentName.vue - Änderungsliste**

### **1. Script Section - Variable hinzufügen**
// Zeile 25: Nach existing variable hinzufügen:
const newVariable = ref(false)

### **2. Template Section - Element ersetzen**
<!-- ALT (Zeile 45): -->
<old-element />

<!-- NEU: -->
<new-element :prop="value" />

### **3. Style Section - CSS hinzufügen**
// Am Ende hinzufügen:
.new-class {
  property: value;
}
```

### 3. Incremental Development
- **Small steps**: Make changes in digestible chunks
- **Pause for implementation**: Wait for user to implement changes before continuing
- **Avoid overwhelm**: Don't present too many modifications at once
- **Iterative approach**: Build features piece by piece

## 🛠️ Technical Preferences

### Code Standards
- **Vue 3**: Use `<script setup>` syntax with Composition API
- **Comments**: Always write source code comments in English
- **SCSS + BEM**: Follow BEM methodology for CSS class naming
- **Mobile-first**: Optimize primarily for 375px width, desktop secondary
- **CSS Optimization**: Primary focus on 375px mobile experience
- **Responsive Strategy**: Mobile-first with progressive enhancement
- **Performance**: Minimize CSS for optimal mobile loading

### Project Structure
- **Components**: Modular, reusable Vue components
- **Styling**: Global CSS variables + SCSS mixins
- **Documentation**: Keep README, CHANGELOG, and ROADMAP updated

## 📝 Communication Style

### Task Planning
1. **Describe the goal** clearly
2. **List specific steps** to achieve it
3. **Wait for confirmation** before proceeding
4. **Execute one step at a time**

### Code Review Process
1. **Present changes** in clear, numbered steps
2. **Show before/after** for modified lines
3. **Explain the reasoning** behind changes
4. **Pause for implementation** and testing

### Progress Tracking
- **Update documentation** when adding features
- **Follow semantic versioning** for releases
- **Update ROADMAP.md** as features are completed

## 🎯 Quality Standards

### Before Implementation
- [ ] Task clearly defined and confirmed
- [ ] Changes broken into manageable steps
- [ ] Code follows project conventions
- [ ] Documentation updates planned

### During Implementation
- [ ] One feature/change at a time
- [ ] Clear line-by-line modifications
- [ ] Proper error handling considered
- [ ] Mobile-first approach maintained
- [ ] Optimized specifically for 375px viewport
- [ ] Touch-friendly interactive elements (min 44px)
- [ ] Performance optimized for mobile devices
- 
### After Implementation
- [ ] Feature tested and working
- [ ] Documentation updated
- [ ] CHANGELOG.md entry added
- [ ] Ready for next iteration

## 🔄 Example Workflow

1. **User Request**: "I want to add a new button to the header"
2. **Claude Response**: "I want to add a new button to the app header with icon and hover states. This involves modifying App.vue lines 25-30 and adding new CSS classes. Should I proceed?"
3. **User Confirmation**: "Yes, go ahead"
4. **Claude Implementation**: Shows specific line changes
5. **User Implementation**: Implements the changes
6. **Next Step**: Claude asks if ready for next modification or testing

## 📊 Success Metrics

- **Clear communication**: No confusion about what will be changed
- **Efficient development**: Changes implemented correctly on first try
- **Maintainable code**: Following established patterns and conventions
- **Progressive enhancement**: Features built incrementally and tested

---

## 📦 Working with Large Repositories

### Communication Protocol for AI Assistance

#### Request Format
When requesting changes or new features, provide:

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
    - Current behavior vs desired behavior
    - Any constraints or dependencies

4. **Translation Requirements**
    - Does this require new translation keys?
    - Which locales are affected? (en.js, de.js)

5. **Data Structure Impact**
    - Does this change localStorage structure?
    - Are there migration considerations?
    - Will existing saves be affected?

### File Categories

#### Core System Files
- **Data Management**: useLocalStorage.js, useInventory.js, useShop.js
- **Routing**: router/index.js
- **Internationalization**: useI18n.js, locales/*.js
- **PWA**: useServiceWorker.js, sw-custom.js

#### UI Components
- **Reusable**: components/Icon.vue, components/InstallPrompt.vue
- **Game Components**: gamingHub/components/*.vue
- **Modals**: ConfirmationModal.vue, ShopModal.vue, GiftCodeModal.vue

#### Views/Pages
- **Top Level**: views/Home.vue, views/About.vue
- **Gaming Hub**: gamingHub/views/*.vue (Profile, Shop, Trophy, Settings)
- **Game Pages**: gamingHub/games/*/

#### Configuration Files
- **Game Config**: gamingHub/config/*.js
- **Achievements**: achievementsConfig.js
- **Shop**: shopConfig.js
- **Gifts**: giftConfig.js
- **Mystery Boxes**: mysteryBoxConfig.js

#### Styling
- **Global**: style.css
- **Component**: Scoped SCSS in .vue files

### Example Requests

#### Example 1: Simple UI Change
Task: Add new icon to header
Files needed:

src/gamingHub/components/Header.vue (lines 50-80)
src/assets/svg/new-icon.svg

Context: Adding quick link to achievements page

#### Example 2: Feature Addition
Task: Add new achievement category
Files needed:

src/gamingHub/config/achievementsConfig.js
src/gamingHub/views/Trophy.vue (achievement display section)
src/locales/en.js (achievements.categories section)
src/locales/de.js (achievements.categories section)
src/gamingHub/composables/useLocalStorage.js (checkAutoAchievements function)

Context: New category for social features (gifts, friends)
Translation: Yes - category name and descriptions
Data Impact: No breaking changes, additive only

#### Example 3: System Enhancement
Task: Improve gift system validation
Files needed:

src/gamingHub/config/giftConfig.js
src/gamingHub/composables/useLocalStorage.js (redeemGift, createGift)
src/gamingHub/views/Shop.vue (gift redemption UI)
src/gamingHub/views/Profile.vue (gift display)

Context: Add expiration dates, improve validation messages
Translation: Yes - new error messages
Data Impact: Yes - add expiresAt field to gift objects (non-breaking)

### Efficient Workflow

#### For Small Changes (1-2 files)
- Send full file content
- Specify exact lines if possible
- Include brief context

#### For Medium Changes (3-5 files)
- Send PROJECT_CONTEXT.md
- Send relevant file sections
- Describe connections between files

#### For Large Changes (6+ files)
- Send PROJECT_CONTEXT.md
- Send file list with brief descriptions
- AI will request specific files as needed

### What AI May Request

During implementation, AI may ask for:
- Related component files for context
- Translation file sections
- Configuration file structures
- Similar existing implementations
- Test data or example states

### Response Format Expectations

AI responses will include:
- Clear file names and sections
- Line numbers for changes
- OLD code and NEW code comparisons
- Explanation of why changes are needed
- Potential side effects or considerations
- Testing suggestions

### Version Control Best Practices

Before AI changes:
1. Commit current work
2. Create feature branch if needed
3. Note current app state

After AI changes:
1. Review all changes carefully
2. Test affected features
3. Check translations in both languages
4. Verify localStorage compatibility
5. Test on mobile viewport (375px)

### Common Pitfalls to Avoid

- Don't send entire codebase for small changes
- Don't forget to mention translation needs
- Don't skip data migration considerations
- Don't ignore mobile-first design requirements
- Don't forget to update relevant documentation

### Quality Checklist

Before marking task complete:
- [ ] Changes work as expected
- [ ] No console errors
- [ ] Translations complete (EN + DE)
- [ ] Mobile-responsive (375px base)
- [ ] localStorage data persists correctly
- [ ] Existing features still work
- [ ] Code follows project conventions (BEM, Vue 3 style)
- [ ] Comments in English (as per guidelines)

---

*This workflow ensures efficient collaboration while maintaining code quality and project consistency.*