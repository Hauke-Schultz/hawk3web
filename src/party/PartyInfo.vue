<script setup>
import { ref } from 'vue'
import Icon from '../components/Icon.vue'

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
  rsvpDeadline: '2026-06-01',
  rsvpEmail: 'party@beispiel.de',
  rsvpPhone: '+49 123 456789',
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

// Kalendereintrag Download-Funktion
const downloadCalendar = () => {
  const event = partyDetails.value

  // Start und End Datum/Zeit formatieren
  const startDateTime = `${event.date.replace(/-/g, '')}T${event.startTime.replace(':', '')}00`

  // End-Datum berechnen (falls über Mitternacht)
  const endDate = event.endTime < event.startTime
    ? getNextDay(event.date)
    : event.date
  const endDateTime = `${endDate.replace(/-/g, '')}T${event.endTime.replace(':', '')}00`

  // Texte für iCal escapen
  const escapedTitle = escapeICalText(event.title)
  const escapedDescription = escapeICalText(event.description)
  const escapedLocation = escapeICalText(`${event.hotelName}, ${event.address}`)

  // iCal Format erstellen
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

  // Download als .ics Datei
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

// Google Maps Link erstellen
const getGoogleMapsLink = (address) => {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
}
</script>

<template>
  <div class="party-page">
    <!-- Hero Section -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="party-title">{{ partyDetails.title }}</h1>
        <p class="party-date">{{ formatDate(partyDetails.date) }}</p>
      </div>
    </section>

    <!-- Main Content -->
    <main class="party-main">

      <!-- Description Card -->
      <section class="info-card">
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
			    <p class="hotel-link">
				    <a :href="getGoogleMapsLink(partyDetails.address)" target="_blank" rel="noopener noreferrer">
					    📍 In Google Maps öffnen
				    </a>
			    </p>
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

      <!-- Calendar Download Button -->
      <section class="calendar-section">
        <button class="btn btn--primary btn--large" @click="downloadCalendar">
          Kalender Eintrag herunterladen
        </button>
      </section>
    </main>
  </div>
</template>

<style lang="scss" scoped>
.party-page {
  min-height: 100vh;
  background: var(--bg-primary);
}

.hero-section {
  background: linear-gradient(135deg, var(--primary-color), var(--success-color));
  padding: var(--space-8) var(--space-4);
  text-align: center;
  color: white;
}

.hero-content {
  max-width: 800px;
  margin: 0 auto;
}

.party-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: var(--space-4) 0 var(--space-2);
  color: white;
}

.party-date {
  font-size: var(--font-size-xl);
  margin: var(--space-2) 0;
  font-weight: var(--font-weight-medium);
}

.party-time {
  font-size: var(--font-size-lg);
  opacity: 0.9;
}

.party-main {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
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

.calendar-section {
  text-align: center;
  padding: var(--space-4) 0;
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