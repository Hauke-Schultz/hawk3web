# Tile System & Inventory Documentation

Das neue Tile-System für HawkDungeon ist vollständig erweiterbar und unterstützt verschiedene Tile-Typen mit unterschiedlichen Eigenschaften und Zuständen. Es ist auch mit einem Inventar-System integriert für Items wie Schlüssel.

## Übersicht

Das System besteht aus mehreren Komponenten:

1. **tileConfig.js** - Definiert alle Tile-Typen und ihre Eigenschaften
2. **useLevelLoader.js** - Lädt und verwaltet Level-Daten mit dem neuen Tile-System
3. **useTileInteractions.js** - Verwaltet Interaktionen mit Tiles (Türen öffnen mit Schlüsseln, etc.)
4. **useGameRenderer.js** - Rendert Tiles basierend auf ihrem Typ und Zustand
5. **useCollisions.js** - Verwaltet Item-Kollisionen (Schlüssel einsammeln, etc.)

## 1. Neue Tile-Typen hinzufügen

### Schritt 1: Sprite in spriteConfig.js definieren

```javascript
// In config/spriteConfig.js
dungeon: {
  floor: { width: 16, height: 16, x: 16, y: 64 },
  door: { width: 16, height: 16, x: 0, y: 48 },
  wall: { width: 16, height: 16, x: 32, y: 16 },
  water: { width: 16, height: 16, x: 48, y: 64 }, // NEU
  bridge: { width: 16, height: 16, x: 64, y: 64 } // NEU
}
```

### Schritt 2: Tile-Typ in tileConfig.js definieren

```javascript
// In config/tileConfig.js

export const tileConfig = {
  // Einfacher Tile (nur eine Eigenschaft)
  water: {
    sprite: 'water',
    walkable: false
  },

  // Begehbarer Tile
  bridge: {
    sprite: 'bridge',
    walkable: true
  },

  // Tile mit Zuständen
  trap: {
    hasState: true,
    defaultState: 'hidden',
    states: {
      hidden: {
        sprite: 'floor', // Sieht aus wie normaler Boden
        walkable: true
      },
      triggered: {
        sprite: 'trap_triggered', // Zeigt die ausgelöste Falle
        walkable: true
      }
    }
  }
}
```

### Schritt 3: Zeichen-Mapping hinzufügen

```javascript
// In config/tileConfig.js

export const tileCharacterMap = {
  '.': 'floor',
  'W': 'wall',
  'D': 'door',
  '~': 'water',   // NEU
  '=': 'bridge',  // NEU
  '^': 'trap',    // NEU
  // ...
}
```

## 2. Tiles in Level-Maps verwenden

```javascript
// In config/levelConfig.js

map: {
  tiles: [
    'WWWWWWWWWW',
    'W........W',
    'W..~~~...W',
    'W..~=~...W',  // = ist eine Brücke über Wasser
    'W..~~~...W',
    'W...D....W',  // D ist eine Tür
    'W...^....W',  // ^ ist eine Falle
    'WWWWWWWWWW'
  ]
}
```

## 3. Inventar-System

### Schlüssel im Inventar

Das Spiel hat jetzt ein Inventar-System (`gameState.inventory`), das Gegenstände wie Schlüssel speichert.

```javascript
// Inventar ist ein Array in gameState
gameState.inventory = [
  { type: 'key', name: 'key' },
  // weitere Items...
]

// Prüfen ob Spieler einen Schlüssel hat
const hasKey = tileInteractions.hasKey()

// Anzahl der Schlüssel im Inventar
const keyCount = gameState.inventory.filter(item => item.type === 'key').length
```

### Schlüssel in Truhen platzieren

```javascript
// In levelConfig.js
chests: [
  {
    x: 3,
    y: 2,
    items: [
      { type: 'key' },           // Schlüssel hinzufügen
      { type: 'health', count: 2 },
    ]
  }
]
```

## 4. Tile-Interaktionen mit Schlüsseln

