import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const HIGHSCORES_FILE = path.join(__dirname, 'highscores.json')
const RSVP_FILE = path.join(__dirname, 'rsvp.json')

// Middleware
app.use(cors())
app.use(express.json())

// Initialize highscores file if it doesn't exist
async function initHighscoresFile() {
  try {
    await fs.access(HIGHSCORES_FILE)
  } catch {
    // File doesn't exist, create it with empty array
    await fs.writeFile(HIGHSCORES_FILE, JSON.stringify([]))
    console.log('Created highscores.json file')
  }
}

// Read highscores from file
async function readHighscores() {
  try {
    const data = await fs.readFile(HIGHSCORES_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading highscores:', error)
    return []
  }
}

// Write highscores to file
async function writeHighscores(highscores) {
  try {
    await fs.writeFile(HIGHSCORES_FILE, JSON.stringify(highscores, null, 2))
    return true
  } catch (error) {
    console.error('Error writing highscores:', error)
    return false
  }
}

// ========================================
// RSVP Functions
// ========================================

// Initialize RSVP file if it doesn't exist
async function initRSVPFile() {
  try {
    await fs.access(RSVP_FILE)
  } catch {
    // File doesn't exist, create it with empty object
    await fs.writeFile(RSVP_FILE, JSON.stringify({}))
    console.log('Created rsvp.json file')
  }
}

// Read RSVP data from file
async function readRSVPData() {
  try {
    const data = await fs.readFile(RSVP_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading RSVP data:', error)
    return {}
  }
}

// Write RSVP data to file
async function writeRSVPData(rsvpData) {
  try {
    await fs.writeFile(RSVP_FILE, JSON.stringify(rsvpData, null, 2))
    return true
  } catch (error) {
    console.error('Error writing RSVP data:', error)
    return false
  }
}

// GET /api/highscores - Fetch all highscores
app.get('/api/highscores', async (req, res) => {
  try {
    const highscores = await readHighscores()
    res.json(highscores)
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch highscores' })
  }
})

// POST /api/highscores - Submit a new highscore
app.post('/api/highscores', async (req, res) => {
  try {
    const { playerId, name, level, date } = req.body

    // Validation
    if (!playerId || !name || level === undefined) {
      return res.status(400).json({ error: 'Missing required fields: playerId, name, level' })
    }

    if (typeof level !== 'number' || level < 0) {
      return res.status(400).json({ error: 'Invalid level value' })
    }

    if (name.length > 20) {
      return res.status(400).json({ error: 'Name too long (max 20 characters)' })
    }

    // Read current highscores
    let highscores = await readHighscores()

    // Check if player already exists
    const existingIndex = highscores.findIndex(score => score.playerId === playerId)

    if (existingIndex !== -1) {
      // Player exists - only update if new score is better
      if (level > highscores[existingIndex].level) {
        highscores[existingIndex] = {
          playerId,
          name: name.trim(),
          level,
          date: date || new Date().toISOString().split('T')[0]
        }
      } else {
        return res.json({
          message: 'Existing score is better',
          rank: highscores.findIndex(s => s.playerId === playerId) + 1,
          highscores: highscores.slice(0, 10)
        })
      }
    } else {
      // New player - add to list
      highscores.push({
        playerId,
        name: name.trim(),
        level,
        date: date || new Date().toISOString().split('T')[0]
      })
    }

    // Sort by level (highest first)
    highscores.sort((a, b) => b.level - a.level)

    // Keep only top 100 (we show top 10, but keep more for backup)
    highscores = highscores.slice(0, 100)

    // Add ranks
    highscores = highscores.map((score, index) => ({
      ...score,
      rank: index + 1
    }))

    // Save to file
    const success = await writeHighscores(highscores)

    if (!success) {
      return res.status(500).json({ error: 'Failed to save highscore' })
    }

    // Find player's rank
    const playerRank = highscores.findIndex(s => s.playerId === playerId) + 1

    res.json({
      message: 'Highscore saved successfully',
      rank: playerRank,
      highscores: highscores.slice(0, 10) // Return top 10
    })
  } catch (error) {
    console.error('Error saving highscore:', error)
    res.status(500).json({ error: 'Failed to save highscore' })
  }
})

// ========================================
// RSVP API Routes
// ========================================

// GET /api/rsvp - Fetch RSVP data
// - Without guestId: Returns all RSVPs as array (for admin)
// - With guestId: Returns single RSVP object for that guest
app.get('/api/rsvp', async (req, res) => {
  try {
    const { guestId } = req.query
    const allRSVPs = await readRSVPData()

    // If no guestId provided, return all RSVPs as array (for admin page)
    if (!guestId) {
      // Convert object to array with guestId included
      const rsvpArray = Object.entries(allRSVPs).map(([id, data]) => ({
        guestId: id,
        ...data
      }))
      return res.json(rsvpArray)
    }

    // If guestId provided, return single RSVP
    const guestRSVP = allRSVPs[guestId]

    if (!guestRSVP) {
      return res.status(404).json({ error: 'No RSVP found for this guest' })
    }

    res.json(guestRSVP)
  } catch (error) {
    console.error('Error fetching RSVP:', error)
    res.status(500).json({ error: 'Failed to fetch RSVP data' })
  }
})

// POST /api/rsvp - Submit or update RSVP
app.post('/api/rsvp', async (req, res) => {
  try {
    const { guestId, name, numberOfGuests, comingByCar, needsParking, needsHotelRoom, numberOfRooms, remarks, status, lastUpdated } = req.body

    // Validation
    if (!guestId) {
      return res.status(400).json({ error: 'Missing required field: guestId' })
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Missing required field: name' })
    }

    if (!status || !['pending', 'accepted', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    if (name.length > 50) {
      return res.status(400).json({ error: 'Name too long (max 50 characters)' })
    }

    // Read current RSVP data
    const allRSVPs = await readRSVPData()

    // Create or update RSVP entry
    const timestamp = new Date().toISOString()
    allRSVPs[guestId] = {
      name: name.trim(),
      numberOfGuests: numberOfGuests || 1,
      comingByCar: comingByCar || false,
      needsParking: needsParking || false,
      needsHotelRoom: needsHotelRoom || false,
      numberOfRooms: numberOfRooms || 1,
      remarks: remarks || '',
      status,
      lastUpdated: timestamp
    }

    // Save to file
    const success = await writeRSVPData(allRSVPs)

    if (!success) {
      return res.status(500).json({ error: 'Failed to save RSVP' })
    }

    res.json({
      message: 'RSVP saved successfully',
      lastUpdated: timestamp
    })
  } catch (error) {
    console.error('Error saving RSVP:', error)
    res.status(500).json({ error: 'Failed to save RSVP' })
  }
})

// DELETE /api/rsvp - Delete an RSVP
app.delete('/api/rsvp', async (req, res) => {
  try {
    const { guestId } = req.query

    if (!guestId) {
      return res.status(400).json({ error: 'Missing guestId parameter' })
    }

    const allRSVPs = await readRSVPData()

    if (!allRSVPs[guestId]) {
      return res.status(404).json({ error: 'RSVP not found' })
    }

    // Delete the RSVP
    delete allRSVPs[guestId]

    // Save to file
    const success = await writeRSVPData(allRSVPs)

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete RSVP' })
    }

    res.json({
      message: 'RSVP deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting RSVP:', error)
    res.status(500).json({ error: 'Failed to delete RSVP' })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Start server
async function startServer() {
  await initHighscoresFile()
  await initRSVPFile()
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 Highscores API: http://localhost:${PORT}/api/highscores`)
    console.log(`💌 RSVP API: http://localhost:${PORT}/api/rsvp`)
  })
}

startServer()