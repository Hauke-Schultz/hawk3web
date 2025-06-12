<script setup>
import {onMounted, ref} from 'vue'

const theme = ref('dark')

onMounted(() => {
  theme.value = localStorage.getItem('theme') || 'dark'
})
</script>

<template>
  <div class="app-container" role="application">
    <header role="banner">
      Hawk
    </header>
    <main id="main-content">
      TODO
    </main>
  </div>
</template>

<style lang="scss">

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
  padding: var(--space-2);
  flex-wrap: wrap;
}

main {
  width: 100%;
  flex-grow: 1;
  padding: var(--space-4);
  max-width: 75rem;
  margin: 0 auto;

  &:focus {
    outline: none;
  }
}
</style>