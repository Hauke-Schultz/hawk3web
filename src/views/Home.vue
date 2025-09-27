<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import { useLocalStorage } from "../gamingHub/composables/useLocalStorage.js"
import {computed, watch} from "vue"
import { memoryConfig } from "../gamingHub/games/memory/memoryConfig.js"
import { fruitMergeConfig } from "../gamingHub/games/fruitmerge/fruitMergeConfig.js"
import { numMergeConfig } from "../gamingHub/games/nummerge/numMergeConfig.js"
import Header from '../gamingHub/components/Header.vue'
import Icon from '../components/Icon.vue'
import CurrencyDisplay from '../gamingHub/components/CurrencyDisplay.vue'
import DailyRewardCard from '../gamingHub/components/DailyRewardCard.vue'
import MysteryBoxCard from '../gamingHub/components/MysteryBoxCard.vue'

const { t } = useI18n()
const {
	gameData,
	canClaimDailyReward,
	claimDailyReward,
	markCardAsRead,
	updateNotificationCount,
	canClaimMysteryBox,
	getRecentLevelsForGame,
	getAllRecentLevels
} = useLocalStorage()
const router = useRouter()

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

	const numMergeLevels = getRecentLevelsForGame('numMerge', 10).map(level => ({
		...level,
		gameId: 'numMerge',
		gameTitle: t('numMerge.title'),
		gameIcon: 'num-merge-game'
	}))

	const combined = [...memoryLevels, ...fruitMergeLevels, ...numMergeLevels]
			.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))
			.slice(0, 3)

	return combined
})

// Format relative time function
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

// Navigation to level function
const navigateToLevel = (gameId, level) => {
	const gameRoutes = {
		'fruitMerge': 'fruitmerge',
		'memory': 'memory',
		'numMerge': 'nummerge'
	}

	const routeName = gameRoutes[gameId]
	if (routeName) {
		navigateTo(`/games/${routeName}/${level}`)
	}
}

// Game Navigation
const navigateToGame = (gameId) => {
	const routes = {
		memory: '/games/memory',
		fruitMerge: '/games/fruitmerge',
		numMerge: '/games/nummerge'
	}
	if (routes[gameId]) {
		router.push(routes[gameId])
	}
}


// Page Navigation
const navigateTo = (path) => {
	router.push(path)
}

// Game Progress Calculations
const getGameProgress = (gameId, config) => {
	const levels = gameData.games[gameId].levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = config.levels.length
	const totalStars = Object.values(levels).reduce((sum, level) => sum + (level.stars || 0), 0)
	const maxStars = totalLevels * 3

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0,
		stars: totalStars,
		maxStars: maxStars,
		gamesPlayed: gameData.games[gameId].gamesPlayed || 0
	}
}

const memoryProgress = computed(() => getGameProgress('memory', memoryConfig))
const fruitMergeProgress = computed(() => getGameProgress('fruitMerge', fruitMergeConfig))
const numMergeProgress = computed(() => getGameProgress('numMerge', numMergeConfig))

// Player Summary
const playerSummary = computed(() => ({
	level: gameData.player.level,
	totalScore: gameData.player.totalScore,
	gamesPlayed: gameData.player.gamesPlayed,
	coins: gameData.player.coins,
	diamonds: gameData.player.diamonds,
	achievements: gameData.achievements.filter(a => a.earned).length
}))

// Overall Progress
const overallProgress = computed(() => {
	const totalCompleted = memoryProgress.value.completed + fruitMergeProgress.value.completed + numMergeProgress.value.completed
	const totalLevels = memoryProgress.value.total + fruitMergeProgress.value.total + numMergeProgress.value.total
	const totalStars = memoryProgress.value.stars + fruitMergeProgress.value.stars + numMergeProgress.value.stars
	const maxStars = memoryProgress.value.maxStars + fruitMergeProgress.value.maxStars + numMergeProgress.value.maxStars

	return {
		levels: totalCompleted,
		totalLevels: totalLevels,
		percentage: totalLevels > 0 ? Math.round((totalCompleted / totalLevels) * 100) : 0,
		stars: totalStars,
		maxStars: maxStars
	}
})

