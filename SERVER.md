# Server Setup & Deployment für www.haukeschultz.com

## Übersicht

Die Highscore-Funktionalität wurde von localStorage auf ein Server-Backend umgestellt:
- **Development:** Node.js + Express (lokal)
- **Production:** PHP + JSON (auf Strato Shared Hosting)

---

## 🎯 Für Strato Shared Hosting (Production)

Da Strato Shared Hosting keinen SSH-Zugriff bietet, verwenden wir **PHP statt Node.js**.

### Was du hochladen musst

```
www.haukeschultz.com/
├── index.html              # Frontend (aus dist/)
├── assets/                 # Frontend Assets (aus dist/)
└── api/                    # Backend (PHP)
    ├── highscores.php      # API-Script
    ├── .htaccess          # CORS-Konfiguration
    └── highscores.json    # Datenbank (wird automatisch erstellt)
```

### Schritt-für-Schritt Deployment

#### 1. Frontend bauen

```bash
npm run build
```

Dies erstellt den `/dist` Ordner mit allen optimierten Dateien.

#### 2. Per FileZilla hochladen

**A) API-Ordner hochladen:**
- Lokal: `api/highscores.php` und `api/.htaccess`
- Server: `www.haukeschultz.com/api/`

**B) Frontend hochladen:**
- Lokal: Alles aus `dist/`
- Server: `www.haukeschultz.com/` (Hauptverzeichnis)

#### 3. Rechte setzen

In FileZilla:
- Rechtsklick auf `api/` Ordner → Dateiattribute → `755`
- Falls `highscores.json` existiert → Dateiattribute → `666`

#### 4. Testen

- **API:** https://www.haukeschultz.com/api/highscores.php
- **Website:** https://www.haukeschultz.com

---

## 💻 Lokal entwickeln (Development)

Für die lokale Entwicklung nutzen wir **Node.js** (einfacher zum Testen).

### Option 1: Node.js Backend (empfohlen)

```bash
# Terminal 1 - Backend starten:
cd server
npm install  # nur beim ersten Mal
npm run dev

# Terminal 2 - Frontend starten:
npm run dev
```

- Backend läuft auf: `http://localhost:3000`
- Frontend läuft auf: `http://localhost:5173`

### Option 2: PHP Backend lokal testen

```bash
# Terminal 1 - PHP Server:
cd api
php -S localhost:8000

# Terminal 2 - Frontend:
npm run dev
```

Dann in `PartyInfo.vue` temporär ändern:
```javascript
const API_BASE_URL = 'http://localhost:8000'
```

---

## 📁 Projekt-Struktur

```
hawk3web/
├── api/                    # PHP Backend (für Production)
│   ├── highscores.php     # REST API
│   ├── .htaccess          # CORS Headers
│   └── highscores.json    # Datenspeicher
│
├── server/                 # Node.js Backend (nur für Development)
│   ├── server.js          # Express Server
│   ├── package.json
│   └── highscores.json    # Datenspeicher
│
├── src/                    # Frontend
│   └── party/
│       └── PartyInfo.vue  # Nutzt automatisch richtige API
│
├── dist/                   # Gebautes Frontend (nach npm run build)
│
└── SERVER.md              # Diese Datei
```

---

## 🔄 API-Erkennung (automatisch)

Das Frontend erkennt automatisch die richtige API:

**Development** (`npm run dev`):
- URL: `http://localhost:3000/api/highscores`
- Backend: Node.js Express

**Production** (gebaut mit `npm run build`):
- URL: `https://www.haukeschultz.com/api/highscores.php`
- Backend: PHP

Konfiguriert in `PartyInfo.vue`:
```javascript
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV
    ? 'http://localhost:3000'        // Development
    : window.location.origin          // Production
)
const API_ENDPOINT = import.meta.env.DEV
  ? '/api/highscores'                 // Node.js
  : '/api/highscores.php'             // PHP
```

---

## 🔧 API-Endpunkte

### GET /api/highscores(.php)
Lädt Top 10 Highscores

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

### POST /api/highscores(.php)
Speichert neuen Highscore

**Request:**
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

---

## 🔄 Updates deployen

