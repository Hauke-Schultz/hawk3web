<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

// Router instance
const router = useRouter()

// State
const rsvps = ref([])
const loading = ref(true)
const error = ref(null)
const searchQuery = ref('')
const statusFilter = ref('all') // 'all', 'accepted', 'declined', 'pending'
const sortBy = ref('name') // 'name', 'date', 'status', 'guests'
const sortOrder = ref('asc') // 'asc', 'desc'

// Edit Modal State
const showEditModal = ref(false)
const editingRSVP = ref(null)

// Password Protection State
const isAuthenticated = ref(false)
const showPasswordModal = ref(true)
const passwordInput = ref('')
const passwordError = ref('')
const ADMIN_PASSWORD = 'ZombieBrain6' // Passwort hier ändern

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? '' : 'https://haukeschultz.com'
)

/**
 * Lade alle RSVPs von der API
 */
const loadAllRSVPs = async () => {
  try {
    loading.value = true
    error.value = null

    // GET /api/rsvp ohne guestId Parameter gibt alle RSVPs zurück
    const rsvpEndpoint = import.meta.env.DEV ? '/api/rsvp' : '/api/rsvp.php'
    const response = await fetch(`${API_BASE_URL}${rsvpEndpoint}`)

    if (!response.ok) {
      throw new Error('Failed to load RSVPs')
    }

    const data = await response.json()
    rsvps.value = Array.isArray(data) ? data : []

  } catch (err) {
    console.error('Error loading RSVPs:', err)
    error.value = 'Fehler beim Laden der RSVPs. Bitte versuche es später erneut.'
    rsvps.value = []
  } finally {
    loading.value = false
  }
}

/**
 * Gefilterte und sortierte RSVPs
 */
const filteredRSVPs = computed(() => {
  let filtered = rsvps.value

  // Filter nach Status
  if (statusFilter.value !== 'all') {
    filtered = filtered.filter(rsvp => rsvp.status === statusFilter.value)
  }

  // Filter nach Suchbegriff
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase().trim()
    filtered = filtered.filter(rsvp =>
      rsvp.name.toLowerCase().includes(query)
    )
  }

  // Sortieren
  filtered = [...filtered].sort((a, b) => {
    let aVal, bVal

    switch (sortBy.value) {
      case 'name':
        aVal = a.name.toLowerCase()
        bVal = b.name.toLowerCase()
        break
      case 'date':
        aVal = new Date(a.lastUpdated || 0)
        bVal = new Date(b.lastUpdated || 0)
        break
      case 'status':
        aVal = a.status
        bVal = b.status
        break
      case 'guests':
        aVal = a.numberOfGuests || 0
        bVal = b.numberOfGuests || 0
        break
      default:
        return 0
    }

    if (sortOrder.value === 'asc') {
      return aVal > bVal ? 1 : aVal < bVal ? -1 : 0
    } else {
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0
    }
  })

  return filtered
})

/**
 * Statistiken berechnen
 */
const statistics = computed(() => {
  const total = rsvps.value.length
  const accepted = rsvps.value.filter(r => r.status === 'accepted').length
  const declined = rsvps.value.filter(r => r.status === 'declined').length
  const pending = rsvps.value.filter(r => r.status === 'pending').length

  const acceptedRSVPs = rsvps.value.filter(r => r.status === 'accepted')
  const totalGuests = acceptedRSVPs.reduce((sum, r) => sum + (r.numberOfGuests || 1), 0)
  const carsCount = acceptedRSVPs.filter(r => r.comingByCar).length
  const parkingCount = acceptedRSVPs.filter(r => r.needsParking).length
  const hotelCount = acceptedRSVPs
    .filter(r => r.needsHotelRoom)
    .reduce((sum, r) => sum + (r.numberOfRooms || 1), 0)

  // Essensvorlieben zählen (nur akzeptierte RSVPs)
  const foodStandard = acceptedRSVPs.filter(r => r.foodPreference === 'standard').length
  const foodVegetarian = acceptedRSVPs.filter(r => r.foodPreference === 'vegetarisch').length
  const foodVegan = acceptedRSVPs.filter(r => r.foodPreference === 'vegan').length
  const foodAllergies = acceptedRSVPs.filter(r => r.foodPreference === 'allergien').length

  return {
    total,
    accepted,
    declined,
    pending,
    totalGuests,
    carsCount,
    parkingCount,
    hotelCount,
    foodStandard,
    foodVegetarian,
    foodVegan,
    foodAllergies
  }
})

