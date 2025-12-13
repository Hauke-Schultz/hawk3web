import express from 'express'
import cors from 'cors'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import nodemailer from 'nodemailer'
import crypto from 'crypto'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000
const HIGHSCORES_FILE = path.join(__dirname, 'highscores.json')
const RSVP_FILE = path.join(__dirname, 'rsvp.json')
const SPRITE_SHEETS_DIR = path.join(__dirname, '../public/dungeon')
const ADMIN_EMAIL = 'haukeschultz@gmail.com'
const USERS_FILE = path.join(__dirname, 'users.json')
const GAMEDATA_FILE = path.join(__dirname, 'gamedata.json')

// Middleware
app.use(cors())
app.use(express.json({ limit: '10mb' })) // Increase limit for base64 images

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

// Send RSVP notification email
async function sendRSVPNotification(rsvpData, isNew) {
  // Create transporter for development (logs to console)
  // For production, configure with real SMTP credentials
  const transporter = nodemailer.createTransport({
    // Development: Use Ethereal for testing or log to console
    streamTransport: true,
    newline: 'unix',
    buffer: true
  })

  const statusText = {
    'accepted': '✅ Zugesagt',
    'declined': '❌ Abgesagt',
    'pending': '⏳ Ausstehend'
  }
  const status = statusText[rsvpData.status] || rsvpData.status

  // Format food preferences
  let foodPrefsText = ''
  if (Array.isArray(rsvpData.foodPreferences) && rsvpData.foodPreferences.filter(p => p).length > 0) {
    const foodLabels = {
      'standard': 'Ich esse alles',
      'vegetarisch': 'Vegetarisch',
      'vegan': 'Vegan',
      'allergien': 'Allergien/Unverträglichkeiten'
    }
    const prefs = rsvpData.foodPreferences.filter(p => p).map(pref => foodLabels[pref] || pref)
    foodPrefsText = prefs.join(', ')
  }

  const subject = isNew ? `🎉 Neue RSVP: ${rsvpData.name}` : `✏️ RSVP aktualisiert: ${rsvpData.name}`

  const htmlContent = `
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
            .header { background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 20px; border-radius: 0 0 8px 8px; }
            .field { margin: 15px 0; padding: 10px; background: #f5f5f5; border-left: 4px solid #1e3a8a; }
            .field-label { font-weight: bold; color: #1e3a8a; }
            .field-value { margin-top: 5px; }
            .status-badge { display: inline-block; padding: 5px 15px; border-radius: 5px; font-weight: bold; }
            .status-accepted { background: #10b981; color: white; }
            .status-declined { background: #ef4444; color: white; }
            .status-pending { background: #f59e0b; color: white; }
            .footer { margin-top: 20px; padding: 15px; background: #f5f5f5; border-radius: 5px; text-align: center; }
            .btn { display: inline-block; padding: 12px 24px; background: #1e3a8a; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; }
        </style>
    </head>
    <body>
        <div class='container'>
            <div class='header'>
                <h2 style='margin: 0;'>${isNew ? '🎉 Neuer Party Eintrag!' : '✏️ Party Eintrag wurde aktualisiert'}</h2>
            </div>
            <div class='content'>
                <div class='field'>
                    <div class='field-label'>👤 Name:</div>
                    <div class='field-value'>${rsvpData.name}</div>
                </div>

                <div class='field'>
                    <div class='field-label'>📊 Status:</div>
                    <div class='field-value'>
                        <span class='status-badge status-${rsvpData.status}'>${status}</span>
                    </div>
                </div>

                <div class='field'>
                    <div class='field-label'>👥 Anzahl Personen:</div>
                    <div class='field-value'>${rsvpData.numberOfGuests}</div>
                </div>

                <div class='field'>
                    <div class='field-label'>🚗 Mit Auto:</div>
                    <div class='field-value'>${rsvpData.comingByCar ? 'Ja' : 'Nein'}</div>
                </div>

                <div class='field'>
                    <div class='field-label'>🅿️ Parkplatz benötigt:</div>
                    <div class='field-value'>${rsvpData.needsParking ? 'Ja' : 'Nein'}</div>
                </div>

                <div class='field'>
                    <div class='field-label'>🏨 Hotelzimmer benötigt:</div>
                    <div class='field-value'>${rsvpData.needsHotelRoom ? `Ja (${rsvpData.numberOfRooms} Zimmer)` : 'Nein'}</div>
                </div>

                ${foodPrefsText ? `
                <div class='field'>
                    <div class='field-label'>🍽️ Essensvorlieben:</div>
                    <div class='field-value'>${foodPrefsText}</div>
                </div>
                ` : ''}

                ${rsvpData.remarks ? `
                <div class='field'>
                    <div class='field-label'>💬 Bemerkungen:</div>
                    <div class='field-value'>${rsvpData.remarks.replace(/\n/g, '<br>')}</div>
                </div>
                ` : ''}

                <div class='footer'>
                    <p>Zum Admin-Bereich:</p>
                    <a href='http://localhost:5173/party/admin' class='btn'>Zur Verwaltung</a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `

  try {
    const info = await transporter.sendMail({
      from: '"Party Einladung" <noreply@haukeschultz.com>',
      to: ADMIN_EMAIL,
      subject: subject,
      html: htmlContent
    })

    // Log email to console for development
    console.log('\n' + '='.repeat(80))
    console.log('📧 E-Mail-Benachrichtigung (Development Mode)')
    console.log('='.repeat(80))
    console.log(`An: ${ADMIN_EMAIL}`)
    console.log(`Betreff: ${subject}`)
    console.log('-'.repeat(80))
    console.log(`Name: ${rsvpData.name}`)
    console.log(`Status: ${status}`)
    console.log(`Anzahl Personen: ${rsvpData.numberOfGuests}`)
    console.log(`Mit Auto: ${rsvpData.comingByCar ? 'Ja' : 'Nein'}`)
    console.log(`Parkplatz: ${rsvpData.needsParking ? 'Ja' : 'Nein'}`)
    console.log(`Hotelzimmer: ${rsvpData.needsHotelRoom ? `Ja (${rsvpData.numberOfRooms} Zimmer)` : 'Nein'}`)
    if (foodPrefsText) console.log(`Essensvorlieben: ${foodPrefsText}`)
    if (rsvpData.remarks) console.log(`Bemerkungen: ${rsvpData.remarks}`)
    console.log('='.repeat(80) + '\n')

    return true
  } catch (error) {
    console.error('Fehler beim Senden der E-Mail-Benachrichtigung:', error)
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
          date: date || new Date().toISOString().split('T')[0],
          emoji: highscores[existingIndex].emoji || '', // Keep existing emoji if any
          status: highscores[existingIndex].status || 'normal' // Keep existing status
        }
      } else {
        return res.json({
          message: 'Existing score is better',
          rank: highscores.findIndex(s => s.playerId === playerId) + 1,
          highscores: highscores
        })
      }
    } else {
      // New player - add to list
      highscores.push({
        playerId,
        name: name.trim(),
        level,
        date: date || new Date().toISOString().split('T')[0],
        emoji: '', // No emoji by default
        status: 'normal' // Default status
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
      highscores: highscores // Return all highscores
    })
  } catch (error) {
    console.error('Error saving highscore:', error)
    res.status(500).json({ error: 'Failed to save highscore' })
  }
})

