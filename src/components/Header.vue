<script setup>
import {ref, computed, watch, onMounted, reactive, onUpdated} from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from "./Icon.vue"
import CurrencyDisplay from "./CurrencyDisplay.vue"
import DailyRewardCard from "./DailyRewardCard.vue"

// Services
const {
	gameData,
	getRecentLevelsForGame,
	updateNotificationCount,
	isCardRead,
	markCardAsRead,
	canClaimDailyReward,
	claimDailyReward } = useLocalStorage()
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
	gameState: {
		type: Object,
		default: null
	},
	player: {
		type: Object,
		default: () => ({ coins: 0, diamonds: 0 })
	},
	achievements: {
		type: Array,
		default: () => []
	},
})

// Emits
const emit = defineEmits([
	'menu-click',
	'save-game',
	'notification-click',
])

// Menu state
const showMenu = ref(false)
const isMenuAnimating = ref(false)
const isSaving = ref(false)
const isMenuTransitioning = ref(false)
const showNotifications = ref(false)
const isNotificationAnimating = ref(false)
const isNotificationTransitioning = ref(false)

const toggleNotifications = async (event) => {
	if (isNotificationAnimating.value || isNotificationTransitioning.value) return

	// Prevent event bubbling
	if (event) {
		event.stopPropagation()
	}

	isNotificationTransitioning.value = true

	if (showNotifications.value) {
		closeNotifications()
	} else {
		openNotifications()
		closeMenu()
	}

	// Reset transition flag after animation
	setTimeout(() => {
		isNotificationTransitioning.value = false
	}, 350)
}

const openNotifications = () => {
	showNotifications.value = true
	isNotificationAnimating.value = true

	setTimeout(() => {
		isNotificationAnimating.value = false
	}, 300)
}

const closeNotifications = () => {
	if (!showNotifications.value) return

	isNotificationAnimating.value = true

	setTimeout(() => {
		showNotifications.value = false
		isNotificationAnimating.value = false
	}, 300)
}

const handleNotificationItemRead = (cardType) => {
	if (cardType === 'dailyRewardCard') {
		const reward = claimDailyReward()
		if (reward) {
			const consecutiveText = reward.consecutive ? ' (2x Bonus!)' : ''
			console.log(`🎁 Daily reward claimed: +${reward.coins} coins, +${reward.diamonds} diamonds${consecutiveText}`)

			setTimeout(() => {
				updateNotificationCount()
			}, 100)
		}
	}
	markCardAsRead(cardType)
	updateNotificationCount()
}

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

const notificationItems = computed(() => {
	const items = []

	// Daily Reward Notification
	if (canClaimDailyReward()) {
		const lastClaimed = gameData.currency.dailyRewards.lastClaimed
		let isConsecutive = false

		if (lastClaimed && lastClaimed !== '2023-01-01') {
			const now = new Date()
			const today = now.toISOString().split('T')[0]
			const lastClaimedDate = new Date(lastClaimed + 'T00:00:00')
			const todayDate = new Date(today + 'T00:00:00')
			const daysDiff = Math.floor((todayDate - lastClaimedDate) / (1000 * 60 * 60 * 24))
			isConsecutive = daysDiff === 1
		}

		items.push({
			id: 'dailyRewardCard',
			type: 'daily_reward',
			title: t('daily_rewards.title'),
			description: isConsecutive ?
					t('daily_rewards.consecutive_bonus') :
					t('daily_rewards.normal_bonus'),
			icon: 'bell',
			isDaily: true,
			canClaim: true,
			consecutive: isConsecutive
		})
	}

	return items
})

const readNotificationItems = computed(() => {
	const items = []

	if (isCardRead('dailyRewardCard')) {
		const readAt = gameData.cardStates.dailyRewardCard?.readAt

		if (readAt) {
			const readDate = new Date(readAt).toISOString().split('T')[0]
			const dailyTransaction = gameData.currency.transactions
					.filter(t => t.source === 'daily_reward')
					.find(t => {
						const transactionDate = new Date(t.timestamp).toISOString().split('T')[0]
						return transactionDate === readDate
					})

			let isConsecutive = dailyTransaction.metadata?.consecutive || false
			const currentStreak = gameData.currency.dailyRewards.streak || 1
			const rewardInfo = currentStreak === 2 ?
					t('daily_rewards.consecutive_bonus') :
					t('daily_rewards.normal_bonus')

			items.push({
				id: 'dailyRewardCard-read',
				type: 'daily_reward_read',
				title: t('daily_rewards.title'),
				description: rewardInfo,
				icon: 'completion-badge',
				readAt: readAt,
				timestamp: new Date(readAt),
				consecutive: isConsecutive,
				rewardDetails: dailyTransaction ? {
					coins: dailyTransaction.amounts.coins,
					diamonds: dailyTransaction.amounts.diamonds
				} : null
			})
		}
	}

	// Recent achievements (last 10)
	const recentAchievements = props.achievements
			.filter(achievement => achievement.earned && achievement.earnedAt)
			.sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
			.slice(0, 5)

	recentAchievements.forEach(achievement => {
		items.push({
			id: `achievement-${achievement.id}`,
			type: 'achievement',
			title: t(`achievements.definitions.${achievement.id}.name`),
			description: t('notifications.achievement_unlocked'),
			icon: 'trophy',
			readAt: achievement.earnedAt,
			timestamp: new Date(achievement.earnedAt),
			rarity: achievement.rarity,
			rewards: achievement.rewards
		})
	})

	// Sort by timestamp (newest first)
	return items.sort((a, b) => b.timestamp - a.timestamp)
})

