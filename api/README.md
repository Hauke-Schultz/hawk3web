# API Documentation

Diese APIs werden für die Hawk3 Gaming Platform verwendet.

## Authentifizierung & Spielerdaten-Synchronisation

### auth.php - Benutzer Authentifizierung

#### Registrierung
```
POST /api/auth.php?action=register
Content-Type: application/json

{
  "username": "testuser",
  "password": "geheim123"
}
```

Response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "username": "testuser"
}
```

#### Login
```
POST /api/auth.php?action=login
Content-Type: application/json

{
  "username": "testuser",
  "password": "geheim123"
}
```

Response:
```json
{
  "success": true,
  "message": "Login successful",
  "username": "testuser",
  "createdAt": "2024-01-15T10:30:00+00:00",
  "lastLogin": "2024-01-15T12:45:00+00:00"
}
```

### gamedata.php - Spielerdaten Synchronisation

#### Daten speichern
```
POST /api/gamedata.php?action=save
Content-Type: application/json

{
  "username": "testuser",
  "password": "geheim123",
  "gameData": {
    "player": {
      "name": "Player",
      "level": 5,
      "coins": 1000,
      "diamonds": 50
    },
    "games": { ... },
    "achievements": [ ... ]
  }
}
```

Response:
```json
{
  "success": true,
  "message": "Game data saved successfully",
  "lastSaved": "2024-01-15T12:50:00+00:00"
}
```

#### Daten laden
```
POST /api/gamedata.php?action=load
Content-Type: application/json

{
  "username": "testuser",
  "password": "geheim123"
}
```

Response:
```json
{
  "success": true,
  "message": "Game data loaded successfully",
  "gameData": {
    "player": { ... },
    "games": { ... },
    "achievements": [ ... ]
  },
  "lastSaved": "2024-01-15T12:50:00+00:00"
}
```

## Sicherheit

- Passwörter werden mit SHA-256 gehasht gespeichert
- Alle API-Anfragen benötigen Authentifizierung (username + password)
- CORS ist auf haukeschultz.com beschränkt
- Benutzernamen werden case-insensitive gespeichert

## Datenspeicherung

Die APIs verwenden JSON-Dateien:
- `users.json` - Benutzer-Accounts
- `gamedata.json` - Spielerdaten pro Benutzer

Diese Dateien werden automatisch erstellt, wenn sie nicht existieren.

## Entwicklung vs. Produktion

Das Frontend erkennt automatisch die Umgebung:

**Lokal (localhost):**
- Verwendet Node.js Server auf Port 3000
- Endpoints: `/api/auth/register`, `/api/auth/login`, etc.

**Produktion (haukeschultz.com):**
- Verwendet PHP APIs
- Endpoints: `/api/auth.php?action=register`, `/api/gamedata.php?action=save`, etc.
