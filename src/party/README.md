# Party Einladung

## Roadmap: Gäste-Zusage-System (RSVP)

### Übersicht
Integration eines RSVP-Systems (Répondez s'il vous plaît / Zusage-System), damit Gäste ihre Teilnahme bestätigen und zusätzliche Informationen angeben können.

### Phase 1: Datenmodell & API-Endpunkte
**Benötigte Datenstruktur:**
```javascript
{
  guestId: string (UUID),
  name: string,
  numberOfGuests: number,
  comingByCar: boolean,
  needsParking: boolean,
  needsHotelRoom: boolean,
  status: 'pending' | 'accepted' | 'declined',
  lastUpdated: timestamp,
  partyId: string (für spätere Multi-Party-Unterstützung)
}
```

**API-Endpunkte:**
- `POST /api/rsvp.php` - Neue Zusage speichern/aktualisieren
- `GET /api/rsvp.php?partyId=xyz` - Alle Zusagen für Gastgeber laden
- `GET /api/rsvp.php?guestId=xyz` - Eigene Zusage laden

### Phase 2: Gäste-Ansicht (auf PartyInfo.vue)
**Neue Kachel "Zusage" erstellen:**
- Position: Nach der "Bist du dabei?"-Kachel (aktuell Zeile 1062-1071)
- Formular mit folgenden Feldern:
  - Name (Input, max 50 Zeichen)
  - Anzahl Personen (Number Input, 1-10)
  - Mit Auto? (Checkbox)
  - Parkplatz benötigt? (Checkbox, nur sichtbar wenn "Mit Auto")
  - Hotelzimmer benötigt? (Checkbox)
  - Status: Zusagen / Absagen (Radio Buttons)
- Anzeige: "Zuletzt geändert: [Datum]"
- LocalStorage: guestId speichern wie bei playerId
- Visuelles Feedback nach Speichern (Konfetti bei Zusage!)

### Phase 3: Gastgeber-Ansicht
**Neue Route & Komponente:**
- `src/party/PartyRSVPAdmin.vue` - Admin-Übersicht
- Route: `/party/rsvp-admin` (mit Passwort-Schutz oder Query-Parameter)

**Features:**
- Tabelle mit allen Gästen
- Filteroptionen:
  - Nur Zusagen / Nur Absagen
  - Braucht Parkplatz
  - Braucht Hotelzimmer
- Statistiken:
  - Gesamt-Zusagen
  - Gesamt-Personen
  - Parkplätze benötigt
  - Hotelzimmer benötigt
- Export als CSV/Excel
- Echtzeit-Updates (optional)

### Phase 4: Backend-Implementierung
**Datei:** `public/api/rsvp.php`
- SQLite oder JSON-Datei als Speicher (analog zu highscores.php)
- Validierung der Eingaben
- Rate Limiting gegen Spam
- Optional: Email-Benachrichtigung an Gastgeber bei neuer Zusage

### Phase 5: Styling & UX
- Konsistentes Design mit bestehenden info-cards
- Responsive für Mobile/Tablet/Desktop
- Ladeanimationen
- Error-Handling & User-Feedback
- Formular-Validierung

### Phase 6: Testing & Deployment
- Test aller RSVP-Flows
- Admin-Ansicht testen
- Mobile-Tests
- Performance-Tests bei vielen Gästen

---

**Technische Details:**
- Wiederverwendung der bestehenden API-Struktur (wie bei Highscores)
- localStorage für guestId (analog zu playerId)
- Refs & Composables für State-Management
- Konfetti-Animation bei Zusage nutzen (bereits vorhanden!)