const allNotificationItems = computed(() => {
	return {
		unread: notificationItems.value,
		read: readNotificationItems.value
	}
})

function getCurrentLevelFromRoute() {
	const matches = route.path.match(/\/games\/(fruitmerge|memory)\/(\d+)/)
	return matches ? parseInt(matches[2]) : null
}

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
		closeNotifications()
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
		setTimeout(() => {
			if (showMenu.value && !isMenuTransitioning.value) {
				closeMenu()
			}
		}, 50)
	}

	if (showNotifications.value && !event.target.closest('.notification-container') && !isNotificationTransitioning.value) {
		setTimeout(() => {
			if (showNotifications.value && !isNotificationTransitioning.value) {
				closeNotifications()
			}
		}, 50)
	}
}

const handleNotificationClick = (event) => {
	toggleNotifications(event)
}

onMounted(() => {
	updateNotificationCount()
})

// Close menu on route change
watch(() => route.path, () => {
	if (showMenu.value) {
		closeMenu()
	}
	if (showNotifications.value) {
		closeNotifications()
	}
})

watch([showMenu, showNotifications], ([isMenuOpen, isNotificationOpen]) => {
	if (isMenuOpen || isNotificationOpen) {
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
				<div class="notification-container">
					<button
							v-if="showNotifications || notificationItems.length >= 0"
							class="btn btn--circle-ghost notification-btn"
							:class="{
							'notification-btn--active': showNotifications
						}"
							@click="handleNotificationClick($event)"
							:aria-label="t('a11y.notification_button')"
							:aria-expanded="showNotifications"
							:disabled="isNotificationAnimating"
					>
						<Icon name="bell" size="24" />
						<span v-if="notificationItems.length > 0" class="notification-badge">{{ notificationItems.length }}</span>
					</button>

						<!-- Notification Dropdown -->
					<transition name="menu">
						<div v-if="showNotifications" class="notification-dropdown" :class="{ 'notification-dropdown--animating': isNotificationAnimating }">
							<div class="notification-header">
								<h4 class="notification-title">{{ t('nav.notifications') }}</h4>
							</div>

							<div class="notification-content">
								<!-- Unread Notifications Section -->
								<div v-if="allNotificationItems.unread.length > 0" class="notification-section">
									<h5 class="notification-section-title">{{ t('notifications.unread') }}</h5>
									<div class="notification-list">
										<div
												v-for="item in allNotificationItems.unread"
												:key="item.id"
												class="notification-item"
												:class="`notification-item--${item.type}`"
										>
											<DailyRewardCard
													v-if="item.type === 'daily_reward'"
													:title="item.title"
													:visible="true"
													:card-type="item.id"
													@mark-as-read="handleNotificationItemRead"
													@click="handleNotificationItemRead(item.id)"
											/>
										</div>
									</div>
								</div>

								<!-- Read Notifications Section -->
								<div v-if="allNotificationItems.read.length > 0" class="notification-section">
									<h5 class="notification-section-title">{{ t('notifications.recent_activity') }}</h5>
									<div class="notification-list">
										<div
												v-for="item in allNotificationItems.read"
												:key="item.id"
												class="notification-item notification-item--read"
												:class="`notification-item--${item.type}`"
										>
											<!-- Achievement Notification -->
											<div v-if="item.type === 'achievement'" class="achievement-notification">
												<div class="achievement-info">
													<div class="achievement-title">{{ item.title }}</div>
													<div v-if="item.rewards" class="achievement-rewards">
														<span v-if="item.rewards.diamonds > 0" class="reward-diamonds">
					                    +{{ item.rewards.diamonds }} 💎
					                  </span>
														<span v-if="item.rewards.coins > 0" class="reward-coins">
					                    +{{ item.rewards.coins }} 💰
					                  </span>
													</div>
													<div class="achievement-meta">
														<span class="achievement-time">{{ formatRelativeTime(item.readAt) }}</span>
													</div>
												</div>
											</div>

											<!-- Daily Reward Notification -->
											<div v-else-if="item.type === 'daily_reward_read'" class="daily-reward-notification">
												<div class="achievement-info">
													<div class="daily-reward-title">{{ item.description }}</div>
													<div v-if="item.rewardDetails" class="achievement-rewards">
														<span v-if="item.rewardDetails.diamonds > 0" class="reward-diamonds">
															+{{ item.rewardDetails.diamonds }} 💎
														</span>
														<span v-if="item.rewardDetails.coins > 0" class="reward-coins">
															+{{ item.rewardDetails.coins }} 💰
														</span>
													</div>
													<div class="achievement-meta">
														<span class="achievement-time">{{ formatRelativeTime(item.readAt) }}</span>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>

								<!-- Empty State -->
								<div v-if="allNotificationItems.unread.length === 0 && allNotificationItems.read.length === 0" class="notification-empty">
									<Icon name="bell" size="32" />
									<span class="empty-text">{{ t('notifications.no_activity') }}</span>
								</div>
							</div>
						</div>
					</transition>
				</div>
				<CurrencyDisplay
						:coins="player.coins || 0"
						:diamonds="player.diamonds || 0"
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



.notification-btn {
	position: relative;
	transition: all 0.3s ease;

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

// Notification Dropdown
.notification-dropdown {
	position: absolute;
	top: calc(100% + var(--space-2));
	right: 0;
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

.notification-header {
	padding: var(--space-3) var(--space-4);
	border-bottom: 1px solid var(--card-border);
	background-color: var(--bg-secondary);
}

.notification-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.notification-content {
	padding: var(--space-2);
}

.notification-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-6);
	color: var(--text-secondary);
	text-align: center;
}

.empty-text {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
}

.notification-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.notification-item {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	overflow: hidden;

	&--daily_reward {
		// Daily reward specific styles if needed
	}
}

// Responsive adjustments
@media (max-width: 375px) {
	.notification-dropdown {
		min-width: calc(100vw - 2 * var(--space-4));
		max-width: calc(100vw - 2 * var(--space-4));
		right: calc(-1 * var(--space-4));
	}
}

.notification-section {
	margin-bottom: var(--space-4);

	&:last-child {
		margin-bottom: 0;
	}
}

.notification-section-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
	margin: 0 0 var(--space-2) 0;
	padding: 0 var(--space-2);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

.notification-item--read {
	opacity: 0.8;
	background-color: var(--bg-secondary);
}

// Achievement Notification Styles
.achievement-notification {
	display: flex;
	padding: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	border-left: 3px solid var(--warning-color);
}

.achievement-icon {
	width: var(--space-10);
	height: var(--space-10);
	background-color: var(--warning-color);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
}

.achievement-info {
	flex: 1;
	display: flex;
	flex-direction: row;
	flex-wrap: wrap;
	justify-content: space-between;
	align-items: center;
}

.achievement-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	line-height: 1.3;
	max-width: 50%;
}

.achievement-description {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	line-height: 1.3;
}

.achievement-meta {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	width: 100%;
}

.achievement-time {
	font-size: var(--font-size-xs);
	color: var(--text-muted);
	font-style: italic;
}

.achievement-rarity {
	padding: var(--space-0) var(--space-1);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;

	&.rarity--common {
		background-color: var(--info-color);
		color: white;
	}

	&.rarity--uncommon {
		background-color: var(--success-color);
		color: white;
	}

	&.rarity--rare {
		background-color: var(--primary-color);
		color: white;
	}

	&.rarity--epic {
		background-color: var(--warning-color);
		color: white;
	}

	&.rarity--legendary {
		background: linear-gradient(45deg, #ff6b6b, #ffd93d);
		color: white;
	}
}

.achievement-rewards {
	display: flex;
	gap: var(--space-2);
}

.reward-coins,
.reward-diamonds {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	padding: var(--space-1);
	border-radius: var(--border-radius-sm);
}

.reward-coins {
	background-color: var(--warning-color);
	color: white;
}

.reward-diamonds {
	background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));
	color: white;
}

// Daily Reward Notification Styles
.daily-reward-notification {
	display: flex;
	padding: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	border-left: 3px solid var(--success-color);
}

.daily-reward-icon {
	width: var(--space-10);
	height: var(--space-10);
	background-color: var(--success-color);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
	flex-shrink: 0;
}

.daily-reward-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.daily-reward-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	line-height: 1.3;
}

.reward-details {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	flex-wrap: wrap;
}

.reward-amount {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

.reward-coins {
	background-color: var(--warning-color);
	color: white;
}

.reward-diamonds {
	background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));
	color: white;
}

.daily-reward-time {
	font-size: var(--font-size-xs);
	color: var(--text-muted);
	font-style: italic;
}
</style>