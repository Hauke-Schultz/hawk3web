# ZombYRun – Roadmap

## Ziel

**ZombYRun** ist ein rundenbasiertes Ausweichspiel, das zuerst als **komplette Vue3 Single-File-Komponente** umgesetzt wird und später **1:1 nach C64 BASIC portiert** werden soll.

Die Vue3-Version dient als **Referenz-Implementierung**. Alle Regeln, Abläufe und Zufallsentscheidungen müssen so definiert sein, dass sie später exakt reproduzierbar sind.

---

## Spielkonzept (Kurzfassung)

* Setting: Mehrstöckiges Hochhaus
* Ziel: Von der obersten Etage bis nach unten entkommen
* Jede Etage wird **horizontal von links nach rechts** gespielt
* Am rechten Rand befindet sich die **Treppe zur nächsten Etage**

---

## Spielfeld

* Eindimensionales, waagerechtes Spielfeld
* Feste Breite (z. B. 30 Felder)
* Enthält:

    * Spieler (Start immer ganz links)
    * Mehrere Zombies
    * Treppe ganz rechts

---

## Rundenprinzip

Das Spiel ist **streng rundenbasiert**:

1. Spieler macht **genau einen Zug** (links / rechts / Moduswechsel)
2. Zombies machen ihren Zug oder bleiben stehen
3. Runde endet
4. Nächste Eingabe möglich

Keine Echtzeit-Logik.

---

## Spieler

### Bewegung

* Links / Rechts
* Maximal 1 Feld pro Runde
* Kein Überspringen von Feldern

### Modi

Der Spieler hat zwei Zustände:

#### Mensch-Modus

* Standardzustand
* Zombies bewegen sich **gezielt auf den Spieler zu**
* Berührung mit Zombie = **Game Over**

#### Zombie-Modus

* Umschaltbar mit **Space** (solange Zombie-Leiste > 0)
* Zombies bewegen sich **zufällig** oder bleiben stehen
* Jede Bewegung des Spielers kostet **1 Punkt Zombie-Leiste**

---

## Zombie-Leiste

* Fester Maximalwert
* Sinkt **nur**, wenn:

    * Spieler im Zombie-Modus ist
    * und sich bewegt

### Sonderregel

* Wenn Zombie-Leiste **0 erreicht**:

    * Automatischer Wechsel in Mensch-Modus
    * **Zombie-Modus kann nicht mehr aktiviert werden**

---

## Zombies

### Verhalten pro Runde

**Im Mensch-Modus des Spielers:**

* Zombies bewegen sich maximal 1 Feld
* Bewegung erfolgt **gerichtet auf die Spielerposition**

**Im Zombie-Modus des Spielers:**

* Zombies:

    * bewegen sich zufällig nach links oder rechts
    * oder bleiben stehen

---

## Kollisionen

**Spieler und Zombie auf dem gleichen Feld**

* Spieler im Zombie-Modus:
  * Spieler stirbt nicht
  * Zombie-Leiste geht nicht um ein Feld runter
* Spieler im Mensch-Modus:
  * Spieler stirbt: Game Over

---

## Etagen-System

* Jede Etage ist ein abgeschlossenes Level
* Nach Erreichen der Treppe:

    * Spieler startet links in der nächsten Etage
    * Neue Zombie-Positionen

---

## Technische Zielsetzung

### Vue3 Version (Phase 1)

* **Ein einziges `.vue` File**
* Enthält:
    * komplette Spiellogik
    * Grafik (2D, simpel, z. B. Grid / Sprites / Emojis)
    * Tastatursteuerung
* Keine externen Abhängigkeiten

Diese Version ist die **Referenz für alle Regeln**.

---

### C64 BASIC Version (Phase 2: kommt später)

* Exakt gleiche Regeln
* Gleicher Rundenablauf
* Keine neuen Mechaniken
* Anpassung nur bei Darstellung & Eingabe

