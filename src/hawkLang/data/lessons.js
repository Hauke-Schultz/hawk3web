/**
 * Fit in Englisch - Lesson Data
 * Bidirectional structure: each sentence has de + en keys
 * Direction (de->en or en->de) is determined at runtime
 */

export const LESSONS = [
  {
    id: 1,
    title: {
      de: 'Sich vorstellen',
      en: 'Introducing yourself'
    },
    description: {
      de: 'Grundlegende Saetze zur Vorstellung und Begruessung',
      en: 'Basic sentences for introductions and greetings'
    },
    order: 1,
    dialogue: [
      { speaker: 'Anna', de: 'Hallo! Ich heisse Anna.', en: 'Hello! My name is Anna.' },
      { speaker: 'Thomas', de: 'Hallo Anna! Ich heisse Thomas. Nett, Sie kennenzulernen!', en: 'Hello Anna! My name is Thomas. Nice to meet you!' },
      { speaker: 'Anna', de: 'Wo wohnst du, Thomas?', en: 'Where do you live, Thomas?' },
      { speaker: 'Thomas', de: 'Ich wohne in Berlin. Und du?', en: 'I live in Berlin. And you?' },
      { speaker: 'Anna', de: 'Sie ist aus Deutschland. Ich wohne auch in Berlin!', en: 'She is from Germany. I live in Berlin too!' },
      { speaker: 'Thomas', de: 'Wie alt bist du?', en: 'How old are you?' },
      { speaker: 'Anna', de: 'Ich bin dreissig Jahre alt. Er spricht Englisch und Deutsch.', en: 'I am thirty years old. He speaks English and German.' },
      { speaker: 'Thomas', de: 'Ich auch! Das ist toll.', en: 'Me too! That is great.' }
    ],
    sentences: [
      {
        id: 1,
        de: 'Sie ist aus Deutschland.',
        en: 'She is from Germany.',
        wrongAnswers: {
          en: [
            'She are from Germany.',
            'Her is from Germany.',
            'She is at Germany.'
          ],
          de: [
            'Sie sind aus Deutschland.',
            'Ihr ist aus Deutschland.',
            'Sie ist bei Deutschland.'
          ]
        },
        vocabulary: [
          { de: 'sie', en: 'she' },
          { de: 'ist', en: 'is' },
          { de: 'aus', en: 'from' },
          { de: 'Deutschland', en: 'Germany' }
        ],
        grammar: {
          id: 'personal-pronouns-be',
          title: {
            de: 'Personalpronomen + to be',
            en: 'Personal pronouns + to be'
          },
          columns: { de: ['Person', 'Englisch', 'Deutsch'], en: ['Person', 'English', 'German'] },
          rows: [
            ['I', 'am', 'bin'],
            ['you', 'are', 'bist'],
            ['he / she / it', 'is', 'ist'],
            ['we', 'are', 'sind'],
            ['they', 'are', 'sind']
          ],
          note: {
            de: 'she is = sie ist (3. Person Singular)',
            en: 'she is = 3rd person singular'
          }
        }
      },
      {
        id: 2,
        de: 'Ich heisse Thomas.',
        en: 'My name is Thomas.',
        wrongAnswers: {
          en: [
            'I name is Thomas.',
            'My name are Thomas.',
            'Me name is Thomas.'
          ],
          de: [
            'Ich bin heisse Thomas.',
            'Mein Name heisse Thomas.',
            'Ich heissen Thomas.'
          ]
        },
        vocabulary: [
          { de: 'mein', en: 'my' },
          { de: 'Name', en: 'name' },
          { de: 'ist', en: 'is' }
        ],
        grammar: {
          id: 'possessive-pronouns',
          title: {
            de: 'Possessivpronomen',
            en: 'Possessive pronouns'
          },
          columns: { de: ['Englisch', 'Deutsch'], en: ['English', 'German'] },
          rows: [
            ['my', 'mein'],
            ['your', 'dein / Ihr'],
            ['his', 'sein'],
            ['her', 'ihr'],
            ['its', 'sein'],
            ['our', 'unser'],
            ['their', 'ihr']
          ]
        }
      },
      {
        id: 3,
        de: 'Wo wohnst du?',
        en: 'Where do you live?',
        wrongAnswers: {
          en: [
            'Where you live?',
            'Where does you live?',
            'Where are you live?'
          ],
          de: [
            'Wo lebst du wohnen?',
            'Wo du wohnst?',
            'Wo wohnen du?'
          ]
        },
        vocabulary: [
          { de: 'wo', en: 'where' },
          { de: 'wohnen', en: 'to live' },
          { de: 'du', en: 'you' }
        ],
        grammar: {
          id: 'questions-do',
          title: {
            de: 'Fragen mit do/does',
            en: 'Questions with do/does'
          },
          columns: { de: ['Hilfsverb', 'Person', 'Beispiel'], en: ['Auxiliary', 'Person', 'Example'] },
          rows: [
            ['Do', 'I / you / we / they', 'Do you live here?'],
            ['Does', 'he / she / it', 'Does she live here?']
          ],
          note: {
            de: 'Nach does steht das Verb OHNE -s: Does she live (nicht: lives)',
            en: 'After does the verb has NO -s: Does she live (not: lives)'
          }
        }
      },
      {
        id: 4,
        de: 'Ich wohne in Berlin.',
        en: 'I live in Berlin.',
        wrongAnswers: {
          en: [
            'I lives in Berlin.',
            'I am live in Berlin.',
            'I living in Berlin.'
          ],
          de: [
            'Ich lebe wohne in Berlin.',
            'Ich wohnt in Berlin.',
            'Ich bin wohne in Berlin.'
          ]
        },
        vocabulary: [
          { de: 'ich', en: 'I' },
          { de: 'wohnen', en: 'to live' },
          { de: 'in', en: 'in' }
        ],
        grammar: {
          id: 'simple-present',
          title: {
            de: 'Simple Present',
            en: 'Simple Present'
          },
          columns: { de: ['Person', 'Verb'], en: ['Person', 'Verb'] },
          rows: [
            ['I', 'live'],
            ['you', 'live'],
            ['he / she / it', 'lives'],
            ['we', 'live'],
            ['they', 'live']
          ],
          note: {
            de: 'Achtung: 3. Person Singular bekommt ein -s!',
            en: 'Note: 3rd person singular gets an -s!'
          }
        }
      },
      {
        id: 5,
        de: 'Er spricht Englisch und Deutsch.',
        en: 'He speaks English and German.',
        wrongAnswers: {
          en: [
            'He speak English and German.',
            'He is speaks English and German.',
            'He speaking English and German.'
          ],
          de: [
            'Er sprechen Englisch und Deutsch.',
            'Er ist spricht Englisch und Deutsch.',
            'Er sprecht Englisch und Deutsch.'
          ]
        },
        vocabulary: [
          { de: 'er', en: 'he' },
          { de: 'sprechen', en: 'to speak' },
          { de: 'Englisch', en: 'English' },
          { de: 'und', en: 'and' },
          { de: 'Deutsch', en: 'German' }
        ],
        grammar: {
          id: 'simple-present-s',
          title: {
            de: 'Simple Present: 3. Person Singular',
            en: 'Simple Present: 3rd person singular'
          },
          columns: { de: ['Regel', 'Beispiel'], en: ['Rule', 'Example'] },
          rows: [
            ['+ s', 'he speaks, she lives, it works'],
            ['+ es (nach s, sh, ch, x, o)', 'he goes, she watches'],
            ['y → ies', 'he tries, she carries'],
            ['have → has', 'she has a dog']
          ]
        }
      },
      {
        id: 6,
        de: 'Nett, Sie kennenzulernen!',
        en: 'Nice to meet you!',
        wrongAnswers: {
          en: [
            'Nice to know you!',
            'Nice for meet you!',
            'Nice to meeting you!'
          ],
          de: [
            'Nett, du zu kennen!',
            'Schoen, Sie zu treffen haben!',
            'Nett, Ihnen zu kennenlernen!'
          ]
        },
        vocabulary: [
          { de: 'nett', en: 'nice' },
          { de: 'kennenlernen', en: 'to meet' },
          { de: 'Sie (formell)', en: 'you (formal)' }
        ],
        grammar: {
          id: 'infinitive-to',
          title: {
            de: 'Infinitiv mit to',
            en: 'Infinitive with to'
          },
          columns: { de: ['Englisch', 'Deutsch'], en: ['English', 'German'] },
          rows: [
            ['to meet', 'treffen / kennenlernen'],
            ['to live', 'leben / wohnen'],
            ['to speak', 'sprechen'],
            ['to be', 'sein']
          ],
          note: {
            de: 'Formel: to + Grundform des Verbs',
            en: 'Pattern: to + base form of verb'
          }
        }
      },
      {
        id: 7,
        de: 'Wie alt bist du?',
        en: 'How old are you?',
        wrongAnswers: {
          en: [
            'How old you are?',
            'How old is you?',
            'How old have you?'
          ],
          de: [
            'Wie alt du bist?',
            'Wie alt ist du?',
            'Wie alt hast du?'
          ]
        },
        vocabulary: [
          { de: 'wie', en: 'how' },
          { de: 'alt', en: 'old' },
          { de: 'bist', en: 'are' }
        ],
        grammar: {
          id: 'questions-be',
          title: {
            de: 'Fragen mit to be',
            en: 'Questions with to be'
          },
          columns: { de: ['Frage', 'Beispiel'], en: ['Question', 'Example'] },
          rows: [
            ['Am I ...?', 'Am I late?'],
            ['Are you ...?', 'Are you tired?'],
            ['Is he/she/it ...?', 'Is she old?'],
            ['Are we ...?', 'Are we ready?'],
            ['Are they ...?', 'Are they here?']
          ],
          note: {
            de: 'Bei Fragen steht das Verb VOR dem Subjekt!',
            en: 'In questions the verb comes BEFORE the subject!'
          }
        }
      },
      {
        id: 8,
        de: 'Ich bin dreissig Jahre alt.',
        en: 'I am thirty years old.',
        wrongAnswers: {
          en: [
            'I have thirty years old.',
            'I am thirty years.',
            'I is thirty years old.'
          ],
          de: [
            'Ich habe dreissig Jahre alt.',
            'Ich bin dreissig Jahre.',
            'Ich ist dreissig Jahre alt.'
          ]
        },
        vocabulary: [
          { de: 'dreissig', en: 'thirty' },
          { de: 'Jahre', en: 'years' },
          { de: 'alt', en: 'old' }
        ],
        grammar: {
          id: 'age-expression',
          title: {
            de: 'Alter ausdruecken',
            en: 'Expressing age'
          },
          columns: { de: ['Richtig', 'Falsch'], en: ['Correct', 'Wrong'] },
          rows: [
            ['I am 30 years old.', 'I have 30 years.'],
            ['She is 25.', 'She has 25.'],
            ['How old are you?', 'How old have you?']
          ],
          note: {
            de: 'Im Englischen wird "to be" benutzt, NICHT "to have"!',
            en: 'English uses "to be", NOT "to have"!'
          }
        }
      }
    ]
  },
  {
    id: 2,
    title: {
      de: 'Im Alltag',
      en: 'Daily life'
    },
    description: {
      de: 'Saetze fuer den taeglichen Gebrauch',
      en: 'Sentences for everyday use'
    },
    order: 2,
    dialogue: [
      { speaker: 'Lisa', de: 'Ich habe einen Hund. Er heisst Bello.', en: 'I have a dog. His name is Bello.' },
      { speaker: 'Max', de: 'Das ist schoen! Sie trinkt jeden Morgen Kaffee, oder?', en: 'That is nice! She drinks coffee every morning, right?' },
      { speaker: 'Lisa', de: 'Ja, stimmt. Das Wetter ist heute schoen.', en: 'Yes, that is right. The weather is nice today.' },
      { speaker: 'Max', de: 'Wir gehen heute Abend ins Kino. Kommst du mit?', en: 'We are going to the cinema tonight. Are you coming?' },
      { speaker: 'Lisa', de: 'Kannst du mir helfen? Ich mag keine Spinnen und der Film ist ein Horrorfilm!', en: 'Can you help me? I do not like spiders and the movie is a horror film!' },
      { speaker: 'Max', de: 'Kein Problem! Wir schauen etwas anderes.', en: 'No problem! We will watch something else.' }
    ],
    sentences: [
      {
        id: 9,
        de: 'Ich habe einen Hund.',
        en: 'I have a dog.',
        wrongAnswers: {
          en: [
            'I has a dog.',
            'I have one dog.',
            'I am have a dog.'
          ],
          de: [
            'Ich hat einen Hund.',
            'Ich habe ein Hund.',
            'Ich bin habe einen Hund.'
          ]
        },
        vocabulary: [
          { de: 'haben', en: 'to have' },
          { de: 'einen', en: 'a' },
          { de: 'Hund', en: 'dog' }
        ],
        grammar: {
          id: 'have-conjugation',
          title: {
            de: 'Konjugation von to have',
            en: 'Conjugation of to have'
          },
          columns: { de: ['Person', 'Verb'], en: ['Person', 'Verb'] },
          rows: [
            ['I', 'have'],
            ['you', 'have'],
            ['he / she / it', 'has'],
            ['we', 'have'],
            ['they', 'have']
          ],
          note: {
            de: 'Achtung: has nur bei 3. Person Singular!',
            en: 'Note: has only for 3rd person singular!'
          }
        }
      },
      {
        id: 10,
        de: 'Sie trinkt jeden Morgen Kaffee.',
        en: 'She drinks coffee every morning.',
        wrongAnswers: {
          en: [
            'She drink coffee every morning.',
            'She drinks every morning coffee.',
            'She is drinks coffee every morning.'
          ],
          de: [
            'Sie trinken jeden Morgen Kaffee.',
            'Sie trinkt Kaffee jeden Morgen.',
            'Sie ist trinkt jeden Morgen Kaffee.'
          ]
        },
        vocabulary: [
          { de: 'trinken', en: 'to drink' },
          { de: 'jeden', en: 'every' },
          { de: 'Morgen', en: 'morning' },
          { de: 'Kaffee', en: 'coffee' }
        ],
        grammar: {
          id: 'word-order',
          title: {
            de: 'Satzstellung im Englischen',
            en: 'Word order in English'
          },
          columns: { de: ['Position', 'Satzteil', 'Beispiel'], en: ['Position', 'Part', 'Example'] },
          rows: [
            ['1', 'Subjekt / Subject', 'She'],
            ['2', 'Verb', 'drinks'],
            ['3', 'Objekt / Object', 'coffee'],
            ['4', 'Zeit / Time', 'every morning']
          ],
          note: {
            de: 'Im Deutschen ist die Satzstellung flexibler, im Englischen gilt: S-V-O-T',
            en: 'English follows a strict S-V-O-T word order'
          }
        }
      },
      {
        id: 11,
        de: 'Wir gehen heute Abend ins Kino.',
        en: 'We are going to the cinema tonight.',
        wrongAnswers: {
          en: [
            'We go to the cinema tonight.',
            'We are go to the cinema tonight.',
            'We going to the cinema tonight.'
          ],
          de: [
            'Wir sind gehen ins Kino heute Abend.',
            'Wir gehen ins Kino heute Abend.',
            'Wir gehend heute Abend ins Kino.'
          ]
        },
        vocabulary: [
          { de: 'wir', en: 'we' },
          { de: 'gehen', en: 'to go' },
          { de: 'heute Abend', en: 'tonight' },
          { de: 'Kino', en: 'cinema' }
        ],
        grammar: {
          id: 'present-continuous',
          title: {
            de: 'Present Continuous (Verlaufsform)',
            en: 'Present Continuous'
          },
          columns: { de: ['Person', 'Beispiel'], en: ['Person', 'Example'] },
          rows: [
            ['I', 'am going'],
            ['you', 'are going'],
            ['he / she / it', 'is going'],
            ['we', 'are going'],
            ['they', 'are going']
          ],
          note: {
            de: 'Formel: am/is/are + Verb + -ing | Fuer aktuelle und geplante Handlungen',
            en: 'Pattern: am/is/are + verb + -ing | For current and planned actions'
          }
        }
      },
      {
        id: 12,
        de: 'Kannst du mir helfen?',
        en: 'Can you help me?',
        wrongAnswers: {
          en: [
            'Can you help I?',
            'Do you can help me?',
            'Can you to help me?'
          ],
          de: [
            'Kannst du helfen ich?',
            'Tust du koennen mir helfen?',
            'Kannst du zu helfen mir?'
          ]
        },
        vocabulary: [
          { de: 'koennen', en: 'can' },
          { de: 'helfen', en: 'to help' },
          { de: 'mir', en: 'me' }
        ],
        grammar: {
          id: 'modal-verbs',
          title: {
            de: 'Modalverben',
            en: 'Modal verbs'
          },
          columns: { de: ['Englisch', 'Deutsch', 'Beispiel'], en: ['English', 'German', 'Example'] },
          rows: [
            ['can / could', 'koennen', 'Can you help me?'],
            ['must', 'muessen', 'You must go now.'],
            ['should', 'sollen', 'You should eat more.'],
            ['may', 'duerfen', 'May I come in?']
          ],
          note: {
            de: 'Modalverb + Grundform OHNE to! (Can you help, NICHT: Can you to help)',
            en: 'Modal verb + base form WITHOUT to! (Can you help, NOT: Can you to help)'
          }
        }
      },
      {
        id: 13,
        de: 'Das Wetter ist heute schoen.',
        en: 'The weather is nice today.',
        wrongAnswers: {
          en: [
            'The weather is today nice.',
            'Today the weather is nice.',
            'The weather are nice today.'
          ],
          de: [
            'Das Wetter ist heute nett.',
            'Heute ist das Wetter nett.',
            'Das Wetter sind heute schoen.'
          ]
        },
        vocabulary: [
          { de: 'Wetter', en: 'weather' },
          { de: 'schoen', en: 'nice / beautiful' },
          { de: 'heute', en: 'today' }
        ],
        grammar: {
          id: 'articles',
          title: {
            de: 'Artikel: the / a / an',
            en: 'Articles: the / a / an'
          },
          columns: { de: ['Artikel', 'Verwendung', 'Beispiel'], en: ['Article', 'Usage', 'Example'] },
          rows: [
            ['the', 'bestimmt / definite', 'the weather, the dog'],
            ['a', 'unbestimmt (vor Konsonant)', 'a dog, a house'],
            ['an', 'unbestimmt (vor Vokal)', 'an apple, an hour']
          ]
        }
      },
      {
        id: 14,
        de: 'Ich mag keine Spinnen.',
        en: 'I do not like spiders.',
        wrongAnswers: {
          en: [
            'I not like spiders.',
            'I no like spiders.',
            'I does not like spiders.'
          ],
          de: [
            'Ich nicht mag Spinnen.',
            'Ich nein mag Spinnen.',
            'Ich tut nicht moegen Spinnen.'
          ]
        },
        vocabulary: [
          { de: 'moegen', en: 'to like' },
          { de: 'keine', en: 'no / not any' },
          { de: 'Spinnen', en: 'spiders' }
        ],
        grammar: {
          id: 'negation-do',
          title: {
            de: 'Verneinung mit do not / does not',
            en: 'Negation with do not / does not'
          },
          columns: { de: ['Person', 'Verneinung', 'Kurzform'], en: ['Person', 'Negation', 'Short form'] },
          rows: [
            ['I / you / we / they', 'do not + Verb', "don't + Verb"],
            ['he / she / it', 'does not + Verb', "doesn't + Verb"]
          ],
          note: {
            de: 'Nach does not steht das Verb OHNE -s: She doesn\'t like (nicht: likes)',
            en: 'After does not the verb has NO -s: She doesn\'t like (not: likes)'
          }
        }
      }
    ]
  }
]

