<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../components/Icon.vue'
import HotelFade from './HotelFade.vue'

// Router instance
const route = useRoute()

// Bilder für Slider
const images = [
  new URL('./img/party-01.png', import.meta.url).href,
  // new URL('./img/party-02.png', import.meta.url).href,
  // new URL('./img/party-03.png', import.meta.url).href,
  new URL('./img/party-04.png', import.meta.url).href,
  new URL('./img/party-05.png', import.meta.url).href,
  new URL('./img/party-06.png', import.meta.url).href,
  new URL('./img/party-07.png', import.meta.url).href
]

// Slider State
const currentImageIndex = ref(0)
const fadeTransition = ref(false)
let intervalId = null

// Countdown State
const countdown = ref({
  days: 0,
  hours: 0,
  minutes: 0,
  seconds: 0
})
let countdownInterval = null

// Level-Up Clicker Game State
const currentLevel = ref(0)
const clickAnimation = ref(false)
const gameCompleted = ref(false)

// Flip Card State
const isFlipped = ref(false)

// Combo System
const comboCount = ref(0)
const comboTimeout = ref(null)
const currentFloatingStatus = ref(null) // Tracks current floating number status

// Toggle Flip Card
const toggleFlip = () => {
  isFlipped.value = !isFlipped.value
}

// Highscore State
const playerName = ref('')
const playerId = ref('')

// Highscore Daten (werden von der API geladen)
const highscores = ref([])

// Level Titles
const getLevelTitle = (level) => {
	if (level === 0) return 'Bereit für dein Abenteuer?'
	if (level < 5) return 'Neuling'
	if (level < 10) return 'Novize'
	if (level < 25) return 'Wegfinder'
	if (level < 50) return 'Abenteurer'
	if (level < 75) return 'Kämpfer'
	if (level < 100) return 'Held'
	if (level < 200) return 'Erweckter 🔥'
	if (level < 400) return 'Unaufhaltsamer 💪'
	if (level < 800) return 'Legende 👑'
	if (level < 1200) return 'Unsterblicher ⚡'
	if (level < 1600) return 'Mythischer 🦄'
	if (level < 2000) return 'Göttlicher 🌟'
	if (level < 2400) return 'Himmelswächter 🌌'
	if (level < 2800) return 'Erleuchteter ✨'
	if (level < 3200) return 'Ewiger 🔮'
	if (level < 3600) return 'Kosmischer Wanderer 🌠'
	if (level < 4000) return 'Transzendenter 🎆'
	if (level < 4400) return 'Allmächtiger 💫'
	if (level < 4800) return 'Überwesen 👾'
	if (level < 5200) return 'Ultimativer 🎮'
	if (level < 5600) return 'Unendlicher ♾️'
	if (level < 6000) return 'Absoluter 💎'
	if (level < 6400) return 'Grenzenloser 🚀'
	if (level < 6800) return 'Unübertroffener 🏆'
	if (level < 7200) return 'Unbesiegbarer 🛡️'
	if (level < 7600) return 'Allwissender 🧠'
	if (level < 8000) return 'Titan der Sagen 🗿'
	if (level < 8400) return 'Kosmischer Imperator 👹'
	if (level < 8800) return 'Gott der Welten 🌍'
	if (level < 9200) return 'Herr der Dimensionen 🌀'
	if (level < 9600) return 'Realitätsformer 🔱'
	if (level < 10000) return 'Meister der Existenz 🌊'
	if (level >= 10000) return 'der Eine ☯️'
	return ''
}

// LocalStorage Keys
const PARTY_LEVEL_KEY = 'party_level'
const PLAYER_NAME_KEY = 'player_name'
const PLAYER_ID_KEY = 'player_id'

// UUID Generator (v4)
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

// Level aus localStorage laden
const loadLevel = () => {
  // SSR-safe: Check if localStorage is available (browser only)
  if (typeof localStorage === 'undefined') {
    return 0
  }

  try {
    const stored = localStorage.getItem(PARTY_LEVEL_KEY)
    if (stored) {
      const level = parseInt(stored, 10)
      return isNaN(level) ? 0 : level
    }
  } catch (error) {
    console.error('Error loading party level from localStorage:', error)
  }
  return 0
}

// Level im localStorage speichern
const saveLevel = (level) => {
  // SSR-safe: Check if localStorage is available (browser only)
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(PARTY_LEVEL_KEY, level.toString())
  } catch (error) {
    console.error('Error saving party level to localStorage:', error)
  }
}

// Name aus localStorage laden
const loadPlayerName = () => {
  if (typeof localStorage === 'undefined') {
    return ''
  }

  try {
    const stored = localStorage.getItem(PLAYER_NAME_KEY)
    return stored || ''
  } catch (error) {
    console.error('Error loading player name from localStorage:', error)
    return ''
  }
}

// Name im localStorage speichern
const savePlayerName = (name) => {
  if (typeof localStorage === 'undefined') {
    return
  }

  try {
    localStorage.setItem(PLAYER_NAME_KEY, name)
  } catch (error) {
    console.error('Error saving player name to localStorage:', error)
  }
}

// Player-ID aus localStorage laden oder neu generieren
const loadOrCreatePlayerId = () => {
  if (typeof localStorage === 'undefined') {
    return generateUUID()
  }

  try {
    let playerId = localStorage.getItem(PLAYER_ID_KEY)
    if (!playerId) {
      playerId = generateUUID()
      localStorage.setItem(PLAYER_ID_KEY, playerId)
    }
    return playerId
  } catch (error) {
    console.error('Error loading/creating player ID:', error)
    return generateUUID()
  }
}

// API Base URL - automatische Erkennung
// Development: http://localhost:3000 (Node.js Server)
// Production: https://www.haukeschultz.com (PHP API)
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? 'http://localhost:3000'  // Development
    : window.location.origin    // Production: nutzt die aktuelle Domain
)

// API-Endpunkt: Node.js nutzt /api/highscores, PHP nutzt /api/highscores.php
const API_ENDPOINT = import.meta.env.DEV ? '/api/highscores' : '/api/highscores.php'

// Highscores von API laden
const loadHighscores = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`)
    if (!response.ok) {
      throw new Error('Failed to fetch highscores')
    }
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error loading highscores from API:', error)
    // Fallback zu leerer Liste bei Fehler
    return []
  }
}

// Highscore zur API senden
const saveHighscores = async (newScore) => {
  try {
    const response = await fetch(`${API_BASE_URL}${API_ENDPOINT}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newScore)
    })

    if (!response.ok) {
      throw new Error('Failed to save highscore')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error saving highscore to API:', error)
    return null
  }
}

