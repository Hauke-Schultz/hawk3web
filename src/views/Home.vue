<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Header from '../gamingHub/components/Header.vue'
import Icon from '../components/Icon.vue'
import {useLocalStorage} from "../gamingHub/composables/useLocalStorage.js";
import {computed} from "vue";
import {memoryConfig} from "../gamingHub/games/memory/memoryConfig.js";
import {fruitMergeConfig} from "../gamingHub/games/fruitmerge/fruitMergeConfig.js";
import {numNumMergeConfig} from "../gamingHub/games/numnummerge/numNumMergeConfig.js";

const { t } = useI18n()
const { gameData } = useLocalStorage()
const router = useRouter()

const startGame = (gameId) => {
	console.log(`Starting ${gameId} game...`)
	if (gameId === 'memory') {
		router.push('/games/memory')
	} else if (gameId === 'fruitMerge') {
		router.push('/games/fruitmerge')
	} else if (gameId === 'numNumMerge') {
		router.push('/games/numnummerge')
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

const fruitMergeProgress = computed(() => {
	const levels = gameData.games.fruitMerge.levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = fruitMergeConfig.levels.length
	const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: percentage
	}
})

const numNumMergeProgress = computed(() => {
	const levels = gameData.games.numNumMerge.levels || {}
	const completedLevels = Object.values(levels).filter(level => level.completed).length
	const totalLevels = numNumMergeConfig.levels.length
	const percentage = totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0

	return {
		completed: completedLevels,
		total: totalLevels,
		percentage: percentage
	}
})

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
	/>

	<main class="portfolio">

		<!-- Projekte -->
		<section class="projects">
			<div class="projects-grid">
				<!-- Gaming Platform -->
				<h2 class="project-title">{{ t('portfolio.gamingHub.title') }}</h2>
				<div class="games-grid">
					<!-- Memory Game Card -->
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

					<!-- FruitMerge Game Card -->
					<div class="game-card">
						<div class="game-header">
							<div class="game-icon">
								<Icon :name="fruitMergeConfig.gameIcon" size="32" />
							</div>
							<h3 class="game-title">{{ fruitMergeConfig.gameTitle }}</h3>
						</div>

						<p class="game-description">{{ fruitMergeConfig.gameDescription }}</p>

						<div class="game-stats">
							<div class="stat-item">
								<span class="stat-value">{{ gameData.games.fruitMerge.gamesPlayed }}</span>
								<span class="stat-label">{{ t('gaming.stats.games_played') }}</span>
							</div>
						</div>

						<!-- Progress Indicator -->
						<div class="game-progress">
							<div class="progress-bar">
								<div
										class="progress-fill"
										:style="{ width: `${fruitMergeProgress.percentage}%` }"
								></div>
							</div>
							<span class="progress-text">{{ fruitMergeProgress.percentage }}%</span>
						</div>

						<button class="btn btn--primary game-play-btn" @click="startGame('fruitMerge')">
							<Icon name="play" size="16" />
							{{ t('common.play') }}
						</button>
					</div>

					<!-- NumberMerge Game Card -->
					<div class="game-card">
						<div class="game-header">
							<div class="game-icon">
								<Icon :name="numNumMergeConfig.gameIcon" size="32" />
							</div>
							<h3 class="game-title">{{ numNumMergeConfig.gameTitle }}</h3>
						</div>
						<p class="game-description">{{ numNumMergeConfig.gameDescription }}</p>
						<div class="game-stats">
							<div class="stat-item">
								<span class="stat-value">{{ gameData.games.numNumMerge.gamesPlayed }}</span>
								<span class="stat-label">{{ t('gaming.stats.games_played') }}</span>
							</div>
						</div>
						<!-- Progress Indicator -->
						<div class="game-progress">
							<div class="progress-bar">
								<div
										class="progress-fill"
										:style="{ width: `${numNumMergeProgress.percentage}%` }"
								></div>
							</div>
							<span class="progress-text">{{ numNumMergeProgress.percentage }}%</span>
						</div>

						<button class="btn btn--primary game-play-btn" @click="startGame('numNumMerge')">
							<Icon name="play" size="16" />
							{{ t('common.play') }}
						</button>
					</div>
				</div>

				<!-- Portfolio Hero -->
				<section class="hero">
					<div class="hero-title"><h1>{{ t('portfolio.title') }}</h1></div>
					<p class="hero-subtitle">{{ t('portfolio.subtitle') }}</p>
				</section>

				<!-- Coming Soon Projekte -->
				<div class="project-card project-card--coming-soon">
					<div class="project-icon">
						<Icon name="code" size="48" />
					</div>
					<div class="project-content">
						<h2 class="project-title">{{ t('portfolio.commingSoon.title') }}</h2>
						<p class="project-description">{{ t('portfolio.commingSoon.description') }}</p>
					</div>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.portfolio {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-8);
}

.hero {
	text-align: center;
	padding: var(--space-8) 0;
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

.projects {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.section-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.projects-grid {
	display: grid;
	gap: var(--space-4);
}

.project-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	gap: var(--space-4);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(&--coming-soon) {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-2px);
	}

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

.project-tech {
	display: flex;
	gap: var(--space-2);
	flex-wrap: wrap;
}

.tech-tag {
	background-color: var(--primary-color);
	color: white;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
}

.quick-links {
	display: flex;
	justify-content: center;
	gap: var(--space-3);
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