### Türen öffnen/schließen (mit Schlüssel-Prüfung)

```javascript
// In deinem Game-Code
import { useTileInteractions } from './composables/useTileInteractions'

const tileInteractions = useTileInteractions(levelLoader, gameState)

// Tür an Position öffnen (benötigt Schlüssel, Schlüssel wird verbraucht)
const result = tileInteractions.openDoor(5, 3, true)
if (result.success) {
  console.log(result.message) // "🔑 Door unlocked and opened!"
} else {
  console.log(result.message) // "You need a key to open this door!"
}

// Tür ohne Schlüssel öffnen (z.B. für Boss-Phase)
tileInteractions.openDoor(5, 3, false)

// Tür togglen
tileInteractions.toggleDoor(5, 3, true) // requireKey = true

// Alle Türen im Level öffnen (ohne Schlüssel)
tileInteractions.openAllDoors(false)
```

### Interaktion mit Tile vor dem Spieler

```javascript
// Wenn Spieler 'E' drückt (benötigt Schlüssel für Türen)
const result = tileInteractions.autoInteract(knight.gridX, knight.gridY, knight.direction, true)

if (result.success) {
  console.log(result.message) // "🔑 Door unlocked and opened!" oder "You need a key to open this door!"
}

// In useHawkDungeon.js ist diese Funktion bereits als handleInteract() verfügbar
game.handleInteract()
```

## 5. Tile-Eigenschaften abfragen

```javascript
// Tile-Typ an Position abrufen
const tileType = levelLoader.getTileType(x, y)

// Aktuellen Zustand eines Tiles abrufen (für Tiles mit Zuständen)
const state = levelLoader.getTileState(x, y)

// Sprite das gerendert werden soll (berücksichtigt Zustand)
const sprite = levelLoader.getTileSpriteAt(x, y)

// Prüfen ob Position begehbar ist
const walkable = levelLoader.isWalkable(x, y)
```

## 6. Tile-Zustände ändern

```javascript
// Zustand eines Tiles ändern
levelLoader.setTileState(x, y, 'open')

// Beispiel: Falle auslösen
const tileType = levelLoader.getTileType(playerX, playerY)
if (tileType === 'trap') {
  levelLoader.setTileState(playerX, playerY, 'triggered')
  // Schaden zufügen, etc.
}
```

## 7. Erweiterte Beispiele

### Beispiel: Druckplatten-System

```javascript
// In tileConfig.js
pressurePlate: {
  hasState: true,
  defaultState: 'inactive',
  states: {
    inactive: {
      sprite: 'pressure_plate_off',
      walkable: true
    },
    active: {
      sprite: 'pressure_plate_on',
      walkable: true
    }
  }
}

// Im Game-Code
const checkPressurePlate = (x, y) => {
  const tileType = levelLoader.getTileType(x, y)
  if (tileType === 'pressurePlate') {
    const currentState = levelLoader.getTileState(x, y)
    if (currentState === 'inactive') {
      levelLoader.setTileState(x, y, 'active')
      // Tür öffnen oder Event auslösen
      tileInteractions.openDoor(doorX, doorY)
    }
  }
}
```

### Beispiel: Zeitlich begrenzte Effekte

```javascript
// Tür für 5 Sekunden öffnen
const openDoorTemporarily = (x, y, duration = 5000) => {
  tileInteractions.openDoor(x, y)

  setTimeout(() => {
    tileInteractions.closeDoor(x, y)
    console.log('Door closed automatically')
  }, duration)
}
```

## 8. Integration in useHawkDungeon.js

Das Tile-Interaction-System ist bereits in `useHawkDungeon.js` integriert:

```javascript
// Tür vor dem Spieler öffnen (z.B. bei 'E'-Taste)
const result = game.handleInteract()

// Alle Türen öffnen (z.B. bei Boss-Phase)
game.openAllDoors()

// Direkt auf das System zugreifen
game.tileInteractions.toggleDoor(x, y)
```

## 9. Verfügbare Tile-Typen und Items

