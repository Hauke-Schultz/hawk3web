<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useLangLocalStorage } from '../composables/useLangLocalStorage.js'
import { getLessonById, buildQuizOptions } from '../data/lessons.js'

const router = useRouter()
const route = useRoute()
const { gameData } = useLocalStorage()
const { langData, setDirection, recordAnswer, markLessonCompleted, getLessonProgress, getWrongSentenceIds } = useLangLocalStorage()

const lessonId = parseInt(route.params.id)
const lesson = getLessonById(lessonId)

// State
const currentIndex = ref(0)
const phase = ref('story') // 'story' | 'question' | 'choices' | 'result' | 'finished'
const selectedAnswer = ref(null)
const isCorrect = ref(false)
const showGrammar = ref(true)
const correctCount = ref(0)
const quizData = ref(null)
const wrongSentenceIds = ref([])
const activeSentences = ref(lesson ? [...lesson.sentences] : [])

const hasDialogue = computed(() => lesson && lesson.dialogue && lesson.dialogue.length > 0)

const currentSentence = computed(() => {
  return activeSentences.value[currentIndex.value] || null
})

const totalSentences = computed(() => activeSentences.value.length)

const progressPercent = computed(() => {
  if (!totalSentences.value) return 0
  return Math.round((currentIndex.value / totalSentences.value) * 100)
})

const directionLabel = computed(() => {
  return langData.direction === 'de-en' ? 'DE → EN' : 'EN → DE'
})

const questionLang = computed(() => langData.direction === 'de-en' ? 'de' : 'en')
const answerLang = computed(() => langData.direction === 'de-en' ? 'en' : 'de')

const toggleDirection = () => {
  setDirection(langData.direction === 'de-en' ? 'en-de' : 'de-en')
  // Rebuild current quiz with new direction if mid-exercise
  if (phase.value === 'question' || phase.value === 'choices') {
    buildQuiz()
  }
}

const buildQuiz = () => {
  if (!currentSentence.value) return
  quizData.value = buildQuizOptions(currentSentence.value, langData.direction)
  phase.value = 'question'
  selectedAnswer.value = null
  isCorrect.value = false
  showGrammar.value = true
}

const startQuizFromStory = () => {
  buildQuiz()
}

const revealChoices = () => {
  phase.value = 'choices'
}

const selectAnswer = (answer) => {
  if (phase.value === 'result') return

  selectedAnswer.value = answer
  isCorrect.value = answer === quizData.value.correct
  phase.value = 'result'

  if (isCorrect.value) {
    correctCount.value++
  } else {
    wrongSentenceIds.value.push(currentSentence.value.id)
  }

  recordAnswer(lessonId, currentSentence.value.id, isCorrect.value)
}

const isVisibleAnswer = (option) => {
  if (phase.value !== 'result') return true
  // Show only the correct answer and the selected wrong answer
  if (option === quizData.value.correct) return true
  if (option === selectedAnswer.value) return true
  return false
}

const getAnswerClass = (option) => {
  if (phase.value !== 'result') return ''
  if (option === quizData.value.correct) return 'answer--correct'
  if (option === selectedAnswer.value && !isCorrect.value) return 'answer--wrong'
  return ''
}

const nextSentence = () => {
  if (currentIndex.value + 1 >= totalSentences.value) {
    markLessonCompleted(lessonId)
    phase.value = 'finished'
    return
  }

  currentIndex.value++
  buildQuiz()
}

const restartLesson = (onlyWrong = false) => {
  currentIndex.value = 0
  correctCount.value = 0

  if (onlyWrong && wrongSentenceIds.value.length > 0) {
    activeSentences.value = lesson.sentences.filter(s => wrongSentenceIds.value.includes(s.id))
    wrongSentenceIds.value = []
    buildQuiz()
  } else {
    activeSentences.value = [...lesson.sentences]
    wrongSentenceIds.value = []
    // Show story again for full restart
    if (hasDialogue.value) {
      phase.value = 'story'
    } else {
      buildQuiz()
    }
  }
}

const goBack = () => {
  router.push('/hawkLang')
}

const startVocabTrainer = () => {
  router.push(`/hawkLang/lesson/${lessonId}/vocab`)
}

const openGrammar = () => {
  router.push(`/hawkLang/lesson/${lessonId}/grammar`)
}

const handleMenuClick = () => {
  router.push('/hawkLang')
}

