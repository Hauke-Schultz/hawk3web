<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useLangLocalStorage } from '../composables/useLangLocalStorage.js'
import { getLessonById, shuffleArray } from '../data/lessons.js'

const router = useRouter()
const route = useRoute()
const { gameData } = useLocalStorage()
const { langData } = useLangLocalStorage()

const lessonId = parseInt(route.params.id)
const lesson = getLessonById(lessonId)

// Collect all unique vocabulary from the lesson (fixed order)
const allVocabulary = computed(() => {
  if (!lesson) return []
  const seen = new Set()
  const vocabs = []
  for (const sentence of lesson.sentences) {
    for (const v of sentence.vocabulary) {
      const key = `${v.de}|${v.en}`
      if (!seen.has(key)) {
        seen.add(key)
        vocabs.push(v)
      }
    }
  }
  return vocabs
})

const vocabKey = (v) => `${v.de}|${v.en}`

// State
const currentIndex = ref(0)
const phase = ref('quiz') // 'quiz' | 'result' | 'finished'
const selectedAnswer = ref(null)
const isCorrect = ref(false)
const correctCount = ref(0)
const quizOrder = ref([])
const quizOptions = ref([])
const wrongVocabs = ref([])
const sessionResults = ref({})

const questionLang = computed(() => langData.direction === 'de-en' ? 'de' : 'en')
const answerLang = computed(() => langData.direction === 'de-en' ? 'en' : 'de')
const directionLabel = computed(() => langData.direction === 'de-en' ? 'DE → EN' : 'EN → DE')

const currentVocab = computed(() => {
  if (quizOrder.value.length === 0) return null
  return quizOrder.value[currentIndex.value] || null
})

const totalVocabs = computed(() => quizOrder.value.length)

const initSessionResults = (keepCorrect = false) => {
  if (!lesson) return
  const result = {}
  allVocabulary.value.forEach(v => {
    const key = vocabKey(v)
    result[key] = (keepCorrect && sessionResults.value[key] === 'correct') ? 'correct' : 'pending'
  })
  sessionResults.value = result
}

const buildVocabQuiz = () => {
  if (!currentVocab.value) return

  const correct = currentVocab.value[answerLang.value]

  // Pick 3 random wrong answers from other vocabs
  const otherVocabs = allVocabulary.value.filter(v => v[answerLang.value] !== correct)
  const wrongPool = shuffleArray(otherVocabs).slice(0, 3).map(v => v[answerLang.value])

  // If not enough wrong answers, pad with placeholders
  while (wrongPool.length < 3) {
    wrongPool.push('—')
  }

  quizOptions.value = shuffleArray([correct, ...wrongPool])
  phase.value = 'quiz'
  selectedAnswer.value = null
  isCorrect.value = false
}

const selectAnswer = (answer) => {
  if (phase.value === 'result') return

  const correct = currentVocab.value[answerLang.value]
  selectedAnswer.value = answer
  isCorrect.value = answer === correct
  phase.value = 'result'

  if (isCorrect.value) {
    correctCount.value++
  } else {
    wrongVocabs.value.push(currentVocab.value)
  }

  sessionResults.value[vocabKey(currentVocab.value)] = isCorrect.value ? 'correct' : 'wrong'
}

const isVisibleAnswer = (option) => {
  if (phase.value !== 'result') return true
  const correct = currentVocab.value[answerLang.value]
  if (option === correct) return true
  if (option === selectedAnswer.value) return true
  return false
}

const getAnswerClass = (option) => {
  if (phase.value !== 'result') return ''
  const correct = currentVocab.value[answerLang.value]
  if (option === correct) return 'answer--correct'
  if (option === selectedAnswer.value && !isCorrect.value) return 'answer--wrong'
  return ''
}

const nextVocab = () => {
  if (currentIndex.value + 1 >= totalVocabs.value) {
    phase.value = 'finished'
    return
  }
  currentIndex.value++
  buildVocabQuiz()
}

const restart = () => {
  currentIndex.value = 0
  correctCount.value = 0
  wrongVocabs.value = []
  quizOrder.value = shuffleArray([...allVocabulary.value])
  initSessionResults(false)
  buildVocabQuiz()
}

