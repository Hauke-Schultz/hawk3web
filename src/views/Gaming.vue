<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { memoryConfig } from '../config/memoryConfig.js'
import { fruitMergeConfig } from '../config/fruitMergeConfig.js'
import Icon from '../components/Icon.vue'
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
	} else if (gameId === 'fruitMerge') {
		router.push('/games/fruitmerge')
	}
}

const handleMenuClick = () => {
	router.push('/')
}
</script>

<template>
	<Header
			:game-data="gameData"
			:show-profile="true"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>

	<main class="gaming-hub">
		<div class="hero-section">
			<h2 class="hero-title">{{ t('gaming.title') }}</h2>
			<p class="hero-subtitle">{{ t('gaming.subtitle') }}</p>
		</div>

		<div class="games-grid">
			<!-- Memory Game Card -->
			<div class="game-card">
				<div class="game-icon">
					<Icon :name="memoryConfig.gameIcon" size="56" />
				</div>
				<div class="game-info">
					<h3 class="game-title">{{ t('memory.title') }}</h3>
					<p class="game-description">{{ t('memory.description') }}</p>
					<div class="game-stats">
						<span class="best-score">{{ t('gaming.stats.best_score', { score: gameData.games.memory.highScore }) }}</span>
						<span class="games-played">{{ t('gaming.stats.games_played', { count: gameData.games.memory.gamesPlayed }) }}</span>
					</div>
				</div>
				<button class="btn" @click="startGame('memory')">
					<Icon name="play" size="20" />
					{{ t('common.play') }}
				</button>
			</div>

			<!-- FruitMerge Game Card -->
			<div class="game-card">
				<div class="game-icon">
					<Icon :name="fruitMergeConfig.gameIcon" size="56" />
				</div>
				<div class="game-info">
					<h3 class="game-title">{{ fruitMergeConfig.gameTitle }}</h3>
					<p class="game-description">{{ fruitMergeConfig.gameDescription }}</p>
					<div class="game-stats">
						<span class="best-score">{{ t('gaming.stats.best_score', { score: gameData.games.fruitMerge.highScore }) }}</span>
						<span class="games-played">{{ t('gaming.stats.games_played', { count: gameData.games.fruitMerge.gamesPlayed }) }}</span>
					</div>
				</div>
				<button class="btn" @click="startGame('fruitMerge')">
					<Icon name="play" size="20" />
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
	gap: var(--space-6);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
}

// Hero Section
.hero-section {
	text-align: center;
	padding: var(--space-4) 0;
}

.hero-title {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.hero-subtitle {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
}

// Games Grid
.games-grid {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

// Game Cards
.game-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	align-items: center;
	gap: var(--space-4);
	transition: all 0.2s ease;
	position: relative;

	&:hover:not(&--coming-soon) {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-2px);
	}

	&--coming-soon {
		opacity: 0.7;

		.btn {
			opacity: 0.5;
			cursor: not-allowed;
		}
	}
}

.game-icon {
	color: white;
	border-radius: 50%;
	width: var(--space-14);
	height: var(--space-14);
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.game-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.game-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.game-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.game-stats {
	display: flex;
	gap: var(--space-3);
	font-size: var(--font-size-xs);
	color: var(--text-muted);
}

.best-score,
.games-played {
	font-weight: var(--font-weight-bold);
}
</style>