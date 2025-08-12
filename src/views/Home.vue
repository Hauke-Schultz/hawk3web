<script setup>
import {defineEmits, computed, watch} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from "../components/Icon.vue";
import WelcomeCard from "../components/WelcomeCard.vue";
import Header from "../components/Header.vue";
import DailyRewardCard from "../components/DailyRewardCard.vue";

// LocalStorage service for achievements
const { gameData, markCardAsRead, isCardRead, canClaimDailyReward, claimDailyReward } = useLocalStorage()

// Emits for parent component communication
const emit = defineEmits([
	'start-game',
	'profile-click',
	'trophy-click',
	'settings-click',
	'about-click',
	'package-click',
	'shop-click'
])

const { t } = useI18n()

const isWelcomeCardVisible = computed(() => {
	return !isCardRead('welcomeCard')
})

const isDailyRewardVisible = computed(() => {
	return canClaimDailyReward() && !isCardRead('dailyRewardCard')
})

// Event handlers - emit to parent component
const handleDailyRewardClaim = (reward) => {
	console.log(`🎁 Daily reward claimed: +${reward.coins} coins, +${reward.diamonds} diamonds, Streak: ${reward.streak}`)
	// Hier könntest du später eine Toast-Benachrichtigung oder Animation hinzufügen
}

const handleStartGame = () => {
	emit('start-game')
}

const handleProfileClick = () => {
	emit('profile-click')
}

const handleShopClick = () => {
	emit('shop-click')
}

const handleTrophyClick = () => {
	emit('trophy-click')
}

const handleSettingsClick = () => {
	emit('settings-click')
}

const handleAboutClick = () => {
	emit('about-click')
}

const handlePackageClick = () => {
	emit('package-click')
}

// Card read handlers
const handleCardRead = (cardType) => {
	console.log(`Marking ${cardType} as read...`, gameData.player.coins)
	if (cardType === 'dailyRewardCard') {
		const reward = claimDailyReward()
		if (reward) {
			console.log(`Daily reward claimed: +${reward.coins} coins, +${reward.diamonds} diamonds`)
			handleDailyRewardClaim(reward)
		}
	}

	markCardAsRead(cardType)
}
</script>

<template>
	<Header
		:game-data="gameData"
	/>
	<!-- Main Content Area -->
	<main class="content">

		<!-- Welcome Back Section -->
		<WelcomeCard
				v-if="isWelcomeCardVisible"
				:title="t('home.welcome_title')"
				:subtitle="t('home.welcome_subtitle')"
				card-type="welcomeCard"
				:hide-when-read="true"
				@mark-as-read="handleCardRead"
				@click="handlePackageClick"
		/>
		<DailyRewardCard
				v-if="isDailyRewardVisible"
				:title="t('daily_rewards.title')"
				card-type="dailyRewardCard"
				@mark-as-read="handleCardRead"
				@click="handlePackageClick"
		/>
		<!-- Game Actions Section -->
		<section class="game-actions" aria-label="Game Actions">
			<!-- Start Game Card -->
			<div
					class="action-card"
					@click="handleStartGame"
					@keydown.enter="handleStartGame"
					tabindex="0"
					role="button"
					aria-label="t('home.start_game')"
			>
				<div class="card-icon">
					<div class="icon-btn btn--primary" aria-label="Play">
						<Icon name="play" size="32" />
					</div>
				</div>
				<div class="card-content">
					<h2 class="card-title">{{ t('nav.gaming_hub') }}</h2>
				</div>
			</div>

			<!-- Profile Card -->
			<div
					class="action-card"
					@click="handleProfileClick"
					@keydown.enter="handleProfileClick"
					tabindex="0"
					role="button"
					aria-label="t('home.view_profile')"
			>
				<div class="card-icon">
					<div class="icon-btn btn--success" aria-label="Profile">
						<Icon name="user" size="32" />
					</div>
				</div>
				<div class="card-content">
					<h2 class="card-title">{{ t('nav.profile') }}</h2>
				</div>
			</div>

			<!-- Shop Card -->
			<div
					class="action-card"
					@click="handleShopClick"
					@keydown.enter="handleShopClick"
					tabindex="0"
					role="button"
					aria-label="t('home.open_shop')"
			>
				<div class="card-icon">
					<div class="icon-btn btn--warning" aria-label="Shop">
						<Icon name="shop" size="32" />
					</div>
				</div>
				<div class="card-content">
					<h2 class="card-title">{{ t('nav.shop') }}</h2>
				</div>
			</div>

			<!-- Trophy Card -->
			<div
					class="action-card"
					@click="handleTrophyClick"
					@keydown.enter="handleTrophyClick"
					tabindex="0"
					role="button"
					aria-label="t('home.view_trophies')"
			>
				<div class="card-icon">
					<div class="icon-btn btn--warning" aria-label="Trophies">
						<Icon name="trophy" size="32" />
					</div>
				</div>
				<div class="card-content">
					<h2 class="card-title">{{ t('nav.trophy') }}</h2>
				</div>
			</div>

			<!-- Settings Card -->
			<div
					class="action-card"
					@click="handleSettingsClick"
					@keydown.enter="handleSettingsClick"
					tabindex="0"
					role="button"
					aria-label="t('home.open_settings')"
			>
				<div class="card-icon">
					<div class="icon-btn btn--info" aria-label="Settings">
						<Icon name="settings" size="32" />
					</div>
				</div>
				<div class="card-content">
					<h2 class="card-title">{{ t('nav.settings') }}</h2>
				</div>
			</div>

			<!-- About Card -->
			<div
					class="action-card"
					@click="handleAboutClick"
					@keydown.enter="handleAboutClick"
					tabindex="0"
					role="button"
					aria-label="t('home.view_about')"
			>
				<div class="card-icon">
					<div class="icon-btn btn--primary" aria-label="About">
						<Icon name="about" size="32" />
					</div>
				</div>
				<div class="card-content">
					<h2 class="card-title">{{ t('nav.about') }}</h2>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>

/* Game Actions Section */
.game-actions {
	display: flex;
	gap: var(--space-4);
	flex-direction: row;
	flex-wrap: wrap;
}

.action-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-3);
	display: flex;
	align-items: center;
	gap: var(--space-3);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	width: calc(50% - var(--space-2));

	&:hover {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-1px);
	}

	&:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 2px;
		box-shadow: var(--focus-shadow);
	}

	&:active {
		transform: translateY(0);
	}
}

.card-icon {
	flex-shrink: 0;
}

.card-content {
	flex: 1;
}

.card-title {
	color: var(--text-color);
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	margin: 0;
}

</style>