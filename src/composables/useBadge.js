import { ref } from 'vue'

export function useBadge() {
  const badgeSupported = ref('setAppBadge' in navigator)

  // Badge setzen
  const setBadge = async (count) => {
    if (!badgeSupported.value) {
      console.log('🔔 Badge API not supported')
      return false
    }

    try {
      if (count > 0) {
        await navigator.setAppBadge(count)
        console.log(`🔔 Badge set to: ${count}`)
      } else {
        await navigator.clearAppBadge()
        console.log('🔔 Badge cleared')
      }
      return true
    } catch (error) {
      console.error('🔔 Badge API error:', error)
      return false
    }
  }

  // Badge löschen
  const clearBadge = async () => {
    return await setBadge(0)
  }

  return {
    badgeSupported,
    setBadge,
    clearBadge
  }
}