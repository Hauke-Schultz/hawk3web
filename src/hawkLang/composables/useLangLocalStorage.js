import { reactive, watch } from 'vue'

const LANG_STORAGE_KEY = 'hawk3_lang_data'

const getDefaultLangData = () => ({
  // Training direction: 'de-en' or 'en-de'
  direction: 'de-en',

  // Progress per lesson: { lessonId: { completed: false, sentences: { sentenceId: { correct: bool } } } }
  lessonProgress: {},

  // Statistics
  stats: {
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    lessonsCompleted: 0,
    currentStreak: 0,
    longestStreak: 0
  }
})

const loadLangData = () => {
  if (typeof localStorage === 'undefined') {
    return getDefaultLangData()
  }

  try {
    const stored = localStorage.getItem(LANG_STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        ...getDefaultLangData(),
        ...parsed,
        stats: {
          ...getDefaultLangData().stats,
          ...(parsed.stats || {})
        }
      }
    }
  } catch (error) {
    console.error('Error loading lang data from localStorage:', error)
  }
  return getDefaultLangData()
}

const saveLangData = (data) => {
  if (typeof localStorage === 'undefined') return false
  try {
    localStorage.setItem(LANG_STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.error('Error saving lang data to localStorage:', error)
    return false
  }
}

const langData = reactive(loadLangData())

watch(
  () => langData,
  (newData) => { saveLangData(newData) },
  { deep: true }
)

export function useLangLocalStorage() {

  const setDirection = (direction) => {
    langData.direction = direction
  }

  const recordAnswer = (lessonId, sentenceId, isCorrect) => {
    // Ensure lesson progress exists
    if (!langData.lessonProgress[lessonId]) {
      langData.lessonProgress[lessonId] = { completed: false, sentences: {} }
    }

    langData.lessonProgress[lessonId].sentences[sentenceId] = {
      correct: isCorrect,
      answeredAt: new Date().toISOString()
    }

    // Update stats
    langData.stats.totalAnswered++
    if (isCorrect) {
      langData.stats.totalCorrect++
      langData.stats.currentStreak++
      if (langData.stats.currentStreak > langData.stats.longestStreak) {
        langData.stats.longestStreak = langData.stats.currentStreak
      }
    } else {
      langData.stats.totalWrong++
      langData.stats.currentStreak = 0
    }
  }

  const markLessonCompleted = (lessonId) => {
    if (!langData.lessonProgress[lessonId]) {
      langData.lessonProgress[lessonId] = { completed: false, sentences: {} }
    }
    langData.lessonProgress[lessonId].completed = true
    langData.stats.lessonsCompleted++
  }

  const getLessonProgress = (lessonId) => {
    return langData.lessonProgress[lessonId] || { completed: false, sentences: {} }
  }

  const getLessonScore = (lessonId, totalSentences) => {
    const progress = getLessonProgress(lessonId)
    const answered = Object.keys(progress.sentences).length
    const correct = Object.values(progress.sentences).filter(s => s.correct).length
    return { answered, correct, total: totalSentences }
  }

  const getWrongSentenceIds = (lessonId) => {
    const progress = getLessonProgress(lessonId)
    return Object.entries(progress.sentences)
      .filter(([, data]) => !data.correct)
      .map(([id]) => parseInt(id))
  }

  const resetLessonProgress = (lessonId) => {
    delete langData.lessonProgress[lessonId]
  }

  const resetAllProgress = () => {
    Object.assign(langData, getDefaultLangData())
  }

  return {
    langData,
    setDirection,
    recordAnswer,
    markLessonCompleted,
    getLessonProgress,
    getLessonScore,
    getWrongSentenceIds,
    resetLessonProgress,
    resetAllProgress
  }
}