// Daily Reward Handler
const handleDailyRewardClaimed = (reward) => {
	claimDailyReward(reward)
	markCardAsRead('dailyRewardCard')
	updateNotificationCount()
}

const handleMysteryBoxClaim = (reward) => {
	console.log('🎁 Mystery Box claimed:', reward)
}

const handleMenuClick = () => {
	router.push('/')
}
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
			@update-click="updateClick"
	/>

	<main class="home">

		<section class="nav-icons-section">
			<div class="nav-icons-grid">
				<button class="nav-icon-btn" @click="navigateTo('/shop')">
					<Icon name="shop" size="20" />
					<span>{{ t('nav.shop') }}</span>
				</button>
				<button class="nav-icon-btn" @click="navigateTo('/trophies')">
					<Icon name="trophy" size="20" />
					<span>{{ t('nav.trophies') }}</span>
				</button>
				<button class="nav-icon-btn" @click="navigateTo('/profile')">
					<Icon name="user" size="20" />
					<span>{{ t('nav.profile') }}</span>
				</button>
				<button class="nav-icon-btn" @click="navigateTo('/settings')">
					<Icon name="settings" size="20" />
					<span>{{ t('nav.settings') }}</span>
				</button>
				<button class="nav-icon-btn" @click="navigateTo('/about')">
					<Icon name="info" size="20" />
					<span>{{ t('nav.about') }}</span>
				</button>
			</div>
		</section>

		<!-- Daily Reward Card -->
		<MysteryBoxCard
				:key="`mystery-box-${gameData.currency.dailyRewards.counter}`"
				@claim-mystery-box="handleMysteryBoxClaim"
		/>
		<DailyRewardCard
				v-if="canClaimDailyReward()"
				:key="`daily-reward-${gameData.currency.dailyRewards.counter}`"
				@mark-as-read="handleDailyRewardClaimed"
		/>

		<section v-if="allRecentLevels.length > 0" class="recent-games-section">
			<div class="recent-games-list">
				<div
						v-for="levelInfo in allRecentLevels"
						:key="`${levelInfo.gameId}-${levelInfo.level}`"
						class="recent-game-item"
						@click="navigateToLevel(levelInfo.gameId, levelInfo.level)"
				>
					<Icon :name="levelInfo.gameIcon" size="24" />
					<div class="recent-game-info">
						<span class="recent-game-title">{{ levelInfo.gameTitle }}</span>
						<span class="recent-game-level btn btn--primary btn--small"><Icon name="resume" size="16" /> {{ t('memory.level_title', { level: levelInfo.level }) }}</span>
						<span class="recent-game-time">{{ formatRelativeTime(levelInfo.savedAt) }}</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Overall Progress Card -->
		<section class="progress-section">
			<div class="progress-card" @click="navigateTo('/profile')">
				<div class="progress-header">
					<Icon :name="gameData.player.avatar" size="48" />
					<h2 class="progress-title">{{ t('home.welcome_back', { name: gameData.player.name }) }}</h2>
				</div>

				<div class="progress-stats">
					<div class="progress-item">
						<span class="progress-number">{{ playerSummary.achievements }}</span>
						<span class="progress-label">{{ t('nav.trophies') }}</span>
					</div>
					<div class="progress-item">
						<span class="progress-number">{{ playerSummary.gamesPlayed }}</span>
						<span class="progress-label">{{ t('gaming.stats.games_played') }}</span>
					</div>
					<div class="progress-item">
						<span class="progress-number">{{ overallProgress.levels }}/{{ overallProgress.totalLevels }}</span>
						<span class="progress-label">{{ t('gaming.stats.levels') }}</span>
					</div>
					<div class="progress-item">
						<span class="progress-number">{{ overallProgress.stars }}/{{ overallProgress.maxStars }}</span>
						<span class="progress-label">{{ t('gaming.stats.stars') }}</span>
					</div>
					<div class="progress-item">
						<span class="progress-number">{{ overallProgress.percentage }}%</span>
						<span class="progress-label">{{ t('common.complete') }}</span>
					</div>
				</div>

				<!-- Overall Progress Bar -->
				<div class="overall-progress-bar">
					<div
							class="overall-progress-fill"
							:style="{ width: `${overallProgress.percentage}%` }"
					></div>
				</div>
			</div>
		</section>

		<!-- Quick Games Access -->
		<section class="games-section">
			<div class="games-grid">
				<!-- Memory Game -->
				<div class="game-card" @click="navigateToGame('memory')">
					<div class="game-header">
						<Icon :name="memoryConfig.gameIcon" size="28" />
						<div class="game-info">
							<h3 class="game-title">{{ t('memory.title') }}</h3>
							<div class="game-progress">
								<span class="progress-text">{{ memoryProgress.completed }}/{{ memoryProgress.total }}</span>
								<div class="mini-progress-bar">
									<div
										class="mini-progress-fill memory"
										:style="{ width: `${memoryProgress.percentage}%` }"
									></div>
								</div>
							</div>
						</div>

						<div class="game-stats">
							<div class="game-stat">
								<Icon name="star-filled" size="14" />
								<span>{{ memoryProgress.stars }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Fruit Merge Game -->
				<div class="game-card" @click="navigateToGame('fruitMerge')">
					<div class="game-header">
						<Icon :name="fruitMergeConfig.gameIcon" size="28" />
						<div class="game-info">
							<h3 class="game-title">{{ fruitMergeConfig.gameTitle }}</h3>
							<div class="game-progress">
								<span class="progress-text">{{ fruitMergeProgress.completed }}/{{ fruitMergeProgress.total }}</span>
								<div class="mini-progress-bar">
									<div
											class="mini-progress-fill fruitmerge"
											:style="{ width: `${fruitMergeProgress.percentage}%` }"
									></div>
								</div>
							</div>
						</div>

						<div class="game-stats">
							<div class="game-stat">
								<Icon name="star-filled" size="14" />
								<span>{{ fruitMergeProgress.stars }}</span>
							</div>
						</div>
					</div>
				</div>

				<!-- Num Merge Game -->
				<div class="game-card" @click="navigateToGame('numMerge')">
					<div class="game-header">
						<Icon :name="numMergeConfig.gameIcon" size="28" />
						<div class="game-info">
							<h3 class="game-title">{{ numMergeConfig.gameTitle }}</h3>
							<div class="game-progress">
								<span class="progress-text">{{ numMergeProgress.completed }}/{{ numMergeProgress.total }}</span>
								<div class="mini-progress-bar">
									<div
											class="mini-progress-fill num"
											:style="{ width: `${numMergeProgress.percentage}%` }"
									></div>
								</div>
							</div>
						</div>

						<div class="game-stats">
							<div class="game-stat">
								<Icon name="star-filled" size="14" />
								<span>{{ numMergeProgress.stars }}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Portfolio Hero -->
		<section class="hero">
			<div class="hero-title"><h1>{{ t('portfolio.title') }}</h1></div>
			<p class="hero-subtitle">{{ t('portfolio.subtitle') }}</p>
		</section>

		<!-- Coming Soon Projekte -->
		<section class="coming-soon-section">
			<div class="project-card project-card--coming-soon">
				<div class="project-icon">
					<Icon name="code" size="48" />
				</div>
				<div class="project-content">
					<h2 class="project-title">{{ t('portfolio.commingSoon.title') }}</h2>
					<p class="project-description">{{ t('portfolio.commingSoon.description') }}</p>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.home {
	padding: var(--space-4) 0;
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	max-width: var(--content-width);
	margin: 0;
}

// Progress Section
.progress-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	cursor: pointer;
	display: flex;
	flex-direction: column;
	gap: var(--space-3);

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
		box-shadow: var(--card-shadow-hover);
	}
}

