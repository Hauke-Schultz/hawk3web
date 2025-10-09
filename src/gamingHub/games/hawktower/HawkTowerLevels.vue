<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../../composables/useI18n.js'
import { STACK_CONFIG } from './stackConfig.js'
import GameLevelTile from '../../components/GameLevelTile.vue'
import ProgressOverview from '../../components/ProgressOverview.vue'
import { getLevelTitle, getLevelDescription } from '../../config/levelUtils.js'
import Header from '../../components/Header.vue'
import { useScreenshot } from '../../composables/useScreenshot.js'
import ScreenshotGallery from '../../components/ScreenshotGallery.vue'

// Services
const { gameData, hasLevelState, loadLevelState } = useLocalStorage()
const { t } = useI18n()
const router = useRouter()
const { getScreenshotCount } = useScreenshot()

const showScreenshotGallery = ref(false)
const selectedLevel = ref(null)

// Computed game data
const gameStats = computed(() => {
	return gameData.games.hawkTower || {}
})

// Compute level data with completion status
const levelData = computed(() => {
	return Object.entries(STACK_CONFIG.levels).map(([levelNumber, level]) => {
		const levelNum = parseInt(levelNumber)
		const levelStats = gameStats.value.levels?.[levelNum] || {}

		const isUnlocked = levelNum === 1 || level.difficulty === 'endless' ||
				(gameStats.value.levels?.[levelNum - 1]?.completed || false)

		const title = getLevelTitle(levelNum, 'hawkTower', t)
		const description = getLevelDescription(levelNum, 'hawkTower', t)

		// Check for saved state
		const savedState = loadLevelState('hawkTower', levelNum)
		const hasSaved = !!savedState
		const savedTimestamp = savedState?.savedAt || null

		// Screenshot data
		const screenshotCount = getScreenshotCount('hawkTower', levelNum)
		const hasScreenshots = screenshotCount > 0

		return {
			level: levelNum,
			title: level.title || title,
			description: description,
			targetHeight: level.targetHeight,
			difficulty: level.difficulty,
			isLocked: !isUnlocked,
			isCompleted: levelStats.completed || false,
			bestHeight: levelStats.bestHeight || 0,
			bestScore: levelStats.bestScore || 0,
			perfectPercent: levelStats.perfectPercent || 0,
			stars: levelStats.stars || 0,
			isEndless: level.targetHeight === Infinity,
			hasSavedState: hasSaved,
			savedStateTimestamp: savedTimestamp,
			screenshotCount: screenshotCount,
			hasScreenshots: hasScreenshots
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
	router.push(`/games/hawktower/${levelNumber}`)
}

const handleViewScreenshots = (levelNumber) => {
	selectedLevel.value = levelNumber
	showScreenshotGallery.value = true
}

const closeScreenshotGallery = () => {
	showScreenshotGallery.value = false
	selectedLevel.value = null
}

const handleScreenshotDownloaded = (screenshot) => {
	console.log('Screenshot downloaded:', screenshot.id)
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
				<h2 class="level-title">{{ t('hawkTower.title') }}</h2>
				<p class="level-subtitle">{{ t('gaming.choose_level') }}</p>
			</div>
		</div>

		<!-- Progress Overview -->
		<ProgressOverview
				:completed="completionStats.completed"
				:total="completionStats.total"
				:total-stars="completionStats.totalStars"
				:max-stars="completionStats.maxStars"
				theme="danger"
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
					:high-score="level.bestScore"
					:best-time="null"
					theme="danger"
					game-type="hawkTower"
					:has-saved-state="level.hasSavedState"
					:saved-state-timestamp="level.savedStateTimestamp"
					:screenshot-count="level.screenshotCount"
					:has-screenshots="level.hasScreenshots"
					@view-screenshots="handleViewScreenshots"
					@play-level="handlePlayLevel"
			>
				<!-- Custom Stats Slot -->
				<template #custom-stats>
					<div class="level-tile__custom-stats">
						<div class="custom-stat">
							<span class="custom-stat__icon">🏗️</span>
							<span class="custom-stat__label">{{ t('hawkTower.bestHeight') }}</span>
							<span class="custom-stat__value">{{ level.bestHeight }}</span>
						</div>
						<div class="custom-stat" v-if="level.perfectPercent > 0">
							<span class="custom-stat__icon">⭐</span>
							<span class="custom-stat__label">{{ t('hawkTower.perfect') }}</span>
							<span class="custom-stat__value">{{ level.perfectPercent }}%</span>
						</div>
					</div>
				</template>
			</GameLevelTile>
		</div>
	</main>

	<!-- Screenshot Gallery Modal -->
	<ScreenshotGallery
			v-if="selectedLevel"
			:visible="showScreenshotGallery"
			:game-id="'hawkTower'"
			:level="selectedLevel"
			:game-title="t('hawkTower.title')"
			:show-download="true"
			:show-metadata="true"
			:max-width="'400px'"
			@close="closeScreenshotGallery"
			@screenshot-downloaded="handleScreenshotDownloaded"
	/>
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

// Custom Stats in Level Tiles
.level-tile__custom-stats {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	margin-top: var(--space-2);
}

.custom-stat {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--text-secondary);

	&__icon {
		font-size: var(--font-size-sm);
	}

	&__label {
		flex: 1;
	}

	&__value {
		font-weight: var(--font-weight-bold);
		color: var(--text-color);
	}
}
</style>