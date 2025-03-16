import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const savedTheme = localStorage.getItem('theme') || 'light'
document.documentElement.setAttribute('data-theme', savedTheme)

createApp(App).mount('#app')