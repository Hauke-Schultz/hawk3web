<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import Icon from '../components/Icon.vue'

// Bilder für Slider
const images = [
  new URL('./img/party-01.png', import.meta.url).href,
  new URL('./img/party-02.png', import.meta.url).href,
  new URL('./img/party-03.png', import.meta.url).href
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

// Seitentitel und Favicon setzen
const setPageMetadata = () => {
  // Titel setzen
  document.title = 'Toni & Hauke Ehe-Challenge Party 2026'

  // Favicon setzen (SVG Party-Icon)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="45" fill="#ff6b6b"/>
      <text x="50" y="65" font-size="50" text-anchor="middle" fill="white">🎉</text>
    </svg>
  `
  const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link')
  favicon.type = 'image/svg+xml'
  favicon.rel = 'shortcut icon'
  favicon.href = `data:image/svg+xml,${encodeURIComponent(svg)}`

  // Altes Favicon entfernen und neues hinzufügen
  const oldFavicon = document.querySelector("link[rel*='icon']")
  if (oldFavicon) {
    oldFavicon.remove()
  }
  document.getElementsByTagName('head')[0].appendChild(favicon)
}

// Beim Laden der Seite
onMounted(() => {
  setPageMetadata()
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
  // Optional: Titel zurücksetzen
  document.title = 'Hawk3'
})

// Party Details - Hier kannst du die Daten anpassen
const partyDetails = ref({
  title: 'Toni & Hauke Ehe-Challenge Party',
  date: '2026-07-04', // Format: YYYY-MM-DD
  startTime: '16:00',
  endTime: '02:00',
  hotelName: 'Hotel Kramer´s Gasthof',
  hotelWebsite: 'https://www.hotel-kramers-gasthof.de/',
  address: 'Dorfstraße 24, 25479 Ellerau, Deutschland',
  description: 'Wir haben nicht nur 15 Jahre Ehe-Challenge gemeistert, sondern feiern auch einen weiteren Meilenstein!\n\nToni wurde 50, oder wie sie es ausdrückt: Sie steigt im Wert.\n\nJetzt kommt das Bonuslevel: Party! 🥳\nKommt und feiert mit uns, wenn wir zusammen weiterleveln – mit Musik, Spaß und ganz viel Konfetti! 🎊',
  dresscode: 'Nach Belieben - Hauptsache ihr fühlt euch wohl!',
  rsvpDeadline: '2026-05-01',
  rsvpEmail: 'tonjaschultz@gmail.com',
  rsvpPhone: '+49 173 8934144',
  program: [
    { time: '16:00', activity: 'Empfang' },
    { time: '18:00', activity: 'Abendessen' },
    { time: '20:00', activity: 'Party' }
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

// Google Calendar Link
const addToGoogleCalendar = () => {
  const event = partyDetails.value
  const startDateTime = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`
  const endDate = event.endTime < event.startTime ? getNextDay(event.date) : event.date
  const endDateTime = `${endDate.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`

  const url = new URL('https://calendar.google.com/calendar/render')
  url.searchParams.append('action', 'TEMPLATE')
  url.searchParams.append('text', event.title)
  url.searchParams.append('dates', `${startDateTime}/${endDateTime}`)
  url.searchParams.append('details', event.description)
  url.searchParams.append('location', `${event.hotelName}, ${event.address}`)

  window.open(url.toString(), '_blank')
}

// Outlook Calendar Link
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

// .ics Datei Download (Fallback)
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
          <div class="calendar-time">{{ partyDetails.startTime }} - {{ partyDetails.endTime }} Uhr</div>

          <!-- Countdown -->
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

      <!-- Description Card -->
      <section class="info-card">
	      <div class="card-header">
		      <h2>Über die Veranstaltung</h2>
	      </div>
        <div class="card-content">
          <p class="description">{{ partyDetails.description }}</p>
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
      </section>

      <!-- Dresscode Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Dresscode</h2>
        </div>
        <div class="card-content">
          <p class="dresscode">{{ partyDetails.dresscode }}</p>
        </div>
      </section>

      <!-- Hotel Übernachtung Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Hotel Übernachtung</h2>
        </div>
        <div class="card-content">
          <p>Falls ihr eine Übernachtung im Hotel benötigt, meldet euch bitte bei uns.</p>
        </div>
      </section>

      <!-- RSVP Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Zusage</h2>
        </div>
        <div class="card-content">
          <p>Bitte sage bis zum <strong>{{ formatDate(partyDetails.rsvpDeadline) }}</strong> zu.</p>
        </div>
      </section>

      <!-- Calendar Download Card -->
      <section class="info-card">
        <div class="card-header">
          <h2>Zum Kalender hinzufügen</h2>
        </div>
        <div class="card-content calendar-buttons">
          <button class="btn btn--calendar btn--google" @click="addToGoogleCalendar">
            Google
          </button>
          <button class="btn btn--calendar btn--outlook" @click="addToOutlookCalendar">
            Outlook
          </button>
          <button class="btn btn--calendar btn--apple" @click="downloadCalendar">
            Apple
          </button>
        </div>
      </section>

      <!-- Bilder Slider Card -->
      <section class="info-card">
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
.container {
	width: 100%;
}

.party-page {
  min-height: 100vh;
  background: var(--bg-primary);
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
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
    margin: var(--space-2) 0;
    line-height: 1.6;
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
  height: 250px;
  overflow: hidden;
  border-radius: var(--border-radius-lg);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;

  @media (min-width: 768px) {
    height: 200px;
  }

  @media (min-width: 1024px) {
    height: 180px;
  }
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
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-2xl);
  cursor: pointer;
  transition: all 0.3s ease;
  border-radius: var(--border-radius-md);
  z-index: 10;

  &:hover {
    background: rgba(0, 0, 0, 0.8);
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
}
</style>