// Server Sync Composable - Zentrale Synchronisations-Logik
import { ref, watch } from 'vue'
import { apiService } from '../services/apiService.js'

const serverAuth = ref({
  isLoggedIn: false,
  username: '',
  password: '',
  lastSynced: null,
  syncStatus: 'idle', // idle, syncing, success, error
  syncError: null
})

// Flag um Doppel-Synchronisation zu vermeiden
let isSyncing = false
let syncTimeout = null

export function useServerSync() {
  // Load saved credentials from localStorage (if any)
  function loadAuthFromStorage() {
    const savedAuth = localStorage.getItem('hawk3_server_auth')
    if (savedAuth) {
      try {
        const auth = JSON.parse(savedAuth)
        serverAuth.value.username = auth.username || ''
        serverAuth.value.password = auth.password || ''
        if (auth.username && auth.password) {
          serverAuth.value.isLoggedIn = true
          return true
        }
      } catch (error) {
        console.error('Error loading saved auth:', error)
      }
    }
    return false
  }

  // Save credentials to localStorage
  function saveAuthToStorage() {
    if (serverAuth.value.username && serverAuth.value.password) {
      localStorage.setItem('hawk3_server_auth', JSON.stringify({
        username: serverAuth.value.username,
        password: serverAuth.value.password
      }))
      // Also save username separately for easy access
      localStorage.setItem('hawk3_current_username', serverAuth.value.username)
    }
  }

  // Login
  async function login(username, password) {
    try {
      const response = await apiService.login(username, password)

      if (response.success) {
        serverAuth.value.isLoggedIn = true
        serverAuth.value.username = username
        serverAuth.value.password = password
        saveAuthToStorage()
        return { success: true }
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Register
  async function register(username, password) {
    try {
      await apiService.register(username, password)
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  // Logout
  function logout() {
    serverAuth.value.isLoggedIn = false
    serverAuth.value.username = ''
    serverAuth.value.password = ''
    serverAuth.value.lastSynced = null
    localStorage.removeItem('hawk3_server_auth')
    localStorage.removeItem('hawk3_current_username')
  }

  // Save to server (with debounce)
  async function saveToServer(gameDataExportFn, immediate = false) {
    if (!serverAuth.value.isLoggedIn) {
      console.log('Not logged in, skipping sync')
      return
    }

    // Clear existing timeout if not immediate
    if (!immediate && syncTimeout) {
      clearTimeout(syncTimeout)
    }

    // If immediate sync or no timeout, sync now
    const doSync = async () => {
      if (isSyncing) {
        console.log('Already syncing, skipping...')
        return
      }

      isSyncing = true
      serverAuth.value.syncStatus = 'syncing'
      serverAuth.value.syncError = null

      try {
        const data = JSON.parse(gameDataExportFn())
        const response = await apiService.saveGameData(
          serverAuth.value.username,
          serverAuth.value.password,
          data
        )

        if (response.success) {
          serverAuth.value.syncStatus = 'success'
          serverAuth.value.lastSynced = response.lastSaved
          console.log('✅ Data synced to server')

          // Reset to idle after 2 seconds
          setTimeout(() => {
            serverAuth.value.syncStatus = 'idle'
          }, 2000)
        }
      } catch (error) {
        serverAuth.value.syncStatus = 'error'
        serverAuth.value.syncError = error.message
        console.error('❌ Error saving to server:', error)
      } finally {
        isSyncing = false
      }
    }

    if (immediate) {
      await doSync()
    } else {
      // Debounce: wait 500ms before syncing
      syncTimeout = setTimeout(doSync, 500)
    }
  }

  // Load from server
  async function loadFromServer(gameDataImportFn) {
    if (!serverAuth.value.isLoggedIn) return

    serverAuth.value.syncStatus = 'syncing'
    serverAuth.value.syncError = null

    try {
      const response = await apiService.loadGameData(
        serverAuth.value.username,
        serverAuth.value.password
      )

      if (response.success && response.gameData) {
        // Import the game data
        const imported = gameDataImportFn(JSON.stringify(response.gameData))
        if (imported) {
          serverAuth.value.syncStatus = 'success'
          serverAuth.value.lastSynced = response.lastSaved
          console.log('📂 Data loaded from server')

          setTimeout(() => {
            serverAuth.value.syncStatus = 'idle'
          }, 2000)
        }
      } else {
        // No data on server, save current data
        console.log('No data on server, will save on next change')
      }
    } catch (error) {
      serverAuth.value.syncStatus = 'error'
      serverAuth.value.syncError = error.message
      console.error('Error loading from server:', error)
    }
  }

  return {
    serverAuth,
    loadAuthFromStorage,
    saveAuthToStorage,
    login,
    register,
    logout,
    saveToServer,
    loadFromServer
  }
}