// Level Up Click Handler
const levelUp = (event) => {
  // Animation triggern
  clickAnimation.value = true
  setTimeout(() => {
    clickAnimation.value = false
  }, 200)

  currentLevel.value++

  // Level im localStorage speichern
  saveLevel(currentLevel.value)

  // Combo System
  comboCount.value++

  // Clear existing timeout
  if (comboTimeout.value) {
    clearTimeout(comboTimeout.value)
  }

  // Reset combo nach 200ms
  comboTimeout.value = setTimeout(() => {
    comboCount.value = 0
  }, 200)

  // Floating Number anzeigen
  showFloatingNumber(event)

  // Konfetti bei Milestones
  const milestones = [50, 100, 150, 200, 300, 400, 500, 1000, 1500, 2000, 2500, 3000, 4000, 5000, 6000, 7000]
  if (milestones.includes(currentLevel.value)) {
    createConfetti()
  }
}

// Floating Number mit Combo-Anzeige
const showFloatingNumber = (event) => {
  const container = document.querySelector('.level-up-card')
  if (!container) return

  // Lustige Combo-Texte für verschiedene Stufen
  const comboTexts = {
    1: ['👆', '👌', 'Click! ✌️', 'Nice! 🤘'],
    3: ['Läuft! 🔥', 'Weiter so!', 'Go! 💪', 'Gut!'],
    5: ['COMBO! 🎯', 'On Fire! 🔥', 'Stark! 💥', 'Top! ⭐'],
    8: ['SUPER! 🚀', 'Krass! ⚡', 'Heftig! 💫', 'Wow! 🌟'],
    12: ['MEGA! 🎆', 'Wahnsinn! 🎊', 'Irre! 🎨', 'Geil! 🎪'],
    15: ['ULTRA! 🌈', 'Monster! 👾', 'Brutal! 💀', 'Hammer! 🔨'],
    20: ['GIGANTISCH! 🦖', 'Legendär! 👑', 'Episch! ⚔️', 'Crazy! 🤪'],
    25: ['UNGLAUBLICH! 🌠', 'Perfekt! 💎', 'Göttlich! ⚡', 'Irrsinn! 🎭'],
    30: ['UNSTOPPABLE! 🔥', 'Phänomenal! 🎇', 'Meisterlich! 🏆', 'Fantastisch! 🎪'],
    40: ['GODLIKE! 👼', 'Überirdisch! 🛸', 'Kosmisch! 🌌', 'Unreal! 🎮'],
    50: ['LEGENDARY! 🐉', 'Mythisch! 🦄', 'Ewig! ♾️', 'Absolut! 💫']
  }

  // Bestimme den Status basierend auf Combo
  let status = 'level1'
  let text = '+1'
  let fontSize = 'normal'

  if (comboCount.value >= 50) {
    status = 'level50'
    const texts = comboTexts[50]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'huge'
  } else if (comboCount.value >= 40) {
    status = 'level40'
    const texts = comboTexts[40]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'huge'
  } else if (comboCount.value >= 30) {
    status = 'level30'
    const texts = comboTexts[30]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'huge'
  } else if (comboCount.value >= 25) {
    status = 'level25'
    const texts = comboTexts[25]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'large'
  } else if (comboCount.value >= 20) {
    status = 'level20'
    const texts = comboTexts[20]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'large'
  } else if (comboCount.value >= 15) {
    status = 'level15'
    const texts = comboTexts[15]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'large'
  } else if (comboCount.value >= 12) {
    status = 'level12'
    const texts = comboTexts[12]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'medium'
  } else if (comboCount.value >= 8) {
    status = 'level8'
    const texts = comboTexts[8]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'medium'
  } else if (comboCount.value >= 5) {
    status = 'level5'
    const texts = comboTexts[5]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'medium'
  } else if (comboCount.value >= 3) {
    status = 'level3'
    const texts = comboTexts[3]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'small'
  } else {
    status = 'level1'
    const texts = comboTexts[1]
    text = texts[Math.floor(Math.random() * texts.length)]
    fontSize = 'normal'
  }

  // Nur anzeigen wenn sich der Status ändert
  if (currentFloatingStatus.value === status) {
    return // Keine Änderung, nicht neu anzeigen
  }

  // Status aktualisieren
  currentFloatingStatus.value = status

  // Check if floating number already exists
  let floatingNumber = container.querySelector('.floating-number')

  // Falls vorhanden, erst entfernen
  if (floatingNumber) {
    floatingNumber.remove()
  }

  // Zufällige Farben
  const colors = [
    '#feca57', '#f3b67e', '#ff9ff3', '#f093fb',
	  '#1dd1a1', '#00cf68', '#00d2d3', '#48dbfb',
  ]

  // Neues Element erstellen
  floatingNumber = document.createElement('div')
  floatingNumber.className = 'floating-number'
  floatingNumber.classList.add(`size-${fontSize}`)

  // Zufällige Farbe setzen
  const randomColor = colors[Math.floor(Math.random() * colors.length)]
  floatingNumber.style.color = randomColor
  floatingNumber.style.textShadow = `0 0 20px ${randomColor}80`

  floatingNumber.textContent = text

  // Position: Above the button, centered
  const button = container.querySelector('.level-up-btn')
  if (button) {
    const buttonRect = button.getBoundingClientRect()
    const containerRect = container.getBoundingClientRect()

    // Position above the button, centered
    const x = (buttonRect.left - containerRect.left) + (buttonRect.width / 2)
    const y = (buttonRect.top - containerRect.top) - 40 // 40px above button

    floatingNumber.style.left = x + 'px'
    floatingNumber.style.top = y + 'px'
  }

  container.appendChild(floatingNumber)

  // Remove after animation (1 second)
  setTimeout(() => {
    if (floatingNumber.parentNode === container) {
      floatingNumber.remove()
      currentFloatingStatus.value = null // Reset status nach Animation
    }
  }, 1000)
}

// Autoplay stoppen
const stopAutoplay = () => {
  if (intervalId) {
    clearInterval(intervalId)
    intervalId = null
  }
}

// Nächstes Bild
const nextImage = () => {
  stopAutoplay() // Autoplay stoppen bei manueller Interaktion
  fadeTransition.value = true
  setTimeout(() => {
    currentImageIndex.value = (currentImageIndex.value + 1) % images.length
    fadeTransition.value = false
  }, 300)
}

// Vorheriges Bild
const prevImage = () => {
  stopAutoplay() // Autoplay stoppen bei manueller Interaktion
  fadeTransition.value = true
  setTimeout(() => {
    currentImageIndex.value = currentImageIndex.value === 0 ? images.length - 1 : currentImageIndex.value - 1
    fadeTransition.value = false
  }, 300)
}

// Zu bestimmtem Bild springen
const goToImage = (index) => {
  stopAutoplay() // Autoplay stoppen bei manueller Interaktion
  fadeTransition.value = true
  setTimeout(() => {
    currentImageIndex.value = index
    fadeTransition.value = false
  }, 300)
}

// Bild in neuem Tab öffnen
const openImageInNewTab = () => {
  window.open(images[currentImageIndex.value], '_blank')
}

