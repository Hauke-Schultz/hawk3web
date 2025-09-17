import { ref, onMounted } from 'vue'

export function useServiceWorker() {
  const swRegistration = ref(null)
  const swSupported = ref('serviceWorker' in navigator)
  const messageChannel = ref(null)

  // Message Channel für bidirektionale Kommunikation
  const createMessageChannel = () => {
    if ('MessageChannel' in window) {
      messageChannel.value = new MessageChannel()

      // Response Handler
      messageChannel.value.port1.onmessage = (event) => {
        console.log('🔧 Response from SW:', event.data)
      }
    }
  }

  // Service Worker Message mit Response
  const sendMessageToSW = async (message) => {
    if (!swRegistration.value || !swSupported.value) {
      console.log('🔧 Service Worker not available')
      return false
    }

    try {
      if (messageChannel.value) {
        // Mit MessageChannel für Response
        swRegistration.value.active.postMessage(message, [messageChannel.value.port2])
        return true
      } else {
        // Normale Message ohne Response
        swRegistration.value.active.postMessage(message)
        return true
      }
    } catch (error) {
      console.error('🔧 Service Worker message error:', error)
      return false
    }
  }

  // Badge an Service Worker senden
  const syncBadgeToSW = async (count) => {
    return await sendMessageToSW({
      type: 'SET_BADGE',
      count: count,
      timestamp: Date.now()
    })
  }

  // Service Worker Setup
  onMounted(async () => {
    if (!swSupported.value) {
      console.log('🔧 Service Worker not supported')
      return
    }

    try {
      // Message Channel erstellen
      createMessageChannel()

      // Service Worker Registration
      const registration = await navigator.serviceWorker.ready
      swRegistration.value = registration
      console.log('🔧 Service Worker ready:', registration)

      // Service Worker Messages empfangen
      navigator.serviceWorker.addEventListener('message', (event) => {
        console.log('🔧 Message from SW:', event.data)

        // Badge Update Events verarbeiten
        if (event.data.type === 'BADGE_UPDATED') {
          console.log(`🔔 Badge updated by SW: ${event.data.count}`)
        }
      })

      // Service Worker Updates
      registration.addEventListener('updatefound', () => {
        console.log('🔧 Service Worker update found')
      })

    } catch (error) {
      console.error('🔧 Service Worker setup error:', error)
    }
  })

  return {
    swRegistration,
    swSupported,
    sendMessageToSW,
    syncBadgeToSW
  }
}