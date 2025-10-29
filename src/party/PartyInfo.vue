<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Icon from '../components/Icon.vue'

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

// Highscore State
const playerName = ref('')
const showHighscore = ref(false)

// Dummy Highscore Daten (Top 10)
const dummyHighscores = ref([
  { rank: 1, name: 'MaxPower', level: 10000, date: '2025-10-20' },
  { rank: 2, name: 'LevelKing', level: 8500, date: '2025-10-18' },
  { rank: 3, name: 'ClickMaster', level: 7800, date: '2025-10-15' },
  { rank: 4, name: 'PartyHero', level: 6200, date: '2025-10-12' },
  { rank: 5, name: 'ButtonSmasher', level: 5500, date: '2025-10-10' },
  { rank: 6, name: 'ProGamer', level: 4900, date: '2025-10-08' },
  { rank: 7, name: 'SpeedClicker', level: 3800, date: '2025-10-05' },
  { rank: 8, name: 'ChampionX', level: 2900, date: '2025-10-02' },
  { rank: 9, name: 'NinjaFinger', level: 2100, date: '2025-09-28' },
  { rank: 10, name: 'ClickNinja', level: 1500, date: '2025-09-25' }
])

// Level Titles
const getLevelTitle = (level) => {
  if (level === 0) return 'Bereit zum Leveln?'
  if (level < 5) return 'Anfänger'
  if (level < 10) return 'Fortgeschritten'
  if (level < 25) return 'Profi'
  if (level < 50) return 'Experte'
  if (level < 75) return 'Meister'
  if (level < 100) return 'Champion'
  if (level < 200) return 'LEVEL GOD 🔥'
  if (level < 400) return 'UNSTOPPABLE 💪'
  if (level < 800) return 'LEGENDARY 👑'
  if (level < 1200) return 'IMMORTAL ⚡'
  if (level < 1600) return 'MYTHICAL 🦄'
  if (level < 2000) return 'GODLIKE 🌟'
  if (level < 2400) return 'CELESTIAL 🌌'
  if (level < 2800) return 'DIVINE ✨'
  if (level < 3200) return 'ETERNAL 🔮'
  if (level < 3600) return 'COSMIC 🌠'
  if (level < 4000) return 'TRANSCENDENT 🎆'
  if (level < 4400) return 'OMNIPOTENT 💫'
  if (level < 4800) return 'SUPREME 👾'
  if (level < 5200) return 'ULTIMATE 🎮'
  if (level < 5600) return 'INFINITE ♾️'
  if (level < 6000) return 'ABSOLUTE 💎'
  if (level < 6400) return 'LIMITLESS 🚀'
  if (level < 6800) return 'UNRIVALED 🏆'
  if (level < 7200) return 'INVINCIBLE 🛡️'
  if (level < 7600) return 'OMNISCIENT 🧠'
  if (level < 8000) return 'LEGENDARY TITAN 🗿'
  if (level < 8400) return 'COSMIC EMPEROR 👹'
  if (level < 8800) return 'UNIVERSAL DEITY 🌍'
  if (level < 9200) return 'DIMENSION LORD 🌀'
  if (level < 9600) return 'REALITY BENDER 🔱'
  if (level < 10000) return 'EXISTENCE MASTER 🌊'
  if (level >= 10000) return 'THE ONE ☯️'
  return ''
}

// LocalStorage Key für Party Level
const PARTY_LEVEL_KEY = 'party_level'

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

// Level Up Click Handler
const levelUp = () => {
  // Animation triggern
  clickAnimation.value = true
  setTimeout(() => {
    clickAnimation.value = false
  }, 200)

  currentLevel.value++

  // Level im localStorage speichern
  saveLevel(currentLevel.value)

  // Bei Level 10: Game Completed - Münzen-Regen startet!
  if (currentLevel.value === 100) {
    gameCompleted.value = true
    createConfetti()
    createTreasureRain()
    return
  }

  // Nach Level 10: Füge bei jedem Klick eine zufällige Münze hinzu
  if (currentLevel.value > 1) {
    addSingleTreasure()
  }

  // Konfetti bei Milestones
  const milestones = [50, 100, 150, 200, 300, 400, 500, 1000, 1500, 2000]
  if (milestones.includes(currentLevel.value)) {
    createConfetti()
  }
}