// PUT /api/highscores/:playerId - Update a highscore
app.put('/api/highscores/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params
    const { name, level, emoji, status } = req.body

    if (!playerId) {
      return res.status(400).json({ error: 'Missing playerId parameter' })
    }

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Missing required field: name' })
    }

    if (typeof level !== 'number' || level < 0) {
      return res.status(400).json({ error: 'Invalid level value' })
    }

    if (name.length > 20) {
      return res.status(400).json({ error: 'Name too long (max 20 characters)' })
    }

    // Validate emoji (optional, max 10 characters for emoji)
    if (emoji && emoji.length > 10) {
      return res.status(400).json({ error: 'Emoji too long (max 10 characters)' })
    }

    // Validate status (optional, must be one of the allowed values)
    const allowedStatuses = ['normal', 'underReview', 'disqualified']
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value. Must be one of: ' + allowedStatuses.join(', ') })
    }

    // Read current highscores
    let highscores = await readHighscores()

    // Find the highscore to update
    const existingIndex = highscores.findIndex(score => score.playerId === playerId)

    if (existingIndex === -1) {
      return res.status(404).json({ error: 'Highscore not found' })
    }

    // Update the highscore
    highscores[existingIndex] = {
      playerId,
      name: name.trim(),
      level,
      date: highscores[existingIndex].date, // Keep original date
      emoji: emoji || '', // Update emoji
      status: status || highscores[existingIndex].status || 'normal' // Update status
    }

    // Sort by level (highest first)
    highscores.sort((a, b) => b.level - a.level)

    // Keep only top 100
    highscores = highscores.slice(0, 100)

    // Add ranks
    highscores = highscores.map((score, index) => ({
      ...score,
      rank: index + 1
    }))

    // Save to file
    const success = await writeHighscores(highscores)

    if (!success) {
      return res.status(500).json({ error: 'Failed to update highscore' })
    }

    res.json({
      message: 'Highscore updated successfully',
      highscores: highscores
    })
  } catch (error) {
    console.error('Error updating highscore:', error)
    res.status(500).json({ error: 'Failed to update highscore' })
  }
})