/**
 * Modal-Titel (abhängig davon, ob es ein neuer oder bearbeiteter Gast ist)
 */
const modalTitle = computed(() => {
  if (!editingRSVP.value) return 'RSVP bearbeiten'
  // Prüfe ob es ein neuer Gast ist (kein lastUpdated)
  return editingRSVP.value.lastUpdated ? 'RSVP bearbeiten' : 'Neuen Gast hinzufügen'
})

/**
 * Status-Badge-Klasse
 */
const getStatusClass = (status) => {
  switch (status) {
    case 'accepted': return 'status-accepted'
    case 'declined': return 'status-declined'
    case 'pending': return 'status-pending'
    default: return ''
  }
}

/**
 * Status-Text
 */
const getStatusText = (status) => {
  switch (status) {
    case 'accepted': return 'Zugesagt'
    case 'declined': return 'Abgesagt'
    case 'pending': return 'Ausstehend'
    default: return status
  }
}

/**
 * Datum formatieren
 */
const formatDate = (dateString) => {
  if (!dateString) return 'Nie'

  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (e) {
    return 'Ungültig'
  }
}

/**
 * Sortierung ändern
 */
const changeSort = (field) => {
  if (sortBy.value === field) {
    // Toggle sort order
    sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = field
    sortOrder.value = 'asc'
  }
}

/**
 * Export zu CSV
 */
const exportToCSV = () => {
  if (rsvps.value.length === 0) {
    return
  }

  // CSV Header
  const headers = [
    'Name',
    'Status',
    'Anzahl Personen',
    'Mit Auto',
    'Parkplatz benötigt',
    'Hotelzimmer benötigt',
    'Essensvorlieben',
    'Bemerkungen',
    'Letzte Aktualisierung'
  ]

  // CSV Rows
  const rows = rsvps.value.map(rsvp => [
    rsvp.name,
    getStatusText(rsvp.status),
    rsvp.numberOfGuests || 1,
    rsvp.comingByCar ? 'Ja' : 'Nein',
    rsvp.needsParking ? 'Ja' : 'Nein',
    rsvp.needsHotelRoom ? 'Ja' : 'Nein',
    rsvp.foodPreference || '',
    rsvp.remarks || '',
    formatDate(rsvp.lastUpdated)
  ])

  // CSV String erstellen
  const csvContent = [
    headers.join(';'),
    ...rows.map(row => row.join(';'))
  ].join('\n')

  // BOM für Excel hinzufügen (damit Umlaute korrekt angezeigt werden)
  const BOM = '\uFEFF'
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })

  // Download starten
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `party-rsvp-${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Refresh-Funktion
 */
const refresh = () => {
  loadAllRSVPs()
}

/**
 * Zurück zur Party-Seite
 */
const goBackToParty = () => {
  router.push('/party')
}

/**
 * UUID Generator (v4)
 */
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

/**
 * Neuen Gast hinzufügen
 */
const addNewGuest = () => {
  editingRSVP.value = {
    guestId: generateUUID(),
    name: '',
    status: 'pending',
    numberOfGuests: 1,
    comingByCar: false,
    needsParking: false,
    needsHotelRoom: false,
    numberOfRooms: 1,
    foodPreference: '',
    remarks: ''
  }
  showEditModal.value = true
}

/**
 * RSVP bearbeiten
 */
const editRSVP = (rsvp) => {
  editingRSVP.value = {
    ...rsvp,
    // Sicherstellen, dass numberOfRooms immer gesetzt ist
    numberOfRooms: rsvp.numberOfRooms || 1
  }
  showEditModal.value = true
}

/**
 * Bearbeitetes RSVP speichern
 */
const saveEdit = async () => {
  if (!editingRSVP.value) return

  try {
    const rsvpEndpoint = import.meta.env.DEV ? '/api/rsvp' : '/api/rsvp.php'
    const response = await fetch(`${API_BASE_URL}${rsvpEndpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(editingRSVP.value)
    })

    if (!response.ok) {
      throw new Error('Failed to save RSVP')
    }

    // Reload data
    await loadAllRSVPs()

    // Close modal
    showEditModal.value = false
    editingRSVP.value = null
  } catch (err) {
    console.error('Error saving RSVP:', err)
  }
}

