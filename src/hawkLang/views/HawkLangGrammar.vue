<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import Header from '../../gamingHub/components/Header.vue'
import Icon from '../../components/Icon.vue'
import { useLocalStorage } from '../../gamingHub/composables/useLocalStorage.js'
import { useLangLocalStorage } from '../composables/useLangLocalStorage.js'
import { getLessonById } from '../data/lessons.js'

const router = useRouter()
const route = useRoute()
const { gameData } = useLocalStorage()
const { langData } = useLangLocalStorage()

const lessonId = parseInt(route.params.id)
const lesson = getLessonById(lessonId)

const questionLang = computed(() => langData.direction === 'de-en' ? 'de' : 'en')

// Collect all unique grammar blocks from the lesson
const grammarBlocks = computed(() => {
  if (!lesson) return []
  const seen = new Set()
  const blocks = []
  for (const sentence of lesson.sentences) {
    if (sentence.grammar && !seen.has(sentence.grammar.id)) {
      seen.add(sentence.grammar.id)
      blocks.push(sentence.grammar)
    }
  }
  return blocks
})

const goBack = () => {
  router.push(`/hawkLang/lesson/${lessonId}`)
}

const handleMenuClick = () => {
  router.push('/hawkLang')
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
    <div v-if="!lesson" class="error-state">
      <p>Lektion nicht gefunden.</p>
      <button class="btn btn--primary" @click="goBack">Zurueck</button>
    </div>

    <template v-else>
      <!-- Header -->
      <div class="grammar-header">
        <button class="btn btn--ghost btn--small" @click="goBack">
          <Icon name="arrow-left" size="18" />
        </button>
        <div class="grammar-header-text">
          <h1 class="grammar-page-title">Grammatik</h1>
          <p class="grammar-lesson-name">{{ lesson.title[questionLang] }}</p>
        </div>
      </div>

      <!-- Grammar blocks -->
      <div class="grammar-list">
        <div
          v-for="block in grammarBlocks"
          :key="block.id"
          class="grammar-block"
        >
          <h2 class="block-title">{{ block.title[questionLang] }}</h2>

          <table class="data-table">
            <thead>
              <tr>
                <th
                  v-for="(col, cIndex) in block.columns[questionLang]"
                  :key="cIndex"
                >
                  {{ col }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, rIndex) in block.rows" :key="rIndex">
                <td v-for="(cell, cellIndex) in row" :key="cellIndex">{{ cell }}</td>
              </tr>
            </tbody>
          </table>

          <p v-if="block.note" class="block-note">
            <Icon name="info" size="14" />
            {{ block.note[questionLang] }}
          </p>
        </div>
      </div>
    </template>
  </main>
</template>

<style lang="scss" scoped>
.grammar-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4) 0;
}

.grammar-header-text {
  flex: 1;
}

.grammar-page-title {
  font-size: var(--font-size-2xl);
  font-weight: var(--font-weight-bold);
  color: var(--text-color);
  margin: 0;
}

.grammar-lesson-name {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  margin: 0;
}

.grammar-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding-bottom: var(--space-6);
}

.grammar-block {
  background-color: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--border-radius-lg);
  overflow: hidden;
}

.block-title {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-bold);
  color: var(--primary-color);
  margin: 0;
  padding: var(--space-3) var(--space-4);
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

  td:first-child {
    font-weight: var(--font-weight-bold);
    white-space: nowrap;
  }

  tbody tr:hover {
    background-color: var(--card-bg-hover, rgba(0, 0, 0, 0.02));
  }
}

.block-note {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin: 0;
  padding: var(--space-2) var(--space-4) var(--space-3);
  font-size: var(--font-size-xs);
  color: var(--text-secondary);
  font-style: italic;
}

.error-state {
  text-align: center;
  padding: var(--space-8) 0;
  color: var(--text-secondary);
}
</style>
