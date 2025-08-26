<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { numNumMergeConfig } from './numNumMergeConfig.js'
import GameLevelTile from '../../components/GameLevelTile.vue'
import Icon from '../../components/Icon.vue'
import ProgressOverview from "../../components/ProgressOverview.vue";
import { calculateLevelStars, getLevelTitle, getLevelDescription } from "../../config/levelUtils.js"
import Header from "../../components/Header.vue";

// Services
const { gameData, hasLevelState, loadLevelState } = useLocalStorage()
const { t } = useI18n()
const router = useRouter()

// Computed game data
const gameStats = computed(() => {
	return gameData.games.numNumMerge || {}
})

// Compute level data with completion status
const levelData = computed(() => {
	return numNumMergeConfig.levels.map((level, index) => {
		const levelNumber = index + 1
		const levelStats = gameStats.value.levels?.[levelNumber] || {}

		const isUnlocked = levelNumber === 1 || level.isEndless ||
				(gameStats.value.levels?.[levelNumber - 1]?.completed || false)

		const title = getLevelTitle(levelNumber, 'numNumMerge', t)
		const description = getLevelDescription(levelNumber, 'numNumMerge', t)

		// Check for saved state
		const savedState = loadLevelState('numNumMerge', levelNumber)
		const hasSaved = !!savedState
		const savedTimestamp = savedState?.savedAt || null

		return {
			level: levelNumber,
			title: title,
			description: description,
			pairs: level.pairs,
			timeBonus: level.timeBonus,
			isLocked: !isUnlocked,
			isCompleted: levelStats.completed || false,
			highScore: levelStats.highScore || 0,
			bestTime: levelStats.bestTime || null,
			stars: levelStats.stars || 0,
			attempts: levelStats.attempts || 0,
			isEndless: level.isEndless || false,
			hasSavedState: hasSaved,
			savedStateTimestamp: savedTimestamp
		}
	})
})

// Completion stats
const completionStats = computed(() => {
	const completed = levelData.value.filter(level => level.isCompleted).length
	const total = levelData.value.length
	const totalStars = levelData.value.reduce((sum, level) => sum + level.stars, 0)
	const maxStars = total * 3

	return {
		completed,
		total,
		totalStars,
		maxStars,
		percentage: Math.round((completed / total) * 100)
	}
})

// Event handlers using router
const handlePlayLevel = (levelNumber) => {
	router.push(`/games/numNumMerge/${levelNumber}`)
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
	/>

	<main class="level-selection">
		<!-- Header Section -->
		<div class="level-header">
			<div class="level-title-section">
				<h2 class="level-title">{{ numNumMergeConfig.gameTitle }}</h2>
				<p class="level-subtitle">{{ t('gaming.choose_level') }}</p>
			</div>
		</div>

		<!-- Progress Overview -->
		<ProgressOverview
			:completed="completionStats.completed"
			:total="completionStats.total"
			:total-stars="completionStats.totalStars"
			:max-stars="completionStats.maxStars"
			theme="warning"
			:levels-label="t('gaming.stats.levels')"
			:stars-label="t('gaming.stats.stars')"
			:complete-label="t('common.complete')"
		/>

		<!-- Levels Grid -->
		<div class="levels-grid">
			<GameLevelTile
				v-for="level in levelData"
				:key="level.level"
				:level="level.level"
				:title="level.title"
				:description="level.description"
				:is-locked="level.isLocked"
				:is-completed="level.isCompleted"
				:stars="level.stars"
				:high-score="level.highScore"
				:best-time="level.bestTime"
				theme="warning"
				game-type="numNumMerge"
				:has-saved-state="level.hasSavedState"
				:saved-state-timestamp="level.savedStateTimestamp"
				@play-level="handlePlayLevel"
			/>
		</div>
	</main>
</template>


<style lang="scss" scoped>
// Main Container
.level-selection {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
}

// Header Section
.level-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: var(--space-3);
}

.level-title-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.level-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.level-subtitle {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	margin: 0;
}

.levels-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: var(--space-2);
	justify-items: stretch;
}

</style>