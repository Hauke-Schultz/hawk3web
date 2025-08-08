<script setup>
import { ref, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from "./Icon.vue"
import CurrencyDisplay from "./CurrencyDisplay.vue"

// Services
const { gameData,
	updateSettings,
	checkAutoAchievements,
	getCurrentLanguage,
	getMostRecentGameActivity,
	getRecentLevelsForGame,
	getAllRecentLevels } = useLocalStorage()
const { t } = useI18n()
const router = useRouter()
const route = useRoute()

// Props
const props = defineProps({
	title: {
		type: String,
		default: ''
	},
	subtitle: {
		type: String,
		default: ''
	},
	showMenuButton: {
		type: Boolean,
		default: false
	},
	gameData: {
		type: Object,
		default: () => ({
			player: {
				name: 'Player',
				avatar: 'avatar/user',
				level: 1,
				coins: 0,
				diamonds: 0
			}
		})
	},
	gameState: {
		type: Object,
		default: null
	}
})

// Emits
const emit = defineEmits([
	'menu-click',
	'save-game'
])

// Menu state
const showMenu = ref(false)
const isMenuAnimating = ref(false)
const isSaving = ref(false)
const isMenuTransitioning = ref(false)

// Computed values
const playerInfo = computed(() => ({
	name: props.gameData.player.name,
	avatar: props.gameData.player.avatar,
	level: props.gameData.player.level,
	coins: props.gameData.player.coins || 0,
	diamonds: props.gameData.player.diamonds || 0
}))

const displayTitle = computed(() => {
	return props.title || t('app.title')
})

const displaySubtitle = computed(() => {
	return props.subtitle || t('app.subtitle')
})

// Check current route context
const currentRoute = computed(() => {
	return {
		isHome: route.path === '/',
		isShop: route.path === '/shop',
		isGame: route.path.includes('/games/'),
		isFruitMergeGame: route.path.includes('/games/fruitmerge/'),
		isMemoryGame: route.path.includes('/games/memory/'),
		currentLevel: getCurrentLevelFromRoute()
	}
})

function getCurrentLevelFromRoute() {
	const matches = route.path.match(/\/games\/(fruitmerge|memory)\/(\d+)/)
	return matches ? parseInt(matches[2]) : null
}

const recentFruitMergeLevels = computed(() => {
	return getRecentLevelsForGame('fruitMerge', 3)
})

const allRecentLevels = computed(() => {
	const memoryLevels = getRecentLevelsForGame('memory', 10).map(level => ({
		...level,
		gameId: 'memory',
		gameTitle: t('memory.title'),
		gameIcon: 'brain'
	}))

	const fruitMergeLevels = getRecentLevelsForGame('fruitMerge', 10).map(level => ({
		...level,
		gameId: 'fruitMerge',
		gameTitle: t('fruitMerge.title'),
		gameIcon: 'fruit-merge-game'
	}))

	const combined = [...memoryLevels, ...fruitMergeLevels]
			.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
			.slice(0, 3) // Nur die 3 neuesten

	return combined
})

const lastPlayedActivity = computed(() => {
	return allRecentLevels.value.length > 0 ? allRecentLevels.value[0] : null
})

const otherRecentLevels = computed(() => {
	return allRecentLevels.value.slice(1) // Alle außer dem ersten
})

// Format relative time
const formatRelativeTime = (dateString) => {
	const date = new Date(dateString)
	const now = new Date()
	const diffMs = now - date
	const diffMinutes = Math.floor(diffMs / (1000 * 60))
	const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
	const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

	if (diffMinutes < 1) {
		return t('gaming.saved_just_now')
	} else if (diffMinutes < 60) {
		return t('gaming.saved_minutes_ago', { minutes: diffMinutes })
	} else if (diffHours < 24) {
		return t('gaming.saved_hours_ago', { hours: diffHours })
	} else {
		return t('gaming.saved_days_ago', { days: diffDays })
	}
}

// Menu items based on context (without save button)
const menuItems = computed(() => {
	const items = [
		{
			id: 'home',
			label: t('nav.home'),
			icon: 'menu',
			action: () => navigateTo('/'),
			highlight: currentRoute.value.isHome,
			visible: true
		},
		{
			id: 'games',
			label: t('nav.gaming'),
			icon: 'play',
			action: () => navigateTo('/games'),
			highlight: route.path.includes('/games'),
			visible: true
		},
		{
			id: 'shop',
			label: t('nav.shop'),
			icon: 'shop',
			action: () => navigateTo('/shop'),
			highlight: currentRoute.value.isShop,
			visible: true
		},
		{
			id: 'profile',
			label: t('nav.profile'),
			icon: 'user',
			action: () => navigateTo('/profile'),
			highlight: route.path.includes('/profile'),
			visible: true
		},
		{
			id: 'trophies',
			label: t('nav.trophies'),
			icon: 'trophy',
			action: () => navigateTo('/trophies'),
			highlight: route.path.includes('/trophies'),
			visible: true
		},
		{
			id: 'settings',
			label: t('nav.settings'),
			icon: 'settings',
			action: () => navigateTo('/settings'),
			highlight: route.path.includes('/settings'),
			visible: true
		}
	]

	return items.filter(item => item.visible)
})

// Menu methods with auto-save functionality
const toggleMenu = async (event) => {
	if (isMenuAnimating.value || isMenuTransitioning.value) return

	// Prevent event bubbling
	if (event) {
		event.stopPropagation()
	}

	isMenuTransitioning.value = true

	if (showMenu.value) {
		closeMenu()
	} else {
		await openMenuWithAutoSave()
	}

	// Reset transition flag after animation
	setTimeout(() => {
		isMenuTransitioning.value = false
	}, 350)
}

const menuIcon = computed(() => {
	return showMenu.value ? 'close' : 'menu'
})

const openMenuWithAutoSave = async () => {
	// Auto-save
	if (currentRoute.value.isFruitMergeGame || currentRoute.value.isMemoryGame) {
		isSaving.value = true

		try {
			// Emit save-game event and wait a moment for the game to process it
			emit('save-game')

			// Show saving feedback briefly
			await new Promise(resolve => setTimeout(resolve, 500))
		} catch (error) {
			console.error('Auto-save failed:', error)
		} finally {
			isSaving.value = false
		}
	}

	// Open the menu
	openMenu()
}

const openMenu = () => {
	showMenu.value = true
	isMenuAnimating.value = true

	setTimeout(() => {
		isMenuAnimating.value = false
	}, 300)
}

const closeMenu = () => {
	if (!showMenu.value) return

	isMenuAnimating.value = true

	setTimeout(() => {
		showMenu.value = false
		isMenuAnimating.value = false
	}, 300)
}

// Navigation methods
const navigateTo = (path) => {
	closeMenu()
	router.push(path)
}

const navigateToLevel = (gameId, level) => {
	const gameRoutes = {
		'fruitMerge': 'fruitmerge',
		'memory': 'memory'
	}

	const routeName = gameRoutes[gameId]
	if (routeName) {
		navigateTo(`/games/${routeName}/${level}`)
	}
}

const handleMenuClick = (event) => {
	if (props.showMenuButton) {
		toggleMenu(event)
	} else {
		emit('menu-click')
	}
}

// Close menu when clicking outside
const handleOutsideClick = (event) => {
	if (showMenu.value && !event.target.closest('.menu-container') && !isMenuTransitioning.value) {
		// Add small delay to prevent immediate closure
		setTimeout(() => {
			if (showMenu.value && !isMenuTransitioning.value) {
				closeMenu()
			}
		}, 50)
	}
}

// Close menu on route change
watch(() => route.path, () => {
	if (showMenu.value) {
		closeMenu()
	}
})

// Add/remove event listener for outside clicks
watch(showMenu, (isOpen) => {
	if (isOpen) {
		document.addEventListener('click', handleOutsideClick)
	} else {
		document.removeEventListener('click', handleOutsideClick)
	}
})
</script>

<template>
	<header class="header" role="banner">
		<div class="header-container">
			<!-- Left section -->
			<div class="header-left">
				<!-- Menu Button -->
				<div class="menu-container">
					<button
						v-if="showMenuButton"
						class="btn btn--circle-ghost menu-button"
						:class="{
              'menu-button--saving': isSaving,
              'menu-button--active': showMenu
            }"
						@click="handleMenuClick($event)"
						:aria-label="t('a11y.menu_button')"
						:aria-expanded="showMenu"
						:disabled="isMenuAnimating"
					>
						<Icon
							:name="isSaving ? 'loading' : menuIcon"
							size="24"
							:class="{ 'icon-spin': isSaving }"
						/>
					</button>

					<!-- Menu Dropdown -->
					<transition name="menu">
						<div v-if="showMenu" class="menu-dropdown" :class="{ 'menu-dropdown--animating': isMenuAnimating }">
							<!-- Auto-Save Status (if just saved) -->
							<div v-if="(currentRoute.isFruitMergeGame || currentRoute.isMemoryGame) && !isSaving" class="save-status">
								<Icon name="save" size="16" />
								<span class="save-status-text">
							    {{ currentRoute.isFruitMergeGame ? t('fruitMerge.state_saved') : t('memory.state_saved') }}
							  </span>
							</div>

							<nav class="menu-nav">
								<ul class="menu-list">
									<li
										v-for="item in menuItems"
										:key="item.id"
										class="menu-item"
									>
										<button
											class="menu-link"
											:class="{ 'menu-link--highlight': item.highlight }"
											@click="item.action"
										>
											<Icon :name="item.icon" size="20" />
											<span class="menu-label">{{ item.label }}</span>
										</button>
									</li>
								</ul>
							</nav>

							<!-- Recent Games Section -->
							<div
									v-if="!currentRoute.isGame && allRecentLevels.length > 0"
									class="menu-recent-games"
							>
								<div v-if="lastPlayedActivity" class="recent-activity">
									<h5 class="activity-subtitle">{{ t('gaming.last_played') }}</h5>
									<div
										class="recent-game-button recent-game-button--primary"
										@click="navigateToLevel(lastPlayedActivity.gameId, lastPlayedActivity.level)"
									>
										<Icon :name="lastPlayedActivity.gameIcon" size="20" />
										<div class="recent-game-info">
											<span class="recent-game-title">{{ lastPlayedActivity.gameTitle }}</span>
											<span class="recent-game-level">
							          {{ t('memory.level_title', { level: lastPlayedActivity.level }) }}
							        </span>
											<span class="recent-game-time">
							          {{ formatRelativeTime(lastPlayedActivity.savedAt) }}
							        </span>
										</div>
									</div>

									<!-- Andere recent levels -->
									<template v-if="otherRecentLevels.length > 0">
										<h5 v-if="otherRecentLevels.length > 0" class="activity-subtitle">{{ t('gaming.other_recent_levels') }}</h5>
										<div
											v-for="levelInfo in otherRecentLevels"
											:key="`${levelInfo.gameId}-${levelInfo.level}`"
											class="recent-game-button"
											@click="navigateToLevel(levelInfo.gameId, levelInfo.level)"
										>
											<Icon :name="levelInfo.gameIcon" size="20" />
											<div class="recent-game-info">
												<span class="recent-game-title">{{ levelInfo.gameTitle }}</span>
												<span class="recent-game-level">
							            {{ t('memory.level_title', { level: levelInfo.level }) }}
							          </span>
												<span class="recent-game-time">
							            {{ formatRelativeTime(levelInfo.savedAt) }}
							          </span>
											</div>
										</div>
									</template>
								</div>
							</div>
						</div>
					</transition>
				</div>

				<!-- App Title/Logo for home page -->
				<div v-if="!showMenuButton" class="header-title">
					<h1 class="app-title">{{ displayTitle }}</h1>
					<span class="app-subtitle">{{ displaySubtitle }}</span>
				</div>
			</div>

			<!-- Center section -->
			<div class="header-center">
			</div>

			<!-- Right section -->
			<div class="header-right">
				<CurrencyDisplay
						:coins="playerInfo.coins"
						:diamonds="playerInfo.diamonds"
						layout="vertical"
						size="small"
						variant="compact"
						:format-numbers="true"
				/>
			</div>
		</div>

		<!-- Menu Backdrop -->
		<transition name="backdrop">
			<div v-if="showMenu" class="menu-backdrop" @click="closeMenu"></div>
		</transition>
	</header>
