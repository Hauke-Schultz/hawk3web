import { ref, computed } from 'vue'

const SCREENSHOT_STORAGE_KEY = 'hawk3_screenshots'
const MAX_SCREENSHOTS_PER_LEVEL = 5

// Screenshot storage management
const screenshots = ref({})

/**
 * Screenshot Management Composable
 * Handles saving, loading, and rendering game screenshots
 */
export function useScreenshot() {
  // Load screenshots from localStorage on initialization
  const loadScreenshots = () => {
    try {
      const stored = localStorage.getItem(SCREENSHOT_STORAGE_KEY)
      if (stored) {
        screenshots.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Error loading screenshots:', error)
      screenshots.value = {}
    }
  }

  // Save screenshots to localStorage
  const saveScreenshots = () => {
    try {
      localStorage.setItem(SCREENSHOT_STORAGE_KEY, JSON.stringify(screenshots.value))
    } catch (error) {
      console.error('Error saving screenshots:', error)
    }
  }

  // Generate unique screenshot ID
  const generateScreenshotId = (gameId, level, timestamp) => {
    return `${gameId}_level${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Create canvas and render game state
  const renderGameStateToCanvas = async (gameStateData) => {
    return new Promise((resolve, reject) => {
      try {
        // Create high-resolution canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')

        // Set canvas size (2x for high resolution)
        const scaleFactor = 2
        canvas.width = gameStateData.boardConfig.width * scaleFactor
        canvas.height = gameStateData.boardConfig.height * scaleFactor

        // Scale context for high resolution
        ctx.scale(scaleFactor, scaleFactor)

        // Set background
        ctx.fillStyle = '#2A2A2A' // Dark theme background
        ctx.fillRect(0, 0, gameStateData.boardConfig.width, gameStateData.boardConfig.height)

        // Add border
        ctx.strokeStyle = '#3A3A3A'
        ctx.lineWidth = 2
        ctx.strokeRect(1, 1, gameStateData.boardConfig.width - 2, gameStateData.boardConfig.height - 2)

        // Render fruits
        const renderPromises = gameStateData.fruits.map(fruit => {
          return new Promise((resolveFruit) => {
            // Create temporary div to render SVG
            const tempDiv = document.createElement('div')
            tempDiv.innerHTML = fruit.svg
            tempDiv.style.position = 'absolute'
            tempDiv.style.left = '-9999px'
            tempDiv.style.width = `${fruit.size}px`
            tempDiv.style.height = `${fruit.size}px`

            document.body.appendChild(tempDiv)

            const svgElement = tempDiv.querySelector('svg')
            if (svgElement) {
              // Set SVG dimensions
              svgElement.setAttribute('width', fruit.size)
              svgElement.setAttribute('height', fruit.size)

              // Convert SVG to image
              const svgData = new XMLSerializer().serializeToString(svgElement)
              const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
              const svgUrl = URL.createObjectURL(svgBlob)

              const img = new Image()
              img.onload = () => {
                // Draw fruit on canvas
                ctx.save()

                // Apply rotation if needed
                if (fruit.rotation && fruit.rotation !== 0) {
                  const centerX = fruit.x + fruit.size / 2
                  const centerY = fruit.y + fruit.size / 2
                  ctx.translate(centerX, centerY)
                  ctx.rotate((fruit.rotation * Math.PI) / 180)
                  ctx.translate(-centerX, -centerY)
                }

                ctx.drawImage(img, fruit.x, fruit.y, fruit.size, fruit.size)
                ctx.restore()

                URL.revokeObjectURL(svgUrl)
                document.body.removeChild(tempDiv)
                resolveFruit()
              }

              img.onerror = () => {
                console.warn('Failed to load fruit image:', fruit.type)
                document.body.removeChild(tempDiv)
                resolveFruit()
              }

              img.src = svgUrl
            } else {
              document.body.removeChild(tempDiv)
              resolveFruit()
            }
          })
        })

        // Wait for all fruits to be rendered
        Promise.all(renderPromises).then(() => {
          // Add score overlay
          ctx.fillStyle = 'rgba(42, 42, 42, 0.9)'
          ctx.fillRect(10, 10, 200, 80)

          ctx.strokeStyle = '#4F46E5'
          ctx.lineWidth = 2
          ctx.strokeRect(10, 10, 200, 80)

          // Score text
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 16px Arial'
          ctx.fillText(`Score: ${gameStateData.score}`, 20, 35)

          // Level/Mode text
          const modeText = gameStateData.isEndless ? 'Endless Mode' : `Level ${gameStateData.level}`
          ctx.fillText(modeText, 20, 55)

          // Stars if available
          if (gameStateData.starsEarned > 0) {
            ctx.fillText(`⭐ ${gameStateData.starsEarned}/3 Stars`, 20, 75)
          }

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.9)
          resolve(dataUrl)
        }).catch(reject)

      } catch (error) {
        reject(error)
      }
    })
  }

  // Save game screenshot
  const saveGameScreenshot = async (gameId, gameStateData) => {
    try {
      console.log('🖼️ Starting screenshot generation...', gameStateData)

      // Generate screenshot image
      const screenshotDataUrl = await renderGameStateToCanvas(gameStateData)

      // Create screenshot metadata
      const screenshotData = {
        id: generateScreenshotId(gameId, gameStateData.level, gameStateData.capturedAt),
        gameId: gameId,
        level: gameStateData.level,
        score: gameStateData.score,
        moves: gameStateData.moves,
        timeElapsed: gameStateData.timeElapsed,
        starsEarned: gameStateData.starsEarned,
        isEndless: gameStateData.isEndless,
        capturedAt: gameStateData.capturedAt,
        imageData: screenshotDataUrl,
        fruitsCount: gameStateData.fruits.length,
        gameTitle: gameStateData.gameTitle
      }

      // Initialize game screenshots if not exists
      if (!screenshots.value[gameId]) {
        screenshots.value[gameId] = {}
      }

      if (!screenshots.value[gameId][gameStateData.level]) {
        screenshots.value[gameId][gameStateData.level] = []
      }

      // Add screenshot to collection
      screenshots.value[gameId][gameStateData.level].push(screenshotData)

      // Limit screenshots per level (keep best scores)
      if (screenshots.value[gameId][gameStateData.level].length > MAX_SCREENSHOTS_PER_LEVEL) {
        screenshots.value[gameId][gameStateData.level].sort((a, b) => b.score - a.score)
        screenshots.value[gameId][gameStateData.level] = screenshots.value[gameId][gameStateData.level].slice(0, MAX_SCREENSHOTS_PER_LEVEL)
      }

      // Save to localStorage
      saveScreenshots()

      console.log('🖼️ Screenshot saved successfully!', screenshotData.id)
      return true

    } catch (error) {
      console.error('Error saving screenshot:', error)
      return false
    }
  }

  // Get screenshots for a specific level
  const getScreenshotsForLevel = (gameId, level) => {
    if (!screenshots.value[gameId] || !screenshots.value[gameId][level]) {
      return []
    }

    // Return sorted by score (highest first)
    return [...screenshots.value[gameId][level]].sort((a, b) => b.score - a.score)
  }

  // Get all screenshots for a game
  const getScreenshotsForGame = (gameId) => {
    if (!screenshots.value[gameId]) {
      return {}
    }

    return screenshots.value[gameId]
  }

  // Delete screenshot
  const deleteScreenshot = (gameId, level, screenshotId) => {
    if (!screenshots.value[gameId] || !screenshots.value[gameId][level]) {
      return false
    }

    const index = screenshots.value[gameId][level].findIndex(s => s.id === screenshotId)
    if (index !== -1) {
      screenshots.value[gameId][level].splice(index, 1)
      saveScreenshots()
      return true
    }

    return false
  }

  // Get screenshot count for level
  const getScreenshotCount = (gameId, level) => {
    if (!screenshots.value[gameId] || !screenshots.value[gameId][level]) {
      return 0
    }

    return screenshots.value[gameId][level].length
  }

  // Clear all screenshots
  const clearAllScreenshots = () => {
    screenshots.value = {}
    saveScreenshots()
  }

  // Computed properties
  const hasScreenshots = computed(() => {
    return Object.keys(screenshots.value).length > 0
  })

  const totalScreenshotCount = computed(() => {
    let count = 0
    Object.values(screenshots.value).forEach(gameScreenshots => {
      Object.values(gameScreenshots).forEach(levelScreenshots => {
        count += levelScreenshots.length
      })
    })
    return count
  })

  // Initialize on first use
  if (Object.keys(screenshots.value).length === 0) {
    loadScreenshots()
  }

  return {
    // State
    screenshots: computed(() => screenshots.value),
    hasScreenshots,
    totalScreenshotCount,

    // Methods
    saveGameScreenshot,
    getScreenshotsForLevel,
    getScreenshotsForGame,
    deleteScreenshot,
    getScreenshotCount,
    clearAllScreenshots,

    // Utilities
    renderGameStateToCanvas
  }
}