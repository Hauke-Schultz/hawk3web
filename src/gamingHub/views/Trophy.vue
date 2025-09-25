<script setup>
import { computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from "../../components/Icon.vue"
import ProgressOverview from "../components/ProgressOverview.vue";
import { ACHIEVEMENTS } from '../config/achievementsConfig.js'
import CurrencyDisplay from "../components/CurrencyDisplay.vue";
import Header from "../components/Header.vue";

const emit = defineEmits(['menu-click'])

// LocalStorage service for achievements
const { gameData } = useLocalStorage()
const { t, currentLanguage } = useI18n()
const router = useRouter()

// Accordion state - alle Kategorien standardmäßig zugeklappt
const categoryStates = ref({
	general: false,
	gaming: false,
	memory: false,
	fruitMerge: false,
	numMerge: false,
	special: false
})

// Achievement categories for organization
const achievementCategories = ACHIEVEMENTS.categories

// All possible achievements (earned and unearned)
const allAchievements = ACHIEVEMENTS.definitions

// Computed achievements with earned status
const achievementsWithStatus = computed(() => {
	return allAchievements.map(achievement => {
		const earned = gameData.achievements.find(a => a.id === achievement.id && a.earned)

		return {
			...achievement,
			coins: achievement.rewards.coins || 0,
			diamonds: achievement.rewards.diamonds || 0,
			earned: !!earned,
			earnedAt: earned?.earnedAt || null,
			progress: getAchievementProgress(achievement)
		}
	})
})

// Get achievement progress for unearned achievements
const getAchievementProgress = (achievement) => {
	if (gameData.achievements.find(a => a.id === achievement.id && a.earned)) {
		return 100 // Already earned
	}

	// Calculate progress based on achievement type
	switch (achievement.id) {
		case 'level_5':
			return Math.min((gameData.player.level / 5) * 100, 100)
		case 'level_10':
			return Math.min((gameData.player.level / 10) * 100, 100)
		case 'level_15':
			return Math.min((gameData.player.level / 15) * 100, 100)
		case 'score_1000':
			return Math.min((gameData.player.totalScore / 1000) * 100, 100)
		case 'games_10':
			return Math.min((gameData.player.gamesPlayed / 10) * 100, 100)
		case 'first_game':
			return gameData.player.gamesPlayed > 0 ? 100 : 0
		default:
			return 0
	}
}

// Group achievements by category
const achievementsByCategory = computed(() => {
	const grouped = {}
	achievementCategories.forEach(category => {
		grouped[category.id] = achievementsWithStatus.value.filter(
				achievement => achievement.category === category.id
		)
	})
	return grouped
})

// Category progress calculation
const getCategoryProgress = (categoryId) => {
	const categoryAchievements = achievementsByCategory.value[categoryId] || []
	const earned = categoryAchievements.filter(a => a.earned).length
	const total = categoryAchievements.length
	const percentage = total > 0 ? Math.round((earned / total) * 100) : 0

	return {
		earned,
		total,
		percentage
	}
}

// Statistics
const achievementStats = computed(() => {
	const earned = achievementsWithStatus.value.filter(a => a.earned).length
	const total = achievementsWithStatus.value.length

	return {
		earned,
		total,
		percentage: Math.round((earned / total) * 100)
	}
})

// Toggle category accordion
const toggleCategory = (categoryId) => {
	categoryStates.value[categoryId] = !categoryStates.value[categoryId]
}

// Check if category is expanded
const isCategoryExpanded = (categoryId) => {
	return categoryStates.value[categoryId]
}

// Get rarity color class
const getRarityClass = (rarity) => {
	const rarityMap = {
		common: 'rarity--common',
		uncommon: 'rarity--uncommon',
		rare: 'rarity--rare',
		epic: 'rarity--epic',
		legendary: 'rarity--legendary'
	}
	return rarityMap[rarity] || 'rarity--common'
}

// Format date
const formatDate = (dateString) => {
	if (!dateString) return ''
	const date = new Date(dateString)
	return date.toLocaleDateString(currentLanguage.value, {
		year: 'numeric',
		month: 'short',
		day: 'numeric'
	})
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
	<main class="content">
		<!-- Trophy Header -->
		<section class="trophy-header">
			<h2 class="trophy-title">{{ t('achievements.title') }}</h2>
			<ProgressOverview
					:completed="achievementStats.earned"
					:total="achievementStats.total"
					theme="warning"
					size="normal"
					:levels-label="t('nav.trophies')"
					:show-stars="false"
					:show-percentage="true"
					:complete-label="t('gaming.stats.unlocked')"
			/>
		</section>

		<!-- Achievement Categories with Accordion -->
		<section
				v-for="category in achievementCategories"
				:key="category.id"
				class="achievement-category"
		>
			<!-- Category Header (Clickable) -->
			<div
					class="category-header"
					@click="toggleCategory(category.id)"
					:class="{ 'category-header--expanded': isCategoryExpanded(category.id) }"
			>
				<div class="category-title-section">
					<h3 class="category-title">{{ t(`achievements.categories.${category.id}`) }}</h3>
					<div class="category-progress-compact">
						<div class="mini-progress-bar">
							<div
									class="mini-progress-fill"
									:style="{ width: `${getCategoryProgress(category.id).percentage}%` }"
							></div>
						</div>
						<span class="progress-stats">
							{{ getCategoryProgress(category.id).earned }}/{{ getCategoryProgress(category.id).total }}
						</span>
					</div>
				</div>

				<!-- Expand/Collapse Icon -->
				<div class="category-toggle">
					<Icon
						name="chevron-down"
						size="20"
					/>
				</div>
			</div>

			<!-- Category Content (Collapsible) -->
			<transition name="accordion">
				<div v-if="isCategoryExpanded(category.id)" class="category-content">
					<!-- Achievements Grid -->
					<div class="achievements-grid">
						<div
								v-for="achievement in achievementsByCategory[category.id]"
								:key="achievement.id"
								class="achievement-card"
								:class="{
									'achievement-card--earned': achievement.earned,
									'achievement-card--locked': !achievement.earned && achievement.progress === 0,
									[getRarityClass(achievement.rarity)]: true
								}"
						>
							<!-- Achievement Icon -->
							<div class="achievement-icon">
								<div
										class="icon-container"
										:class="`btn--${category.color}`"
								>
									<Icon :name="achievement.icon" size="24" />
								</div>
							</div>

							<!-- Achievement Content -->
							<div class="achievement-content">
								<div class="achievement-header">
									<h4 class="achievement-name">{{ t(`achievements.definitions.${achievement.id}.name`) }}</h4>
									<div class="rarity-badge" :class="getRarityClass(achievement.rarity)">
										{{ t(`achievements.rarities.${achievement.rarity}`) }}
									</div>
								</div>

								<p class="achievement-description">{{ t(`achievements.definitions.${achievement.id}.description`) }}</p>

								<!-- Progress Bar (for unearned achievements) -->
								<div
										v-if="!achievement.earned && achievement.progress > 0"
										class="achievement-progress"
								>
									<div class="progress-bar">
										<div
												class="progress-fill"
												:style="{ width: `${achievement.progress}%` }"
										></div>
									</div>
									<span class="progress-text">{{ Math.round(achievement.progress) }}%</span>
								</div>

								<!-- Earned Date -->
								<div v-if="achievement.earned && achievement.earnedAt" class="earned-date">
									<Icon name="trophy" size="14" />
									<span>{{ t('achievements.earned', { date: formatDate(achievement.earnedAt) }) }}</span>
								</div>
								<CurrencyDisplay
										v-if="!achievement.earned"
										:coins="achievement.coins"
										:diamonds="achievement.diamonds"
										layout="horizontal"
										size="small"
										variant="compact"
										:format-numbers="true"
										:show-zero-values="false"
								/>
							</div>
						</div>
					</div>
				</div>
			</transition>
		</section>
	</main>
</template>

<style lang="scss" scoped>
// Trophy Header
.trophy-header {
	text-align: center;
	margin-bottom: var(--space-6);
}

.trophy-title {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-4) 0;
}