// Beim Laden der Seite
onMounted(async () => {
  // Level aus localStorage laden
  currentLevel.value = loadLevel()

  // Name aus localStorage laden
  playerName.value = loadPlayerName()

  // Player-ID laden oder generieren
  playerId.value = loadOrCreatePlayerId()

  // Highscores von API laden
  const savedHighscores = await loadHighscores()
  if (savedHighscores && savedHighscores.length > 0) {
    highscores.value = savedHighscores
  }

  // Slider starten
  intervalId = setInterval(nextImage, 5000)

  // Countdown starten
  updateCountdown()
  countdownInterval = setInterval(updateCountdown, 1000)

  // Automatisches Konfetti beim Laden
  setTimeout(() => {
    createConfetti()
  }, 500)
})

// Beim Verlassen der Seite Titel zurücksetzen
onUnmounted(() => {
  if (intervalId) {
    clearInterval(intervalId)
  }
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

// Party Details - Hier kannst du die Daten anpassen
const partyDetails = ref({
  title: 'Toni & Hauke Ehe-Challenge Party',
  date: '2026-07-25', // Format: YYYY-MM-DD (Samstag, 25.07.2026)
  startTime: '16:00',
  endTime: '02:00',
  hotelName: 'Hotel Hafen Hamburg',
  hotelWebsite: 'https://www.hotel-hafen-hamburg.de/',
  address: 'Seewartenstraße 9, 20459 Hamburg',
  description: 'Wir haben nicht nur 15 Jahre Ehe-Challenge gemeistert, sondern feiern auch einen weiteren Meilenstein!\n\nToni wurde 50, oder wie sie es ausdrückt: Sie steigt im Wert.\n\nJetzt kommt das Bonuslevel:\nParty! 🥳\n\nKommt und feiert mit uns, wenn wir zusammen weiterleveln – mit Musik, Spaß und ganz viel Konfetti! 🎊',
  dresscode: 'Nach Belieben - Hauptsache ihr fühlt euch wohl!',
  rsvpDeadline: '2026-05-01',
  rsvpEmail: 'tonjaschultz@gmail.com',
  rsvpPhone: '+49 173 8934144',
  program: [
    { time: '16:00', activity: 'Empfang' },
    { time: '18:00', activity: 'Abendessen' },
    { time: '20:00', activity: 'Party' },
    { time: '02:00', activity: 'Ende' },
  ]
})

// Hilfsfunktion: Text für iCal escapen
const escapeICalText = (text) => {
  if (!text) return ''
  return text
    .replace(/\\/g, '\\\\')  // Backslash escapen
    .replace(/;/g, '\\;')    // Semikolon escapen
    .replace(/,/g, '\\,')    // Komma escapen
    .replace(/\n/g, '\\n')   // Newlines escapen
}

// Google Calendar Event Link - Hier deinen Google Calendar Event Link einfügen
const GOOGLE_CALENDAR_EVENT_LINK = 'https://calendar.google.com/calendar/event?action=TEMPLATE&tmeid=N2xiZHFsczZwZTYzdnNxbnRmNGtwMjkxNGogYWYyMDdiNzAxMDg5ZWIyMmYyZDE2NTI2YTg1Njg0M2Q1NTBjMDBjYTViMWJiNjVhNDhmZjJjNjk5OTE4ZDI0YkBn&tmsrc=af207b701089eb22f2d16526a856843d550c00ca5b1bb65a48ff2c699918d24b%40group.calendar.google.com' // <-- HIER DEINEN LINK EINFÜGEN!

const openGoogleCalendarEvent = () => {
  window.open(GOOGLE_CALENDAR_EVENT_LINK, '_blank')
}

// Outlook Calendar - einmaliges Hinzufügen
const addToOutlookCalendar = () => {
  const event = partyDetails.value
  const startDateTime = `${event.date}T${event.startTime}:00`
  const endDate = event.endTime < event.startTime ? getNextDay(event.date) : event.date
  const endDateTime = `${endDate}T${event.endTime}:00`

  const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
  url.searchParams.append('subject', event.title)
  url.searchParams.append('startdt', startDateTime)
  url.searchParams.append('enddt', endDateTime)
  url.searchParams.append('body', event.description)
  url.searchParams.append('location', `${event.hotelName}, ${event.address}`)
  url.searchParams.append('path', '/calendar/action/compose')
  url.searchParams.append('rru', 'addevent')

  window.open(url.toString(), '_blank')
}

// Apple Calendar - .ics Download
const downloadCalendar = () => {
  const event = partyDetails.value
  const startDateTime = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`
  const endDate = event.endTime < event.startTime ? getNextDay(event.date) : event.date
  const endDateTime = `${endDate.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`

  const escapedTitle = escapeICalText(event.title)
  const escapedDescription = escapeICalText(event.description)
  const escapedLocation = escapeICalText(`${event.hotelName}, ${event.address}`)

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Party Invitation//NONSGML v1.0//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:${escapedTitle}
DESCRIPTION:${escapedDescription}
LOCATION:${escapedLocation}
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-P1D
ACTION:DISPLAY
DESCRIPTION:Reminder: ${escapedTitle} morgen!
END:VALARM
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = 'party-einladung.ics'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

// Hilfsfunktion: Nächsten Tag berechnen
const getNextDay = (dateString) => {
  const date = new Date(dateString)
  date.setDate(date.getDate() + 1)
  return date.toISOString().split('T')[0]
}

// Datum formatieren für Anzeige
const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Kalender-Komponenten für Calendar Card
const getCalendarMonth = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })
}

const getCalendarDay = (dateString) => {
  const date = new Date(dateString)
  return date.getDate()
}

const getCalendarWeekday = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('de-DE', { weekday: 'long' })
}

// Google Maps Link erstellen
const getGoogleMapsLink = (address) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}

// Google Maps Embed Link erstellen
const getGoogleMapsEmbedLink = (address) => {
  return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${encodeURIComponent(address)}`
}

// Countdown berechnen
const updateCountdown = () => {
  const event = partyDetails.value
  const eventDate = new Date(`${event.date}T${event.startTime}:00`)
  const now = new Date()
  const diff = eventDate - now

  if (diff <= 0) {
    countdown.value = { days: 0, hours: 0, minutes: 0, seconds: 0 }
    if (countdownInterval) {
      clearInterval(countdownInterval)
    }
    return
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)

  countdown.value = { days, hours, minutes, seconds }
}

// Name-Sanitization (nur Buchstaben, Zahlen, Leerzeichen, Bindestriche)
const sanitizeName = (name) => {
  if (!name || typeof name !== 'string') return ''

  return name
    .trim() // Remove whitespace from start/end
    .replace(/[^a-zA-Z0-9\s\-äöüÄÖÜß]/g, '') // Allow letters, numbers, spaces, hyphens, and German umlauts
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .replace(/\-+/g, '-') // Replace multiple hyphens with single hyphen
    .substring(0, 20) // Limit to 20 characters
    .trim() // Final trim in case we cut off in the middle of spaces
}

// Submit Score
const submitScore = async () => {
  // Name sanitizen (Sonderzeichen entfernen)
  const sanitizedName = sanitizeName(playerName.value)

  if (!sanitizedName) {
    alert('Bitte gib einen gültigen Namen ein (nur Buchstaben, Zahlen, Leerzeichen und Bindestriche)')
    return
  }

  // Sanitizierten Namen zurück ins Feld schreiben
  playerName.value = sanitizedName

  // Name im LocalStorage speichern
  savePlayerName(sanitizedName)

  // Neuen Score erstellen
  const newScore = {
    playerId: playerId.value,
    name: sanitizedName,
    level: currentLevel.value,
    date: new Date().toISOString().split('T')[0] // Format: YYYY-MM-DD
  }

  // Score zur API senden
  const result = await saveHighscores(newScore)

  if (result && result.highscores) {
    // Erfolg - aktualisiere die Anzeige
    highscores.value = result.highscores
    console.log(`Highscore gespeichert! Rang: ${result.rank}`)
    createConfetti()
  } else {
    // Fehler - informiere den Benutzer
    console.error('Fehler beim Speichern des Highscores')
  }
}

// Name speichern, wenn er geändert wird
const savePlayerNameOnChange = () => {
  // Name sanitizen beim Verlassen des Input-Feldes
  const sanitized = sanitizeName(playerName.value)
  if (sanitized) {
    playerName.value = sanitized
    savePlayerName(sanitized)
  }
}

// Aktuellen Spieler-Score berechnen
const currentPlayerScore = computed(() => {
  // Erstelle eine temporäre Liste mit allen Scores inkl. aktuellem Spieler
  const allScores = [...highscores.value]

  // Prüfe ob dieser Spieler schon in der Liste ist
  const existingIndex = allScores.findIndex(score => score.playerId === playerId.value)
  let existingLevel = null

  if (existingIndex !== -1) {
    // Spieler ist bereits in der Liste - speichere den bisherigen Level
    existingLevel = allScores[existingIndex].level
    // Aktuellen Level für Vorschau nutzen
    allScores[existingIndex] = {
      playerId: playerId.value,
      name: playerName.value.trim(),
      level: currentLevel.value,
      date: new Date().toISOString().split('T')[0]
    }
  } else {
    // Füge den aktuellen Score hinzu
    allScores.push({
      playerId: playerId.value,
      name: playerName.value.trim(),
      level: currentLevel.value,
      date: new Date().toISOString().split('T')[0]
    })
  }

  // Sortieren nach Level (höchste zuerst)
  allScores.sort((a, b) => b.level - a.level)

  // Finde den Rang des aktuellen Spielers
  const rank = allScores.findIndex(score => score.playerId === playerId.value) + 1

  // Prüfe ob der aktuelle Level besser ist als der bisherige
  const isImprovement = existingLevel === null || currentLevel.value > existingLevel

  return {
    rank,
    name: playerName.value.trim(),
    level: currentLevel.value,
    isImprovement
  }
})

// Konfetti-Animation (Regenfall von oben)
const createConfetti = () => {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#00d2d3']
  const emojis = ['🍬', '🍭', '🍫', '🍦', '🍰', '🍺', '🍻', '🍷', '🥂', '🎂', '🎁', '✨', '🎈', '🎊']
  const confettiCount = 40
  const container = document.querySelector('.party-page')
  const currentScrollTop = window.scrollY || document.documentElement.scrollTop

  // Berechne Scroll-Prozentsatz (0 = oben, 1 = unten)
  const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
  const scrollPercent = Math.min(currentScrollTop / scrollableHeight, 1)

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div')
    confetti.className = 'confetti'

    // Von der aktuellen Scroll-Position starten, über die gesamte Breite verteilt (wie Regenfall)
    const startLeft = Math.random() * 70 + 10 // 0-100%
    confetti.style.left = startLeft + '%'
    // Startet etwas oberhalb der aktuellen Scroll-Position
    confetti.style.top = `${currentScrollTop - 50}px`

    // 50% Chance für Emoji, 50% für bunten Kreis
    const isEmoji = Math.random() > 0.5

    if (isEmoji) {
      confetti.textContent = emojis[Math.floor(Math.random() * emojis.length)]
      confetti.style.fontSize = Math.random() * 20 + 20 + 'px'
      confetti.classList.add('confetti-emoji')
    } else {
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)]
      confetti.style.width = Math.random() * 12 + 6 + 'px'
      confetti.style.height = confetti.style.width
      confetti.style.borderRadius = '50%'
    }

    // Regenfall: nach unten + leichte horizontale Bewegung
    const horizontalDistance = Math.random() * 20 - 10 // Leichtes horizontales Schwingen
    const verticalDistance = container.clientHeight + (Math.random() * 300) - 250 - currentScrollTop

    // Dauer: 4-6s oben, 2-3s unten (basierend auf Scroll-Position)
    const minDuration = 2 + (1 - scrollPercent) * 2 // 2-4s
    const maxDuration = 3 + (1 - scrollPercent) * 3 // 3-6s
    const duration = Math.random() * (maxDuration - minDuration) + minDuration

    confetti.style.setProperty('--x', horizontalDistance + 'px')
    confetti.style.setProperty('--y', verticalDistance + 'px')
    confetti.style.setProperty('--rotation', Math.random() * 720 + 'deg')
    confetti.style.animation = `confettiFall ${duration}s ease-in forwards`

    container.appendChild(confetti)

    // Entfernen nach Animation
    setTimeout(() => {
      confetti.remove()
    }, duration * 6000)
  }
}
</script>