/**
 * Get a lesson by ID
 */
export const getLessonById = (id) => {
  return LESSONS.find(lesson => lesson.id === id) || null
}

/**
 * Get all lessons sorted by order
 */
export const getAllLessons = () => {
  return [...LESSONS].sort((a, b) => a.order - b.order)
}

/**
 * Get sentence by ID across all lessons
 */
export const getSentenceById = (sentenceId) => {
  for (const lesson of LESSONS) {
    const sentence = lesson.sentences.find(s => s.id === sentenceId)
    if (sentence) return sentence
  }
  return null
}

/**
 * Shuffle an array (Fisher-Yates)
 */
export const shuffleArray = (array) => {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * Build multiple choice options for a sentence
 * @param {Object} sentence - The sentence object
 * @param {string} direction - 'de-en' or 'en-de'
 * @returns {Object} { question, correct, options }
 */
export const buildQuizOptions = (sentence, direction = 'de-en') => {
  const questionLang = direction === 'de-en' ? 'de' : 'en'
  const answerLang = direction === 'de-en' ? 'en' : 'de'

  const question = sentence[questionLang]
  const correct = sentence[answerLang]
  const wrong = sentence.wrongAnswers[answerLang]

  const options = shuffleArray([correct, ...wrong])

  return { question, correct, options }
}