### Tile-Typen

### Aktuell implementiert:
- **empty** - Leerer/void Bereich (nicht begehbar)
- **floor** - Normaler Boden (begehbar)
- **wall** - Wand (nicht begehbar)
- **door** - Tür mit Zuständen 'closed' (blockiert) und 'open' (begehbar)

### Kommentierte Beispiele für zukünftige Erweiterungen:
- **water** - Wasser (nicht begehbar)
- **bridge** - Brücke (begehbar)
- **trap** - Falle mit Zuständen 'hidden' und 'triggered'

### Verfügbare Items:
- **health** - Heilt 1 HP
- **healthPotion** - Erhöht Max HP um 1 und heilt 1 HP
- **mana** - Stellt 1 Mana wieder her
- **manaPotion** - Erhöht Max Mana um 1 und stellt 1 Mana wieder her
- **key** - Schlüssel zum Öffnen von Türen (wird verbraucht beim Öffnen)
- **weapon** - Waffe (z.B. 'axe', 'spear')

## 10. Best Practices

1. **Sprite zuerst definieren**: Stelle sicher, dass das Sprite in `spriteConfig.js` existiert, bevor du es in `tileConfig.js` verwendest.

2. **Eindeutige Zeichen**: Verwende eindeutige Zeichen im `tileCharacterMap` für jedes Tile.

3. **Zustände durchdenken**: Für Tiles mit Zuständen, überlege dir alle möglichen Zustände im Voraus.

4. **Walkability beachten**: Stelle sicher, dass die `walkable`-Eigenschaft für jeden Zustand korrekt gesetzt ist.

5. **Dokumentation**: Kommentiere deine neuen Tile-Typen in `tileConfig.js`.

6. **Schlüssel-Verwendung**: Schlüssel werden beim Öffnen von Türen verbraucht. Stelle sicher, dass genug Schlüssel im Level verfügbar sind.

7. **Event-basiertes Öffnen**: Für Türen, die sich durch Events öffnen (Boss-Phase, Schalter), verwende `requireKey = false`.

## 11. Bekannte Charaktere

| Zeichen | Tile-Typ | Beschreibung |
|---------|----------|--------------|
| `.`     | floor    | Normaler Boden |
| `W`     | wall     | Wand |
| `D`     | door     | Tür |
| `C`     | floor    | Truhe (Boden darunter) |
| `P`     | floor    | Spieler-Start (Boden darunter) |
| `G`     | floor    | Goblin-Spawn (Boden darunter) |
| ` `     | empty    | Leerer Bereich |

## 12. Gameplay-Flow: Schlüssel und Türen

Der typische Ablauf für den Spieler:

1. **Schlüssel finden**: Spieler öffnet eine Truhe und findet einen Schlüssel
2. **Schlüssel wird automatisch eingesammelt**: "🔑 Key collected! You can now open doors."
3. **Zur Tür gehen**: Spieler navigiert zur verschlossenen Tür
4. **Tür öffnen**: Spieler drückt Interaktionstaste (z.B. 'E') vor der Tür
   - Mit Schlüssel: "🔑 Door unlocked and opened!" (Schlüssel wird verbraucht)
   - Ohne Schlüssel: "You need a key to open this door!"
5. **Durch die Tür gehen**: Spieler kann nun durch die geöffnete Tür laufen

## Zusammenfassung

Das neue Tile-System ist:
- ✅ **Erweiterbar**: Einfach neue Tile-Typen hinzufügen
- ✅ **Zustandsfähig**: Tiles können verschiedene Zustände haben (Türen: offen/geschlossen)
- ✅ **Flexibel**: Unterscheide zwischen begehbaren und nicht-begehbaren Tiles
- ✅ **Interaktiv**: Integriertes System für Tile-Interaktionen mit Schlüssel-Support
- ✅ **Inventar-Integration**: Schlüssel werden im Inventar gespeichert und verbraucht
- ✅ **Abwärtskompatibel**: Existierender Code funktioniert weiterhin
