# Hawk3Web Backend Server

Einfacher Express.js Backend-Server für die Highscore-Verwaltung der Party-Website.

## Features

- REST API für Highscores
- JSON-Datei als Datenbank (keine MySQL erforderlich!)
- CORS-Unterstützung
- Automatische Highscore-Sortierung
- Top 10 Tracking

## Installation

```bash
cd server
npm install
```

## Verwendung

### Entwicklung (mit Auto-Reload)

```bash
npm run dev
```

### Production

```bash
npm start
```

Der Server läuft auf `http://localhost:3000`

## API Endpunkte

### GET /api/highscores
Lädt alle Highscores (Top 10)

**Response:**
```json
[
  {
    "rank": 1,
    "playerId": "uuid",
    "name": "MaxPower",
    "level": 300,
    "date": "2025-10-20"
  }
]
```

### POST /api/highscores
Sendet einen neuen Highscore

**Request Body:**
```json
{
  "playerId": "uuid",
  "name": "PlayerName",
  "level": 150,
  "date": "2025-10-31"
}
```

**Response:**
```json
{
  "message": "Highscore saved successfully",
  "rank": 3,
  "highscores": [...]
}
```

### GET /api/health
Health Check Endpunkt

## Daten

Highscores werden in `highscores.json` gespeichert. Diese Datei wird automatisch erstellt, wenn sie nicht existiert.

## Konfiguration

Der Server kann über Umgebungsvariablen konfiguriert werden:

- `PORT`: Server-Port (Standard: 3000)

## Deployment

Für Production solltest du:
1. Die `highscores.json` Datei sichern
2. Den Server hinter einem Reverse Proxy (nginx) laufen lassen
3. HTTPS aktivieren