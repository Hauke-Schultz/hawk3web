<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useLangLocalStorage } from '../composables/useLangLocalStorage.js'
import { getLessonById, shuffleArray } from '../data/lessons.js'

const router = useRouter()
const route = useRoute()
const { gameData } = useLocalStorage()
const { langData, saveVocabProgress, getVocabProgress, clearVocabProgress } = useLangLocalStorage()

const lessonId = parseInt(route.params.id)
const lesson = getLessonById(lessonId)

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

const questionLang = computed(() => langData.direction === 'de-en' ? 'de' : 'en')
const answerLang = computed(() => langData.direction === 'de-en' ? 'en' : 'de')
const directionLabel = computed(() => langData.direction === 'de-en' ? 'DE → EN' : 'EN → DE')
const answerLangLabel = computed(() => answerLang.value === 'en' ? 'Englisch' : 'Deutsch')

// State
const currentIndex = ref(0)
const phase = ref('typing') // 'typing' | 'result' | 'finished'
const userInput = ref('')
const isCorrect = ref(false)
const wasFuzzy = ref(false)
const correctCount = ref(0)
const wrongVocabs = ref([])
const quizOrder = ref([])
const sessionResults = ref({})
const streak = ref(0)
const bestStreak = ref(0)
const inputRef = ref(null)

const currentVocab = computed(() => quizOrder.value[currentIndex.value] || null)
const totalVocabs = computed(() => quizOrder.value.length)

// Levenshtein distance
const levenshtein = (a, b) => {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => [i])
  for (let j = 0; j <= a.length; j++) dp[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      dp[i][j] = b[i - 1] === a[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j - 1], dp[i][j - 1], dp[i - 1][j])
    }
  }
  return dp[b.length][a.length]
}

// Fuzzy match: words ≤4 chars need exact match, 5-8 chars allow 1 typo, 9+ allow 2
// Also handles "to drink" vs "drink" (missing or extra "to" prefix)
const checkAnswer = (input, correct) => {
  const a = input.trim().toLowerCase()
  const b = correct.trim().toLowerCase()
  if (a === b) return { match: true, fuzzy: false }

  // "to drink" eingegeben, "drink" erwartet — oder umgekehrt
  if (b.startsWith('to ') && a === b.slice(3)) return { match: true, fuzzy: true }
  if (a.startsWith('to ') && a.slice(3) === b) return { match: true, fuzzy: true }

  const maxDist = b.length <= 4 ? 0 : b.length <= 8 ? 1 : 2
  const dist = levenshtein(a, b)
  return { match: dist <= maxDist, fuzzy: dist > 0 && dist <= maxDist }
}

const initSessionResults = () => {
  const result = {}
  allVocabulary.value.forEach(v => { result[vocabKey(v)] = 'pending' })
  sessionResults.value = result
}

const focusInput = async () => {
  await nextTick()
  inputRef.value?.focus()
}

const submitAnswer = () => {
  if (phase.value !== 'typing' || !userInput.value.trim()) return

  const correct = currentVocab.value[answerLang.value]
  const result = checkAnswer(userInput.value, correct)
  isCorrect.value = result.match
  wasFuzzy.value = result.fuzzy
  phase.value = 'result'

  if (isCorrect.value) {
    correctCount.value++
    streak.value++
    if (streak.value > bestStreak.value) bestStreak.value = streak.value
  } else {
    wrongVocabs.value.push(currentVocab.value)
    streak.value = 0
  }

  sessionResults.value[vocabKey(currentVocab.value)] = isCorrect.value ? 'correct' : 'wrong'
}

const skipVocab = () => {
  if (phase.value !== 'typing') return
  isCorrect.value = false
  wasFuzzy.value = false
  phase.value = 'result'
  wrongVocabs.value.push(currentVocab.value)
  streak.value = 0
  sessionResults.value[vocabKey(currentVocab.value)] = 'wrong'
}

const finishGame = () => {
  phase.value = 'finished'
  saveVocabProgress(lessonId, langData.direction, {
    correctCount: correctCount.value,
    sessionResults: { ...sessionResults.value },
    bestStreak: bestStreak.value,
    wrongVocabs: [...wrongVocabs.value]
  })
}

const nextVocab = () => {
  if (currentIndex.value + 1 >= totalVocabs.value) {
    finishGame()
    return
  }
  currentIndex.value++
  userInput.value = ''
  phase.value = 'typing'
  focusInput()
}

const restart = () => {
  clearVocabProgress(lessonId, langData.direction)
  currentIndex.value = 0
  correctCount.value = 0
  wrongVocabs.value = []
  streak.value = 0
  bestStreak.value = 0
  quizOrder.value = shuffleArray([...allVocabulary.value])
  initSessionResults()
  userInput.value = ''
  phase.value = 'typing'
  focusInput()
}

const restartWrong = () => {
  clearVocabProgress(lessonId, langData.direction)
  const wrongs = [...wrongVocabs.value]
  currentIndex.value = 0
  correctCount.value = 0
  wrongVocabs.value = []
  streak.value = 0
  quizOrder.value = shuffleArray(wrongs)
  initSessionResults()
  userInput.value = ''
  phase.value = 'typing'
  focusInput()
}

const goBack = () => router.push(`/hawkLang/lesson/${lessonId}`)
const handleMenuClick = () => router.push('/hawkLang')

const handleKeydown = (e) => {
  if (e.key === 'Enter') {
    if (phase.value === 'typing') submitAnswer()
    else if (phase.value === 'result') nextVocab()
  }
}

