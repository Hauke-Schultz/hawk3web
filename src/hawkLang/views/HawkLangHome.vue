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
const { langData, setDirection, getLessonScore } = useLangLocalStorage()

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

const getLessonProgressInfo = (lesson) => {
  const score = getLessonScore(lesson.id, lesson.sentences.length)
  return score
}

const startLesson = (lessonId) => {
  router.push(`/hawkLang/lesson/${lessonId}`)
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

      <button class="direction-toggle" @click="toggleDirection">
        <span class="direction-label">{{ directionLabel }}</span>
        <Icon name="repeat" size="18" />
      </button>
    </section>

    <section class="lessons-list">
      <div
        v-for="lesson in lessons"
        :key="lesson.id"
        class="lesson-card"
        @click="startLesson(lesson.id)"
      >
        <div class="lesson-info">
          <h2 class="lesson-title">
            <span class="lesson-number">{{ lesson.order }}.</span>
            {{ getLessonTitle(lesson) }}
          </h2>
          <p class="lesson-description">{{ getLessonDescription(lesson) }}</p>
        </div>

        <div class="lesson-meta">
          <span class="sentence-count">{{ lesson.sentences.length }} Saetze</span>

          <div class="progress-info">
            <div
              v-if="getLessonProgressInfo(lesson).answered > 0"
              class="progress-bar-container"
            >
              <div
                class="progress-bar"
                :style="{ width: (getLessonProgressInfo(lesson).correct / getLessonProgressInfo(lesson).total * 100) + '%' }"
              ></div>
            </div>
            <span
              v-if="getLessonProgressInfo(lesson).answered > 0"
              class="progress-text"
            >
              {{ getLessonProgressInfo(lesson).correct }}/{{ getLessonProgressInfo(lesson).total }}
            </span>
          </div>
        </div>

        <Icon name="chevron-right" size="20" class="lesson-arrow" />
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

.direction-toggle {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  background-color: var(--primary-color);
  color: var(--white);
  border: none;
  border-radius: var(--border-radius-md);
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  cursor: pointer;
  transition: all 0.2s ease;
  font-family: var(--font-family-base);
  margin-top: var(--space-2);

  &:hover {
    opacity: 0.9;
    transform: scale(1.02);
  }

  &:active {
    transform: scale(0.98);
  }
}

.lessons-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.lesson-card {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-xl);
  padding: var(--space-4);
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background-color: var(--card-bg-hover);
    border-color: var(--primary-color);
    transform: translateY(-1px);
  }

  &:active {
    transform: translateY(0);
  }
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

.progress-info {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.progress-bar-container {
  width: 60px;
  height: 6px;
  background-color: var(--card-border);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: var(--success-color, #22c55e);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  white-space: nowrap;
}

.lesson-arrow {
  color: var(--text-secondary);
  flex-shrink: 0;
}
</style>