/**
 * Edit-Modal schließen
 */
const cancelEdit = () => {
  showEditModal.value = false
  editingRSVP.value = null
}

/**
 * Personalisierten Link kopieren
 */
const copyGuestLink = async (rsvp) => {
  const link = `${window.location.origin}/party?guestId=${rsvp.guestId}`

  try {
    await navigator.clipboard.writeText(link)
  } catch (err) {
    console.error('Error copying link:', err)
    // Fallback für ältere Browser
    const textarea = document.createElement('textarea')
    textarea.value = link
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    try {
      document.execCommand('copy')
    } catch (fallbackErr) {
    }
    document.body.removeChild(textarea)
  }
}

/**
 * RSVP löschen
 */
const deleteRSVP = async (rsvp) => {
  if (!confirm(`Möchtest du das RSVP von "${rsvp.name}" wirklich löschen?`)) {
    return
  }

  try {
    const rsvpEndpoint = import.meta.env.DEV ? '/api/rsvp' : '/api/rsvp.php'
    const response = await fetch(`${API_BASE_URL}${rsvpEndpoint}?guestId=${rsvp.guestId}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      throw new Error('Failed to delete RSVP')
    }

    // Reload data
    await loadAllRSVPs()
  } catch (err) {
    console.error('Error deleting RSVP:', err)
  }
}

/**
 * Passwort überprüfen
 */
const checkPassword = () => {
  if (passwordInput.value === ADMIN_PASSWORD) {
    isAuthenticated.value = true
    showPasswordModal.value = false
    passwordError.value = ''
    // Passwort in Session speichern
    sessionStorage.setItem('partyAdminAuth', 'true')
    // RSVPs laden
    loadAllRSVPs()
  } else {
    passwordError.value = 'Falsches Passwort. Bitte versuche es erneut.'
    passwordInput.value = ''
  }
}

/**
 * Logout-Funktion
 */
const logout = () => {
  isAuthenticated.value = false
  showPasswordModal.value = true
  passwordInput.value = ''
  passwordError.value = ''
  sessionStorage.removeItem('partyAdminAuth')
  rsvps.value = []
}

// Initiales Laden
onMounted(() => {
  // Prüfen, ob bereits authentifiziert
  const isAuth = sessionStorage.getItem('partyAdminAuth') === 'true'
  if (isAuth) {
    isAuthenticated.value = true
    showPasswordModal.value = false
    loadAllRSVPs()
  }
})
</script>

<template>
  <div class="admin-container">
    <!-- Password Modal -->
    <div v-if="showPasswordModal" class="modal-overlay password-modal">
      <div class="modal-content password-content" @click.stop>
        <h2 class="modal-title">🔒 Admin Bereich</h2>
        <p class="password-description">Bitte gib das Admin-Passwort ein:</p>

        <form @submit.prevent="checkPassword" class="password-form">
          <div class="form-group">
            <input
              v-model="passwordInput"
              type="password"
              class="form-input password-input"
              placeholder="Passwort eingeben..."
              autofocus
            />
          </div>

          <div v-if="passwordError" class="password-error">
            {{ passwordError }}
          </div>

          <div class="modal-actions">
            <button @click="goBackToParty" type="button" class="btn btn--secondary">
              Abbrechen
            </button>
            <button type="submit" class="btn btn--primary">
              Anmelden
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Main Content (nur wenn authentifiziert) -->
    <template v-if="isAuthenticated">
      <!-- Header -->
      <header class="admin-header">
        <button @click="goBackToParty" class="btn btn--secondary back-btn">
          ← Zurück zur Party
        </button>
        <h1 class="admin-title">Party Verwaltung</h1>
        <button @click="addNewGuest" class="btn btn--success add-btn">
          ➕ Gast hinzufügen
        </button>
        <button @click="refresh" class="btn btn--primary refresh-btn" :disabled="loading">
          🔄 Aktualisieren
        </button>
      </header>

    <!-- Loading State -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>Lade Liste...</p>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button @click="refresh" class="btn btn--primary">Erneut versuchen</button>
    </div>

    <!-- Main Content -->
    <div v-else class="admin-content">
      <!-- Statistics Cards -->
      <section class="statistics">
        <div class="stat-card stat-card--total">
          <div class="stat-icon">📊</div>
          <div class="stat-content">
            <div class="stat-label">Gesamt</div>
            <div class="stat-value">{{ statistics.total }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--accepted">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-label">Zugesagt</div>
            <div class="stat-value">{{ statistics.accepted }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--declined">
          <div class="stat-icon">❌</div>
          <div class="stat-content">
            <div class="stat-label">Abgesagt</div>
            <div class="stat-value">{{ statistics.declined }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--pending">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-label">Ausstehend</div>
            <div class="stat-value">{{ statistics.pending }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--guests">
          <div class="stat-icon">👥</div>
          <div class="stat-content">
            <div class="stat-label">Gäste</div>
            <div class="stat-value">{{ statistics.totalGuests }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--cars">
          <div class="stat-icon">🚗</div>
          <div class="stat-content">
            <div class="stat-label">Autos</div>
            <div class="stat-value">{{ statistics.carsCount }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--parking">
          <div class="stat-icon">🅿️</div>
          <div class="stat-content">
            <div class="stat-label">Parkplätze</div>
            <div class="stat-value">{{ statistics.parkingCount }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--hotel">
          <div class="stat-icon">🛏️</div>
          <div class="stat-content">
            <div class="stat-label">Zimmer</div>
            <div class="stat-value">{{ statistics.hotelCount }}</div>
          </div>
        </div>

        <div class="stat-card stat-card--foot">
          <div class="stat-icon">🍽️</div>
          <div class="stat-content">
            <div class="stat-label">Standard: <strong>{{ statistics.foodStandard }}</strong></div>
            <div class="stat-label">Vegetarisch: <strong>{{ statistics.foodVegetarian }}</strong></div>
            <div class="stat-label">Vegan: <strong>{{ statistics.foodVegan }}</strong></div>
            <div class="stat-label">Allergien: <strong>{{ statistics.foodAllergies }}</strong></div>
          </div>
        </div>
      </section>

      <!-- Filters and Search -->
      <section class="filters">
        <div class="filter-group">
          <label>Suche:</label>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Name suchen..."
            class="search-input"
          />
        </div>

        <div class="filter-group">
          <label>Status:</label>
          <select v-model="statusFilter" class="filter-select">
            <option value="all">Alle</option>
            <option value="accepted">Zugesagt</option>
            <option value="declined">Abgesagt</option>
            <option value="pending">Ausstehend</option>
          </select>
        </div>

        <button @click="exportToCSV" class="btn btn--success export-btn">
          📥 CSV Export
        </button>
      </section>

      <!-- RSVP Table -->
      <section class="rsvp-table-container">
        <div v-if="filteredRSVPs.length === 0" class="empty-state">
          <p>Keine Liste gefunden</p>
        </div>

        <table v-else class="rsvp-table">
          <thead>
            <tr>
              <th @click="changeSort('name')" class="sortable">
                Name
                <span v-if="sortBy === 'name'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="changeSort('status')" class="sortable">
                Status
                <span v-if="sortBy === 'status'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th @click="changeSort('guests')" class="sortable" title="Anzahl Personen">
                👥
                <span v-if="sortBy === 'guests'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th title="Mit Auto">🚗</th>
              <th title="Parkplatz benötigt">🅿️</th>
              <th title="Hotelzimmer benötigt">🏨</th>
              <th title="Anzahl Zimmer">🛏️</th>
              <th title="Essensvorlieben">🍽️</th>
              <th title="Bemerkungen">💬</th>
              <th @click="changeSort('date')" class="sortable" title="Letzte Aktualisierung">
                🕐
                <span v-if="sortBy === 'date'" class="sort-indicator">
                  {{ sortOrder === 'asc' ? '↑' : '↓' }}
                </span>
              </th>
              <th title="Aktionen">⚙️</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rsvp in filteredRSVPs" :key="rsvp.guestId" class="rsvp-row">
              <td class="name-cell">{{ rsvp.name }}</td>
              <td>
                <span class="status-badge" :class="getStatusClass(rsvp.status)">
                  {{ getStatusText(rsvp.status) }}
                </span>
              </td>
              <td class="center-cell">{{ rsvp.numberOfGuests || 1 }}</td>
              <td class="center-cell">{{ rsvp.comingByCar ? '✅' : '—' }}</td>
              <td class="center-cell">{{ rsvp.needsParking ? '✅' : '—' }}</td>
              <td class="center-cell">{{ rsvp.needsHotelRoom ? '✅' : '—' }}</td>
              <td class="center-cell">{{ rsvp.needsHotelRoom ? (rsvp.numberOfRooms || 1) : '—' }}</td>
              <td class="center-cell">{{ rsvp.foodPreference || '—' }}</td>
              <td class="remarks-cell">{{ rsvp.remarks || '—' }}</td>
              <td class="date-cell">{{ formatDate(rsvp.lastUpdated) }}</td>
              <td class="actions-cell">
                <button @click="copyGuestLink(rsvp)" class="action-btn copy-btn" title="Link kopieren">
                  🔗
                </button>
                <button @click="editRSVP(rsvp)" class="action-btn edit-btn" title="Bearbeiten">
                  ✏️
                </button>
                <button @click="deleteRSVP(rsvp)" class="action-btn delete-btn" title="Löschen">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <!-- Footer Info -->
      <footer class="admin-footer">
        <p>Zeige {{ filteredRSVPs.length }} von {{ rsvps.length }} Einträge</p>
      </footer>
    </div>

    <!-- Edit Modal -->
    <div v-if="showEditModal && editingRSVP" class="modal-overlay" @click="cancelEdit">
      <div class="modal-content" @click.stop>
        <h2 class="modal-title">{{ modalTitle }}</h2>

        <div class="form-group">
          <label>Name</label>
          <input v-model="editingRSVP.name" type="text" class="form-input" />
        </div>

        <div class="form-group">
          <label>Status</label>
          <select v-model="editingRSVP.status" class="form-select">
            <option value="pending">Ausstehend</option>
            <option value="accepted">Zugesagt</option>
            <option value="declined">Abgesagt</option>
          </select>
        </div>

        <div class="form-group">
          <label>Anzahl Personen</label>
          <input v-model.number="editingRSVP.numberOfGuests" type="number" min="1" class="form-input" />
        </div>

        <div class="form-group">
          <label>
            <input v-model="editingRSVP.comingByCar" type="checkbox" class="form-checkbox" />
            Mit Auto
          </label>
        </div>

        <div class="form-group">
          <label>
            <input v-model="editingRSVP.needsParking" type="checkbox" class="form-checkbox" />
            Parkplatz benötigt
          </label>
        </div>

        <div class="form-group">
          <label>
            <input v-model="editingRSVP.needsHotelRoom" type="checkbox" class="form-checkbox" />
            Hotelzimmer benötigt
          </label>
        </div>

        <div v-if="editingRSVP.needsHotelRoom" class="form-group">
          <label>Anzahl Zimmer</label>
          <input v-model.number="editingRSVP.numberOfRooms" type="number" min="1" class="form-input" />
        </div>

        <div class="form-group">
          <label>Essensvorlieben</label>
          <select v-model="editingRSVP.foodPreference" class="form-select">
	          <option value="">Bitte auswählen...</option>
	          <option value="standard">Ich esse alles</option>
	          <option value="vegetarisch">Ich esse vegetarisch</option>
	          <option value="vegan">Ich esse vegan</option>
	          <option value="allergien">Ich habe Allergien oder Unverträglichkeiten</option>
          </select>
        </div>

        <div class="form-group">
          <label>Bemerkungen</label>
          <textarea v-model="editingRSVP.remarks" class="form-textarea" rows="3"></textarea>
        </div>

        <div class="modal-actions">
          <button @click="cancelEdit" class="btn btn--secondary">Abbrechen</button>
          <button @click="saveEdit" class="btn btn--primary">Speichern</button>
        </div>
      </div>
    </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
.admin-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  padding: var(--space-6);
  color: white;
	width: 100vw;
	max-width: 1200px;
}

.admin-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  gap: var(--space-4);
  flex-wrap: wrap;
}

.admin-title {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  margin: 0;
  flex: 1;
  text-align: center;
}

.back-btn,
.refresh-btn {
  flex-shrink: 0;
}

.btn {
  padding: var(--space-3) var(--space-5);
  border-radius: var(--border-radius-lg);
  border: none;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn--secondary {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
}

.btn--success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: var(--space-4);
}

.spinner {
  width: 50px;
  height: 50px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.admin-content {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.statistics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
}

.stat-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius-xl);
  padding: var(--space-3);
  display: flex;
  align-items: center;
	justify-content: space-between;
  gap: var(--space-2);
  border: 2px solid rgba(255, 255, 255, 0.2);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
    border-color: rgba(255, 255, 255, 0.4);
  }

	&--foot {
		min-width: 200px;

		.stat-label {
			text-transform: inherit;
			display: flex;
			justify-content: space-between;
			width: 100%;
		}

		.stat-content {
			align-items: flex-start;
			gap: 0;
		}
	}
}

.stat-icon {
  font-size: var(--font-size-xl);
  line-height: 1;
}

.stat-content {
  display: flex;
	flex-direction: column;
	width: 100%;
	justify-content: center;
	align-items: center;

	gap: var(--space-1);
}

.stat-label {
  font-size: var(--font-size-base);
  opacity: 0.8;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
}

.filters {
  display: flex;
  gap: var(--space-2);
  flex-wrap: wrap;
  align-items: flex-end;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: var(--space-3);
  border-radius: var(--border-radius-xl);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex: 1;
  min-width: 200px;

  label {
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.8;
  }
}

.search-input,
.filter-select {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-lg);
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;

  &::placeholder {
    color: rgba(255, 255, 255, 0.6);
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.2);
  }
}

.filter-select {
  option {
    background: #1e3a8a;
    color: white;
  }
}

.export-btn {
  align-self: flex-end;
}

.rsvp-table-container {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: var(--border-radius-xl);
  border: 2px solid rgba(255, 255, 255, 0.2);
  overflow-x: auto;
}

.empty-state {
  text-align: center;
  padding: var(--space-8);
  font-size: var(--font-size-lg);
  opacity: 0.7;
}

.rsvp-table {
  width: 100%;
  border-collapse: collapse;

  thead {
    background: rgba(255, 255, 255, 0.1);

    th {
      padding: var(--space-2);
      text-align: left;
      font-weight: var(--font-weight-bold);
      font-size: var(--font-size-sm);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 2px solid rgba(255, 255, 255, 0.3);

      &.sortable {
        cursor: pointer;
        user-select: none;
        transition: all 0.2s ease;

        &:hover {
          background: rgba(255, 255, 255, 0.15);
        }
      }
    }
  }

  tbody {
    tr {
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      transition: all 0.2s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }

    td {
      padding: var(--space-2);
	    vertical-align: baseline;
    }
  }
}

.sort-indicator {
  margin-left: var(--space-2);
  font-size: var(--font-size-sm);
}

.name-cell {
  font-weight: var(--font-weight-medium);
  min-width: 150px;
  width: 20%;
}

.center-cell {
  text-align: center;
  white-space: nowrap;
}

.date-cell {
  font-size: var(--font-size-sm);
  opacity: 0.8;
  white-space: nowrap;
}

.remarks-cell {
  min-width: 200px;
  width: 25%;
  max-width: 400px;
  font-size: var(--font-size-xs);
  line-height: 1.4;
  white-space: pre-wrap;
  word-break: break-word;
}

.status-badge {
  display: inline-block;
  padding: var(--space-1) var(--space-3);
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.status-accepted {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.status-declined {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.status-pending {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

.actions-cell {
  text-align: center;
  white-space: nowrap;
}

.action-btn {
  padding: var(--space-1);
  margin: 0 var(--space-1);
  border: none;
  background: rgba(255, 255, 255, 0.15);
  color: white;
  border-radius: var(--border-radius-md);
  cursor: pointer;
  font-size: var(--font-size-lg);
  transition: all 0.2s ease;

  &:hover {
    transform: scale(1.1);
    background: rgba(255, 255, 255, 0.25);
  }

  &.copy-btn:hover {
    background: rgba(16, 185, 129, 0.3);
  }

  &.edit-btn:hover {
    background: rgba(102, 126, 234, 0.3);
  }

  &.delete-btn:hover {
    background: rgba(239, 68, 68, 0.3);
  }
}

.admin-footer {
  text-align: center;
  padding: var(--space-4);
  opacity: 0.7;
  font-size: var(--font-size-sm);
}

// Modal Styles
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--space-4);
}

.modal-content {
  background: linear-gradient(135deg, #1e3a8a 0%, #312e81 100%);
  border-radius: var(--border-radius-xl);
  padding: var(--space-6);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  border: 2px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  margin: 0 0 var(--space-6) 0;
  color: white;
}

.form-group {
  margin-bottom: var(--space-4);

  label {
    display: block;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    opacity: 0.9;
    margin-bottom: var(--space-2);
  }
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-lg);
  border: 2px solid rgba(255, 255, 255, 0.3);
  background: rgba(255, 255, 255, 0.15);
  color: white;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 0.2);
  }
}

.form-select {
  option {
    background: #1e3a8a;
    color: white;
  }
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-checkbox {
  margin-right: var(--space-2);
  width: auto;
}

.modal-actions {
  display: flex;
  gap: var(--space-4);
  margin-top: var(--space-6);

  .btn {
    flex: 1;
  }
}

// Password Modal Styles
.password-modal {
  z-index: 2000;
}

.password-content {
  max-width: 450px;
  text-align: center;
}

.password-description {
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: var(--space-6);
  font-size: var(--font-size-base);
}

.password-form {
  width: 100%;
}

.password-error {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  padding: var(--space-3);
  border-radius: var(--border-radius-md);
  margin-top: var(--space-4);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
}

.logout-btn {
  flex-shrink: 0;
}
</style>