<template>
  <div class="party-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="party-title">{{ partyDetails.title }}</h1>
      </div>
    </section>

    <!-- Konfetti-Button (fixed unten rechts) -->
    <button class="confetti-btn-fixed" @click="createConfetti">
      🎉
    </button>

    <!-- Main Content -->
    <main class="party-main">

      <!-- Calendar Card -->
      <section class="info-card calendar-card">
        <div class="calendar-visual">
	        <div class="calendar-month">{{ getCalendarMonth(partyDetails.date) }}</div>
          <div class="calendar-day">{{ getCalendarDay(partyDetails.date) }}</div>
          <div class="calendar-weekday">{{ getCalendarWeekday(partyDetails.date) }}</div>
          <div class="calendar-time">{{ partyDetails.startTime }} - {{ partyDetails.endTime }} Uhr</div>
          <div class="countdown" v-if="countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0">
            <div class="countdown-item">
              <span class="countdown-value">{{ countdown.days }}</span>
              <span class="countdown-label">Tage</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-value">{{ String(countdown.hours).padStart(2, '0') }}</span>
              <span class="countdown-label">Stunden</span>
            </div>
            <div class="countdown-item">
              <span class="countdown-value">{{ String(countdown.minutes).padStart(2, '0') }}</span>
              <span class="countdown-label">Minuten</span>
            </div>
          </div>
        </div>
      </section>

	    <!-- Location Card -->
	    <section class="info-card">
		    <div class="card-header">
			    <h2>Ort</h2>
		    </div>
		    <div class="card-content">
			    <h3 class="hotel-name">{{ partyDetails.hotelName }}</h3>
			    <p class="address">{{ partyDetails.address }}</p>
			    <p class="hotel-link">
				    <a :href="partyDetails.hotelWebsite" target="_blank" rel="noopener noreferrer">
					    {{ partyDetails.hotelWebsite }}
				    </a>
			    </p>

			    <!-- Google Maps iframe -->
			    <div class="maps-container">
				    <iframe
					    :src="getGoogleMapsEmbedLink(partyDetails.address)"
					    class="maps-iframe"
					    allowfullscreen
					    loading="lazy"
					    referrerpolicy="no-referrer-when-downgrade"
				    ></iframe>
			    </div>
		    </div>
	    </section>

	    <!-- Hotel Fade Bilder Kachel -->
	    <section class="info-card info-card--no-border">
		    <HotelFade />
	    </section>

	    <!-- Description Card -->
	    <section class="info-card">
		    <div class="card-content">
			    <p class="description">{{ partyDetails.description }}</p>
		    </div>
	    </section>

      <!-- Program Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Programm</h2>
        </div>
        <div class="card-content">
          <div class="program-list">
            <div
              v-for="(item, index) in partyDetails.program"
              :key="index"
              class="program-item"
            >
              <span class="program-time">{{ item.time }}</span>
              <span class="program-activity">{{ item.activity }}</span>
            </div>
          </div>
        </div>
	      <div class="card-content">
		      <p class="dresscode"><strong>Dresscode:</strong> {{ partyDetails.dresscode }}</p>
	      </div>
      </section>

      <!-- Hotel Übernachtung Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Hotel</h2>
        </div>
        <div class="card-content">
	        <p class="description">Ihr möchtet vor Ort übernachten? Das Hotel Hafen Hamburg bietet Zimmer.</p>
	        <p class="description"><strong>Zimmerpreise:</strong> Aktuelle Preise findet ihr auf der Hotel-Website.</p>
	        <p class="description">Bei Fragen zur Übernachtung meldet euch gerne bei uns!</p>
        </div>
      </section>

      <!-- Anreise Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Anreise</h2>
        </div>
        <div class="card-content">
	        <p class="description">Das Hotel verfügt über Parkplätze (ca. 25€ pro Tag).</p>
	        <p class="description">Wir empfehlen alternativ die Anreise mit öffentlichen Verkehrsmitteln. Das Hotel liegt nur 5 Gehminuten von der S-Bahn-Station Landungsbrücken entfernt.</p>
        </div>
      </section>


	    <!-- RSVP Card -->
	    <section class="info-card">
		    <div class="card-header">
			    <h2>Zusage</h2>
		    </div>
		    <div class="card-content">
			    <p class="description">Bitte sage bis zum <strong>{{ formatDate(partyDetails.rsvpDeadline) }}</strong> zu.</p>
			    <p class="description"><strong>Zum Kalender hinzufügen</strong></p>
			    <div class="calendar-buttons" style="margin-top: var(--space-4);">
				    <button class="btn btn--calendar btn--google" @click="openGoogleCalendarEvent">
					    Google
				    </button>
				    <button class="btn btn--calendar btn--outlook" @click="addToOutlookCalendar">
					    Outlook
				    </button>
				    <button class="btn btn--calendar btn--apple" @click="downloadCalendar">
					    Apple
				    </button>
			    </div>
		    </div>
	    </section>

	    <!-- Level-Up Clicker Game Card with Flip -->
	    <section class="info-card level-up-card">
		    <div class="flip-card-container" :class="{ 'flipped': isFlipped }">
			    <!-- Vorderseite: Play Content -->
			    <div class="flip-card-front">
				    <div class="card-content play-content">
					    <div class="level-display">
						    <div class="level-number">Level {{ currentLevel }}</div>
						    <div class="level-title">{{ getLevelTitle(currentLevel) }}</div>
					    </div>

					    <button
							    class="level-up-btn"
							    :class="{ 'level-up-btn--animate': clickAnimation }"
							    @click="levelUp"
					    >
						    LEVEL UP!
					    </button>

					    <!-- Toggle Button -->
					    <button class="flip-toggle-btn" @click="toggleFlip">
						    🏆 Highscore
					    </button>
				    </div>
			    </div>

			    <!-- Rückseite: Highscore Content -->
			    <div class="flip-card-back">
				    <div class="card-content highscore-content">
					    <div class="card-header">
						    <h2>Highscore</h2>
						    <!-- Toggle Button -->
						    <button class="flip-toggle-btn" @click="toggleFlip">
							    🎮 Zurück zum Spiel
						    </button>
					    </div>
					    <div class="card-content">

						    <!-- Top 10 Highscore Liste -->
						    <div class="highscore-list">
							    <!-- Dein aktueller Score -->
							    <div
									    v-if="currentPlayerScore"
									    class="highscore-entry current-player"
							    >
								    <!-- Noch keine Score erreicht (Level 0) -->
								    <template v-if="currentLevel === 0">
									    <div class="info-text-container">
										    <div class="info-text">Klicke auf "LEVEL UP!" um zu starten und einen Highscore zu erreichen!</div>
									    </div>
								    </template>

								    <!-- Noch nicht in Top 10 (Rang > 10) -->
								    <template v-else-if="currentPlayerScore.rank > 10">
									    <div class="info-text-container">
										    <div class="info-text">Noch kein Highscore erreicht! Klicke den "LEVEL UP!" Button weiter!! <strong>Level {{ currentPlayerScore.level }}</strong> erreicht.</div>
									    </div>
								    </template>

								    <!-- Highscore erreicht (Rang <= 10) und Verbesserung -->
								    <template v-else-if="currentPlayerScore.isImprovement">
									    <div class="congratulations-text">
										    <span>Du hast es geschafft! Neuer Highscore!</span>
										    <span v-if="playerName.length === 0"> Jetzt Namen eintragen und Highscore senden.</span>
									    </div>
									    <span class="rank-number">{{ currentPlayerScore.rank }}.</span>
									    <span class="player-name">
										    <input
												    v-model="playerName"
												    type="text"
												    name="playerName"
												    placeholder="Dein Name..."
												    class="name-input"
												    maxlength="20"
												    @blur="savePlayerNameOnChange"
										    />
									    </span>
									    <span class="player-level">{{ currentPlayerScore.level }}</span>
									    <button class="btn submit-btn" @click="submitScore" :disabled="playerName.length === 0">
										    Highscore senden
									    </button>
								    </template>

								    <!-- Kein Highscore (gleicher oder schlechterer Score) -->
								    <template v-else>
									    <div class="info-text-container">
										    <div class="info-text">Highscore <strong>Platz {{ currentPlayerScore.rank }}</strong> mit Level {{ currentPlayerScore.level }} erreicht. Klicke den "LEVEL UP!" Button weiter!!</div>
									    </div>
								    </template>
							    </div>
							    <!-- Top 10 Liste -->
							    <div
									    v-for="entry in highscores.slice(0, 10)"
									    :key="entry.rank"
									    class="highscore-entry"
									    :class="{
								      'top-1': entry.rank === 1,
								      'top-2': entry.rank === 2,
								      'top-3': entry.rank === 3
								    }"
							    >
								    <span class="rank-number">{{ entry.rank }}.</span>
								    <span v-if="entry.rank === 1" class="rank-medal">🥇</span>
								    <span v-else-if="entry.rank === 2" class="rank-medal">🥈</span>
								    <span v-else-if="entry.rank === 3" class="rank-medal">🥉</span>
								    <span class="player-name">{{ entry.name }}</span>
								    <span class="player-level">{{ entry.level }}</span>
							    </div>
						    </div>
					    </div>
				    </div>
			    </div>
		    </div>
	    </section>

      <!-- Bilder Slider Card -->
      <section class="info-card info-card--wide">
        <div class="card-content">
          <div class="image-slider">
            <div class="slider-container">
              <img
                :src="images[currentImageIndex]"
                :class="{ 'fade-out': fadeTransition }"
                class="slider-image"
                @click="openImageInNewTab"
                alt="Party Bild"
              />
              <button class="slider-btn slider-btn--prev" @click="prevImage">
                ❮
              </button>
              <button class="slider-btn slider-btn--next" @click="nextImage">
                ❯
              </button>
            </div>
            <div class="slider-indicators">
              <span
                v-for="(img, index) in images"
                :key="index"
                :class="{ 'active': index === currentImageIndex }"
                class="indicator"
                @click="goToImage(index)"
              ></span>
            </div>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss">