// Füge eine einzelne Münze hinzu (nach Level 100)
const addSingleTreasure = () => {
  const treasures = ['💰', '💎', '🪙', '💵', '💴', '💶', '💷', '💸', '🏆', '⭐', '✨']
  const container = document.querySelector('.level-up-card')

  let treasureContainer = document.querySelector('.treasure-container')
  if (!treasureContainer) {
    treasureContainer = document.createElement('div')
    treasureContainer.className = 'treasure-container'
    container.appendChild(treasureContainer)
  }

  const treasure = document.createElement('div')
  treasure.className = 'treasure'
  treasure.textContent = treasures[Math.floor(Math.random() * treasures.length)]

  const startLeft = Math.random() * 100
  treasure.style.left = startLeft + '%'
  treasure.style.top = '-50px'
  treasure.style.fontSize = Math.random() * 15 + 20 + 'px'

  // Zähle vorhandene Treasures
  const existingTreasures = treasureContainer.querySelectorAll('.treasure').length
  const row = Math.floor(existingTreasures / 8)
  const col = existingTreasures % 8
  const finalBottom = row * 35 + Math.random() * 10
  const finalLeft = col * 12 + Math.random() * 8

  const rotation = Math.random() * 60 - 30
  const duration = Math.random() * 0.5 + 1.5

  treasure.style.setProperty('--treasure-final-bottom', finalBottom + 'px')
  treasure.style.setProperty('--treasure-final-left', finalLeft + '%')
  treasure.style.setProperty('--treasure-rotation', rotation + 'deg')
  treasure.style.animation = `treasureFillUp ${duration}s ease-out forwards`

  treasureContainer.appendChild(treasure)
}

// Münzen und Diamanten füllen die Card wie ein Glas bei Level 100
const createTreasureRain = () => {
  const treasures = ['💰', '💎', '🪙', '💵', '💴', '💶', '💷', '💸', '🏆', '⭐', '✨']
  const treasureCount = 80
  const container = document.querySelector('.level-up-card')

  // Container für Treasures erstellen
  const treasureContainer = document.createElement('div')
  treasureContainer.className = 'treasure-container'
  container.appendChild(treasureContainer)

  for (let i = 0; i < treasureCount; i++) {
    setTimeout(() => {
      const treasure = document.createElement('div')
      treasure.className = 'treasure'
      treasure.textContent = treasures[Math.floor(Math.random() * treasures.length)]

      const startLeft = Math.random() * 100
      treasure.style.left = startLeft + '%'
      treasure.style.top = '-50px'
      treasure.style.fontSize = Math.random() * 15 + 20 + 'px'

      // Berechne finale Position (stapelt sich von unten nach oben)
      const cardHeight = container.offsetHeight
      const row = Math.floor(i / 8) // 8 Münzen pro Reihe
      const col = i % 8
      const finalBottom = row * 35 + Math.random() * 10 // Stapelt sich von unten
      const finalLeft = col * 12 + Math.random() * 8 - 16 // Verteilt horizontal

      const rotation = Math.random() * 60 - 30 // Leichte Rotation
      const duration = Math.random() * 0.5 + 1.5

      treasure.style.setProperty('--treasure-final-bottom', finalBottom + 'px')
      treasure.style.setProperty('--treasure-final-left', finalLeft + '%')
      treasure.style.setProperty('--treasure-rotation', rotation + 'deg')
      treasure.style.animation = `treasureFillUp ${duration}s ease-out forwards`

      treasureContainer.appendChild(treasure)
      // NICHT entfernen - bleibt sichtbar!
    }, i * 40)
  }
}

