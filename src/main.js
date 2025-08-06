import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './style.css'

const initializeApp = async () => {
	const savedTheme = localStorage.getItem('theme') || 'dark'
	document.documentElement.setAttribute('data-theme', savedTheme)

	const savedLanguage = localStorage.getItem('hawk3_language') || 'en'
	document.documentElement.setAttribute('lang', savedLanguage)

	const app = createApp(App)
	app.use(router)
	app.mount('#app')
}

initializeApp()