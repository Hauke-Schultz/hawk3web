<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from './composables/useLocalStorage.js'
import { useI18n } from './composables/useI18n.js'

// Services
const { gameData, updateSettings, checkAutoAchievements, getCurrentLanguage } = useLocalStorage()
const { t, setLanguage } = useI18n()
const router = useRouter()

// Theme handling
const handleThemeChange = (newTheme) => {
	updateSettings({ theme: newTheme })
	document.documentElement.setAttribute('data-theme', newTheme)
}

const handleLanguageChange = async (newLanguage) => {
	const success = await setLanguage(newLanguage)
	if (success) {
		updateSettings({ language: newLanguage })
		document.documentElement.setAttribute('lang', newLanguage)
	}
}

const handleFontSizeChange = (newFontSize) => {
	updateSettings({ fontSize: newFontSize })
	document.documentElement.setAttribute('data-font-size', newFontSize)
}

// Navigation handlers using router
const handleBackToHome = () => {
	router.push('/')
}

const handleSettingsClick = () => {
	router.push('/settings')
}

const handleProfileClick = () => {
	router.push('/profile')
}

const handleAboutClick = () => {
	router.push('/about')
}

const handleStartGame = () => {
	router.push('/games')
}

const handleShopClick = () => {
	router.push('/shop')
}

const handleTrophyClick = () => {
	router.push('/trophies')
}

const handleMenuClick = () => {
	router.push('/')
}

// Lifecycle
onMounted(async () => {
	document.documentElement.setAttribute('data-theme', gameData.settings.theme)

	const storedLanguage = getCurrentLanguage()
	await setLanguage(storedLanguage)
	const storedFontSize = gameData.settings.fontSize || 'medium'
	document.documentElement.setAttribute('lang', storedLanguage)
	document.documentElement.setAttribute('data-font-size', storedFontSize)

	checkAutoAchievements()
})
</script>

<template>
	<div class="container" :class="gameData.settings.theme" role="application">
		<router-view
				:player-profile="gameData.player"
				:current-theme="gameData.settings.theme"
				@start-game="handleStartGame"
				@profile-click="handleProfileClick"
				@trophy-click="handleTrophyClick"
				@settings-click="handleSettingsClick"
				@about-click="handleAboutClick"
				@shop-click="handleShopClick"
				@theme-change="handleThemeChange"
				@language-change="handleLanguageChange"
				@font-size-change="handleFontSizeChange"
				@menu-click="handleMenuClick"
				@back-to-home="handleBackToHome"
		/>
	</div>
</template>

<style lang="scss">
#app {
	margin: 0 auto;
	display: flex;
	justify-content: center;
}

.container {
	min-height: 100vh;
	font-family: var(--font-family-base), sans-serif;
	background-color: var(--bg-color);
	color: var(--text-color);
	transition: background-color 0.3s, color 0.3s;
	display: flex;
	flex-direction: column;
	position: relative;
	width: var(--content-width);
}

.content {
	padding: var(--space-4) 0;
	max-width: var(--content-width);
	margin: 0 auto;
	width: 100%;
	display: flex;
	flex-direction: column;
	align-items: stretch;
	justify-content: flex-start;
	gap: var(--space-4);

	&:focus {
		outline: none;
	}
}
</style>