export function useLocalNotifications() {
  const notificationSupported = ref('Notification' in window)
  const permission = ref(Notification.permission)

  // Permission anfragen
  const requestPermission = async () => {
    if (!notificationSupported.value) return false

    try {
      const result = await Notification.requestPermission()
      permission.value = result
      return result === 'granted'
    } catch (error) {
      console.error('Notification permission error:', error)
      return false
    }
  }

  // Sofortige lokale Notification
  const showNotification = (title, options = {}) => {
    if (permission.value !== 'granted') return false

    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options
    })

    // Auto-close nach 5 Sekunden
    setTimeout(() => notification.close(), 5000)

    return notification
  }

  // Daily Reward Reminder setzen
  const scheduleDailyReminder = () => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(9, 0, 0, 0) // 9 Uhr morgens

    const msUntilReminder = tomorrow.getTime() - now.getTime()

    setTimeout(() => {
      showNotification('🎁 Daily Reward Available!', {
        body: 'Your daily reward is ready to claim in Hawk3!',
        tag: 'daily-reward',
        requireInteraction: true
      })

      // Nächsten Tag planen
      scheduleDailyReminder()
    }, msUntilReminder)
  }

  return {
    notificationSupported,
    permission,
    requestPermission,
    showNotification,
    scheduleDailyReminder
  }
}