onMounted(() => {
  if (!lesson || allVocabulary.value.length === 0) return

  const saved = getVocabProgress(lessonId, langData.direction)

  if (route.query.mode === 'wrong' && saved?.wrongVocabs?.length > 0) {
    clearVocabProgress(lessonId, langData.direction)
    const wrongs = saved.wrongVocabs
    correctCount.value = 0
    wrongVocabs.value = []
    streak.value = 0
    bestStreak.value = 0
    quizOrder.value = shuffleArray(wrongs)
    initSessionResults()
    userInput.value = ''
    phase.value = 'typing'
    focusInput()
    return
  }

  if (saved) {
    correctCount.value = saved.correctCount
    sessionResults.value = saved.sessionResults
    bestStreak.value = saved.bestStreak
    wrongVocabs.value = saved.wrongVocabs || []
    quizOrder.value = [...allVocabulary.value]
    phase.value = 'finished'
  } else {
    initSessionResults()
    quizOrder.value = shuffleArray([...allVocabulary.value])
    focusInput()
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

        <div v-if="bestStreak > 1" class="streak-stat">
          Beste Serie: {{ bestStreak }}x
        </div>

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

    <!-- Typing game -->
    <template v-else-if="currentVocab">
      <!-- Progress bar -->
      <div class="exercise-progress">
        <div class="progress-header">
          <button class="btn btn--ghost btn--small" @click="goBack">
            <Icon name="arrow-left" size="18" />
          </button>
          <span class="progress-label">{{ currentIndex + 1 }} / {{ totalVocabs }}</span>
          <div v-if="streak > 1" class="streak-badge">{{ streak }}x</div>
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

      <!-- Question word -->
      <section class="question-section">
        <p class="question-hint">Schreibe auf {{ answerLangLabel }}:</p>
        <h2 class="question-text">{{ currentVocab[questionLang] }}</h2>
      </section>

      <!-- Input area -->
      <section class="input-section">
        <div class="input-row">
          <input
            ref="inputRef"
            v-model="userInput"
            class="vocab-input"
            :class="{
              'vocab-input--correct': phase === 'result' && isCorrect,
              'vocab-input--wrong': phase === 'result' && !isCorrect
            }"
            :disabled="phase === 'result'"
            placeholder="Übersetzung eingeben..."
            autocomplete="off"
            autocorrect="off"
            autocapitalize="off"
            spellcheck="false"
            @keydown="handleKeydown"
          />
          <button
            v-if="phase === 'typing'"
            class="btn btn--primary submit-btn"
            :disabled="!userInput.trim()"
            @click="submitAnswer"
          >
            <Icon name="check" size="20" />
          </button>
        </div>

        <button
          v-if="phase === 'typing'"
          class="btn btn--ghost skip-btn"
          @click="skipVocab"
        >
          Weiß ich nicht
        </button>

        <!-- Feedback -->
        <div v-if="phase === 'result'" class="feedback-area">
          <div class="feedback-banner" :class="isCorrect ? 'feedback--correct' : 'feedback--wrong'">
            <Icon :name="isCorrect ? 'check-circle' : 'x-circle'" size="20" />
            <span v-if="isCorrect && wasFuzzy">Fast perfekt — gemeint war: <strong>{{ currentVocab[answerLang] }}</strong></span>
            <span v-else-if="isCorrect">Richtig!</span>
            <span v-else>Richtige Antwort: <strong>{{ currentVocab[answerLang] }}</strong></span>
          </div>

          <button class="btn btn--primary btn--large next-btn" @click="nextVocab">
            {{ currentIndex + 1 >= totalVocabs ? 'Ergebnis anzeigen' : 'Weiter' }}
            <Icon name="arrow-right" size="18" />
          </button>
          <p class="enter-hint">oder Enter drücken</p>
        </div>
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

.streak-badge {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.15);
  border: 1px solid rgba(245, 158, 11, 0.4);
  border-radius: var(--border-radius-md);
  padding: var(--space-1) var(--space-2);
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
  padding: var(--space-10) 0 var(--space-8);
}

.question-hint {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0 0 var(--space-3) 0;
}

.question-text {
  font-size: var(--font-size-3xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  line-height: 1.3;
}

.input-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.input-row {
  display: flex;
  gap: var(--space-2);
  align-items: stretch;
}

.vocab-input {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  font-size: var(--font-size-lg);
  font-family: var(--font-family-base);
  color: var(--text-color);
  background-color: var(--card-bg);
  border: 2px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  outline: none;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:focus {
    border-color: var(--primary-color);
  }

  &:disabled {
    cursor: default;
  }

  &--correct {
    border-color: var(--success-color, #22c55e);
    background-color: rgba(34, 197, 94, 0.06);
  }

  &--wrong {
    border-color: var(--error-color, #ef4444);
    background-color: rgba(239, 68, 68, 0.06);
    animation: shake 0.35s ease;
  }
}

.submit-btn {
  padding: var(--space-3) var(--space-4);
  flex-shrink: 0;
}

.skip-btn {
  align-self: center;
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.feedback-area {
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
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);

  strong {
    font-weight: var(--font-weight-bold);
  }
}

.feedback--correct {
  background-color: rgba(34, 197, 94, 0.12);
  color: var(--success-color, #22c55e);
}

.feedback--wrong {
  background-color: rgba(239, 68, 68, 0.12);
  color: var(--error-color, #ef4444);
}

.next-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  width: 100%;
}

.enter-hint {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
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

.streak-stat {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: #f59e0b;
  background-color: rgba(245, 158, 11, 0.12);
  border: 1px solid rgba(245, 158, 11, 0.3);
  border-radius: var(--border-radius-md);
  padding: var(--space-1) var(--space-3);
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

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%       { transform: translateX(-8px); }
  40%       { transform: translateX(8px); }
  60%       { transform: translateX(-5px); }
  80%       { transform: translateX(5px); }
}
</style>
