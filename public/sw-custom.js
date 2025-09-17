import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { clientsClaim, skipWaiting } from 'workbox-core'

// Vite-Plugin-PWA Manifest wird hier injiziert
precacheAndRoute(self.__WB_MANIFEST)

// Service Worker sofort aktivieren
skipWaiting()
clientsClaim()

// Alte Caches bereinigen
cleanupOutdatedCaches()

console.log('🔧 Hawk3 Custom Service Worker activated')

// Badge API Support
const BADGE_STORAGE_KEY = 'hawk3_badge_count'

// Badge setzen
async function setBadgeInSW(count) {
  try {
    if ('setAppBadge' in self) {
      if (count > 0) {
        await self.setAppBadge(count)
        console.log(`🔔 SW: Badge set to ${count}`)
      } else {
        await self.clearAppBadge()
        console.log('🔔 SW: Badge cleared')
      }

      // Badge Count für späteren Abruf speichern
      await self.caches.open('badge-storage').then(cache => {
        cache.put(BADGE_STORAGE_KEY, new Response(count.toString()))
      })

      return true
    } else {
      console.log('🔔 SW: Badge API not supported')
      return false
    }
  } catch (error) {
    console.error('🔔 SW: Badge error:', error)
    return false
  }
}

// Badge Count laden
async function getBadgeCount() {
  try {
    const cache = await self.caches.open('badge-storage')
    const response = await cache.match(BADGE_STORAGE_KEY)

    if (response) {
      const count = parseInt(await response.text()) || 0
      console.log(`🔔 SW: Loaded badge count: ${count}`)
      return count
    }

    return 0
  } catch (error) {
    console.error('🔔 SW: Error loading badge count:', error)
    return 0
  }
}

// Message Handler für Badge Updates
self.addEventListener('message', async (event) => {
  console.log('🔧 SW: Received message:', event.data)

  const { type, count, clientId } = event.data || {}

  switch (type) {
    case 'SET_BADGE':
      const success = await setBadgeInSW(count)

      // Response an Client senden
      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'BADGE_RESPONSE',
          success,
          count
        })
      }

      // An alle Clients broadcasten
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({
          type: 'BADGE_UPDATED',
          count,
          success
        })
      })
      break

    case 'GET_BADGE':
      const currentCount = await getBadgeCount()

      if (event.ports && event.ports[0]) {
        event.ports[0].postMessage({
          type: 'BADGE_RESPONSE',
          count: currentCount
        })
      }
      break

    case 'SKIP_WAITING':
      self.skipWaiting()
      break

    default:
      console.log('🔧 SW: Unknown message type:', type)
  }
})

// Service Worker Aktivierung
self.addEventListener('activate', async (event) => {
  console.log('🔧 SW: Activated')

  event.waitUntil((async () => {
    try {
      // Badge beim Start wiederherstellen
      const savedCount = await getBadgeCount()
      if (savedCount > 0) {
        await setBadgeInSW(savedCount)
        console.log(`🔔 SW: Restored badge count: ${savedCount}`)
      }

      // Clients übernehmen
      await self.clients.claim()

    } catch (error) {
      console.error('🔧 SW: Activation error:', error)
    }
  })())
})

// Notification Action Handler
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 SW: Notification clicked:', event.action)

  event.notification.close()

  if (event.action === 'claim') {
    // App öffnen und zu Daily Reward navigieren
    event.waitUntil(
        clients.openWindow('/?action=daily-reward')
    )
  } else if (event.action === 'later') {
    // Badge behalten, keine weitere Action
    console.log('🔔 SW: User chose to claim later')
  } else {
    // Default click - App öffnen
    event.waitUntil(
        clients.openWindow('/')
    )
  }
})

// Install Event
self.addEventListener('install', (event) => {
  console.log('🔧 SW: Installing...')

  event.waitUntil((async () => {
    // Service Worker Installation
    console.log('🔧 SW: Installation complete')
  })())
})

// Periodic Badge Sync (falls unterstützt)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'daily-badge-check') {
    event.waitUntil(checkDailyRewards())
  }
})

// Daily Rewards Check
async function checkDailyRewards() {
  try {
    // Hier könntest du localStorage-ähnliche Daten aus Cache lesen
    // und Daily Reward Status prüfen
    console.log('🔔 SW: Checking daily rewards...')

    // Beispiel: Badge auf 1 setzen wenn Daily Reward verfügbar
    const now = new Date()
    const lastClaimed = await getLastDailyRewardDate()

    if (!lastClaimed || isNewDay(lastClaimed, now)) {
      await setBadgeInSW(1)
      console.log('🔔 SW: Daily reward available - badge set!')
    }

  } catch (error) {
    console.error('🔔 SW: Daily reward check error:', error)
  }
}

// Helper Functions
async function getLastDailyRewardDate() {
  try {
    const cache = await self.caches.open('daily-storage')
    const response = await cache.match('last-daily-reward')

    if (response) {
      return new Date(await response.text())
    }

    return null
  } catch (error) {
    console.error('SW: Error getting last daily reward date:', error)
    return null
  }
}

function isNewDay(lastDate, currentDate) {
  const last = new Date(lastDate).toDateString()
  const current = new Date(currentDate).toDateString()
  return last !== current
}

// Error Handler
self.addEventListener('error', (event) => {
  console.error('🔧 SW: Global error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('🔧 SW: Unhandled promise rejection:', event.reason)
})