// Override App.vue container width for full-width party page
body:has(.party-page) .container,
.party-page + .container,
:root:has(.party-page) .container {
	width: 100%;
	max-width: none !important;
}

.party-page {
  min-height: 100vh;
  background: var(--bg-primary);
	display: flex;
	flex-direction: column;
	align-items: center;
	width: 100%;
	padding-bottom: 400px;
}

.hero-section {
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: white;
  width: 100%;
  position: relative;
  overflow: hidden;
}

.hero-content {
  max-width: 1200px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

// Konfetti-Button (fixed unten rechts)
.confetti-btn-fixed {
  position: fixed;
  bottom: 30px;
  right: 30px;
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  border: 3px solid rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  width: 70px;
  height: 70px;
  font-size: 35px;
  cursor: pointer;
  transition: all 0.3s ease;
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  animation: pulse-fixed 2s ease-in-out infinite;

  &:hover {
    transform: scale(1.15);
    box-shadow: 0 6px 25px rgba(0, 0, 0, 0.4);
    animation: none;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    font-size: 30px;
    bottom: 20px;
    right: 20px;
  }
}

@keyframes pulse-fixed {
  0%, 100% {
    transform: scale(1);
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  }
  50% {
    transform: scale(1.08);
    box-shadow: 0 6px 30px rgba(0, 0, 0, 0.4);
  }
}

// Konfetti-Animation
.confetti {
  position: absolute;
  pointer-events: none;
  z-index: 5;

  &-emoji {
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
  }
}

@keyframes confettiFall {
  0% {
    opacity: 1;
    transform: translate(0, 0) rotate(0deg);
  }
  100% {
    opacity: 1;
    transform: translate(var(--x), var(--y)) rotate(var(--rotation));
  }
}

.party-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: var(--space-4) 0 var(--space-2);
  color: white;

  @media (min-width: 1024px) {
    font-size: var(--font-size-4xl);
  }
}