// DELETE /api/highscores/:playerId - Delete a highscore
app.delete('/api/highscores/:playerId', async (req, res) => {
  try {
    const { playerId } = req.params

    if (!playerId) {
      return res.status(400).json({ error: 'Missing playerId parameter' })
    }

    // Read current highscores
    let highscores = await readHighscores()

    // Find the highscore to delete
    const existingIndex = highscores.findIndex(score => score.playerId === playerId)

    if (existingIndex === -1) {
      return res.status(404).json({ error: 'Highscore not found' })
    }

    // Remove the highscore
    highscores.splice(existingIndex, 1)

    // Re-calculate ranks
    highscores = highscores.map((score, index) => ({
      ...score,
      rank: index + 1
    }))

    // Save to file
    const success = await writeHighscores(highscores)

    if (!success) {
      return res.status(500).json({ error: 'Failed to delete highscore' })
    }

    res.json({
      message: 'Highscore deleted successfully',
      playerId: playerId
    })
  } catch (error) {
    console.error('Error deleting highscore:', error)
    res.status(500).json({ error: 'Failed to delete highscore' })
  }
})

// ========================================
// User & Game Data Functions
// ========================================

// Hash password using SHA-256
function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex')
}

// Initialize users file if it doesn't exist
async function initUsersFile() {
  try {
    await fs.access(USERS_FILE)
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({}))
    console.log('Created users.json file')
  }
}

// Read users from file
async function readUsers() {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading users:', error)
    return {}
  }
}

// Write users to file
async function writeUsers(users) {
  try {
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2))
    return true
  } catch (error) {
    console.error('Error writing users:', error)
    return false
  }
}

// Initialize game data file if it doesn't exist
async function initGameDataFile() {
  try {
    await fs.access(GAMEDATA_FILE)
  } catch {
    await fs.writeFile(GAMEDATA_FILE, JSON.stringify({}))
    console.log('Created gamedata.json file')
  }
}

// Read game data from file
async function readGameData() {
  try {
    const data = await fs.readFile(GAMEDATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading game data:', error)
    return {}
  }
}

// Write game data to file
async function writeGameData(gameData) {
  try {
    await fs.writeFile(GAMEDATA_FILE, JSON.stringify(gameData, null, 2))
    return true
  } catch (error) {
    console.error('Error writing game data:', error)
    return false
  }
}

// ========================================
// User Authentication API Routes
// ========================================

// POST /api/auth/register - Register a new user
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be between 3 and 20 characters' })
    }

    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' })
    }

    // Check for invalid characters in username
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return res.status(400).json({ error: 'Username can only contain letters, numbers, hyphens and underscores' })
    }

    const users = await readUsers()

    // Check if username already exists
    if (users[username.toLowerCase()]) {
      return res.status(400).json({ error: 'Username already exists' })
    }

    // Create new user
    const hashedPassword = hashPassword(password)
    users[username.toLowerCase()] = {
      username: username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      lastLogin: null
    }

    // Save users
    const success = await writeUsers(users)
    if (!success) {
      return res.status(500).json({ error: 'Failed to create user' })
    }

    console.log(`✅ New user registered: ${username}`)

    res.json({
      success: true,
      message: 'User registered successfully',
      username: username
    })
  } catch (error) {
    console.error('Error registering user:', error)
    res.status(500).json({ error: 'Failed to register user' })
  }
})

