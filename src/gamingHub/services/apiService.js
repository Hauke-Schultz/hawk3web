// API Service for server communication

class ApiService {
  constructor() {
    // Detect environment at runtime (not build time)
    this.isProduction = this.detectProduction()
    this.baseUrl = this.getBaseUrl()
    this.apiType = this.isProduction ? 'php' : 'node'
    console.log(`API Service initialized: ${this.apiType} mode, base URL: ${this.baseUrl}`)
  }

  detectProduction() {
    if (typeof window === 'undefined') return false
    const hostname = window.location.hostname
    return hostname === 'haukeschultz.com' || hostname === 'www.haukeschultz.com'
  }

  getBaseUrl() {
    if (this.isProduction) {
      return 'https://haukeschultz.com/api'
    }
    return import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
  }

  // Helper method for making requests
  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Request failed')
      }

      return data
    } catch (error) {
      console.error('API Request Error:', error)
      throw error
    }
  }

  // Authentication endpoints
  async register(username, password) {
    if (this.apiType === 'php') {
      // PHP API uses action parameter
      return this.request('/auth.php?action=register', {
        method: 'POST',
        body: JSON.stringify({ username, password, action: 'register' })
      })
    } else {
      // Node.js API
      return this.request('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
    }
  }

  async login(username, password) {
    if (this.apiType === 'php') {
      // PHP API uses action parameter
      return this.request('/auth.php?action=login', {
        method: 'POST',
        body: JSON.stringify({ username, password, action: 'login' })
      })
    } else {
      // Node.js API
      return this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
    }
  }

  // Game data endpoints
  async saveGameData(username, password, gameData) {
    if (this.apiType === 'php') {
      // PHP API uses action parameter
      return this.request('/gamedata.php?action=save', {
        method: 'POST',
        body: JSON.stringify({ username, password, gameData, action: 'save' })
      })
    } else {
      // Node.js API
      return this.request('/gamedata/save', {
        method: 'POST',
        body: JSON.stringify({ username, password, gameData })
      })
    }
  }

  async loadGameData(username, password) {
    if (this.apiType === 'php') {
      // PHP API uses action parameter
      return this.request('/gamedata.php?action=load', {
        method: 'POST',
        body: JSON.stringify({ username, password, action: 'load' })
      })
    } else {
      // Node.js API
      return this.request('/gamedata/load', {
        method: 'POST',
        body: JSON.stringify({ username, password })
      })
    }
  }

  // Get all users with statistics
  async getUserStats() {
    if (this.apiType === 'php') {
      return this.request('/gamedata.php?action=users', {
        method: 'GET'
      })
    } else {
      return this.request('/gamedata/users', {
        method: 'GET'
      })
    }
  }

  // Health check (only for Node.js)
  async healthCheck() {
    if (this.apiType === 'node') {
      return this.request('/health')
    }
    return { status: 'ok', apiType: 'php' }
  }
}

// Export singleton instance
export const apiService = new ApiService()
