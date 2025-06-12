import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const savedTheme = localStorage.getItem('theme') || 'dark'
document.documentElement.setAttribute('data-theme', savedTheme)

createApp(App).mount('#app')