// POST /api/auth/login - Login user
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    const users = await readUsers()
    const user = users[username.toLowerCase()]

    // Check if user exists
    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Check password
    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid username or password' })
    }

    // Update last login
    user.lastLogin = new Date().toISOString()
    users[username.toLowerCase()] = user
    await writeUsers(users)

    console.log(`✅ User logged in: ${username}`)

    res.json({
      success: true,
      message: 'Login successful',
      username: user.username,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    })
  } catch (error) {
    console.error('Error logging in:', error)
    res.status(500).json({ error: 'Failed to login' })
  }
})

// ========================================
// Game Data API Routes
// ========================================

// POST /api/gamedata/save - Save game data for a user
app.post('/api/gamedata/save', async (req, res) => {
  try {
    const { username, password, gameData } = req.body

    // Validation
    if (!username || !password || !gameData) {
      return res.status(400).json({ error: 'Username, password and gameData are required' })
    }

    // Verify user credentials
    const users = await readUsers()
    const user = users[username.toLowerCase()]

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Load existing game data
    const allGameData = await readGameData()

    // Save game data for this user
    allGameData[username.toLowerCase()] = {
      username: user.username,
      data: gameData,
      lastSaved: new Date().toISOString()
    }

    // Write to file
    const success = await writeGameData(allGameData)
    if (!success) {
      return res.status(500).json({ error: 'Failed to save game data' })
    }

    console.log(`💾 Game data saved for user: ${username}`)

    res.json({
      success: true,
      message: 'Game data saved successfully',
      lastSaved: allGameData[username.toLowerCase()].lastSaved
    })
  } catch (error) {
    console.error('Error saving game data:', error)
    res.status(500).json({ error: 'Failed to save game data' })
  }
})

// POST /api/gamedata/load - Load game data for a user
app.post('/api/gamedata/load', async (req, res) => {
  try {
    const { username, password } = req.body

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' })
    }

    // Verify user credentials
    const users = await readUsers()
    const user = users[username.toLowerCase()]

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const hashedPassword = hashPassword(password)
    if (user.password !== hashedPassword) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    // Load game data
    const allGameData = await readGameData()
    const userGameData = allGameData[username.toLowerCase()]

    if (!userGameData) {
      return res.json({
        success: true,
        message: 'No game data found',
        gameData: null,
        lastSaved: null
      })
    }

    console.log(`📂 Game data loaded for user: ${username}`)

    res.json({
      success: true,
      message: 'Game data loaded successfully',
      gameData: userGameData.data,
      lastSaved: userGameData.lastSaved
    })
  } catch (error) {
    console.error('Error loading game data:', error)
    res.status(500).json({ error: 'Failed to load game data' })
  }
})