.party-date {
  font-size: var(--font-size-xl);
  margin: var(--space-2) 0;
  font-weight: var(--font-weight-medium);

  @media (min-width: 1024px) {
    font-size: var(--font-size-2xl);
  }
}

.party-time {
  font-size: var(--font-size-lg);
  opacity: 0.9;
}

.party-main {
  padding: var(--space-6) var(--space-4);
  display: flex;
	flex-direction: row;
	justify-content: center;
  flex-wrap: wrap;
  gap: var(--space-4);
	max-width: 1200px;

  .info-card {
    width: 100%; // Mobile: 100%

    @media (min-width: 768px) {
      width: calc(50% - var(--space-2)); // Tablet: 50%
    }

    @media (min-width: 1024px) {
      width: calc(33.333% - var(--space-3)); // Desktop: 33%
    }

	  &--wide {
		  @media (min-width: 768px) {
			  width: 100%;
		  }

		  @media (min-width: 1024px) {
			  width: calc(50% - var(--space-3));
		  }
	  }

	  &--no-border {
		  padding: 0;
	  }
  }
}

.info-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  transition: all 0.2s ease;

  &:hover {
    box-shadow: var(--card-shadow-hover);
    transform: translateY(-2px);
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-3);
  color: var(--warning-color);

  h2 {
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    margin: 0;
    color: var(--text-color);
  }
}

.card-content {
  color: var(--text-color);

  p {
    margin: 0;
    line-height: 1.3;
  }

  a {
    color: var(--warning-color);
    text-decoration: none;
    font-weight: var(--font-weight-medium);

    &:hover {
      text-decoration: underline;
    }
  }
}

.hotel-name {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--space-2);
  color: var(--text-color);
}

.address {
  color: var(--text-secondary);
  margin: 0;
}

.hotel-link {
  margin-top: var(--space-2);
}

.description {
  white-space: pre-line;
	font-size: var(--font-size-lg);

	& + .description {
		margin-top: var(--space-3);
	}
}

.program-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.program-item {
  display: flex;
  gap: var(--space-4);
  padding: var(--space-2);
  border-left: 3px solid var(--warning-color);
  padding-left: var(--space-3);
}

.program-time {
  font-weight: var(--font-weight-bold);
  color: var(--warning-color);
  min-width: 60px;
}

.program-activity {
  color: var(--text-color);
}

.dresscode {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-medium);
  color: var(--warning-color);
  padding: var(--space-3) 0 0;

	strong {
		color: var(--white);
	}
}

.calendar-content {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: var(--space-2) 0;
}

.calendar-buttons {
  display: flex;
  flex-direction: row;
	flex-wrap: wrap;
  gap: var(--space-3);
  width: 100%;
}

.placeholder-text {
  text-align: center;
  color: var(--text-secondary);
  font-style: italic;
}

// Image Slider Styles
.image-slider {
  width: 100%;
}

.slider-container {
  position: relative;
  width: 100%;
  height: 480px;
  overflow: hidden;
  border-radius: var(--border-radius-lg);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
}

