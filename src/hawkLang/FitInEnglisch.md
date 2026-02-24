# Fit in Englisch - Vokabel- & Satztrainer

> Angelehnt an *Langenscheidt Fit in 30 Tagen Englisch*

---

## Projektbeschreibung

Ein interaktiver Satz- und Vokabeltrainer, bei dem der Nutzer Englisch anhand ganzer Saetze lernt. Der Fokus liegt nicht auf einzelnen Woertern, sondern auf praxisnahen Saetzen mit anschliessender Vokabel- und Grammatikvertiefung.

---

## Kernkonzept (Ablauf einer Übung)

1. **Lektion waehlen** - Der Nutzer waehlt eine Lektion aus (z.B. "Lektion 1 - Sich vorstellen")
2. **Deutscher Satz wird angezeigt** - z.B. *"Sie ist aus Deutschland."*
3. **Klick / Weiter** - Der Nutzer klickt, um die Antwortmoeglichkeiten zu sehen
4. **4 Antworten (Multiple Choice)** - Nur eine ist korrekt, z.B.:
   - A) She is from Germany. (richtig)
   - B) She are from Germany.
   - C) Her is from Germany.
   - D) She is at Germany.
5. **Auswahl & Feedback** - Richtig/Falsch-Anzeige mit Erklaerung
6. **Vokabeln zum Satz** - Unterhalb werden relevante Vokabeln angezeigt (she = sie, from = aus, Germany = Deutschland)
7. **Grammatik einblenden (optional)** - z.B. Personalpronomen + "to be" Konjugation

---

## Entwicklungsplan

### Phase 1 - Grundstruktur & Datenmodell

- [ ] Projektstruktur anlegen (Ordner, Konfiguration, Abhangigkeiten)
- [ ] Datenmodell definieren:
  - **Lektion**: id, titel, beschreibung, reihenfolge
  - **Satz**: id, lektionId, deutsch, englischKorrekt, falscheAntworten[]
  - **Vokabel**: id, deutsch, englisch, satzId
  - **Grammatik**: id, titel, inhalt (Markdown/HTML), satzId/lektionId
- [ ] Beispieldaten fuer 1-2 Lektionen als JSON erstellen
- [ ] Technologie-Stack festlegen (Framework, Styling, State Management)

### Phase 2 - Lektionsuebersicht

- [ ] Startseite mit Lektionsliste
- [ ] Lektionskarten mit Titel, Beschreibung und Fortschrittsanzeige
- [ ] Navigation: Lektion auswaehlen -> Uebung starten

### Phase 3 - Uebungsablauf (Kern-Feature)

- [ ] Satzanzeige-Komponente (deutscher Satz gross dargestellt)
- [ ] "Antworten anzeigen"-Button
- [ ] Multiple-Choice-Komponente mit 4 Antworten
- [ ] Zufaellige Reihenfolge der Antworten
- [ ] Antwort-Auswahl mit visuellem Feedback (gruen = richtig, rot = falsch)
- [ ] Richtige Antwort hervorheben bei falscher Wahl
- [ ] Weiter-Button zum naechsten Satz
- [ ] Fortschrittsbalken (Satz 3 von 10)

### Phase 4 - Vokabelanzeige

- [ ] Nach Beantwortung: Vokabelliste zum aktuellen Satz einblenden
- [ ] Darstellung: Deutsch <-> Englisch Paare
- [ ] Optional: Vokabel antippen zum Uebersetzen (verdeckter Modus)
- [ ] Vokabeln separat trainierbar machen (eigener Vokabel-Modus)

### Phase 5 - Grammatik-Bereich

- [ ] Grammatik-Button unter dem Satz ("Grammatik anzeigen")
- [ ] Grammatik-Overlay/Bereich mit formatiertem Inhalt
- [ ] Inhalte z.B.:
  - Personalpronomen + to be (I am, you are, she is...)
  - Praepostionen (from, at, in...)
  - Satzstellung
- [ ] Grammatik pro Lektion oder pro Satz zuweisbar

### Phase 6 - Fortschritt & Ergebnisse

- [ ] Ergebnis-Seite nach Abschluss einer Lektion (z.B. 8/10 richtig)
- [ ] Fortschritt pro Lektion speichern (LocalStorage oder Backend)
- [ ] Falsch beantwortete Saetze markieren fuer Wiederholung
- [ ] Gesamtfortschritt ueber alle Lektionen anzeigen

### Phase 7 - Inhalte erstellen

- [ ] Lektionen 1-5 mit je 10-15 Saetzen befuellen
- [ ] Vokabeln zu jedem Satz zuordnen
- [ ] Grammatik-Erklaerungen erstellen
- [ ] Falsche Antworten sinnvoll gestalten (typische Fehler einbauen)

