<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(3)
</script>

<template>
  <h1 @click="count++">{{ msg }}{{ count }}</h1>
</template>

<style scoped>
h1 {
  color: #888;
}
</style>
