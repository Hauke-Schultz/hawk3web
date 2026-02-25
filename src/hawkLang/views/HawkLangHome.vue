<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useLangLocalStorage } from '../composables/useLangLocalStorage.js'
import { getAllLessons } from '../data/lessons.js'

const router = useRouter()
const { gameData } = useLocalStorage()
const { langData, setDirection, getLessonProgress, getVocabProgress } = useLangLocalStorage()

const lessons = getAllLessons()

const directionLabel = computed(() => {
  return langData.direction === 'de-en' ? 'DE → EN' : 'EN → DE'
})

const toggleDirection = () => {
  setDirection(langData.direction === 'de-en' ? 'en-de' : 'de-en')
}

const questionLang = computed(() => langData.direction === 'de-en' ? 'de' : 'en')

const getLessonTitle = (lesson) => lesson.title[questionLang.value]
const getLessonDescription = (lesson) => lesson.description[questionLang.value]

const getLessonSegments = (lesson) => {
  const progress = getLessonProgress(lesson.id)
  return lesson.sentences.map(sentence => {
    const data = progress.sentences[sentence.id]
    if (!data) return 'pending'
    return data.correct ? 'correct' : 'wrong'
  })
}

const hasWrongLessonAnswers = (lessonId) => {
  const progress = getLessonProgress(lessonId)
  return Object.values(progress.sentences).some(s => !s.correct)
}

const hasWrongVocabAnswers = (lessonId) => {
  const saved = getVocabProgress(lessonId, langData.direction)
  return saved?.wrongVocabs?.length > 0
}

const startLesson = (lessonId) => {
  router.push(`/hawkLang/lesson/${lessonId}`)
}

const restartLesson = (lessonId) => {
  router.push(`/hawkLang/lesson/${lessonId}?mode=wrong`)
}

const startVocab = (lessonId) => {
  router.push(`/hawkLang/lesson/${lessonId}/vocab`)
}

const restartVocab = (lessonId) => {
  router.push(`/hawkLang/lesson/${lessonId}/vocab?mode=wrong`)
}

const openGrammar = (lessonId) => {
  router.push(`/hawkLang/lesson/${lessonId}/grammar`)
}

const handleMenuClick = () => {
  router.push('/')
}
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
    <section class="lang-header">
      <Icon name="book-open" size="48" />
      <h1 class="lang-title">Fit in Englisch</h1>
      <p class="lang-subtitle">Satztrainer</p>

      <button class="btn btn--ghost" @click="toggleDirection">
        <span class="direction-label">{{ directionLabel }}</span>
        <Icon name="repeat" size="18" />
      </button>
    </section>

    <section class="lessons-list">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-card"
      >
        <div class="lesson-top">
          <div class="lesson-info">
            <h2 class="lesson-title">
              <span class="lesson-number">{{ lesson.order }}.</span>
              {{ getLessonTitle(lesson) }}
            </h2>
            <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>
          </div>

          <div class="lesson-meta">
            <span class="sentence-count">{{ lesson.sentences.length }} Sätze</span>
            <div class="progress-track">
              <div
                v-for="(status, index) in getLessonSegments(lesson)"
                :key="index"
                class="progress-segment"
                :class="status"
              ></div>
            </div>
          </div>
        </div>

        <div class="lesson-actions">
          <div class="lesson-btn-group">
            <button class="btn btn--primary lesson-btn" @click="startLesson(lesson.id)">
              <Icon name="play" size="15" />
            </button>
            <button
              v-if="hasWrongLessonAnswers(lesson.id)"
              class="btn btn--ghost lesson-restart-btn"
              title="Neu starten"
              @click="restartLesson(lesson.id)"
            >
              <Icon name="repeat" size="15" />
            </button>
          </div>
          <div class="lesson-btn-group">
            <button class="btn btn--secondary lesson-btn" @click="startVocab(lesson.id)">
              <Icon name="book-open" size="15" />
            </button>
            <button
              v-if="hasWrongVocabAnswers(lesson.id)"
              class="btn btn--ghost lesson-restart-btn"
              title="Neu starten"
              @click="restartVocab(lesson.id)"
            >
              <Icon name="repeat" size="15" />
            </button>
          </div>
          <button class="btn btn--secondary lesson-btn" @click="openGrammar(lesson.id)">
            <Icon name="info" size="15" />
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style lang="scss" scoped>
.lang-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-6) 0;
  text-align: center;
}

.lang-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.lang-subtitle {
  font-size: var(--font-size-base);
  color: var(--text-secondary);
  margin: 0;
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lesson-card {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
}

.lesson-top {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.lesson-info {
  flex: 1;
  min-width: 0;
}

.lesson-title {
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0 0 var(--space-1) 0;
}

.lesson-number {
  color: var(--primary-color);
}

.lesson-description {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.lesson-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: var(--space-1);
  flex-shrink: 0;
}

.sentence-count {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.progress-track {
  display: flex;
	overflow: hidden;
	border-radius: 3px;
}

.progress-segment {
  width: 10px;
  height: 10px;
  background-color: var(--card-border);
  transition: background-color 0.2s ease;

  &.correct {
    background-color: var(--success-color, #22c55e);
  }

  &.wrong {
    background-color: var(--error-color, #ef4444);
  }
}

.lesson-actions {
  display: flex;
  gap: var(--space-2);
  border-top: 1px solid var(--card-border);
  padding-top: var(--space-3);
}

.lesson-btn-group {
  flex: 1;
  display: flex;
  gap: 2px;
}

.lesson-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-1);
  font-size: var(--font-size-sm);
}

.lesson-restart-btn {
  flex-shrink: 0;
  padding: var(--space-2);
  color: var(--text-secondary);

  &:hover {
    color: var(--primary-color);
  }
}
</style>