### Phase 8 - UI/UX & Polish

- [ ] Responsives Design (Desktop + Mobil)
- [ ] Animationen fuer Uebergaenge und Feedback
- [ ] Farbschema und Typografie finalisieren
- [ ] Sound-Feedback (optional, korrekt/falsch)
- [ ] Dark Mode (optional)

### Phase 9 - Erweiterungen (spaeter)

- [ ] Sprachausgabe der englischen Saetze (Text-to-Speech)
- [ ] Schwierigkeitsgrade (Anfaenger, Fortgeschritten)
- [ ] Tages-Challenge (angelehnt an "30 Tage"-Konzept)
- [ ] Eigene Saetze/Vokabeln hinzufuegen
- [ ] Statistiken und Lernkurve

---

## Trainings-Richtung

Der Trainer unterstuetzt zwei Richtungen:

- **DE -> EN** (Standard): Deutscher Satz wird gezeigt, englische Antworten waehlen
- **EN -> DE**: Englischer Satz wird gezeigt, deutsche Antworten waehlen

Die Richtung kann pro Uebung umgeschaltet werden. Die JSON-Struktur ist sprachneutral aufgebaut (`source` / `target` werden zur Laufzeit je nach Richtung zugewiesen).

---

## Datenstruktur (JSON) - Englische Keys, bidirektional

```json
{
  "lessons": [
    {
      "id": 1,
      "title": {
        "de": "Sich vorstellen",
        "en": "Introducing yourself"
      },
      "description": {
        "de": "Grundlegende Saetze zur Vorstellung",
        "en": "Basic sentences for introductions"
      },
      "order": 1,
      "sentences": [
        {
          "id": 1,
          "de": "Sie ist aus Deutschland.",
          "en": "She is from Germany.",
          "wrongAnswers": {
            "en": [
              "She are from Germany.",
              "Her is from Germany.",
              "She is at Germany."
            ],
            "de": [
              "Sie sind aus Deutschland.",
              "Ihr ist aus Deutschland.",
              "Sie ist bei Deutschland."
            ]
          },
          "vocabulary": [
            { "de": "sie", "en": "she" },
            { "de": "ist", "en": "is" },
            { "de": "aus", "en": "from" },
            { "de": "Deutschland", "en": "Germany" }
          ],
          "grammar": {
            "id": "personal-pronouns-be",
            "title": {
              "de": "Personalpronomen + to be",
              "en": "Personal pronouns + to be"
            },
            "content": {
              "de": "I am = ich bin, you are = du bist, he/she/it is = er/sie/es ist, we are = wir sind, they are = sie sind",
              "en": "I am, you are, he/she/it is, we are, they are"
            }
          }
        },
        {
          "id": 2,
          "de": "Ich heisse Thomas.",
          "en": "My name is Thomas.",
          "wrongAnswers": {
            "en": [
              "I name is Thomas.",
              "My name are Thomas.",
              "Me name is Thomas."
            ],
            "de": [
              "Ich bin heisse Thomas.",
              "Mein Name heisse Thomas.",
              "Ich heissen Thomas."
            ]
          },
          "vocabulary": [
            { "de": "mein", "en": "my" },
            { "de": "Name", "en": "name" },
            { "de": "ist", "en": "is" }
          ],
          "grammar": {
            "id": "possessive-pronouns",
            "title": {
              "de": "Possessivpronomen",
              "en": "Possessive pronouns"
            },
            "content": {
              "de": "my = mein, your = dein, his = sein, her = ihr, our = unser, their = ihr",
              "en": "my, your, his, her, its, our, their"
            }
          }
        }
      ]
    }
  ]
}
```

### Logik zur Laufzeit

```
direction = "de-en" | "en-de"

if direction == "de-en":
    questionLang = "de"    // Satz anzeigen in Deutsch
    answerLang   = "en"    // Antworten auf Englisch
else:
    questionLang = "en"    // Satz anzeigen in Englisch
    answerLang   = "de"    // Antworten auf Deutsch

question  = sentence[questionLang]
correct   = sentence[answerLang]
wrong     = sentence.wrongAnswers[answerLang]
options   = shuffle([correct, ...wrong])
```

---

## Technologie-Optionen

| Option | Beschreibung |
|--------|-------------|
| **Angular** | Passt zum bestehenden hawk3web-Projekt |
| **React** | Alternativ, leichtgewichtig |
| **Vanilla JS** | Minimal, kein Framework noetig |
| **Daten** | JSON-Dateien oder Firebase/Supabase |
| **Styling** | Tailwind CSS, Bootstrap oder eigenes CSS |