.slider-image {
  width: auto;
  height: 100%;
  max-width: 100%;
  object-fit: contain;
  cursor: pointer;
  transition: opacity 0.3s ease-in-out;
  opacity: 1;

  &.fade-out {
    opacity: 0;
  }

  &:hover {
    filter: brightness(1.1);
  }
}

.slider-btn {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: rgba(0, 0, 0, 0.3);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-2xl);
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: var(--border-radius-md);
  z-index: 10;

  &:hover {
    background: rgba(0, 0, 0, 0.5);
    transform: translateY(-50%) scale(1.1);
  }

  &--prev {
    left: var(--space-2);
  }

  &--next {
    right: var(--space-2);
  }
}

.slider-indicators {
  display: flex;
  justify-content: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--text-secondary);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: var(--primary-color);
    transform: scale(1.2);
  }

  &.active {
    background: var(--warning-color);
    width: 32px;
    border-radius: 6px;
  }
}

.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  font-family: var(--font-family-base);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-base);

  &--primary {
    background: var(--warning-color);
    color: white;

    &:hover {
      background: var(--warning-color);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }
  }

  &--large {
    padding: var(--space-4) var(--space-8);
    font-size: var(--font-size-lg);
  }

  &--calendar {
    justify-content: center;
    padding: var(--space-3) var(--space-4);
  }

  &--google {
    background: #4285f4;
    color: white;

    &:hover {
      background: #3367d6;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(66, 133, 244, 0.3);
    }
  }

  &--outlook {
    background: #0078d4;
    color: white;

    &:hover {
      background: #005a9e;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
    }
  }

  &--apple {
    background: #555555;
    color: white;

    &:hover {
      background: #333333;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(85, 85, 85, 0.3);
    }
  }
}

// Calendar Card Styles
.calendar-card {
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  color: white;
  padding: 0;
  overflow: hidden;

  &:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  }
}

.calendar-visual {
  padding: var(--space-6) var(--space-4);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.calendar-month {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
  padding: var(--space-2);
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-md);
}

.calendar-day {
  font-size: 4rem;
  font-weight: var(--font-weight-bold);
  line-height: 1;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (min-width: 768px) {
    font-size: 5rem;
  }
}

.calendar-weekday {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  opacity: 0.95;
  margin: var(--space-1) 0 var(--space-3);
}

.calendar-time {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--space-2) var(--space-4);
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--border-radius-md);
  display: inline-block;
  margin: 0 auto;
}

// Countdown Styles
.countdown {
  display: flex;
  justify-content: center;
  gap: var(--space-4);
  margin-top: var(--space-4);
  padding-top: var(--space-4);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

.countdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-1);
}

.countdown-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  line-height: 1;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  @media (min-width: 768px) {
    font-size: var(--font-size-3xl);
  }
}

.countdown-label {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-medium);
  text-transform: uppercase;
  letter-spacing: 1px;
  opacity: 0.9;
}

// Save The Date Badge
.save-the-date-badge {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 2px;
  padding: var(--space-3) var(--space-6);
	background: linear-gradient(135deg, rgba(var(--primary-color-rgb, 255, 107, 107), 0.1), rgba(var(--success-color-rgb, 72, 219, 251), 0.1));
	border-radius: var(--border-radius-lg);
  display: inline-block;
  margin-bottom: var(--space-3);
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  animation: pulse-badge 2s ease-in-out infinite;
	cursor: default;

	&:hover {
		border-color: var(--warning-color);
		color: var(--text-color);
		transform: translateY(-2px);
	}

  @media (min-width: 768px) {
    font-size: var(--font-size-xl);
  }
}

@keyframes pulse-badge {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
}

// Placeholder Badge Styles
.placeholder-badge {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(135deg, rgba(var(--primary-color-rgb, 255, 107, 107), 0.1), rgba(var(--success-color-rgb, 72, 219, 251), 0.1));
  border: 2px dashed var(--card-border);
  border-radius: var(--border-radius-lg);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--text-secondary);
  text-align: center;
  animation: fade-pulse 2.5s ease-in-out infinite;
  transition: all 0.3s ease;

  &:hover {
    border-color: var(--warning-color);
    color: var(--text-color);
    transform: translateY(-2px);
  }

  @media (min-width: 768px) {
    font-size: var(--font-size-lg);
  }
}

@keyframes fade-pulse {
  0%, 100% {
    opacity: 0.7;
  }
  50% {
    opacity: 1;
  }
}

// Google Maps iframe Styles
.maps-container {
  margin-top: var(--space-4);
  position: relative;
  width: 100%;
  height: 0;
  padding-bottom: 56.25%; // 16:9 aspect ratio
  border-radius: var(--border-radius-lg);
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.maps-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
  border-radius: var(--border-radius-lg);
}

// Level-Up Clicker Game Styles
.level-up-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  position: relative;
  overflow: hidden;
	min-height: 360px;

  .card-header h2 {
    color: white;
  }

  .card-content {
    display: flex;
    flex-direction: column;
	  align-items: center;
	  justify-content: space-between;
	  height: 100%;
    gap: var(--space-4);
    position: relative;
    z-index: 2;
  }
}

// Treasure Container - füllt die Card von unten
.treasure-container {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

// Münzen und Diamanten Animation
.treasure {
  position: absolute;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

// Neue Animation: Münzen fallen und stapeln sich von unten
@keyframes treasureFillUp {
  0% {
    top: -50px;
    left: var(--treasure-final-left, 50%);
    opacity: 0;
    transform: scale(0.3) rotate(0deg);
  }
  30% {
    opacity: 0.5;
    transform: scale(1.1) rotate(180deg);
  }
  100% {
    top: auto;
    bottom: var(--treasure-final-bottom, 0px);
    left: var(--treasure-final-left, 50%);
    opacity: 0.6;
    transform: scale(1) rotate(var(--treasure-rotation, 0deg));
  }
}

.level-display {
  text-align: center;
  padding: var(--space-4) 0;
}

.level-number {
  font-size: var(--font-size-4xl);
  font-weight: var(--font-weight-bold);
  margin-bottom: var(--space-2);
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);

  @media (min-width: 768px) {
    font-size: 3.5rem;
  }
}

.level-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  opacity: 0.9;
  min-height: 28px;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);

  @media (min-width: 768px) {
    font-size: var(--font-size-xl);
  }
}

.level-up-btn {
  width: 100%;
  padding: var(--space-6) var(--space-4);
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border: none;
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  text-transform: uppercase;
  letter-spacing: 2px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  user-select: none;
	opacity: .9;

  &:hover {
    transform: translateY(-2px) scale(1.02);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0) scale(0.98);
  }
}

.level-milestones {
  text-align: center;
}

.milestone-text {
  font-size: var(--font-size-xs);
  opacity: 0.7;
  font-style: italic;
}