### Nur Frontend geändert:
```bash
npm run build
```
Dann `dist/` Inhalt per FileZilla hochladen (überschreibe alte Dateien)

### Nur API geändert:
Lade `api/highscores.php` per FileZilla hoch

### Beides geändert:
Mache beides

---

## 💾 Backup

**Wichtig:** Sichere regelmäßig die Highscore-Daten!

Per FileZilla herunterladen:
- `/api/highscores.json`

Speichere lokale Kopien mit Datum:
```
backups/
├── highscores_20251030.json
├── highscores_20251101.json
└── ...
```

---

## 🐛 Troubleshooting

### API gibt 500 Fehler

**Lösung:**
1. Prüfe Dateirechte in FileZilla:
   - `api/` Ordner: 755
   - `highscores.php`: 644
   - `highscores.json`: 666

2. Prüfe ob `.htaccess` hochgeladen wurde

### CORS-Fehler im Browser

**Symptom:** Fehlermeldung in Browser-Konsole (F12)

**Lösung:**
1. `.htaccess` neu hochladen
2. Browser-Cache leeren (Strg+F5)
3. Prüfe ob `.htaccess` korrekt ist:
   ```apache
   Header set Access-Control-Allow-Origin "https://www.haukeschultz.com"
   ```

### Highscores werden nicht gespeichert

**Lösung:**
1. Prüfe ob `highscores.json` existiert
2. Falls nicht: Erstelle sie manuell per FileZilla:
   - Rechtsklick im `api/` Ordner → "Datei erstellen"
   - Name: `highscores.json`
   - Inhalt: `[]`
   - Rechte: 666

### Lokal: "Failed to fetch"

**Lösung:**
1. Prüfe ob Backend läuft:
   ```bash
   cd server
   npm run dev
   ```
2. Prüfe URL in Browser: http://localhost:3000/api/highscores

---

## 🚀 Production Checklist

Vor dem Hochladen:

- [ ] `npm run build` ausgeführt
- [ ] `dist/` Ordner existiert
- [ ] API-Ordner vorbereitet (`api/highscores.php` + `.htaccess`)
- [ ] FileZilla FTP-Verbindung funktioniert
- [ ] Alte Dateien auf Server gesichert (falls vorhanden)

Nach dem Hochladen:

- [ ] API-Test: https://www.haukeschultz.com/api/highscores.php
- [ ] Frontend-Test: https://www.haukeschultz.com
- [ ] Highscore-Funktion testen (Name eintragen + senden)
- [ ] Browser-Konsole prüfen (F12 → Console, keine Fehler)
- [ ] Verschiedene Browser testen (Chrome, Firefox, Safari)

---

## 📊 Unterschiede: Node.js vs. PHP

| Feature | Node.js (Development) | PHP (Production/Strato) |
|---------|----------------------|------------------------|
| **Installation** | SSH nötig (npm install) | Keine Installation nötig |
| **Endpoint** | `/api/highscores` | `/api/highscores.php` |
| **Server** | Express.js | Apache (auf Strato) |
| **Datei** | `server/server.js` | `api/highscores.php` |
| **CORS** | Im Code (cors package) | Via `.htaccess` |
| **Reload** | `--watch` Flag | Automatisch (Apache) |
| **Logs** | Console/PM2 | Apache Error Log |

---

## 📞 Support

Bei Problemen:
1. Prüfe Browser-Konsole (F12 → Console)
2. Prüfe API direkt im Browser: `https://www.haukeschultz.com/api/highscores.php`
3. Prüfe Dateirechte in FileZilla
4. Prüfe Apache Error Logs (bei Strato im Control Panel)

---

## 🎯 Wichtige URLs

- **Website:** https://www.haukeschultz.com
- **API:** https://www.haukeschultz.com/api/highscores.php
- **Party-Seite:** https://www.haukeschultz.com/#/party
- **Strato FTP:** ftp.haukeschultz.com (Port 21)

---

**Erstellt:** 2025-10-30
**Projekt:** hawk3web - Party Einladung mit Highscore
**Backend:** PHP + JSON (Production) / Node.js + Express (Development)