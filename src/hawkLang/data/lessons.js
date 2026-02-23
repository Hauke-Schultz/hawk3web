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
          content: {
            de: 'I am = ich bin | you are = du bist | he is = er ist | she is = sie ist | it is = es ist | we are = wir sind | they are = sie sind',
            en: 'I am | you are | he is | she is | it is | we are | they are'
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
          content: {
            de: 'my = mein | your = dein/Ihr | his = sein | her = ihr | its = sein | our = unser | their = ihr',
            en: 'my | your | his | her | its | our | their'
          }
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
          content: {
            de: 'Do + I/you/we/they + Verb | Does + he/she/it + Verb | Beispiel: Do you live here? = Wohnst du hier?',
            en: 'Do + I/you/we/they + verb | Does + he/she/it + verb | Example: Do you live here?'
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
          content: {
            de: 'I live | you live | he/she/it lives (Achtung: -s bei 3. Person!) | we live | they live',
            en: 'I live | you live | he/she/it lives (note: -s for 3rd person!) | we live | they live'
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
          content: {
            de: 'he/she/it + Verb + s | he speaks | she lives | it works | Ausnahmen: do -> does, go -> goes, have -> has',
            en: 'he/she/it + verb + s | he speaks | she lives | it works | Exceptions: do -> does, go -> goes, have -> has'
          }
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
          content: {
            de: 'to + Grundform des Verbs | to meet = treffen/kennenlernen | to live = leben/wohnen | to speak = sprechen',
            en: 'to + base form of verb | to meet | to live | to speak'
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
          content: {
            de: 'Am I...? | Are you...? | Is he/she/it...? | Are we...? | Are they...? | Verb vor dem Subjekt!',
            en: 'Am I...? | Are you...? | Is he/she/it...? | Are we...? | Are they...? | Verb before subject!'
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
          content: {
            de: 'Englisch: I am + Zahl + years old | NICHT: I have... years (wie im Franzoesischen) | Deutsch: Ich bin + Zahl + Jahre alt',
            en: 'English uses "to be": I am 30 years old | NOT: I have 30 years'
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
          content: {
            de: 'I have | you have | he/she/it has | we have | they have | Achtung: has nur bei 3. Person Singular!',
            en: 'I have | you have | he/she/it has | we have | they have | Note: has only for 3rd person singular!'
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
          content: {
            de: 'Subjekt + Verb + Objekt + Zeitangabe | She drinks coffee every morning | Im Deutschen ist die Satzstellung flexibler',
            en: 'Subject + Verb + Object + Time | She drinks coffee every morning'
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
          content: {
            de: 'am/is/are + Verb + -ing | I am going | you are going | Wird fuer geplante Handlungen und aktuelle Aktionen benutzt',
            en: 'am/is/are + verb + -ing | I am going | you are going | Used for planned actions and current activities'
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
          content: {
            de: 'can/could = koennen | must = muessen | should = sollen | may = duerfen | Modalverb + Grundform (OHNE to!) | Can you help?',
            en: 'can/could | must | should | may | Modal verb + base form (NO to!) | Can you help?'
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
          content: {
            de: 'the = der/die/das (bestimmt) | a = ein/eine (unbestimmt, vor Konsonant) | an = ein/eine (vor Vokal) | the weather, a dog, an apple',
            en: 'the = definite article | a = indefinite (before consonant) | an = indefinite (before vowel) | the weather, a dog, an apple'
          }
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
          content: {
            de: 'I/you/we/they + do not (don\'t) + Verb | he/she/it + does not (doesn\'t) + Verb | I do not like = Ich mag nicht',
            en: 'I/you/we/they + do not (don\'t) + verb | he/she/it + does not (doesn\'t) + verb'
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
