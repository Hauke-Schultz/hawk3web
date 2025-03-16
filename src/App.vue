<script setup>
import {onMounted, ref, watch} from 'vue'
import HelloWorld from './components/HelloWorld.vue'
import ThemeSwitch from './components/ThemeSwitch.vue'

const theme = ref('light')

const toggleTheme = () => {
  theme.value = theme.value === 'light' ? 'dark' : 'light'
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
          <div class="project-card" role="listitem" tabindex="0">
            <h3>Projekt 1</h3>
            <p>Beschreibung des Projekts</p>
            <a href="#" class="project-link" aria-label="Mehr über Projekt 1 erfahren">Mehr erfahren</a>
          </div>
          <div class="project-card" role="listitem" tabindex="0">
            <h3>Projekt 2</h3>
            <p>Beschreibung des Projekts</p>
            <a href="#" class="project-link" aria-label="Mehr über Projekt 2 erfahren">Mehr erfahren</a>
          </div>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.app-container {
  min-height: 100vh;
  font-family: 'Arial', sans-serif;
  transition: background-color 0.3s, color 0.3s;
  display: flex;
  flex-direction: column;
}

.light {
  background-color: var(--bg-color);
  color: var(--text-color);
}

.dark {
  background-color: var(--bg-color);
  color: var(--text-color);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-8);
  box-shadow: var(--header-shadow, 0 0.125rem 0.5rem rgba(0, 0, 0, 0.1));
}

h1 {
  margin: 0;
  font-size: var(--font-size-2xl);
  font-weight: bold;
}

.theme-switch-container {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

main {
  max-width: 75rem;
  margin: 0 auto;
  padding: var(--space-8);
  width: 100%;
  flex-grow: 1;
}

main:focus {
  outline: none;
}

.content {
  margin-top: var(--space-8);
}

.projects {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(18.75rem, 1fr));
  gap: var(--space-8);
  margin-top: var(--space-8);
}

.project-card {
  background-color: var(--card-bg);
  border-radius: 0.5rem;
  padding: var(--space-6);
  box-shadow: var(--card-shadow);
  transition: transform 0.3s, box-shadow 0.3s;
position: relative;
  outline: none;
}

.project-card:hover {
  transform: translateY(-0.3125rem);
  box-shadow: 0 0.375rem 0.75rem rgba(0, 0, 0, 0.15);
}

.project-card:focus-visible {
  outline: 0.125rem solid var(--accent-color);
  outline-offset: 0.25rem;
  box-shadow: var(--focus-shadow);
}

.project-link {
  display: inline-block;
  margin-top: var(--space-4);
  color: var(--accent-color);
  text-decoration: none;
  font-weight: bold;
  padding: var(--space-2) 0;
  border-bottom: 0.125rem solid transparent;
  transition: border-color 0.3s;
}

.project-link:hover,
.project-link:focus {
  border-color: var(--accent-color);
}

.project-link:focus-visible {
  outline: 0.125rem solid var(--accent-color);
  outline-offset: 0.25rem;
}
</style>