</template>

<style lang="scss" scoped>
.header {
	background-color: var(--bg-header);
	border-bottom: 1px solid var(--card-border);
	width: var(--content-width);
	position: relative;
	z-index: 100;
}

.header-container {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-4);
	padding: var(--space-2) var(--space-4);
	height: 65px;
}

// Left Section
.header-left {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	flex: 1;
	min-width: 65px;
}

.menu-container {
	position: relative;
}

// Menu Button States
.menu-button {
	transition: all 0.3s ease;
	pointer-events: auto;

	&:disabled,
	&.menu-button--transitioning {
		pointer-events: none;
	}

	&--saving {
		background-color: var(--warning-color);
		color: white;
		border-color: var(--warning-color);

		&:hover {
			background-color: var(--warning-hover);
			border-color: var(--warning-hover);
		}
	}

	&--active {
		background-color: var(--primary-color);
		color: white;
		border-color: var(--primary-color);

		&:hover {
			background-color: var(--primary-hover);
			border-color: var(--primary-hover);
		}
	}
}

// Loading Spinner Animation
.icon-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}

.header-title {
	display: flex;
	flex-direction: column;
	gap: 0;

	.app-title {
		font-size: var(--font-size-xl);
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
		margin: 0;
		line-height: 1;
	}

	.app-subtitle {
		font-size: var(--font-size-xs);
		color: var(--text-secondary);
		line-height: 1;
	}
}