onMounted(() => {
  if (!lesson) return

  const progress = getLessonProgress(lessonId)
  if (progress.completed) {
    // Load previous results
    const savedWrongIds = getWrongSentenceIds(lessonId)
    wrongSentenceIds.value = savedWrongIds
    const correct = Object.values(progress.sentences).filter(s => s.correct).length
    correctCount.value = correct
    activeSentences.value = [...lesson.sentences]
    phase.value = 'finished'
  } else if (hasDialogue.value) {
    phase.value = 'story'
  } else {
    buildQuiz()
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
      <button class="btn btn--primary" @click="goBack">Zurueck</button>
    </div>

    <!-- Finished screen -->
    <div v-else-if="phase === 'finished'" class="finished-screen">
      <div class="finished-card">
        <Icon name="trophy" size="64" />
        <h1 class="finished-title">Lektion abgeschlossen!</h1>
        <p class="finished-lesson">{{ lesson.title[questionLang] }}</p>

        <div class="score-display">
          <span class="score-number">{{ correctCount }}</span>
          <span class="score-divider">/</span>
          <span class="score-total">{{ totalSentences }}</span>
        </div>
        <p class="score-label">richtige Antworten</p>

        <div class="finished-actions">
          <button class="btn btn--primary" @click="restartLesson(false)">
            <Icon name="repeat" size="18" />
            Alle wiederholen
          </button>
          <button
            v-if="wrongSentenceIds.length > 0"
            class="btn btn--warning"
            @click="restartLesson(true)"
          >
            <Icon name="x-circle" size="18" />
            Nur Fehler ({{ wrongSentenceIds.length }})
          </button>
          <button class="btn btn--secondary" @click="startVocabTrainer">
            <Icon name="book-open" size="18" />
            Vokabeltrainer
          </button>
          <button class="btn btn--secondary" @click="openGrammar">
            <Icon name="info" size="18" />
            Grammatik nachschlagen
          </button>
          <button class="btn btn--ghost" @click="goBack">
            <Icon name="arrow-left" size="18" />
            Lektionen
          </button>
        </div>
      </div>
    </div>

    <!-- Story / Dialogue -->
    <div v-else-if="phase === 'story'" class="story-screen">
      <div class="story-header">
        <button class="btn btn--ghost btn--small" @click="goBack">
          <Icon name="arrow-left" size="18" />
        </button>
        <div class="story-header-text">
          <h1 class="story-title">{{ lesson.title[questionLang] }}</h1>
          <p class="story-subtitle">Geschichte</p>
        </div>
        <button class="direction-badge" @click="toggleDirection">
          <span>{{ directionLabel }}</span>
          <Icon name="repeat" size="12" />
        </button>
      </div>

      <div class="dialogue-container">
        <div
          v-for="(line, index) in lesson.dialogue"
          :key="index"
          class="dialogue-line"
          :class="index % 2 === 0 ? 'dialogue-line--left' : 'dialogue-line--right'"
        >
          <span class="dialogue-speaker">{{ line.speaker }}</span>
          <div class="dialogue-bubble">
            <p class="dialogue-text-primary">{{ line[questionLang] }}</p>
          </div>
        </div>
      </div>

      <div class="story-actions">
        <button
          class="btn btn--primary btn--large story-next-btn"
          @click="startQuizFromStory"
        >
          Übung starten
          <Icon name="arrow-right" size="18" />
        </button>
      </div>
    </div>

    <!-- Exercise flow -->
    <template v-else-if="quizData">
      <!-- Progress bar -->
      <div class="exercise-progress">
        <div class="progress-header">
          <button class="btn btn--ghost btn--small" @click="goBack">
            <Icon name="arrow-left" size="18" />
          </button>
          <span class="progress-label">{{ currentIndex + 1 }} / {{ totalSentences }}</span>
          <button class="direction-badge" @click="toggleDirection">
          <span>{{ directionLabel }}</span>
          <Icon name="repeat" size="12" />
        </button>
        </div>
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }"></div>
        </div>
      </div>

      <!-- Question -->
      <section class="question-section">
        <p class="question-hint">Uebersetze diesen Satz:</p>
        <h2 class="question-text">{{ quizData.question }}</h2>
      </section>

      <!-- Reveal button -->
      <section v-if="phase === 'question'" class="reveal-section">
        <button class="btn btn--primary btn--large" @click="revealChoices">
          Antworten anzeigen
        </button>
      </section>

      <!-- Multiple choice -->
      <section v-if="phase === 'choices' || phase === 'result'" class="choices-section">
        <template v-for="(option, index) in quizData.options" :key="index">
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
              v-if="phase === 'result' && option === quizData.correct"
              name="check"
              size="20"
              class="answer-icon"
            />
            <Icon
              v-if="phase === 'result' && option === selectedAnswer && !isCorrect && option !== quizData.correct"
              name="x"
              size="20"
              class="answer-icon"
            />
          </button>
        </template>
      </section>

      <!-- Feedback -->
      <section v-if="phase === 'result'" class="feedback-section">
        <div class="feedback-banner" :class="isCorrect ? 'feedback--correct' : 'feedback--wrong'">
          <Icon :name="isCorrect ? 'check-circle' : 'x-circle'" size="24" />
          <span>{{ isCorrect ? 'Richtig!' : 'Leider falsch.' }}</span>
        </div>

        <!-- Next button directly after feedback -->
        <button class="btn btn--primary btn--large next-btn" @click="nextSentence">
          {{ currentIndex + 1 >= totalSentences ? 'Ergebnis anzeigen' : 'Weiter' }}
          <Icon name="arrow-right" size="18" />
        </button>

        <!-- Vocabulary table (always visible) -->
        <div class="detail-block">
          <h3 class="detail-heading">
            <Icon name="book-open" size="18" />
            Vokabeln
          </h3>
          <table class="data-table">
            <thead>
              <tr>
                <th>{{ langData.direction === 'de-en' ? 'Deutsch' : 'English' }}</th>
                <th>{{ langData.direction === 'de-en' ? 'English' : 'Deutsch' }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(vocab, vIndex) in currentSentence.vocabulary" :key="vIndex">
                <td class="cell-source">{{ vocab[questionLang] }}</td>
                <td class="cell-target">{{ vocab[answerLang] }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Grammar table (toggle) -->
        <div v-if="currentSentence.grammar" class="detail-block">
          <button class="detail-heading detail-heading--toggle" @click="showGrammar = !showGrammar">
            <Icon name="book-open" size="18" />
            <span class="detail-heading__title">{{ currentSentence.grammar.title[questionLang] }}</span>
            <Icon :name="showGrammar ? 'chevron-up' : 'chevron-down'" size="16" class="toggle-icon" />
          </button>

          <div v-if="showGrammar" class="grammar-content">
            <table class="data-table data-table--grammar">
              <thead>
                <tr>
                  <th
                    v-for="(col, cIndex) in currentSentence.grammar.columns[questionLang]"
                    :key="cIndex"
                  >
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, rIndex) in currentSentence.grammar.rows" :key="rIndex">
                  <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
                </tr>
              </tbody>
            </table>

            <p v-if="currentSentence.grammar.note" class="grammar-note">
              <Icon name="info" size="14" />
              {{ currentSentence.grammar.note[questionLang] }}
            </p>
          </div>
        </div>
      </section>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.exercise-progress {
  margin-bottom: var(--space-4);
}

.progress-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--space-2);
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.direction-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-1);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  font-family: var(--font-family-base);
  color: var(--primary-color);
  background-color: var(--card-bg);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  padding: var(--space-1) var(--space-2);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-color);
    color: var(--white);
  }
}