.progress-header {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

.progress-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.progress-stats {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-2);
}

.progress-item {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	text-align: center;
}

.progress-number {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.progress-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
}

.overall-progress-bar {
	height: 8px;
	background-color: var(--card-border);
	border-radius: var(--border-radius-md);
	overflow: hidden;
}

.overall-progress-fill {
	height: 100%;
	background: linear-gradient(90deg, var(--primary-color), var(--success-color));
	border-radius: var(--border-radius-md);
	transition: width 0.5s ease;
}

// Games Section
.section-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-3) 0;
}

.games-grid {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.game-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	cursor: pointer;
	transition: all 0.2s ease;
	display: flex;
	justify-content: space-between;
	align-items: center;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
		box-shadow: var(--card-shadow-hover);
	}
}

.game-header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	flex: 1;
}

.game-info {
	display: flex;
	gap: var(--space-1);
	flex-grow: 2;
	justify-content: space-between;
}

.game-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.game-progress {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.progress-text {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
}

.mini-progress-bar {
	width: 60px;
	height: 4px;
	background-color: var(--card-border);
	border-radius: var(--border-radius-sm);
	overflow: hidden;
}

.mini-progress-fill {
	height: 100%;
	border-radius: var(--border-radius-sm);
	transition: width 0.3s ease;
	background: linear-gradient(90deg, var(--primary-color), var(--success-color));
}

.game-stats {
	display: flex;
	gap: var(--space-2);
}

.game-stat {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
}

// Portfolio Hero
.hero {
	text-align: center;
	padding: var(--space-8) 0;
	margin-bottom: var(--space-4);
}

.hero-title {
	position: relative;
	width: 100%;
	height: 80px;
}

.hero-subtitle {
	font-size: var(--font-size-lg);
	color: var(--text-secondary);
	margin: 0;
}

// Coming Soon Section
.coming-soon-section {
	margin-bottom: var(--space-4);
}

.project-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	gap: var(--space-4);
	transition: all 0.2s ease;

	&--coming-soon {
		opacity: 0.6;
		cursor: default;
	}
}