// Highscore Card Styles
.highscore-card {
  background: linear-gradient(135deg, #667eea 0%, #19547b 100%);
  color: white;

  @media (min-width: 768px) {
    width: 100%;
  }

  @media (min-width: 1024px) {
    width: calc(66.666% - var(--space-3));
  }

  .card-header h2 {
    color: white;
  }
}

.name-input-section {
  margin-bottom: var(--space-4);
}

.congratulations-text {
  margin: 0;
	line-height: 1.2;
  color: white;
	width: 100%;
}

.input-label {
  font-size: var(--font-size-base);
  margin: 0 0 var(--space-3);
  text-align: center;
  color: rgba(255, 255, 255, 0.9);
}

.name-input-wrapper {
  display: flex;
  gap: var(--space-2);
  flex-direction: column;

  @media (min-width: 768px) {
    flex-direction: row;
  }
}

.name-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-lg);
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;
	width: 160px;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.2);
  }
}

.submit-btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--border-radius-lg);
  border: none;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
}

.highscore-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--space-4);
  color: white;
}

.highscore-entry {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  margin-bottom: var(--space-1);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(4px);
  }

  // Gold for 1st place
  &.top-1 {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.7), rgba(255, 185, 0, 0.7));
    border: 2px solid rgba(255, 215, 0, 0.8);
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.4);
  }

  // Silver for 2nd place
  &.top-2 {
    background: linear-gradient(135deg, rgba(192, 192, 192, 0.6), rgba(169, 169, 169, 0.6));
    border: 2px solid rgba(192, 192, 192, 0.7);
    box-shadow: 0 0 12px rgba(192, 192, 192, 0.3);
  }

  // Bronze for 3rd place
  &.top-3 {
    background: linear-gradient(135deg, rgba(205, 127, 50, 0.6), rgba(184, 115, 51, 0.6));
    border: 2px solid rgba(205, 127, 50, 0.7);
    box-shadow: 0 0 10px rgba(205, 127, 50, 0.3);
  }
}

.rank-number {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: white;
  min-width: 30px;
}

.rank-medal {
  font-size: var(--font-size-lg);
  margin-right: var(--space-1);
}

.player-name {
  flex: 1;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: white;
}

.player-level {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: white;
  text-align: right;
}

// Accordion Styles
.accordion-header {
  cursor: pointer;
  user-select: none;
  justify-content: space-between;
	margin: 0;

  &:hover {
    opacity: 0.9;
  }
}

.accordion-icon {
  font-size: var(--font-size-sm);
  transition: transform 0.3s ease;
  color: white;

  &.open {
    transform: rotate(180deg);
  }
}

.accordion-content {
  animation: slideDown 0.3s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// Current Player Section Styles
.current-player-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  margin: 0 0 var(--space-2);
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
}

.highscore-entry.current-player {
  background: linear-gradient(135deg, rgba(0, 200, 150, 0.7), rgba(0, 150, 255, 0.7));
  border: 2px solid rgba(0, 200, 150, 0.8);
  animation: pulse-glow 2s ease-in-out infinite;
	flex-wrap: wrap;
	justify-content: space-between;
	padding: var(--space-3);

  &:hover {
    background: linear-gradient(135deg, rgba(0, 220, 170, 0.8), rgba(0, 170, 255, 0.8));
    transform: translateX(4px);
  }
}

.highscore-entry.player-level {
	flex-grow: 0;
	padding: 0 var(--space-2);
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 10px rgba(0, 200, 150, 0.5);
  }
  50% {
    box-shadow: 0 0 20px rgba(0, 200, 150, 0.8);
  }
}

// Info Text Container Styles
.info-text-container {
  width: 100%;
  text-align: center;
  padding: var(--space-1);
}

.info-text {
  margin: 0;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  color: white;
  line-height: 1.2;

  &:not(:last-child) {
    margin-bottom: var(--space-2);
  }
}

// Flip Card Styles
.flip-card-container {
  position: relative;
  width: 100%;
  perspective: 1000px;
  transform-style: preserve-3d;
  transition: transform 0.6s;
	height: 100%;

	.card-header {
		justify-content: space-between;
		width: 100%;
		margin: 0;
	}
}

.flip-card-front,
.flip-card-back {
  position: relative;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  transform-style: preserve-3d;
}

.flip-card-front {
  transform: rotateY(0deg);
  z-index: 2;
	height: 100%;
}

.flip-card-back {
  transform: rotateY(180deg);
	height: 0;
}

.flip-card-container.flipped {
  .flip-card-front {
    transform: rotateY(-180deg);
	  height: 0;
  }

  .flip-card-back {
    transform: rotateY(0deg);
	  height: 100%;
  }
}

// Flip Toggle Button
.flip-toggle-btn {
  width: auto;
	align-self: flex-end;
  padding: var(--space-2);
  font-size: var(--font-size-xs);
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  &:active {
    transform: translateY(0);
  }
}

// Floating Number Styles
.floating-number {
  position: absolute;
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: white;
  pointer-events: none;
  user-select: none;
  z-index: 10;
  animation: floatUp 1s ease-out forwards;
  transform: translateX(-50%);
  white-space: nowrap;

  // Size Varianten
  &.size-normal {
    font-size: var(--font-size-xl);
  }

  &.size-small {
    font-size: var(--font-size-2xl);
  }

  &.size-medium {
    font-size: calc(var(--font-size-2xl) * 1.2);
  }

  &.size-large {
    font-size: var(--font-size-3xl);
  }

  &.size-huge {
    font-size: calc(var(--font-size-3xl) * 1.2);
  }
}

// Floating Animation (Standard)
@keyframes floatUp {
  0% {
    opacity: 1;
    transform: translate(-50%, 0) scale(0.8);
  }
  50% {
    opacity: 1;
    transform: translate(-50%, -30px) scale(1.1);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -80px) scale(1);
  }
}

// Floating Animation (Mega)
@keyframes floatUpMega {
  0% {
    opacity: 1;
    transform: translate(-50%, 0) scale(0.5) rotate(-5deg);
  }
  30% {
    opacity: 1;
    transform: translate(-50%, -20px) scale(1.3) rotate(5deg);
  }
  60% {
    opacity: 1;
    transform: translate(-50%, -50px) scale(1.2) rotate(-3deg);
  }
  100% {
    opacity: 0;
    transform: translate(-50%, -100px) scale(1) rotate(0deg);
  }
}

@media (max-width: 768px) {
  .party-title {
    font-size: var(--font-size-2xl);
  }

  .party-date {
    font-size: var(--font-size-lg);
  }

	.description {
		font-size: var(--font-size-base);
	}

  .highscore-entry {
    gap: var(--space-1);
  }

  .rank-number {
    min-width: 25px;
  }

  .player-name {
    font-size: var(--font-size-sm);
  }

  .player-level {
    font-size: var(--font-size-sm);
  }
}
</style>