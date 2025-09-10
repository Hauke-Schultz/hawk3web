<script setup>
import {computed, ref} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../../composables/useLocalStorage.js'
import { useI18n } from '../../../composables/useI18n.js'
import { useScreenshot } from '../../composables/useScreenshot.js'
import { fruitMergeConfig } from './fruitMergeConfig.js'
import GameLevelTile from '../../components/GameLevelTile.vue'
import Icon from '../../../components/Icon.vue'
import ProgressOverview from "../../components/ProgressOverview.vue";
import { calculateLevelStars, getLevelTitle, getLevelDescription } from "../../config/levelUtils.js"
import Header from "../../components/Header.vue";

// Services
const { gameData, hasLevelState, loadLevelState } = useLocalStorage()
const { t } = useI18n()
const router = useRouter()
const { getScreenshotsForLevel, getScreenshotCount } = useScreenshot()

const showScreenshotGallery = ref(false)
const selectedLevel = ref(null)
const selectedLevelScreenshots = ref([])

// Computed game data
const gameStats = computed(() => {
	return gameData.games.fruitMerge || {}
})

// Compute level data with completion status
const levelData = computed(() => {
	return fruitMergeConfig.levels.map((level, index) => {
		const levelNumber = index + 1
		const levelStats = gameStats.value.levels?.[levelNumber] || {}

		const isUnlocked = levelNumber === 1 || level.isEndless ||
				(gameStats.value.levels?.[levelNumber - 1]?.completed || false)

		const title = getLevelTitle(levelNumber, 'fruitMerge', t)
		const description = getLevelDescription(levelNumber, 'fruitMerge', t)

		// Check for saved state
		const savedState = loadLevelState('fruitMerge', levelNumber)
		const hasSaved = !!savedState
		const savedTimestamp = savedState?.savedAt || null
		const screenshotCount = getScreenshotCount('fruitMerge', levelNumber)
		const hasScreenshots = screenshotCount > 0

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
	router.push(`/games/fruitmerge/${levelNumber}`)
}

const handleViewScreenshots = (levelNumber) => {
	selectedLevel.value = levelNumber
	selectedLevelScreenshots.value = getScreenshotsForLevel('fruitMerge', levelNumber)
	showScreenshotGallery.value = true
}

const closeScreenshotGallery = () => {
	showScreenshotGallery.value = false
	selectedLevel.value = null
	selectedLevelScreenshots.value = []
}

const handleMenuClick = () => {
	router.push('/')
}

const downloadScreenshot = (screenshot) => {
	try {
		// Create download link
		const link = document.createElement('a')
		link.href = screenshot.imageData
		link.download = `fruitmerge_level${screenshot.level}_${screenshot.score}points_${new Date(screenshot.capturedAt).toISOString().slice(0, 10)}.png`

		// Trigger download
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		console.log('📸 Screenshot downloaded:', screenshot.id)
	} catch (error) {
		console.error('Error downloading screenshot:', error)
	}
}

const formatScreenshotDate = (dateString) => {
	try {
		const date = new Date(dateString)
		return date.toLocaleDateString() + ' ' + date.toLocaleTimeString()
	} catch (error) {
		return dateString
	}
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
				<h2 class="level-title">{{ fruitMergeConfig.gameTitle }}</h2>
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
				game-type="fruitMerge"
				:has-saved-state="level.hasSavedState"
				:saved-state-timestamp="level.savedStateTimestamp"
				:screenshot-count="level.screenshotCount"
				:has-screenshots="level.hasScreenshots"
				@view-screenshots="handleViewScreenshots"
				@play-level="handlePlayLevel"
			/>
		</div>
	</main>
	<!-- Screenshot Gallery Modal -->
	<Teleport to="body">
		<div
				v-if="showScreenshotGallery"
				class="screenshot-gallery-overlay"
				@click="closeScreenshotGallery"
		>
			<div
					class="screenshot-gallery-modal"
					@click.stop
					role="dialog"
					aria-modal="true"
					:aria-labelledby="t('fruitMerge.screenshot_gallery_title')"
			>
				<!-- Gallery Header -->
				<div class="gallery-header">
					<h3 class="gallery-title">
						{{ t('fruitMerge.screenshot_gallery') }} - {{ t('fruitMerge.level_title', { level: selectedLevel }) }}
					</h3>
					<button
							class="btn btn--circle-ghost"
							@click="closeScreenshotGallery"
							:aria-label="t('common.close')"
					>
						<Icon name="close" size="20" />
					</button>
				</div>

				<!-- Gallery Content -->
				<div class="gallery-content">
					<div v-if="selectedLevelScreenshots.length === 0" class="gallery-empty">
						<Icon name="camera" size="48" />
						<p class="empty-message">{{ t('fruitMerge.no_screenshots') }}</p>
						<p class="empty-description">{{ t('fruitMerge.play_level_for_screenshots') }}</p>
					</div>

					<div v-else class="screenshots-grid">
						<div
								v-for="screenshot in selectedLevelScreenshots"
								:key="screenshot.id"
								class="screenshot-item"
						>
							<!-- Screenshot Image -->
							<div class="screenshot-image-container">
								<img
										:src="screenshot.imageData"
										:alt="t('fruitMerge.screenshot_alt', { score: screenshot.score })"
										class="screenshot-image"
								/>

								<!-- Screenshot Overlay Info -->
								<div class="screenshot-overlay">
									<!-- Screenshot Actions -->
									<div class="screenshot-actions">
										<button
												class="btn btn--small btn--info"
												@click="downloadScreenshot(screenshot)"
												:title="t('fruitMerge.download_screenshot')"
										>
											<Icon name="download" size="14" />
										</button>
									</div>
								</div>
							</div>

							<!-- Screenshot Metadata -->
							<div class="screenshot-metadata">
								<div class="metadata-row">
									<span class="metadata-label">{{ t('stats.score') }}:</span>
									<span class="metadata-value">{{ screenshot.score }}</span>
								</div>
								<div v-if="screenshot.moves" class="metadata-row">
									<span class="metadata-label">{{ t('stats.moves') }}:</span>
									<span class="metadata-value">{{ screenshot.moves }}</span>
								</div>
								<div class="metadata-row">
									<span class="metadata-label">{{ t('fruitMerge.fruits_on_board') }}:</span>
									<span class="metadata-value">{{ screenshot.fruitsCount }}</span>
								</div>
								<div class="metadata-row">
									<span class="metadata-value">{{ formatScreenshotDate(screenshot.capturedAt) }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Teleport>
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



// Screenshot Gallery Modal
.screenshot-gallery-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.3s ease;
}

.screenshot-gallery-modal {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	border: 1px solid var(--card-border);
	max-width: 90%;
	width: 400px;
	box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
	animation: slideIn 0.3s ease;
	max-height: 90vh;
	overflow-y: auto;
}

.gallery-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-4);
	border-bottom: 1px solid var(--card-border);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

.gallery-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.gallery-content {
	flex: 1;
	overflow-y: auto;
	padding: var(--space-4);
}

.gallery-empty {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	padding: var(--space-8);
	text-align: center;
	color: var(--text-secondary);
}

.empty-message {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	margin: var(--space-4) 0 var(--space-2) 0;
}

.empty-description {
	font-size: var(--font-size-sm);
	margin: 0;
	opacity: 0.8;
}

.screenshots-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: var(--space-2);
}

.screenshot-item {
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
	border: 1px solid var(--card-border);
	overflow: hidden;
	transition: all 0.2s ease;
}

.screenshot-item:hover {
	border-color: var(--primary-color);
	box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

.screenshot-image-container {
	position: relative;
	overflow: hidden;
}

.screenshot-image {
	width: 100%;
	height: auto;
	display: block;
	transition: transform 0.2s ease;
}

.screenshot-item:hover .screenshot-image {
	transform: scale(1.02);
}

.screenshot-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(
					to bottom,
					rgba(0, 0, 0, 0.7) 0%,
					transparent 40%,
					transparent 60%,
					rgba(0, 0, 0, 0.7) 100%
	);
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	padding: var(--space-3);
	opacity: 0;
	transition: opacity 0.2s ease;
}

.screenshot-item:hover .screenshot-overlay {
	opacity: 1;
}

.screenshot-actions {
	display: flex;
	justify-content: flex-end;
	gap: var(--space-2);
}

.screenshot-metadata {
	padding: var(--space-3);
	background-color: var(--card-bg);
}

.metadata-row {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: var(--space-1) 0;
	border-bottom: 1px solid var(--card-border);
}

.metadata-row:last-child {
	border-bottom: none;
}

.metadata-label {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
}

.metadata-value {
	font-size: var(--font-size-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
}

// Responsive Design
@media (max-width: 480px) {
	.screenshot-gallery-modal {
		width: 95%;
		max-height: 95vh;
	}

	.gallery-header {
		padding: var(--space-3);
	}

	.gallery-content {
		padding: var(--space-3);
	}
}

// Animations
@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateY(-30px) scale(0.9);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>