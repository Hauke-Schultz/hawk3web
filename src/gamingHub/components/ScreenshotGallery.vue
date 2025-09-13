<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import { useScreenshot } from '../composables/useScreenshot.js'
import Icon from '../../components/Icon.vue'

// Props for the screenshot gallery component
const props = defineProps({
	gameId: {
		type: String,
		required: true
	},
	level: {
		type: Number,
		required: true
	},
	gameTitle: {
		type: String,
		required: true
	},
	visible: {
		type: Boolean,
		default: false
	},
	// Optional props for customization
	showDownload: {
		type: Boolean,
		default: true
	},
	showMetadata: {
		type: Boolean,
		default: true
	},
	maxWidth: {
		type: String,
		default: '400px'
	}
})

// Emits for parent component communication
const emit = defineEmits([
	'close',
	'screenshot-downloaded'
])

const { t } = useI18n()
const { getScreenshotsForLevel } = useScreenshot()

const expandedScreenshot = ref(null)

// Get screenshots for this level
const screenshots = computed(() => {
	return getScreenshotsForLevel(props.gameId, props.level)
})

// Event handlers
const closeGallery = () => {
	emit('close')
}

// Update download method to prevent event bubbling
const downloadScreenshot = (screenshot) => {
	try {
		// Create download link
		const link = document.createElement('a')
		link.href = screenshot.imageData
		link.download = `${props.gameId}_level${screenshot.level}_${screenshot.score}points_${new Date(screenshot.capturedAt).toISOString().slice(0, 10)}.png`

		// Trigger download
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)

		console.log('📸 Screenshot downloaded:', screenshot.id)
		emit('screenshot-downloaded', screenshot)
	} catch (error) {
		console.error('Error downloading screenshot:', error)
	}
}