// Achievement Categories with Accordion
.achievement-category {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	overflow: hidden;
}

// Category Header (Clickable)
.category-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-4);
	cursor: pointer;
	transition: all 0.2s ease;
	border-bottom: 1px solid transparent;

	&:hover {
		background-color: var(--card-bg-hover);
	}

	&--expanded {
		border-bottom-color: var(--card-border);
		background-color: var(--bg-secondary);
	}
}

.category-title-section {
	display: flex;
	align-items: center;
	gap: var(--space-4);
	flex: 1;
	justify-content: space-between;
}

.category-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

// Compact Progress (in collapsed state)
.category-progress-compact {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.progress-stats {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
	min-width: 40px;
}

.mini-progress-bar {
	width: 80px;
	height: 6px;
	background-color: var(--card-border);
	border-radius: var(--border-radius-sm);
	overflow: hidden;
}

.mini-progress-fill {
	height: 100%;
	background: linear-gradient(90deg, var(--warning-color), var(--warning-hover));
	border-radius: var(--border-radius-sm);
	transition: width 0.3s ease;
}

.progress-percentage {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	min-width: 35px;
	text-align: right;
}

// Category Toggle Icon
.category-toggle {
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--text-secondary);
	transition: transform 0.2s ease;
}

.category-header--expanded .category-toggle {
	transform: rotate(180deg);
}

