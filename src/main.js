import { ViteSSG } from 'vite-ssg'
import { routes } from './router'
import App from './App.vue'
import './style.css'

// https://github.com/antfu/vite-ssg
export const createApp = ViteSSG(
	App,
	{ routes },
	({ app, router, routes, isClient, initialState }) => {
		// Setup app instance

		// Client-only code (nur im Browser)
		if (isClient) {
			const savedTheme = localStorage.getItem('theme') || 'dark'
			document.documentElement.setAttribute('data-theme', savedTheme)

			const savedLanguage = localStorage.getItem('hawk3_language') || 'en'
			document.documentElement.setAttribute('lang', savedLanguage)
		}
	},
	{
		// SSG Options
		includedRoutes(paths, routes) {
			return paths.filter((path) => {
				return ['/'].includes(path)
			})
		}
	}
)