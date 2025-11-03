<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { memoryConfig } from '../games/memory/memoryConfig.js'
import { hawkFruitConfig } from '../games/hawkfruit/hawkFruitConfig.js'
import { hawkDoubleUpConfig } from '../games/hawkdoubleup/hawkDoubleUpConfig.js'
import { hawkDungeonConfig } from '../games/hawkdungeon/hawkDungeonConfig.js'
import Icon from '../../components/Icon.vue'
import Header from "../components/Header.vue";

// Services
const { gameData } = useLocalStorage()
const { t } = useI18n()
const router = useRouter()

// Game methods using router
const startGame = (gameId) => {
	console.log(`Starting ${gameId} game...`)
	if (gameId === 'memory') {
		router.push('/games/memory')
	} else if (gameId === 'hawkFruit') {
		router.push('/games/hawkfruit')
	} else if (gameId === 'hawkDoubleUp') {
		router.push('/games/hawkdoubleup')
	} else if (gameId === 'hawkDungeon') {
		router.push('/games/hawkdungeon')
	}
}

const memoryProgress = computed(() => {
	const levels = gameData.games.memory.levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = memoryConfig.levels.length
	const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: percentage
	}
})

const hawkFruitProgress = computed(() => {
	const levels = gameData.games.hawkFruit.levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = hawkFruitConfig.levels.length
	const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: percentage
	}
})

const hawkDoubleUpProgress = computed(() => {
	const levels = gameData.games.hawkDoubleUp.levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = hawkDoubleUpConfig.levels.length
	const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: percentage
	}
})

const hawkDungeonProgress = computed(() => {
	const levels = gameData.games.hawkDungeon?.levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = hawkDungeonConfig.levels.length
	const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: percentage
	}
})

const handleMenuClick = () => {
	router.push('/gaming')
}
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>

	<main class="gaming-hub">
		<div class="hero-section">
			<h2 class="hero-title">{{ t('gaming.title') }}</h2>
			<p class="hero-subtitle">{{ t('gaming.subtitle') }}</p>
		</div>

		<div class="games-grid">
			<!-- Hawk Memory Game Card -->
			<div class="game-card">
				<div class="game-header">
					<div class="game-icon">
						<Icon :name="memoryConfig.gameIcon" size="32" />
					</div>
					<h3 class="game-title">{{ t('memory.title') }}</h3>
				</div>

				<p class="game-description">{{ t('memory.description') }}</p>

				<div class="game-stats">
					<div class="stat-item">
						<span class="stat-value">{{ gameData.games.memory.gamesPlayed }}</span>
						<span class="stat-label">{{ t('gaming.stats.games_played') }}</span>
					</div>
				</div>

				<!-- Progress Indicator -->
				<div class="game-progress">
					<div class="progress-bar">
						<div
							class="progress-fill"
							:style="{ width: `${memoryProgress.percentage}%` }"
						></div>
					</div>
					<span class="progress-text">{{ memoryProgress.percentage }}%</span>
				</div>

				<button class="btn btn--primary game-play-btn" @click="startGame('memory')">
					<Icon name="play" size="16" />
					{{ t('common.play') }}
				</button>
			</div>

			<!-- HawkFruit Game Card -->
			<div class="game-card">
				<div class="game-header">
					<div class="game-icon">
						<Icon :name="hawkFruitConfig.gameIcon" size="32" />
					</div>
					<h3 class="game-title">{{ hawkFruitConfig.gameTitle }}</h3>
				</div>

				<p class="game-description">{{ hawkFruitConfig.gameDescription }}</p>

				<div class="game-stats">
					<div class="stat-item">
						<span class="stat-value">{{ gameData.games.hawkFruit.gamesPlayed }}</span>
						<span class="stat-label">{{ t('gaming.stats.games_played') }}</span>
					</div>
				</div>

				<!-- Progress Indicator -->
				<div class="game-progress">
					<div class="progress-bar">
						<div
							class="progress-fill"
							:style="{ width: `${hawkFruitProgress.percentage}%` }"
						></div>
					</div>
					<span class="progress-text">{{ hawkFruitProgress.percentage }}%</span>
				</div>

				<button class="btn btn--primary game-play-btn" @click="startGame('hawkFruit')">
					<Icon name="play" size="16" />
					{{ t('common.play') }}
				</button>
			</div>

			<!-- NumberMerge Game Card -->
			<div class="game-card">
				<div class="game-header">
					<div class="game-icon">
						<Icon :name="hawkDoubleUpConfig.gameIcon" size="32" />
					</div>
					<h3 class="game-title">{{ hawkDoubleUpConfig.gameTitle }}</h3>
				</div>
				<p class="game-description">{{ hawkDoubleUpConfig.gameDescription }}</p>
				<div class="game-stats">
					<div class="stat-item">
						<span class="stat-value">{{ gameData.games.hawkDoubleUp.gamesPlayed }}</span>
						<span class="stat-label">{{ t('gaming.stats.games_played') }}</span>
					</div>
				</div>
				<!-- Progress Indicator -->
				<div class="game-progress">
					<div class="progress-bar">
						<div
							class="progress-fill"
							:style="{ width: `${hawkDoubleUpProgress.percentage}%` }"
						></div>
					</div>
					<span class="progress-text">{{ hawkDoubleUpProgress.percentage }}%</span>
				</div>

				<button class="btn btn--primary game-play-btn" @click="startGame('hawkDoubleUp')">
					<Icon name="play" size="16" />
					{{ t('common.play') }}
				</button>
			</div>

			<!-- Hawk Dungeon Game Card -->
			<div class="game-card">
				<div class="game-header">
					<div class="game-icon">
						<Icon :name="hawkDungeonConfig.gameIcon" size="32" />
					</div>
					<h3 class="game-title">{{ hawkDungeonConfig.gameTitle }}</h3>
				</div>
				<p class="game-description">{{ hawkDungeonConfig.gameDescription }}</p>
				<div class="game-stats">
					<div class="stat-item">
						<span class="stat-value">{{ gameData.games.hawkDungeon?.gamesPlayed || 0 }}</span>
						<span class="stat-label">{{ t('gaming.stats.games_played') }}</span>
					</div>
				</div>
				<!-- Progress Indicator -->
				<div class="game-progress">
					<div class="progress-bar">
						<div
							class="progress-fill"
							:style="{ width: `${hawkDungeonProgress.percentage}%` }"
						></div>
					</div>
					<span class="progress-text">{{ hawkDungeonProgress.percentage }}%</span>
				</div>

				<button class="btn btn--primary game-play-btn" @click="startGame('hawkDungeon')">
					<Icon name="play" size="16" />
					{{ t('common.play') }}
				</button>
			</div>
		</div>
	</main>