// Category Content (Collapsible)
.category-content {
	padding: var(--space-4);
	padding-top: var(--space-3);
}

.category-progress-full {
	margin-bottom: var(--space-4);
}

// Accordion Animation
.accordion-enter-active,
.accordion-leave-active {
	transition: all 0.3s ease;
	overflow: hidden;
}

.accordion-enter-from,
.accordion-leave-to {
	max-height: 0;
	opacity: 0;
	padding-top: 0;
	padding-bottom: 0;
}

.accordion-enter-to,
.accordion-leave-from {
	max-height: 2000px; // Large enough to accommodate content
	opacity: 1;
}

// Achievements Grid
.achievements-grid {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

// Achievement Card
.achievement-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	display: flex;
	gap: var(--space-3);
	transition: all 0.2s ease;

	&--earned {
		background-color: var(--card-bg-hover);
		border-color: var(--success-color);
		box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.1);
	}

	&--locked {
		opacity: 0.6;

		.achievement-icon {
			opacity: 0.5;
		}
	}
}

.achievement-icon {
	flex-shrink: 0;

	.icon-container {
		width: var(--space-12);
		height: var(--space-12);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
	}
}

.achievement-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.achievement-header {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	flex-wrap: wrap;
	gap: var(--space-2);
}

.achievement-name {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	width: 60%;
	margin: 0;
	line-height: 1.2;
}

.achievement-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

// Rarity System
.rarity-badge {
	padding: var(--space-0) var(--space-2);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;

	&.rarity--common {
		background-color: var(--info-color);
		color: white;
		display: none;
	}

	&.rarity--uncommon {
		background-color: var(--success-color);
		color: white;
		display: none;
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

// Progress System
.achievement-progress {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	margin-top: var(--space-1);
}

.progress-bar {
	flex: 1;
	height: var(--space-1);
	background-color: var(--card-border);
	border-radius: var(--border-radius-sm);
	overflow: hidden;
}

.progress-fill {
	height: 100%;
	background-color: var(--primary-color);
	border-radius: var(--border-radius-sm);
	transition: width 0.3s ease;
}

.progress-text {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	min-width: 35px;
}

// Earned Date
.earned-date {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--success-color);
	font-weight: var(--font-weight-bold);
	margin-top: var(--space-1);
}
</style>