// Level Reset
const resetLevel = () => {
  currentLevel.value = 0
  gameCompleted.value = false

  // Level aus localStorage löschen
  saveLevel(0)

  // Entferne den treasure-container falls vorhanden
  const treasureContainer = document.querySelector('.treasure-container')
  if (treasureContainer) {
    treasureContainer.remove()
  }
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
onMounted(() => {
  // Level aus localStorage laden
  currentLevel.value = loadLevel()

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
  startTime: '16:00', // Platzhalter für Countdown
  endTime: '02:00',
  hotelName: '',
  hotelWebsite: '',
  address: '',
  description: 'Wir haben nicht nur 15 Jahre Ehe-Challenge gemeistert, sondern feiern auch einen weiteren Meilenstein!\n\nToni wurde 50, oder wie sie es ausdrückt: Sie steigt im Wert.\n\nJetzt kommt das Bonuslevel:\nParty! 🥳\n\nKommt und feiert mit uns, wenn wir zusammen weiterleveln – mit Musik, Spaß und ganz viel Konfetti! 🎊',
  dresscode: 'Nach Belieben - Hauptsache ihr fühlt euch wohl!',
  rsvpDeadline: '2026-05-01',
  rsvpEmail: 'tonjaschultz@gmail.com',
  rsvpPhone: '+49 173 8934144',
  program: [
    { time: '--:--', activity: 'Empfang' },
    { time: '--:--', activity: 'Abendessen' },
    { time: '--:--', activity: 'Party' }
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

// TODO: Später aktivieren wenn alle Details final sind
// Outlook Calendar - einmaliges Hinzufügen
// const addToOutlookCalendar = () => {
//   const event = partyDetails.value
//   const startDateTime = `${event.date}T${event.startTime}:00`
//   const endDate = event.endTime < event.startTime ? getNextDay(event.date) : event.date
//   const endDateTime = `${endDate}T${event.endTime}:00`
//
//   const url = new URL('https://outlook.live.com/calendar/0/deeplink/compose')
//   url.searchParams.append('subject', event.title)
//   url.searchParams.append('startdt', startDateTime)
//   url.searchParams.append('enddt', endDateTime)
//   url.searchParams.append('body', event.description)
//   url.searchParams.append('location', `${event.hotelName}, ${event.address}`)
//   url.searchParams.append('path', '/calendar/action/compose')
//   url.searchParams.append('rru', 'addevent')
//
//   window.open(url.toString(), '_blank')
// }

// TODO: Später aktivieren wenn alle Details final sind
// Apple Calendar - .ics Download
// const downloadCalendar = () => {
//   const event = partyDetails.value
//   const startDateTime = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`
//   const endDate = event.endTime < event.startTime ? getNextDay(event.date) : event.date
//   const endDateTime = `${endDate.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`
//
//   const escapedTitle = escapeICalText(event.title)
//   const escapedDescription = escapeICalText(event.description)
//   const escapedLocation = escapeICalText(`${event.hotelName}, ${event.address}`)
//
//   const icsContent = `BEGIN:VCALENDAR
// VERSION:2.0
// PRODID:-//Party Invitation//NONSGML v1.0//EN
// CALSCALE:GREGORIAN
// METHOD:PUBLISH
// BEGIN:VEVENT
// DTSTART:${startDateTime}
// DTEND:${endDateTime}
// SUMMARY:${escapedTitle}
// DESCRIPTION:${escapedDescription}
// LOCATION:${escapedLocation}
// STATUS:CONFIRMED
// SEQUENCE:0
// BEGIN:VALARM
// TRIGGER:-P1D
// ACTION:DISPLAY
// DESCRIPTION:Reminder: ${escapedTitle} morgen!
// END:VALARM
// END:VEVENT
// END:VCALENDAR`
//
//   const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
//   const link = document.createElement('a')
//   link.href = URL.createObjectURL(blob)
//   link.download = 'party-einladung.ics'
//   document.body.appendChild(link)
//   link.click()
//   document.body.removeChild(link)
// }

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

// Submit Score (Placeholder für Datenbank-Integration)
const submitScore = () => {
  if (!playerName.value.trim()) {
    alert('Bitte gib einen Namen ein!')
    return
  }

  // Hier später Datenbank-Integration
  alert(`Glückwunsch ${playerName.value}! Dein Score (Level ${currentLevel.value}) wurde eingetragen!`)
  createConfetti()
}

// Konfetti-Animation (Regenfall von oben)
const createConfetti = () => {
  const colors = ['#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#00d2d3']
  const emojis = ['🍬', '🍭', '🍫', '🍦', '🍰', '🍺', '🍻', '🍷', '🥂', '🎂', '🎁', '✨', '🎈', '🎊']
  const confettiCount = 40
  const container = document.querySelector('.party-page')

  for (let i = 0; i < confettiCount; i++) {
    const confetti = document.createElement('div')
    confetti.className = 'confetti'

    // Von oben starten, über die gesamte Breite verteilt (wie Regenfall)
    const startLeft = Math.random() * 70 + 10 // 0-100%
    confetti.style.left = startLeft + '%'
    confetti.style.top = '-50px' // Etwas außerhalb des Viewports starten

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
    const horizontalDistance = Math.random() * 20 - 10 // -100 bis 100px (leichtes Schwingen)
    const verticalDistance = Math.random() * 300 + window.innerHeight + 2200 // Bis über den Viewport hinaus
    const duration = Math.random() * 2 + 4 // 4-6 Sekunden

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
<!--          <div class="calendar-time">{{ partyDetails.startTime }} - {{ partyDetails.endTime }} Uhr</div>-->

	        <div class="save-the-date-badge">SAVE THE DATE</div>
          <!-- Countdown -->
<!--          <div class="countdown" v-if="countdown.days > 0 || countdown.hours > 0 || countdown.minutes > 0">-->
<!--            <div class="countdown-item">-->
<!--              <span class="countdown-value">{{ countdown.days }}</span>-->
<!--              <span class="countdown-label">Tage</span>-->
<!--            </div>-->
<!--            <div class="countdown-item">-->
<!--              <span class="countdown-value">{{ String(countdown.hours).padStart(2, '0') }}</span>-->
<!--              <span class="countdown-label">Stunden</span>-->
<!--            </div>-->
<!--            <div class="countdown-item">-->
<!--              <span class="countdown-value">{{ String(countdown.minutes).padStart(2, '0') }}</span>-->
<!--              <span class="countdown-label">Minuten</span>-->
<!--            </div>-->
<!--          </div>-->
        </div>
      </section>

      <!-- Description Card -->
      <section class="info-card">
        <div class="card-content">
          <p class="description">{{ partyDetails.description }}</p>
        </div>
      </section>


	    <!-- Level-Up Clicker Game Card -->
	    <section class="info-card level-up-card">
		    <div class="card-content">
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
		    </div>
	    </section>

	    <!-- Highscore Card - nur sichtbar ab Level 100 -->
	    <section v-if="currentLevel >= 100" class="info-card highscore-card">
		    <div class="card-header">
			    <h2>Highscore</h2>
		    </div>
		    <div class="card-content">
			    <!-- Namenseingabe -->
			    <div class="name-input-section">
				    <h4 class="congratulations-text">Trage deinen Namen ein und werde Teil der Highscore-Liste:</h4>
				    <div class="name-input-wrapper">
					    <input
						    v-model="playerName"
						    type="text"
						    placeholder="Dein Name..."
						    class="name-input"
						    maxlength="20"
					    />
					    <button class="btn submit-btn" @click="submitScore">
						    Eintragen
					    </button>
				    </div>
			    </div>

			    <!-- Top 10 Highscore Liste -->
			    <div class="highscore-list">
				    <div
					    v-for="entry in dummyHighscores"
					    :key="entry.rank"
					    class="highscore-entry"
					    :class="{ 'top-3': entry.rank <= 3 }"
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
	    </section>

	    <!-- Location Card -->
	    <section class="info-card">
		    <div class="card-header">
			    <h2>Ort</h2>
		    </div>
		    <div class="card-content">
			    <div class="placeholder-badge">📍 Ort wird bekannt gegeben</div>
<!--			    <h3 class="hotel-name">{{ partyDetails.hotelName }}</h3>-->
<!--			    <p class="address">{{ partyDetails.address }}</p>-->
<!--			    <p class="hotel-link">-->
<!--				    <a :href="partyDetails.hotelWebsite" target="_blank" rel="noopener noreferrer">-->
<!--					    {{ partyDetails.hotelWebsite }}-->
<!--				    </a>-->
<!--			    </p>-->

			    <!-- Google Maps iframe -->
<!--			    <div class="maps-container">-->
<!--				    <iframe-->
<!--					    :src="getGoogleMapsEmbedLink(partyDetails.address)"-->
<!--					    class="maps-iframe"-->
<!--					    allowfullscreen-->
<!--					    loading="lazy"-->
<!--					    referrerpolicy="no-referrer-when-downgrade"-->
<!--				    ></iframe>-->
<!--			    </div>-->
		    </div>
	    </section>

      <!-- Program Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Programm</h2>
        </div>
        <div class="card-content">
          <div class="placeholder-badge">🗓️ Programm folgt</div>
<!--          <div class="program-list">-->
<!--            <div-->
<!--              v-for="(item, index) in partyDetails.program"-->
<!--              :key="index"-->
<!--              class="program-item"-->
<!--            >-->
<!--              <span class="program-time">{{ item.time }}</span>-->
<!--              <span class="program-activity">{{ item.activity }}</span>-->
<!--            </div>-->
<!--          </div>-->
        </div>
      </section>

      <!-- Dresscode Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Dresscode</h2>
        </div>
        <div class="card-content">
          <div class="placeholder-badge">👔 Details folgen</div>
<!--          <p class="dresscode">{{ partyDetails.dresscode }}</p>-->
        </div>
      </section>

      <!-- Hotel Übernachtung Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Hotel Übernachtung</h2>
        </div>
        <div class="card-content">
          <div class="placeholder-badge">🏨 Infos folgen</div>
<!--          <p>Falls ihr eine Übernachtung im Hotel benötigt, meldet euch bitte bei uns.</p>-->
        </div>
      </section>

      <!-- RSVP Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Zusage</h2>
        </div>
        <div class="card-content">
          <div class="placeholder-badge">📬 Deadline folgt</div>
<!--          <p>Bitte sage bis zum <strong>{{ formatDate(partyDetails.rsvpDeadline) }}</strong> zu.</p>-->
        </div>
      </section>

      <!-- Calendar Subscribe Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Zum Kalender hinzufügen</h2>
        </div>
        <div class="card-content">
	        <div class="placeholder-badge">📅 Kalender Eintrag folgt</div>

          <!-- TODO: Später aktivieren wenn alle Details final sind -->
          <!-- <div class="calendar-buttons" style="margin-top: var(--space-4);">
            <button class="btn btn--calendar btn--outlook" @click="addToOutlookCalendar">
              Outlook
            </button>
            <button class="btn btn--calendar btn--apple" @click="downloadCalendar">
              Apple
            </button>
          </div> -->
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
    font-size: var(--font-size-lg);
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
  margin: 0;
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
  margin: var(--space-3) 0;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);

  @media (min-width: 768px) {
    font-size: 5rem;
  }
}

.calendar-weekday {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-medium);
  opacity: 0.95;
  margin-bottom: var(--space-2);
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
    opacity: 1;
    transform: scale(1.1) rotate(180deg);
  }
  100% {
    top: auto;
    bottom: var(--treasure-final-bottom, 0px);
    left: var(--treasure-final-left, 50%);
    opacity: 1;
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
  margin: 0 0 var(--space-2);
  color: white;
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
	width: 140px;

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
  padding: var(--space-2) var(--space-3);
  margin-bottom: var(--space-1);
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--border-radius-md);
  transition: all 0.3s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateX(4px);
  }

  &.top-3 {
    background: linear-gradient(135deg, rgba(255, 215, 0, 0.6), rgba(255, 140, 0, 0.6));
    border: 2px solid rgba(255, 215, 0, 0.5);
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

@media (max-width: 768px) {
  .party-title {
    font-size: var(--font-size-2xl);
  }

  .party-date {
    font-size: var(--font-size-lg);
  }

  .program-item {
    flex-direction: column;
    gap: var(--space-1);
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