const restartWrong = () => {
  currentIndex.value = 0
  correctCount.value = 0
  quizOrder.value = shuffleArray([...wrongVocabs.value])
  wrongVocabs.value = []
  initSessionResults(true)
  buildVocabQuiz()
}

const goBack = () => {
  router.push(`/hawkLang/lesson/${lessonId}`)
}

const handleMenuClick = () => {
  router.push('/hawkLang')
}

onMounted(() => {
  if (lesson && allVocabulary.value.length > 0) {
    initSessionResults(false)
    quizOrder.value = shuffleArray([...allVocabulary.value])
    buildVocabQuiz()
  }
})
</script>

<template>
  <Header
    :game-data="gameData"
    :player="gameData.player"
    :achievements="gameData.achievements"
    :show-menu-button="true"
    @menu-click="handleMenuClick"
  />

  <main class="content">
    <!-- No lesson found -->
    <div v-if="!lesson" class="error-state">
      <p>Lektion nicht gefunden.</p>
      <button class="btn btn--primary" @click="goBack">Zurück</button>
    </div>

    <!-- Finished screen -->
    <div v-else-if="phase === 'finished'" class="finished-screen">
      <div class="finished-card">
        <Icon name="book-open" size="64" />
        <h1 class="finished-title">Vokabeln abgeschlossen!</h1>
        <p class="finished-lesson">{{ lesson.title[questionLang] }}</p>

        <div class="score-display">
          <span class="score-number">{{ correctCount }}</span>
          <span class="score-divider">/</span>
          <span class="score-total">{{ totalVocabs }}</span>
        </div>
        <p class="score-label">richtige Antworten</p>

        <!-- Segment track on finished screen -->
        <div class="progress-track progress-track--finished">
          <div
            v-for="vocab in allVocabulary"
            :key="vocabKey(vocab)"
            class="progress-segment"
            :class="sessionResults[vocabKey(vocab)] || 'pending'"
          ></div>
        </div>

        <div class="finished-actions">
          <button class="btn btn--primary" @click="restart">
            <Icon name="repeat" size="18" />
            Alle wiederholen
          </button>
          <button
            v-if="wrongVocabs.length > 0"
            class="btn btn--warning"
            @click="restartWrong"
          >
            <Icon name="x-circle" size="18" />
            Nur Fehler ({{ wrongVocabs.length }})
          </button>
          <button class="btn btn--ghost" @click="goBack">
            <Icon name="arrow-left" size="18" />
            Zurück zur Lektion
          </button>
        </div>
      </div>
    </div>

    <!-- Vocab quiz -->
    <template v-else-if="currentVocab">
      <!-- Progress -->
      <div class="exercise-progress">
        <div class="progress-header">
          <button class="btn btn--ghost btn--small" @click="goBack">
            <Icon name="arrow-left" size="18" />
          </button>
          <span class="progress-label">{{ currentIndex + 1 }} / {{ totalVocabs }}</span>
          <span class="direction-badge">{{ directionLabel }}</span>
        </div>
        <div class="progress-track">
          <div
            v-for="vocab in allVocabulary"
            :key="vocabKey(vocab)"
            class="progress-segment"
            :class="[
              sessionResults[vocabKey(vocab)] || 'pending',
              { 'progress-segment--current': currentVocab && vocabKey(vocab) === vocabKey(currentVocab) }
            ]"
          ></div>
        </div>
      </div>

      <!-- Vocab question -->
      <section class="question-section">
        <p class="question-hint">Übersetze:</p>
        <h2 class="question-text">{{ currentVocab[questionLang] }}</h2>
      </section>

      <!-- Multiple choice -->
      <section class="choices-section">
        <template v-for="(option, index) in quizOptions" :key="index">
          <button
            v-if="isVisibleAnswer(option)"
            class="answer-btn"
            :class="getAnswerClass(option)"
            :disabled="phase === 'result'"
            @click="selectAnswer(option)"
          >
            <span class="answer-letter">{{ ['A', 'B', 'C', 'D'][index] }}</span>
            <span class="answer-text">{{ option }}</span>
            <Icon
              v-if="phase === 'result' && option === currentVocab[answerLang]"
              name="check"
              size="20"
              class="answer-icon"
            />
            <Icon
              v-if="phase === 'result' && option === selectedAnswer && !isCorrect && option !== currentVocab[answerLang]"
              name="x"
              size="20"
              class="answer-icon"
            />
          </button>
        </template>
      </section>

      <!-- Feedback + Next -->
      <section v-if="phase === 'result'" class="feedback-section">
        <div class="feedback-banner" :class="isCorrect ? 'feedback--correct' : 'feedback--wrong'">
          <Icon :name="isCorrect ? 'check-circle' : 'x-circle'" size="24" />
          <span>{{ isCorrect ? 'Richtig!' : 'Leider falsch.' }}</span>
        </div>

        <button class="btn btn--primary btn--large next-btn" @click="nextVocab">
          {{ currentIndex + 1 >= totalVocabs ? 'Ergebnis anzeigen' : 'Weiter' }}
          <Icon name="arrow-right" size="18" />
        </button>
      </section>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.exercise-progress {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.progress-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  white-space: nowrap;
}