.progress-track {
  width: 100%;
  height: 6px;
  background-color: var(--card-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background-color: var(--primary-color);
  border-radius: 3px;
  transition: width 0.4s ease;
}

.question-section {
  text-align: center;
  padding: var(--space-6) 0;
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

.reveal-section {
  display: flex;
  justify-content: center;
  padding: var(--space-4) 0;
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

.btn--secondary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--card-bg);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-family: var(--font-family-base);
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--primary-color);
    color: var(--white);
  }
}

.btn--warning {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  background-color: var(--warning-color, #f59e0b);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-md);
  padding: var(--space-2) var(--space-4);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  font-family: var(--font-family-base);
  transition: all 0.2s ease;

  &:hover {
    opacity: 0.9;
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

.detail-block {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.detail-heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  margin: 0;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
}

.detail-heading__title {
	flex: 1;
}

.detail-heading--toggle {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-family: var(--font-family-base);
  transition: background-color 0.2s ease;

  &:hover {
    background-color: var(--card-bg-hover);
  }

  span {
    text-align: left;
  }

  .toggle-icon {
    color: var(--text-secondary);
  }
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: var(--font-size-sm);

  th, td {
    padding: var(--space-2) var(--space-4);
    text-align: left;
    border-top: 1px solid var(--card-border);
  }

  th {
    font-weight: var(--font-weight-bold);
    color: var(--text-secondary);
    font-size: var(--font-size-xs);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    background-color: var(--card-bg-hover, rgba(0, 0, 0, 0.03));
  }

  td {
    color: var(--text-color);
  }

  tbody tr:hover {
    background-color: var(--card-bg-hover, rgba(0, 0, 0, 0.02));
  }
}

.cell-source {
  font-weight: var(--font-weight-bold);
}

.cell-target {
  color: var(--primary-color);
  font-weight: var(--font-weight-bold);
}

.data-table--grammar {
  td:first-child {
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
  }
}

.grammar-content {
  margin: 0;
}

.grammar-note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-2) var(--space-4) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-style: italic;
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

/* Story / Dialogue */
.story-screen {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.story-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
}

.story-header-text {
  flex: 1;
}

.story-title {
  font-size: var(--font-size-xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.story-subtitle {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  margin: 0;
}

.dialogue-container {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding-bottom: var(--space-4);
}

.dialogue-line {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}

.dialogue-line--left {
  align-self: flex-start;
}

.dialogue-line--right {
  align-self: flex-end;
}

.dialogue-speaker {
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--text-secondary);
  margin-bottom: var(--space-1);
  padding: 0 var(--space-3);
}

.dialogue-line--right .dialogue-speaker {
  text-align: right;
}

.dialogue-bubble {
  padding: var(--space-3) var(--space-4);
  border-radius: var(--border-radius-lg);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
}

.dialogue-line--left .dialogue-bubble {
  border-bottom-left-radius: var(--space-1);
}

.dialogue-line--right .dialogue-bubble {
  border-bottom-right-radius: var(--space-1);
  background-color: var(--primary-color);
  border-color: var(--primary-color);

  .dialogue-text-primary {
    color: var(--white);
  }
}

.dialogue-text-primary {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
  line-height: 1.5;
}

.story-actions {
  padding: var(--space-2) 0 var(--space-4);
}

.story-next-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
}

.error-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-secondary);
}
</style>
