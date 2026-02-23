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
const { langData, recordAnswer, markLessonCompleted } = useLangLocalStorage()

const lessonId = parseInt(route.params.id)
const lesson = getLessonById(lessonId)

// State
const currentIndex = ref(0)
const phase = ref('question') // 'question' | 'choices' | 'result' | 'finished'
const selectedAnswer = ref(null)
const isCorrect = ref(false)
const showVocabulary = ref(false)
const showGrammar = ref(false)
const correctCount = ref(0)
const quizData = ref(null)

const currentSentence = computed(() => {
  if (!lesson) return null
  return lesson.sentences[currentIndex.value] || null
})

const totalSentences = computed(() => lesson ? lesson.sentences.length : 0)

const progressPercent = computed(() => {
  if (!totalSentences.value) return 0
  return Math.round((currentIndex.value / totalSentences.value) * 100)
})

const directionLabel = computed(() => {
  return langData.direction === 'de-en' ? 'DE → EN' : 'EN → DE'
})

const questionLang = computed(() => langData.direction === 'de-en' ? 'de' : 'en')
const answerLang = computed(() => langData.direction === 'de-en' ? 'en' : 'de')

const buildQuiz = () => {
  if (!currentSentence.value) return
  quizData.value = buildQuizOptions(currentSentence.value, langData.direction)
  phase.value = 'question'
  selectedAnswer.value = null
  isCorrect.value = false
  showVocabulary.value = false
  showGrammar.value = false
}

const revealChoices = () => {
  phase.value = 'choices'
}

const selectAnswer = (answer) => {
  if (phase.value === 'result') return

  selectedAnswer.value = answer
  isCorrect.value = answer === quizData.value.correct
  phase.value = 'result'

  if (isCorrect.value) correctCount.value++

  recordAnswer(lessonId, currentSentence.value.id, isCorrect.value)
}

const getAnswerClass = (option) => {
  if (phase.value !== 'result') return ''
  if (option === quizData.value.correct) return 'answer--correct'
  if (option === selectedAnswer.value && !isCorrect.value) return 'answer--wrong'
  return 'answer--dimmed'
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

const restartLesson = () => {
  currentIndex.value = 0
  correctCount.value = 0
  buildQuiz()
}

const goBack = () => {
  router.push('/hawkLang')
}

const handleMenuClick = () => {
  router.push('/hawkLang')
}

onMounted(() => {
  if (lesson) buildQuiz()
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
          <button class="btn btn--primary" @click="restartLesson">
            <Icon name="repeat" size="18" />
            Nochmal
          </button>
          <button class="btn btn--ghost" @click="goBack">
            <Icon name="arrow-left" size="18" />
            Lektionen
          </button>
        </div>
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
          <span class="direction-badge">{{ directionLabel }}</span>
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
        <button
          v-for="(option, index) in quizData.options"
          :key="index"
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
      </section>

      <!-- Feedback -->
      <section v-if="phase === 'result'" class="feedback-section">
        <div class="feedback-banner" :class="isCorrect ? 'feedback--correct' : 'feedback--wrong'">
          <Icon :name="isCorrect ? 'check-circle' : 'x-circle'" size="24" />
          <span>{{ isCorrect ? 'Richtig!' : 'Leider falsch.' }}</span>
        </div>

        <!-- Vocabulary toggle -->
        <button class="toggle-btn" @click="showVocabulary = !showVocabulary">
          <Icon :name="showVocabulary ? 'chevron-up' : 'chevron-down'" size="18" />
          Vokabeln anzeigen
        </button>

        <div v-if="showVocabulary" class="vocabulary-list">
          <div
            v-for="(vocab, vIndex) in currentSentence.vocabulary"
            :key="vIndex"
            class="vocab-item"
          >
            <span class="vocab-source">{{ vocab[questionLang] }}</span>
            <span class="vocab-arrow">=</span>
            <span class="vocab-target">{{ vocab[answerLang] }}</span>
          </div>
        </div>

        <!-- Grammar toggle -->
        <button
          v-if="currentSentence.grammar"
          class="toggle-btn"
          @click="showGrammar = !showGrammar"
        >
          <Icon :name="showGrammar ? 'chevron-up' : 'chevron-down'" size="18" />
          {{ currentSentence.grammar.title[questionLang] }}
        </button>

        <div v-if="showGrammar && currentSentence.grammar" class="grammar-box">
          <h4 class="grammar-title">{{ currentSentence.grammar.title[questionLang] }}</h4>
          <p class="grammar-content">{{ currentSentence.grammar.content[questionLang] }}</p>
        </div>

        <!-- Next button -->
        <button class="btn btn--primary btn--large next-btn" @click="nextSentence">
          {{ currentIndex + 1 >= totalSentences ? 'Ergebnis anzeigen' : 'Weiter' }}
          <Icon name="arrow-right" size="18" />
        </button>
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
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  background-color: var(--card-bg);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
  padding: var(--space-1) var(--space-2);
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

.answer--dimmed {
  opacity: 0.5;
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

.toggle-btn {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: none;
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-md);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);

  &:hover {
    color: var(--text-color);
    border-color: var(--primary-color);
  }
}

.vocabulary-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
  padding: var(--space-3);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-md);
}

.vocab-item {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--font-size-sm);
}

.vocab-source {
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  min-width: 100px;
}

.vocab-arrow {
  color: var(--text-secondary);
}

.vocab-target {
  color: var(--primary-color);
  font-weight: var(--font-weight-bold);
}

.grammar-box {
  padding: var(--space-3);
  background-color: var(--card-bg);
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius-md);
}

.grammar-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin: 0 0 var(--space-2) 0;
}

.grammar-content {
  font-size: var(--font-size-sm);
  color: var(--text-color);
  margin: 0;
  line-height: 1.6;
  white-space: pre-line;
}

.next-btn {
  margin-top: var(--space-2);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
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
  gap: var(--space-3);
  margin-top: var(--space-3);
}

.error-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-secondary);
}
</style>