.direction-badge {
  margin-left: auto;
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  background-color: var(--card-bg);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  padding: var(--space-1) var(--space-2);
}

.progress-track {
  display: flex;
  gap: 4px;
  width: 100%;

  &--finished {
    width: 100%;
  }
}

.progress-segment {
  flex: 1;
  height: 8px;
  border-radius: 3px;
  background-color: var(--card-border);
  transition: background-color 0.3s ease;

  &.correct {
    background-color: var(--success-color, #22c55e);
  }

  &.wrong {
    background-color: var(--error-color, #ef4444);
  }

  &.progress-segment--current {
    background-color: var(--primary-color);
    opacity: 0.5;
  }
}

.question-section {
  text-align: center;
  padding: var(--space-8) 0 var(--space-6);
}

.question-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-2) 0;
}

.question-text {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  line-height: 1.4;
}

.choices-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.answer-btn {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  width: 100%;
  padding: var(--space-3) var(--space-4);
  background-color: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
  font-size: var(--font-size-base);
  color: var(--text-color);
  text-align: left;
  min-height: 48px;

  &:hover:not(:disabled) {
    border-color: var(--primary-color);
    background-color: var(--card-bg-hover);
  }

  &:disabled {
    cursor: default;
  }
}

.answer-letter {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--card-border);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-sm);
  flex-shrink: 0;
}

.answer-text {
  flex: 1;
}

.answer-icon {
  flex-shrink: 0;
}

.answer--correct {
  border-color: var(--success-color, #22c55e);
  background-color: rgba(34, 197, 94, 0.1);

  .answer-letter {
    background-color: var(--success-color, #22c55e);
    color: var(--white);
  }
}

.answer--wrong {
  border-color: var(--error-color, #ef4444);
  background-color: rgba(239, 68, 68, 0.1);

  .answer-letter {
    background-color: var(--error-color, #ef4444);
    color: var(--white);
  }
}

.feedback-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.feedback-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-lg);
  font-weight: var(--font-weight-bold);
  font-size: var(--font-size-lg);
}

.feedback--correct {
  background-color: rgba(34, 197, 94, 0.15);
  color: var(--success-color, #22c55e);
}

.feedback--wrong {
  background-color: rgba(239, 68, 68, 0.15);
  color: var(--error-color, #ef4444);
}

.next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
}

/* Finished screen */
.finished-screen {
  display: flex;
  justify-content: center;
  padding: var(--space-6) 0;
}

.finished-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: var(--space-3);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-6);
  max-width: 400px;
  width: 100%;
}

.finished-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.finished-lesson {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

.score-display {
  display: flex;
  align-items: baseline;
  gap: var(--space-1);
}

.score-number {
  font-size: 3rem;
  font-weight: var(--font-weight-bold);
  color: var(--success-color, #22c55e);
}

.score-divider {
  font-size: var(--font-size-2xl);
  color: var(--text-secondary);
}

.score-total {
  font-size: var(--font-size-2xl);
  color: var(--text-secondary);
}

.score-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.finished-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  margin-top: var(--space-3);
  width: 100%;

  .btn {
    width: 100%;
    justify-content: center;
  }
}

.error-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-secondary);
}
</style>
