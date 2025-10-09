import { ref, computed } from 'vue'

const SCREENSHOT_STORAGE_KEY = 'hawk3_screenshots'
const MAX_SCREENSHOTS_PER_LEVEL = 5
const WATERMARK_CONFIG = {
  // Brand watermark (top right)
  brand: {
    text: 'HAWK3 Games',
    fontSize: 12,
    fontFamily: 'Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.7)',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowBlur: 4,
    position: 'top-right',
    margin: 12
  },

  // Game name watermark (top right)
  gameName: {
    fontSize: 14,
    fontFamily: 'Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.8)',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowBlur: 4,
    position: 'top-right',
    margin: 12
  },

  // Timestamp watermark (top right)
  timestamp: {
    fontSize: 11,
    fontFamily: 'Arial, sans-serif',
    color: 'rgba(255, 255, 255, 0.6)',
    shadowColor: 'rgba(0, 0, 0, 0.8)',
    shadowBlur: 4,
    position: 'top-right',
    margin: 12
  }
}

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

  // Add watermarks to screenshot
  const addWatermarksToCanvas = (ctx, gameStateData, canvasWidth, canvasHeight) => {
    // Save current context state
    ctx.save()

    const baseX = canvasWidth - WATERMARK_CONFIG.brand.margin
    let currentY = WATERMARK_CONFIG.brand.margin
    const lineSpacing = 18 // Spacing between lines

    // Game name watermark (top line)
    const gameName = WATERMARK_CONFIG.gameName
    ctx.font = `${gameName.fontSize}px ${gameName.fontFamily}`
    ctx.fillStyle = gameName.color
    ctx.shadowColor = gameName.shadowColor
    ctx.shadowBlur = gameName.shadowBlur
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'

    const gameDisplayName = getGameDisplayName(gameStateData.gameTitle)
    ctx.fillText(gameDisplayName, baseX, currentY)

    // Move to next line
    currentY += lineSpacing

    // Brand watermark (second line)
    const brand = WATERMARK_CONFIG.brand
    ctx.font = `${brand.fontSize}px ${brand.fontFamily}`
    ctx.fillStyle = brand.color
    ctx.shadowColor = brand.shadowColor
    ctx.shadowBlur = brand.shadowBlur
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'

    ctx.fillText(brand.text, baseX, currentY)

    // Move to next line
    currentY += lineSpacing

    // Timestamp watermark (third line)
    const timestamp = WATERMARK_CONFIG.timestamp
    ctx.font = `${timestamp.fontSize}px ${timestamp.fontFamily}`
    ctx.fillStyle = timestamp.color
    ctx.shadowColor = timestamp.shadowColor
    ctx.shadowBlur = timestamp.shadowBlur
    ctx.shadowOffsetX = 1
    ctx.shadowOffsetY = 1
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'

    const timestampText = new Date(gameStateData.capturedAt).toLocaleDateString()
    ctx.fillText(timestampText, baseX, currentY)

    // Restore context state
    ctx.restore()
  }

  // Helper function to get proper game display names
  const getGameDisplayName = (gameTitle) => {
    const gameNames = {
      'Memory': 'Memory Game',
      'Fruit Merge': 'Fruit Merge',
      'Num Merge': 'Num Merge'
    }

    return gameNames[gameTitle] || gameTitle
  }

  // Generate unique screenshot ID
  const generateScreenshotId = (gameId, level, timestamp) => {
    return `${gameId}_level${level}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
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

        // Determine game type and render accordingly
        if (gameStateData.numbers) {
          // Num Merge Game rendering
          renderNumGameState(ctx, gameStateData)

          // Add common UI overlay for Num
          addGameUIOverlay(ctx, gameStateData)

          // NEW: Add watermarks
          addWatermarksToCanvas(ctx, gameStateData, gameStateData.boardConfig.width, gameStateData.boardConfig.height)

          // Convert canvas to data URL
          const dataUrl = canvas.toDataURL('image/png', 0.9)
          resolve(dataUrl)

        } else if (gameStateData.fruits) {
          // FruitMerge Game rendering (async because of SVG loading)
          renderFruitMergeGameState(ctx, gameStateData)
              .then(() => {
                addGameUIOverlay(ctx, gameStateData)

                // NEW: Add watermarks
                addWatermarksToCanvas(ctx, gameStateData, gameStateData.boardConfig.width, gameStateData.boardConfig.height)

                // Convert canvas to data URL after fruits are rendered
                const dataUrl = canvas.toDataURL('image/png', 0.9)
                resolve(dataUrl)
              })
              .catch(reject)
        } else if (gameStateData.blocks) {
            // StackMerge Game rendering
            renderStackMergeGameState(ctx, gameStateData)
            addGameUIOverlay(ctx, gameStateData)
            addWatermarksToCanvas(ctx, gameStateData, gameStateData.boardConfig.width, gameStateData.boardConfig.height)
            const dataUrl = canvas.toDataURL('image/png', 0.9)
            resolve(dataUrl)
        } else {
          reject(new Error('Unknown game type - no fruits or numbers found'))
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  const renderStackMergeGameState = (ctx, gameStateData) => {
    const { boardConfig } = gameStateData
    const yOffset = 75

    // Set background
    ctx.fillStyle = '#0F0F0F'
    ctx.fillRect(0, 0, boardConfig.width, boardConfig.height)

    // Add border
    ctx.strokeStyle = '#3A3A3A'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, boardConfig.width - 2, boardConfig.height - 2)

    const maxBlocks = 10
    const totalBlocks = gameStateData.blocks.length
    const blocksToShow = gameStateData.blocks.slice(Math.max(0, totalBlocks - maxBlocks))
    const startIndex = Math.max(0, totalBlocks - maxBlocks)

    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.font = 'bold 14px Arial'
    ctx.textAlign = 'right'
    ctx.fillText(`Height: ${totalBlocks}`, boardConfig.width - 10, yOffset + 10)

    const blockHeight = 40
    const startY = yOffset + 40

    blocksToShow.reverse().forEach((block, idx) => {
      const y = startY + (idx * blockHeight)
      const blockNum = totalBlocks - idx // Höchste Nummer oben

      // Shadow
      ctx.fillStyle = 'rgba(0, 0, 0, 0.2)'
      ctx.fillRect(block.x + 2, y + 2, block.width, block.height)

      // Block
      ctx.fillStyle = block.color
      ctx.fillRect(block.x, y, block.width, block.height)

      // Border
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)'
      ctx.lineWidth = 2
      ctx.strokeRect(block.x, y, block.width, block.height)

      // Number
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = 'bold 12px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(blockNum.toString(), block.x + block.width / 2, y + block.height / 2)
    })

    if (totalBlocks > maxBlocks) {
      const indicatorY = startY + (blocksToShow.length * blockHeight) + 15
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.font = 'bold 14px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`+${totalBlocks - maxBlocks} blocks below`, boardConfig.width / 2, indicatorY)
    }
  }

  // Common UI overlay function for both games
  const addGameUIOverlay = (ctx, gameStateData) => {
    // Add score overlay
    ctx.fillStyle = 'rgba(42, 42, 42, 0.6)'
    ctx.fillRect(10, 10, 200, 70)

    // Player name (erste Zeile)
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'left'
    ctx.textBaseline = 'alphabetic'
    ctx.fillText(`${gameStateData.player?.name ?? 'Unknown'}`, 20, 30)

    // Score text (zweite Zeile)
    ctx.fillText(`Score: ${gameStateData.score}`, 20, 50)

    // Level und Sterne (dritte Zeile)
    let stars = ''
    if (gameStateData.starsEarned > 0) {
      for (let i = 0; i < gameStateData.starsEarned; i++) {
        stars += '⭐'
      }
    }
    const levelText = gameStateData.isEndless ? `Endless Mode ${stars}` : `Level ${gameStateData.level} ${stars}`
    ctx.fillText(levelText, 20, 70)
  }

  const renderNumGameState = (ctx, gameStateData) => {
    const { boardConfig } = gameStateData
    const yOffset = 75

    // Set background
    ctx.fillStyle = '#2A2A2A' // Dark theme background
    ctx.fillRect(0, 0, boardConfig.width, boardConfig.height)

    // Add border
    ctx.strokeStyle = '#3A3A3A'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, boardConfig.width - 2, boardConfig.height - 2)

    // Draw grid lines mit Y-Offset
    ctx.strokeStyle = '#4A4A4A'
    ctx.lineWidth = 1

    // Vertical lines
    for (let col = 1; col < boardConfig.cols; col++) {
      const x = col * (boardConfig.cellSize + boardConfig.cellGap) + boardConfig.cellGap / 2
      ctx.beginPath()
      ctx.moveTo(x, boardConfig.cellGap + yOffset)
      ctx.lineTo(x, boardConfig.height - boardConfig.cellGap)
      ctx.stroke()
    }

    // Horizontal lines
    for (let row = 1; row < boardConfig.rows; row++) {
      const y = row * (boardConfig.cellSize + boardConfig.cellGap) + boardConfig.cellGap / 2 + yOffset
      ctx.beginPath()
      ctx.moveTo(boardConfig.cellGap, y)
      ctx.lineTo(boardConfig.width - boardConfig.cellGap, y)
      ctx.stroke()
    }

    // Draw numbers mit Y-Offset
    gameStateData.numbers.forEach(number => {
      // Draw cell background
      ctx.fillStyle = number.color
      ctx.fillRect(
          number.x,
          number.y + yOffset,
          boardConfig.cellSize,
          boardConfig.cellSize
      )

      // Draw number text
      ctx.fillStyle = number.textColor
      ctx.font = `bold ${Math.min(24, boardConfig.cellSize * 0.4)}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const centerX = number.x + boardConfig.cellSize / 2
      const centerY = number.y + boardConfig.cellSize / 2 + yOffset

      ctx.fillText(number.number.toString(), centerX, centerY)
    })
  }

  const renderFruitMergeGameState = (ctx, gameStateData) => {
    const { boardConfig } = gameStateData

    // Set background
    ctx.fillStyle = '#2A2A2A' // Dark theme background
    ctx.fillRect(0, 0, boardConfig.width, boardConfig.height)

    // Add border
    ctx.strokeStyle = '#3A3A3A'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, boardConfig.width - 2, boardConfig.height - 2)

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

    // Return promise that resolves when all fruits are rendered
    return Promise.all(renderPromises)
  }

  // Copy screenshot to clipboard
  const copyScreenshotToClipboard = async (screenshotImageData) => {
    try {
      // Check if Clipboard API is supported
      if (!navigator.clipboard || !navigator.clipboard.write) {
        throw new Error('Clipboard API not supported')
      }

      // Convert data URL to blob
      const response = await fetch(screenshotImageData)
      const blob = await response.blob()

      // Create clipboard item
      const clipboardItem = new ClipboardItem({
        [blob.type]: blob
      })

      // Write to clipboard
      await navigator.clipboard.write([clipboardItem])

      console.log('📋 Screenshot copied to clipboard successfully')
      return true

    } catch (error) {
      console.error('Error copying screenshot to clipboard:', error)

      // Fallback: Try to copy as text (data URL)
      try {
        await navigator.clipboard.writeText(screenshotImageData)
        console.log('📋 Screenshot data URL copied to clipboard as fallback')
        return true
      } catch (fallbackError) {
        console.error('Fallback clipboard copy also failed:', fallbackError)
        return false
      }
    }
  }

  // Copy existing screenshot from storage to clipboard
  const copyStoredScreenshotToClipboard = async (screenshotId, gameId, level) => {
    try {
      const screenshots = getScreenshotsForLevel(gameId, level)
      const screenshot = screenshots.find(s => s.id === screenshotId)

      if (!screenshot) {
        console.error('Screenshot not found:', screenshotId)
        return false
      }

      return await copyScreenshotToClipboard(screenshot.imageData)
    } catch (error) {
      console.error('Error copying stored screenshot:', error)
      return false
    }
  }

  // Save game screenshot
  const saveGameScreenshot = async (gameId, gameStateData) => {
    try {
      console.log('🖼️ Starting screenshot generation...', gameStateData)

      // Generate screenshot image
      const screenshotDataUrl = await renderGameStateToCanvas(gameStateData)

      // Create screenshot metadata based on game type
      let screenshotData = {
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
        gameTitle: gameStateData.gameTitle
      }

      // Add game-specific metadata
      if (gameId === 'fruitMerge') {
        screenshotData.fruitsCount = gameStateData.fruits.length
      } else if (gameId === 'numMerge') {
        screenshotData.numbersCount = gameStateData.numbers.length
        screenshotData.highestNumber = Math.max(...gameStateData.numbers.map(n => n.number), 0)
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
    copyScreenshotToClipboard,
    copyStoredScreenshotToClipboard,

    // Utilities
    renderGameStateToCanvas
  }
}