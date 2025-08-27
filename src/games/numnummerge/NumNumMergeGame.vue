<script setup>
import {computed, nextTick, onMounted, onUnmounted, ref, shallowRef, watch} from 'vue'
import Header from "../../components/Header.vue";
import {useLocalStorage} from "../../composables/useLocalStorage.js";
import {useI18n} from "../../composables/useI18n.js";
import Icon from "../../components/Icon.vue";
import {NUM_NUM_MERGE_LEVELS} from "./numNumMergeConfig.js";
import {useRouter} from "vue-router";
import ProgressOverview from "../../components/ProgressOverview.vue";

// Props
const props = defineProps({
	playerProfile: {
		type: Object,
		required: true
	},
	currentTheme: {
		type: String,
		default: 'default'
	},
	level: {
		type: Number,
		default: 1
	}
})

const router = useRouter()
const gameState = ref('playing') // 'playing', 'paused', 'completed', 'game-over'
const currentLevel = ref(props.level || 1)
const currentLevelConfig = computed(() => NUM_NUM_MERGE_LEVELS[currentLevel.value])

const numNums = [
	[null, null, null, null],
	[null, null, null, null],
	[null, null, null, null],
	[4, null, null, null],
	[8, 4, 2, 2],
]

// Services
const {
	gameData,
	updateGameStats,
	updateLevelStats,
	addScore,
	checkGameLevelAchievements,
	checkAutoAchievements,
	getLevelStats,
	saveLevelState,
	loadLevelState,
	clearLevelState,
	hasLevelState,
	addAchievement,
	hasAchievement,
	buyItem,
	removeItemFromInventory,
} = useLocalStorage()
const { t } = useI18n()

const gameProgress = computed(() => {
	const targetNum = currentLevelConfig.value.targetNum || 0
	let hasReachedTarget = false

	return {
		completed: hasReachedTarget ? 1 : 0,
		total: 1,
		percentage: hasReachedTarget ? 100 : 0
	}
});

// hasNumberAt
const hasNumberAt = (row, col) => {
	return numNums[row][col] !== null
}
const getNumberAt = (row, col) => {
	return numNums[row][col]
}

const isEndlessMode = computed(() => {
	return currentLevelConfig.value.isEndless || false
})

const handleMenuClick = () => {
	emit('menu-click')
}

const handleMenuSaveGame = () => {
	emit('save-game')
}
</script>
<template>
	<Header
		:game-data="gameData"
		:player="gameData.player"
		:achievements="gameData.achievements"
		:show-menu-button="true"
		@menu-click="handleMenuClick"
		@save-game="handleMenuSaveGame"
	/>
	<main class="num-num-merge-game">
		<!-- Game Header -->
		<div class="game-header">
			<div class="game-info">
				<h2 class="game-title">{{ t('numNumMerge.title') }}</h2>
				<div class="level-indicator" :class="{ 'level-indicator--endless': isEndlessMode }">
					{{ isEndlessMode ? t('numNumMerge.endless_mode') : t('numNumMerge.level_title', { level: currentLevel }) }}
				</div>
				<div v-if="gameState === 'playing'" class="manual-save">
					<button
						class="btn btn--small"
						@click="handleManualSave"
						:disabled="isSaving"
						:title="t('numNumMerge.save_game')"
					>
						<Icon :name="isSaving ? 'loading' : 'save'" size="22" />
					</button>
				</div>
			</div>
			<div class="game-stats-container">
				<!-- Progress Overview -->
				<ProgressOverview
						v-if="!isEndlessMode"
						:completed="gameProgress.completed"
						:total="gameProgress.total"
						theme="warning"
						size="small"
						:levels-label="currentLevelConfig.targetNum"
						:show-stars="false"
						:show-percentage="false"
						:complete-label="t('numNumMerge.target')"
				/>
			</div>
		</div>
		<!-- Game Board -->
		<div class="game-board">
			<div class="num-grid">
				<div
					v-for="(row, rowIndex) in 5"
					:key="`row-${rowIndex}`"
					class="grid-row"
				>
					<div
						v-for="(col, colIndex) in 4"
						:key="`cell-${rowIndex}-${colIndex}`"
						class="grid-cell"
						:class="{ 'grid-cell--occupied': hasNumberAt(rowIndex, colIndex) }"
					>
						<div v-if="hasNumberAt(rowIndex, colIndex)" class="cell-number">
							{{ getNumberAt(rowIndex, colIndex) }}
						</div>
					</div>
				</div>
			</div>
		</div>
	</main>
</template>
<style lang="scss" scoped>

.num-num-merge-game {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
	width: 100%;
	max-width: 440px;
	margin: 0 auto;
}

// Game Header
.game-header {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.game-info {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.game-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.level-indicator {
	background-color: var(--warning-color);
	color: white;
	padding: var(--space-1) var(--space-3);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	align-self: center;
}

.manual-save {
	display: flex;
	align-items: center;
	justify-content: center;
}

.game-stats-container {
	display: flex;
	flex-direction: row;
	gap: var(--space-2);
	justify-content: space-between;
}

// Game Container
.game-container {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
	position: relative;
}

.game-board {
	flex: 1;
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
}

.num-grid {
	display: grid;
	grid-template-rows: repeat(5, 1fr);
	grid-template-columns: repeat(4, 1fr);
	gap: var(--space-1);
	width: 100%;
	max-width: 440px;
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
	box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.grid-row {
	display: contents;
}

.grid-cell {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	aspect-ratio: 1;
	position: relative;
	background-color: var(--black);
	border-radius: var(--border-radius-sm);
	transition: background-color 0.3s, border-color 0.3s;
}

</style>