// Center Section
.header-center {
	display: flex;
	justify-content: center;
	align-items: center;
	flex: 1;
	gap: var(--space-3);
}

// Right Section
.header-right {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	flex: 1;
	justify-content: flex-end;
}

// Menu Dropdown
.menu-dropdown {
	position: absolute;
	top: calc(100% + var(--space-2));
	left: 0;
	min-width: 320px;
	max-width: 350px;
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	box-shadow: var(--card-shadow-hover);
	z-index: 1000;
	overflow: hidden;
	max-height: 80vh;
	overflow-y: auto;
}

// Save Status
.save-status {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2) var(--space-4);
	background-color: var(--success-color);
	color: white;
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-medium);
	border-bottom: 1px solid var(--card-border);
}

.save-status-text {
	flex: 1;
}

// Menu Navigation
.menu-nav {
	padding: var(--space-2);
}

.menu-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-1);
	align-items: stretch;
}

.menu-item {
	width: 100%;
}

.menu-link {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-1);
	padding: var(--space-2) var(--space-1);
	width: 100%;
	min-height: 70px;
	border: none;
	border-radius: var(--border-radius-md);
	background-color: transparent;
	color: var(--text-color);
	font-family: var(--font-family-base);
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: center;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
	}

	&--highlight {
		background-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
		}
	}
}