// GET /api/gamedata/users - Get all users with their statistics
app.get('/api/gamedata/users', async (req, res) => {
  try {
    const users = await readUsers()
    const allGameData = await readGameData()

    const userStats = []

    for (const [usernameLower, userData] of Object.entries(allGameData)) {
      const user = users[usernameLower]
      if (!user) continue

      const gameData = userData.data

      // Calculate statistics
      const stats = {
        username: user.username,
        level: gameData.player?.level || 1,
        coins: gameData.player?.coins || 0,
        diamonds: gameData.player?.diamonds || 0,
        totalScore: gameData.player?.totalScore || 0,
        gamesPlayed: gameData.player?.gamesPlayed || 0,
        achievements: gameData.achievements?.filter(a => a.earned).length || 0,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
        lastSaved: userData.lastSaved
      }

      userStats.push(stats)
    }

    // Sort by level descending, then by coins
    userStats.sort((a, b) => {
      if (b.level !== a.level) return b.level - a.level
      return b.coins - a.coins
    })

    res.json({
      success: true,
      users: userStats,
      total: userStats.length
    })
  } catch (error) {
    console.error('Error fetching user stats:', error)
    res.status(500).json({ error: 'Failed to fetch user statistics' })
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
    const { guestId, name, numberOfGuests, comingByCar, needsParking, needsHotelRoom, numberOfRooms, foodPreference, foodPreferences, remarks, status, lastUpdated } = req.body

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

    // Support for foodPreferences array (new) and foodPreference string (old)
    let foodPrefs = []
    if (Array.isArray(foodPreferences)) {
      foodPrefs = foodPreferences
    } else if (foodPreference && foodPreference.trim().length > 0) {
      // Backwards compatibility: convert old foodPreference to array
      foodPrefs = [foodPreference.trim()]
    }

    // Read current RSVP data
    const allRSVPs = await readRSVPData()

    // Check if this is a new RSVP or an update
    const isNewRSVP = !allRSVPs[guestId]

    // Create or update RSVP entry
    const timestamp = new Date().toISOString()
    const rsvpData = {
      name: name.trim(),
      numberOfGuests: numberOfGuests || 1,
      comingByCar: comingByCar || false,
      needsParking: needsParking || false,
      needsHotelRoom: needsHotelRoom || false,
      numberOfRooms: numberOfRooms || 1,
      foodPreferences: foodPrefs,
      remarks: remarks || '',
      status,
      lastUpdated: timestamp
    }

    allRSVPs[guestId] = rsvpData

    // Save to file
    const success = await writeRSVPData(allRSVPs)

    if (!success) {
      return res.status(500).json({ error: 'Failed to save RSVP' })
    }

    // Send email notification
    await sendRSVPNotification(rsvpData, isNewRSVP)

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

// ========================================
// Sprite Sheet API Routes
// ========================================

// GET /api/sprite-sheets - Get list of available sprite sheets
app.get('/api/sprite-sheets', async (req, res) => {
  try {
    // Ensure sprite sheets directory exists
    await fs.mkdir(SPRITE_SHEETS_DIR, { recursive: true })

    // Read all files in the directory
    const files = await fs.readdir(SPRITE_SHEETS_DIR)

    // Filter only PNG files
    const pngFiles = files
      .filter(file => file.toLowerCase().endsWith('.png'))
      .map(file => {
        const fileName = file.replace('.png', '')
        return {
          name: fileName,
          path: `/dungeon/${file}`,
          gridSize: 16
        }
      })

    res.json(pngFiles)
  } catch (error) {
    console.error('Error reading sprite sheets:', error)
    res.status(500).json({ error: 'Failed to read sprite sheets' })
  }
})

// POST /api/sprite-sheets - Save a sprite sheet image
app.post('/api/sprite-sheets', async (req, res) => {
  try {
    const { imageData, fileName } = req.body

    // Validation
    if (!imageData || !fileName) {
      return res.status(400).json({ error: 'Missing required fields: imageData, fileName' })
    }

    // Validate filename (should end with .png and no path traversal)
    if (!fileName.endsWith('.png') || fileName.includes('/') || fileName.includes('\\')) {
      return res.status(400).json({ error: 'Invalid filename. Must be a .png file without path separators.' })
    }

    // Remove data:image/png;base64, prefix if present
    const base64Data = imageData.replace(/^data:image\/png;base64,/, '')

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(base64Data, 'base64')

    // Ensure sprite sheets directory exists
    await fs.mkdir(SPRITE_SHEETS_DIR, { recursive: true })

    // Save the file
    const filePath = path.join(SPRITE_SHEETS_DIR, fileName)
    await fs.writeFile(filePath, imageBuffer)

    console.log(`✅ Sprite sheet saved: ${fileName}`)

    res.json({
      message: 'Sprite sheet saved successfully',
      fileName: fileName,
      path: `/dungeon/${fileName}`
    })
  } catch (error) {
    console.error('Error saving sprite sheet:', error)
    res.status(500).json({ error: 'Failed to save sprite sheet' })
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
  await initUsersFile()
  await initGameDataFile()
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`)
    console.log(`📊 Highscores API: http://localhost:${PORT}/api/highscores`)
    console.log(`💌 RSVP API: http://localhost:${PORT}/api/rsvp`)
    console.log(`🎨 Sprite Sheets API: http://localhost:${PORT}/api/sprite-sheets`)
    console.log(`👤 Auth API: http://localhost:${PORT}/api/auth/*`)
    console.log(`💾 Game Data API: http://localhost:${PORT}/api/gamedata/*`)
  })
}

startServer()