.project-icon {
	color: var(--primary-color);
	flex-shrink: 0;
}

.project-content {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.project-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.project-description {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
}

// Recent Games Section
.recent-games-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.recent-game-item {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3);
	border-radius: var(--border-radius-xl);
	border: 1px solid;
	background: var(--card-bg);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
		box-shadow: var(--card-shadow-hover);
	}
}

.recent-game-info {
	flex: 1;
	display: flex;
	gap: var(--space-2);
	justify-content: flex-start;
	align-items: center;
}

.recent-game-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	width: 95px;
}

.recent-game-level {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	display: flex;
	gap: var(--space-1);
}

.recent-game-time {
	font-size: var(--font-size-xs);
	color: var(--text-muted);
	font-style: italic;
	flex-grow: 2;
	text-align: right;
}

.nav-icons-grid {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: var(--space-2);
}

.nav-icon-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-1);
	padding: var(--space-2) var(--space-1);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	cursor: pointer;
	transition: all 0.2s ease;
	color: var(--text-color);
	font-family: var(--font-family-base);
	min-height: 60px;
	text-align: center;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
		box-shadow: var(--card-shadow-hover);
	}

	span {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-bold);
		line-height: 1;
	}
}

// H1 Animation (from original)
h1 {
	font-size: var(--font-size-4xl);
	text-shadow:
			1px 1px 0 #f39,
			1px 0 0 #3f9,
			0 1px 0 #3f9,
			1px -1px 0 #3f9,
			-1px 1px 0 #3f9,
			-1px -1px 0 #3f9,
			-1px 0 0 #3f9,
			0 -1px 0 #3f9,
			0 35px 15px rgba(0, 0, 0, 0.8);
	color: #777;
	position: absolute;
	top: 0;
	left: 50%;
	text-align: center;
	text-transform: uppercase;
	transform: translateX(-50%) translateY(-50%) rotate3d(1, 1, 1, 0deg);
	animation-name: shadow;
	animation-duration: 20s;
	animation-iteration-count: infinite;
	perspective: 600px;
	white-space: nowrap;

	&::before {
		content: "HAUKE SCHULTZ";
		position: absolute;
		opacity: 0;
		overflow: hidden;
		text-shadow: none;
		margin: 0;
		left: 0;
		width: 100%;
		height: 30px;
		text-align: center;
		animation-name: foo1;
		animation-duration: 8000ms;
		animation-iteration-count: infinite;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}

	&::after {
		content: "HAUKE SCHULTZ";
		position: absolute;
		opacity: 0;
		overflow: hidden;
		text-shadow: none;
		margin: 0;
		left: 0;
		top: 50%;
		width: 100%;
		height: 30px;
		line-height: 0;
		text-align: center;
		animation-name: foo2;
		animation-duration: 8030ms;
		animation-iteration-count: infinite;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
}

@keyframes foo1 {
	0% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	1% {
		color: #3f9;
		transform: translateX(-1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	2% {
		color: #f39;
		transform: translateX(1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	3% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	10% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	11% {
		color: #3f9;
		transform: translateX(-1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	12% {
		transform: translateX(1%) translateY(0%) rotate3d(1, 1, 1, 0deg);
	}
	13% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	23.9% { opacity: 0; }
	24% { opacity: 1; color: #f39; }
	25% { opacity: 0; color: #000; }
	33.9% { opacity: 0; }
	34% { opacity: 1; color: #3f9; }
	35% { opacity: 0; color: #000; }
}

@keyframes foo2 {
	0% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	1% {
		color: #3f9;
		transform: translateX(3%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	2% {
		transform: translateX(-1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	3% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	10% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	11% {
		color: #f39;
		transform: translateX(1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	12% {
		transform: translateX(-3%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	13% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	26.9% { opacity: 0; }
	27% { opacity: 1; color: #3f9; }
	28% { opacity: 0; color: #000; }
	32.9% { opacity: 0; }
	33% { opacity: 1; color: #f39; }
	34% { opacity: 0; color: #000; }
}

@keyframes shadow {
	0% {
		text-shadow:
				1px 1px 0 #f39,
				1px 0 0 #3f9,
				0 1px 0 #3f9,
				1px -1px 0 #3f9,
				-1px 1px 0 #3f9,
				-1px -1px 0 #3f9,
				-1px 0 0 #3f9,
				0 -1px 0 #3f9,
				0 -35px 15px #414;
		transform: translateX(-50%) translateY(0%) rotate3d(1, 1, 1, -5deg);
	}

	50% {
		text-shadow:
				1px 1px 0 #f39,
				1px 0 0 #3f9,
				0 1px 0 #3f9,
				1px -1px 0 #3f9,
				-1px 1px 0 #3f9,
				-1px -1px 0 #3f9,
				-1px 0 0 #3f9,
				0 -1px 0 #3f9,
				0 35px 15px #314;
		transform: translateX(-50%) translateY(-50%) rotate3d(1, 1, 1, 3deg);
	}

	100% {
		text-shadow:
				1px 1px 0 #f39,
				1px 0 0 #3f9,
				0 1px 0 #3f9,
				1px -1px 0 #3f9,
				-1px 1px 0 #3f9,
				-1px -1px 0 #3f9,
				-1px 0 0 #3f9,
				0 -1px 0 #3f9,
				0 -35px 15px #414;
		transform: translateX(-50%) translateY(0%) rotate3d(1, 1, 1, -5deg);
	}
}
</style>