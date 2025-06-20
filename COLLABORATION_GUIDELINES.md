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

*This document ensures efficient collaboration and high-quality code development for the Hawk3Games project.*