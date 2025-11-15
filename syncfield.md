# 🎮 SyncField

> *Nur wer im Einklang ist, kann das Feld erobern.*

---

## 🌍 Grundprinzip
**SyncField** ist ein langfristiges, ruhiges Online-Teamspiel für etwa sechs Monate Spielzeit. Ziel ist es, als dreiköpfiges Team gemeinsam ein 7×7-Feld zu erobern – Feld für Feld. Der Clou: Alle Teammitglieder müssen täglich dieselbe Zahl wählen, um das aktive Feld zu synchronisieren und zu erobern.

Das Spiel dreht sich um Timing, Intuition und Teamharmonie – nicht um Geschwindigkeit oder Wissen.

---

## ⚙️ Spielmechanik

### 🧩 Spielfeld
- Das Spielfeld besteht aus **49 Feldern (7×7)**.
- Jedes Team startet mit **einem aktivierten Startfeld**.
- Felder können **nur angrenzend** erobert werden.

---

### 🔢 Tägliche Zahl & Eingabe
- Jedes aktive Feld zeigt täglich **eine Zahl zwischen 1 und 9** an.
- Jeder Spieler hat einen **Drehknopf (1–9)** und kann seine Einstellung **einmal pro Tag** wählen oder ändern.
- Ziel: Alle Teammitglieder müssen dieselbe Zahl wie das Feld wählen.

---

### ✅ Eroberung eines Feldes
1. Das Team stellt die Knöpfe auf die aktuelle Feldzahl ein (z.B. **7**).
2. Wenn **alle drei Spieler dieselbe Zahl eingestellt haben**, gilt das Feld als **erobert**.
3. Danach darf das Team ein **angrenzendes Feld** aktivieren.
4. Jedes neue Feld beginnt wieder mit einer zufälligen Zahl zwischen 1–9.

---

### 💤 Offline-Spieler & Teilfortschritt
SyncField berücksichtigt inaktive Spieler:

- Wenn **mindestens ein Spieler** die richtige Zahl eingestellt hat, **bleibt die aktuelle Zahl bestehen** (sie wird **nicht neu generiert**).
- Spieler, die **nicht online waren**, werden automatisch als **offline markiert**.
- Wenn z.B. 2 von 3 Spielern richtig getippt haben:
  - Das Feld wird **teilweise aktiviert** (2 von 3 Ecken leuchten).
  - Das Team muss an den Folgetagen die fehlenden Ecken synchronisieren.
- Sobald **alle drei** Ecken mit der richtigen Zahl eingestellt ist, wird das Feld **endgültig erobert**.

➡️ So bleibt das Spiel auch aktiv, wenn einzelne Teammitglieder längere Pausen einlegen.

---

### 🔁 Fortschritt & Expansion
- Nach der Eroberung eines Feldes kann das Team **direkt ein angrenzendes Feld** aktivieren.
- Teams können sich **über das gesamte 7×7-Grid** ausbreiten.
- Langfristiges Ziel: **So viele Felder wie möglich** erobern.

---

## 👥 Teamsystem
- Teams bestehen aus **maximal 3 Spielern**.
- Spieler werden beim Einstieg **automatisch zufällig zugewiesen**.
- Wenn ein Team 3 Spieler hat, wird **ein neues Team erstellt**.
- Wenn ein Spieler **mehrere Tage inaktiv** ist, wird er als *schlafend* markiert.
- Nach einer definierten Zeit kann ein neuer Spieler einen freien Platz übernehmen.

---

## 🕰️ Tageszyklus
- Ein realer Tag = eine Spielrunde.
- Um Mitternacht:
  - wird geprüft, welche Teams synchronisiert waren,
  - eroberte Felder werden aktualisiert,
  - neue Zahlen werden für aktive Felder generiert (außer bei Teil-Synchronität, siehe oben).

---

## ⚔️ Wettbewerb & Sichtbarkeit
- Die Karte kann für alle Teams sichtbar sein (optional).
- Eroberte Felder leuchten in der Teamfarbe.
- Aktive Felder blinken leicht.
- Offline-Spieler werden mit einem grauen Symbol markiert.

---

## 🧮 Technische Struktur (Basis)
**Frontend:**
- Drehknopf (1–9) pro Spieler.
- Anzeige der aktuellen Feldzahl.
- Mini-Karte (7×7) mit Farben, Leuchteffekten und Offline-Markierungen.

**Backend:**
- Speicherung von Spielerstatus, Teams und Feldern.
- Tagesauswertung (Mitternacht-Job).
- Logik für Teilfortschritt und Offline-Erkennung.