</template>

<style lang="scss" scoped>
// Gaming Hub Main Container
.gaming-hub {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
}

// Hero Section - kompakter
.hero-section {
	text-align: center;
	padding: var(--space-2) 0;
}

.hero-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-1) 0;
}

.hero-subtitle {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
}

// Games Grid
.games-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: var(--space-3);
	align-items: start;
}

// Game Cards
.game-card {
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	transition: all 0.3s ease;
	height: fit-content;
	min-height: 200px;
	position: relative;
	overflow: hidden;

	&--coming-soon {
		opacity: 0.7;

		.btn {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
}

// Game Header - Icon und Title horizontal
.game-header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-bottom: var(--space-1);
}

.game-icon {
	color: var(--primary-color);
	width: var(--space-10);
	height: var(--space-10);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.game-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	line-height: 1.2;
}

.game-description {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.3;
	flex: 1;
}

// Game Stats - kompakte 2-Spalten
.game-stats {
	display: flex;
	gap: var(--space-2);
	margin: var(--space-2) 0 0;
	padding: var(--space-2);
	background-color: rgba(255, 255, 255, 0.1);
	border-radius: var(--border-radius-md);
	backdrop-filter: blur(2px);
}

.stat-item {
	display: flex;
	flex-direction: row;
	justify-content: center;
	align-items: center;
	width: 100%;
	gap: var(--space-3);
	text-align: center;
}

.stat-value {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	line-height: 1;
}

.stat-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	line-height: 1;
}

// Play Button - volle Breite
.game-play-btn {
	width: 100%;
	margin-top: auto;
	padding: var(--space-2) var(--space-3);
	justify-content: center;
}

.game-progress {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin: var(--space-1) 0;
}

.progress-bar {
	flex: 1;
	height: 6px;
	background-color: rgba(255, 255, 255, 0.2);
	border-radius: var(--border-radius-sm);
	overflow: hidden;
	backdrop-filter: blur(2px);
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, var(--success-color), var(--success-hover));
	border-radius: var(--border-radius-sm);
	transition: width 0.5s ease;
	box-shadow: 0 0 8px rgba(16, 185, 129, 0.4);
}

.progress-text {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	min-width: 35px;
	text-align: center;
	background-color: rgba(255, 255, 255, 0.1);
	padding: var(--space-0) var(--space-1);
	border-radius: var(--border-radius-sm);
	backdrop-filter: blur(2px);
}

// Responsive für sehr kleine Bildschirme
@media (max-width: 320px) {
	.games-grid {
		grid-template-columns: 1fr;
		gap: var(--space-2);
	}

	.game-card {
		min-height: 180px;
	}

	.game-stats {
		grid-template-columns: repeat(2, 1fr);
		gap: var(--space-1);
		padding: var(--space-1);
	}

	.stat-value {
		font-size: var(--font-size-sm);
	}
}
</style>