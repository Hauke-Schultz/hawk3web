<script setup>
import {onMounted, ref, watch} from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'
import MemoryGame from './components/MemoryGame/MemoryGame.vue'

const theme = ref('light')
const showMemoryGame = ref(true)

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
}

const toggleMemoryGame = () => {
  showMemoryGame.value = !showMemoryGame.value
}

watch(theme, (newTheme) => {
  document.documentElement.setAttribute('data-theme', newTheme)
  localStorage.setItem('theme', newTheme)
})

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'light'
})
</script>

<template>
  <div class="app-container" :class="theme" role="application">
    <header role="banner">
      <HelloWorld msg="Hawk" />
      <div class="theme-switch-container">
        <ThemeSwitch :theme="theme" @toggle-theme="toggleTheme" />
      </div>
    </header>
    <main id="main-content">
      <section class="content" aria-labelledby="projects-heading">
        <h2 id="projects-heading">Meine Projekte</h2>
        <div class="projects" role="list">
          <div class="project-card game-card" role="listitem" tabindex="0">
            <div v-if="showMemoryGame" class="memory-game-container">
              <MemoryGame />
            </div>
            <div v-else>
              <h3>Memory-Spiel</h3>
              <p>Ein einfaches Memory-Spiel mit Tastatur- und Maussteuerung</p>
            </div>
            <button
              @click="toggleMemoryGame"
              class="btn"
              :class="{
                'btn--ghost': showMemoryGame
              }"
              :aria-label="showMemoryGame ? 'Memory-Spiel ausblenden' : 'Memory-Spiel spielen'"
            >
              {{ showMemoryGame ? 'Spiel ausblenden' : 'Spiel starten' }}
            </button>
          </div>
          <div class="project-card" role="listitem" tabindex="0">
            <h3>Projekt 2</h3>
            <p>Beschreibung des Projekts</p>
            <button class="btn" aria-label="Mehr über Projekt 2 erfahren">Mehr erfahren</button>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style lang="scss">
@use './assets/variables.scss' as vars;

.app-container {
  min-height: 100vh;
  font-family: 'Arial', sans-serif;
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;

  &.light {
    background-color: var(--bg-color);
    color: var(--text-color);
  }

  &.dark {
    background-color: var(--bg-color);
    color: var(--text-color);
  }
}


header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-2) var(--space-4);
  box-shadow: var(--header-shadow, 0 0.125rem 0.5rem rgba(0, 0, 0, 0.1));
  flex-wrap: wrap;

  @media (min-width: vars.$breakpoint-md) {
    padding: var(--space-4) var(--space-8);
    flex-wrap: nowrap;
  }
}

h1 {
  margin: 0;
  font-size: var(--font-size-xl);
  font-weight: bold;

  @media (min-width: vars.$breakpoint-md) {
    font-size: var(--font-size-2xl);
  }
}

h3 {
  margin: 0;
  font-size: var(--font-size-lg);

  @media (min-width: vars.$breakpoint-md) {
    font-size: var(--font-size-xl);
  }
}

p {
  margin: 0;
}

.theme-switch-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-2);

  @media (min-width: vars.$breakpoint-md) {
    gap: var(--space-4);
  }
}

main {
  width: 100%;
  flex-grow: 1;
  padding: var(--space-4);

  @media (min-width: vars.$breakpoint-md) {
    max-width: 75rem;
    margin: 0 auto;
    padding: var(--space-8);
  }

  &:focus {
    outline: none;
  }
}

.content {
  margin-top: var(--space-4);

  @media (min-width: vars.$breakpoint-md) {
    margin-top: var(--space-8);
  }
}

.projects {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  margin-top: var(--space-4);

  @media (min-width: vars.$breakpoint-sm) {
    grid-template-columns: repeat(auto-fill, minmax(18.75rem, 1fr));
    gap: var(--space-6);
  }

  @media (min-width: vars.$breakpoint-md) {
    gap: var(--space-8);
    margin-top: var(--space-8);
  }
}

.project-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: var(--space-4);
  box-shadow: var(--card-shadow);
  transition: box-shadow 0.3s;
  position: relative;
  outline: none;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);

  @media (min-width: vars.$breakpoint-md) {
    padding: var(--space-6);
    gap: var(--space-4);
  }

  &:hover {
    box-shadow: var(--focus-shadow);
  }

  &:focus-visible {
    outline: 0.125rem solid var(--accent-color);
    outline-offset: 0.25rem;
    box-shadow: var(--focus-shadow);
  }
}

.memory-game-container {
  width: 100%;
  flex-grow: 1;
}
</style>