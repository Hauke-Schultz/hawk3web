import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

const initializeApp = async () => {
	const savedTheme = localStorage.getItem('theme') || 'dark'
	document.documentElement.setAttribute('data-theme', savedTheme)

	const savedLanguage = localStorage.getItem('hawk3_language') || 'en'
	document.documentElement.setAttribute('lang', savedLanguage)

	createApp(App).mount('#app')
}

initializeApp()