const toggleScreenshot = (screenshotId) => {
	if (expandedScreenshot.value === screenshotId) {
		expandedScreenshot.value = null
	} else {
		expandedScreenshot.value = screenshotId
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

const formatGameTitle = (gameId) => {
	// Fallback to gameId if no translation exists
	return t(`${gameId}.title`, props.gameTitle)
}
</script>

<template>
	<!-- Screenshot Gallery Modal -->
	<Teleport to="body">
		<div
				v-if="visible"
				class="screenshot-gallery-overlay"
				@click="closeGallery"
		>
			<div
					class="screenshot-gallery-modal"
					:style="{ maxWidth: maxWidth }"
					@click.stop
					role="dialog"
					aria-modal="true"
					:aria-labelledby="t('nav.screenshot_gallery')"
			>
				<!-- Gallery Header -->
				<div class="gallery-header">
					<h3 class="gallery-title">
						{{ t('nav.screenshot_gallery') }} - {{ formatGameTitle(gameId) }} {{ t('common.level') }} {{ level }}
					</h3>
					<button
							class="btn btn--circle-ghost"
							@click="closeGallery"
							:aria-label="t('common.close')"
					>
						<Icon name="close" size="20" />
					</button>
				</div>

				<!-- Gallery Content -->
				<div class="gallery-content">
					<!-- Empty State -->
					<div v-if="screenshots.length === 0" class="gallery-empty">
						<Icon name="camera" size="48" />
						<p class="empty-message">{{ t('fruitMerge.no_screenshots') }}</p>
						<p class="empty-description">{{ t('fruitMerge.play_level_for_screenshots') }}</p>
					</div>

					<!-- Screenshots List -->
					<div v-else class="screenshots-list">
						<div
								v-for="screenshot in screenshots"
								:key="screenshot.id"
								class="screenshot-item"
								:class="{ 'screenshot-item--expanded': expandedScreenshot === screenshot.id }"
						>
							<!-- Screenshot Row - Clickable -->
							<div
									class="screenshot-row"
									@click="toggleScreenshot(screenshot.id)"
									:aria-expanded="expandedScreenshot === screenshot.id"
									role="button"
									tabindex="0"
									@keydown.enter="toggleScreenshot(screenshot.id)"
									@keydown.space.prevent="toggleScreenshot(screenshot.id)"
							>
								<!-- Thumbnail -->
								<div class="screenshot-thumbnail">
									<img
											:src="screenshot.imageData"
											:alt="t('fruitMerge.screenshot_alt', { score: screenshot.score })"
											class="thumbnail-image"
									/>
								</div>

								<!-- Screenshot Info -->
								<div class="screenshot-info">
									<div class="screenshot-primary-info">
										<span class="screenshot-score">{{ screenshot.score }} {{ t('stats.score') }}</span>
										<span class="screenshot-date">{{ formatScreenshotDate(screenshot.capturedAt) }}</span>
									</div>
									<div v-if="showMetadata" class="screenshot-secondary-info">
										<span v-if="screenshot.moves" class="info-item">{{ screenshot.moves }} {{ t('stats.moves') }}</span>
										<span v-if="screenshot.timeElapsed" class="info-item">{{ Math.floor(screenshot.timeElapsed / 60) }}:{{ String(screenshot.timeElapsed % 60).padStart(2, '0') }}</span>
										<span v-if="screenshot.fruitsCount" class="info-item">{{ screenshot.fruitsCount }} {{ t('fruitMerge.fruits_on_board') }}</span>
										<span v-if="screenshot.highestNumber" class="info-item">{{ t('numNumMerge.highest_number') }}: {{ screenshot.highestNumber }}</span>
									</div>
								</div>

								<!-- Expand/Collapse Icon -->
								<div class="screenshot-toggle">
									<Icon
										:name="'chevron-down'"
										size="20"
									/>
								</div>
							</div>

							<!-- Expanded Screenshot View -->
							<Transition name="screenshot-expand">
								<div v-if="expandedScreenshot === screenshot.id" class="screenshot-expanded">
									<div class="expanded-image-container">
										<img
												:src="screenshot.imageData"
												:alt="t('fruitMerge.screenshot_alt', { score: screenshot.score })"
												class="expanded-image"
										/>
									</div>

									<!-- Download Button -->
									<div v-if="showDownload" class="expanded-actions">
										<button
												class="btn btn--small btn--info"
												@click.stop="downloadScreenshot(screenshot)"
												:title="t('fruitMerge.download_screenshot')"
										>
											<Icon name="download" size="14" />
											{{ t('common.download') }}
										</button>
									</div>
								</div>
							</Transition>
						</div>
					</div>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
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
	padding: var(--space-3);
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

.metadata-date {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	text-align: center;
	width: 100%;
}

// Single column on very small screens
@media (max-width: 480px) {
	.screenshot-gallery-modal {
		width: 95% !important;
		max-height: 95vh;
	}

	.screenshots-grid {
		grid-template-columns: 1fr;
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

.screenshots-list {
	display: flex;
	flex-direction: column;
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
	box-shadow: 0 2px 8px rgba(79, 70, 229, 0.2);
}

.screenshot-item--expanded {
	border-color: var(--primary-color);
	box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
}

// Screenshot Row (Clickable)
.screenshot-row {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3);
	cursor: pointer;
	transition: background-color 0.2s ease;
	min-height: 80px;
}

.screenshot-row:hover {
	background-color: var(--card-bg-hover);
}

.screenshot-row:focus-visible {
	outline: var(--focus-outline);
	outline-offset: -2px;
	background-color: var(--card-bg-hover);
}

// Thumbnail
.screenshot-thumbnail {
	width: 60px;
	height: 60px;
	border-radius: var(--border-radius-md);
	overflow: hidden;
	flex-shrink: 0;
	border: 2px solid var(--card-border);
}

.thumbnail-image {
	width: 100%;
	height: 100%;
	object-fit: cover;
	display: block;
}

// Screenshot Info
.screenshot-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	min-width: 0; // Allows text truncation
}

.screenshot-primary-info {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: var(--space-2);
}

.screenshot-score {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.screenshot-date {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	flex-shrink: 0;
}

.screenshot-secondary-info {
	display: flex;
	gap: var(--space-3);
	flex-wrap: wrap;
}

.info-item {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	background-color: var(--card-bg);
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	border: 1px solid var(--card-border);
}

// Toggle Icon
.screenshot-toggle {
	color: var(--text-secondary);
	transition: transform 0.2s ease;
	flex-shrink: 0;
}

.screenshot-item--expanded .screenshot-toggle {
	transform: rotate(180deg);
}

// Expanded Content
.screenshot-expanded {
	border-top: 1px solid var(--card-border);
	background-color: var(--card-bg);
}

.expanded-image-container {
	padding: var(--space-4);
	display: flex;
	justify-content: center;
	background-color: var(--bg-color);
}

.expanded-image {
	max-width: 100%;
	max-height: 300px;
	border-radius: var(--border-radius-md);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	object-fit: contain;
}

.expanded-actions {
	padding: var(--space-3);
	border-top: 1px solid var(--card-border);
	display: flex;
	justify-content: center;
	background-color: var(--bg-secondary);
}

// Expand/Collapse Transition
.screenshot-expand-enter-active,
.screenshot-expand-leave-active {
	transition: all 0.3s ease;
	overflow: hidden;
}

.screenshot-expand-enter-from,
.screenshot-expand-leave-to {
	max-height: 0;
	opacity: 0;
}

.screenshot-expand-enter-to,
.screenshot-expand-leave-from {
	max-height: 400px;
	opacity: 1;
}

// Mobile Optimizations
@media (max-width: 480px) {
	.screenshot-gallery-modal {
		width: 95% !important;
		max-height: 95vh;
	}

	.gallery-content {
		padding: var(--space-2);
	}

	.screenshot-row {
		padding: var(--space-2);
		gap: var(--space-2);
		min-height: 70px;
	}

	.screenshot-thumbnail {
		width: 50px;
		height: 50px;
	}

	.screenshot-secondary-info {
		gap: var(--space-2);
	}

	.info-item {
		font-size: var(--font-size-xxs);
		padding: var(--space-0) var(--space-1);
	}

	.expanded-image {
		max-height: 250px;
	}

	.expanded-actions {
		padding: var(--space-2);
	}
}

// Accessibility improvements
@media (prefers-reduced-motion: reduce) {
	.screenshot-expand-enter-active,
	.screenshot-expand-leave-active {
		transition-duration: 0.1s;
	}

	.screenshot-toggle {
		transition: none;
	}
}
</style>