.menu-label {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	line-height: 1.1;
	text-align: center;
	max-width: 100%;
	word-wrap: break-word;
	hyphens: auto;
}

// Kleinere Icons für kompakte Version
.menu-link :deep(svg) {
	width: 20px;
	height: 20px;
	flex-shrink: 0;
}

// Recent Games Section
.menu-recent-games {
	border-top: 1px solid var(--card-border);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
}

.recent-games-header {
	margin-bottom: var(--space-3);
}

.recent-games-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
	margin: 0;
	text-transform: uppercase;
}

.recent-activity {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.activity-subtitle {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-muted);
	margin: 0;
	text-transform: uppercase;
}

.recent-game-button {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-1) var(--space-2);
	width: 100%;
	border: none;
	border-radius: var(--border-radius-lg);
	background-color: var(--card-bg);
	color: var(--text-color);
	font-family: var(--font-family-base);
	cursor: pointer;
	transition: all 0.2s ease;
	text-align: left;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
	}

	&--primary {
		background-color: var(--warning-color);
		color: white;

		&:hover {
			background-color: var(--warning-hover);
		}
	}
}

.recent-game-info {
	flex: 1;
	display: flex;
	gap: 0 var(--space-2);
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
	min-height: var(--space-8);
}

.recent-game-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

.recent-game-level {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-medium);
	opacity: 0.9;
}

.recent-game-time {
	font-size: var(--font-size-xs);
	opacity: 0.7;
	font-style: italic;
	width: 100%;
}

.level-number {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

.level-time {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
}

// Menu Backdrop
.menu-backdrop {
	position: fixed;
	top: 0;
	left: 0;
	width: 100vw;
	height: 100vh;
	background-color: rgba(0, 0, 0, 0.3);
	z-index: 999;
}

// Transitions
.menu-enter-active,
.menu-leave-active {
	transition: all 0.3s ease;
}

.menu-enter-from {
	opacity: 0;
	transform: translateY(-10px) scale(0.95);
}

.menu-leave-to {
	opacity: 0;
	transform: translateY(-10px) scale(0.95);
}

.backdrop-enter-active,
.backdrop-leave-active {
	transition: opacity 0.3s ease;
}

.backdrop-enter-from,
.backdrop-leave-to {
	opacity: 0;
}

// Responsive adjustments
@media (max-width: 375px) {
	.menu-dropdown {
		min-width: calc(100vw - 2 * var(--space-4));
		max-width: calc(100vw - 2 * var(--space-4));
		left: calc(-1 * var(--space-4));
	}
}
</style>