<script setup>
import { computed } from 'vue'

// Define component props
const props = defineProps({
  // Icon name (matches the SVG filename without extension)
  name: {
    type: String,
    required: true,
    validator: (value) => typeof value === 'string' && value.length > 0
  },
  // Icon size in pixels or CSS units
  size: {
    type: [String, Number],
    default: 24,
    validator: (value) => {
      if (typeof value === 'number') return value > 0
      if (typeof value === 'string') return /^\d+(\.\d+)?(px|rem|em|%)?$/.test(value)
      return false
    }
  },
  // Icon color (CSS color value)
  color: {
    type: String,
    default: 'currentColor'
  },
  // Additional CSS classes
  class: {
    type: [String, Array, Object],
    default: ''
  },
  // Accessibility label
  ariaLabel: {
    type: String,
    default: ''
  },
  // Whether the icon is decorative only
  decorative: {
    type: Boolean,
    default: false
  }
})

// Import all SVG files from assets/svg directory
const svgModules = import.meta.glob('/src/assets/svg/**/*.svg', {
  as: 'raw',
  eager: true
})

// Create a map of icon names to their SVG content
const iconMap = computed(() => {
  const icons = {}

  for (const path in svgModules) {
    const pathSegments = path.split('/')
    const filename = pathSegments.pop().replace('.svg', '') // 'settings.svg' -> 'settings'

    // Für Root-Level: settings.svg -> 'settings'
    // Für Subfolder: avatar/beard.svg -> 'avatar/beard'
    if (pathSegments[pathSegments.length - 1] === 'svg') {
      // Root level: /src/assets/svg/settings.svg
      icons[filename] = svgModules[path]
    } else {
      // Subfolder: /src/assets/svg/avatar/beard.svg
      const subfolder = pathSegments[pathSegments.length - 1]
      icons[`${subfolder}/${filename}`] = svgModules[path]
    }
  }

  return icons
})

// Get the SVG content for the requested icon
const svgContent = computed(() => {
  const content = iconMap.value[props.name]

  if (!content) {
    console.warn(`Icon "${props.name}" not found. Available icons:`, Object.keys(iconMap.value))
    return null
  }

  return content
})

// Compute the size with units
const iconSize = computed(() => {
  if (typeof props.size === 'number') {
    return `${props.size}px`
  }
  return props.size
})

// Compute accessibility attributes
const accessibilityAttrs = computed(() => {
  if (props.decorative) {
    return {
      'aria-hidden': 'true',
      role: 'presentation'
    }
  }

  return {
    'aria-label': props.ariaLabel || `${props.name} icon`,
    role: 'img'
  }
})

// Parse and modify SVG content to apply props
const processedSvgContent = computed(() => {
  if (!svgContent.value) return ''

  let processed = svgContent.value

  // Remove existing width, height, and style attributes from SVG tag
  processed = processed.replace(/<svg[^>]*>/, (match) => {
    return match
      .replace(/\s*width="[^"]*"/g, '')
      .replace(/\s*height="[^"]*"/g, '')
      .replace(/\s*style="[^"]*"/g, '')
  })

  // Add our custom attributes
  processed = processed.replace('<svg', `<svg
    width="${iconSize.value}"
    height="${iconSize.value}"
    style="color: ${props.color}; display: inline-block; vertical-align: middle;"`)

  return processed
})
</script>

<template>
  <span
    v-if="svgContent"
    class="icon-wrapper"
    :class="class"
    v-bind="accessibilityAttrs"
    v-html="processedSvgContent"
  />
  <span
    v-else
    class="icon-wrapper icon-missing"
    :class="class"
    :style="{
      width: iconSize,
      height: iconSize,
      backgroundColor: '#ff0000',
      display: 'inline-block'
    }"
    :title="`Missing icon: ${name}`"
  >
    ?
  </span>
</template>

<style lang="scss" scoped>
.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;

  // Ensure SVG fills the container properly
  :deep(svg) {
    display: block;
    fill: currentColor;
    stroke: currentColor;
  }

  // Handle different fill/stroke scenarios
  :deep(svg[fill="none"]) {
    fill: none;
  }

  :deep(svg path[fill="currentColor"]),
  :deep(svg circle[fill="currentColor"]),
  :deep(svg rect[fill="currentColor"]) {
    fill: currentColor;
  }

  :deep(svg path[stroke="currentColor"]),
  :deep(svg circle[stroke="currentColor"]),
  :deep(svg line[stroke="currentColor"]) {
    stroke: currentColor;
  }
}

.icon-missing {
  background-color: var(--error-color);
  color: white;
  border-radius: 2px;
  font-size: 12px;
  font-weight: bold;
}
</style>