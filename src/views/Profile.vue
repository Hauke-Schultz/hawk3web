<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { useInventory } from '../composables/useInventory.js'
import Icon from "../components/Icon.vue"
import CurrencyDisplay from "../components/CurrencyDisplay.vue";
import Header from "../components/Header.vue";

// Services
const { gameData, updatePlayer, formatCurrency } = useLocalStorage()
const { t } = useI18n()
const { getAllOwnedItems } = useInventory()
const router = useRouter()

// Available avatar options
const avatarOptions = [
	{ value: 'avatar/user', label: t('profile.avatars.default_user'), icon: 'avatar/user' },
	{ value: 'avatar/beard', label: t('profile.avatars.beard_user'), icon: 'avatar/beard' },
	{ value: 'avatar/glasses', label: t('profile.avatars.glasses_user'), icon: 'avatar/glasses' },
	{ value: 'avatar/headset', label: t('profile.avatars.headset_user'), icon: 'avatar/headset' },
	{ value: 'avatar/cap', label: t('profile.avatars.cap_user'), icon: 'avatar/cap' }
]

// Computed values for direct access
const playerName = computed({
	get: () => gameData.player.name,
	set: (value) => {
		const trimmedName = value.trim()
		updatePlayer({ name: trimmedName })
	}
})

const ownedItems = computed(() => {
	return getAllOwnedItems().slice(0, 12) // Limit to 12 items for display
})

const selectedAvatar = computed({
	get: () => gameData.player.avatar,
	set: (value) => {
		updatePlayer({ avatar: value })
	}
})

// Methods
const selectAvatar = (avatar) => {
	selectedAvatar.value = avatar
}

const updatePlayerName = () => {
	playerName.value = playerName.value
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
		<!-- Player Profile Section -->
		<section class="profile-section">
			<h2 class="section-title">{{ t('profile.title') }}</h2>

			<!-- Player Avatar Preview -->
			<div class="profile-preview">
				<div class="profile-avatar-large">
					<Icon :name="selectedAvatar" size="64" />
				</div>
				<div class="profile-info">
					<h3 class="profile-name">{{ playerName }}</h3>
					<div class="profile-stats">
						<div class="stat-item">
							<span class="stat-label">{{ t('profile.stats.level') }}</span>
							<span class="stat-value">{{ gameData.player.level }}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">{{ t('profile.stats.score') }}</span>
							<span class="stat-value">{{ gameData.player.totalScore }}</span>
						</div>
						<div class="stat-item">
							<span class="stat-label">{{ t('profile.stats.played') }}</span>
							<span class="stat-value">{{ gameData.player.gamesPlayed }}</span>
						</div>
					</div>
				</div>
				<CurrencyDisplay
						:coins="gameData.player.coins"
						:diamonds="gameData.player.diamonds"
						layout="horizontal"
						size="large"
						variant="card"
						:format-numbers="true"
				/>
			</div>
			<!-- Inventory Section -->
			<div class="profile-section">
				<h3 class="section-title">{{ t('profile.inventory.title') }}</h3>
				<div class="inventory-simple" v-if="ownedItems.length > 0">
					<div
							v-for="item in ownedItems"
							:key="item.id"
							class="inventory-item"
					>
						<span class="item-icon">{{ item.icon }}</span>
						<span class="item-name">{{ item.name }}</span>
						<span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
					</div>
				</div>
				<div v-else class="inventory-empty">
					<p>{{ t('profile.inventory.empty_description') }}</p>
				</div>
			</div>
			<!-- Player Settings -->
			<div class="player-settings">
				<!-- Player Name Input -->
				<div class="setting-group">
					<label for="player-name" class="setting-label">{{ t('profile.display_name') }}</label>
					<input
							id="player-name"
							v-model="playerName"
							type="text"
							class="name-input"
							:placeholder="t('profile.display_name')"
							maxlength="20"
							@blur="updatePlayerName"
							@keydown.enter="updatePlayerName"
					/>
				</div>

				<!-- Avatar Selection -->
				<div class="setting-group">
					<label class="setting-label">{{ t('profile.avatar') }}</label>
					<div class="avatar-selector">
						<button
								v-for="option in avatarOptions"
								:key="option.value"
								class="avatar-option"
								:class="{ 'avatar-option--active': selectedAvatar === option.value }"
								@click="selectAvatar(option.value)"
								:aria-label="t('profile.select_avatar', { name: option.label })"
								:aria-pressed="selectedAvatar === option.value"
						>
							<div class="avatar-icon">
								<Icon :name="option.icon" size="50" />
							</div>
						</button>
					</div>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.profile-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

.section-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

// Profile Preview Section
.profile-preview {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-6);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-4);
	text-align: center;
}

.profile-avatar-large {
	width: var(--space-16);
	height: var(--space-16);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	color: white;
}

.profile-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.profile-name {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.profile-stats {
	display: flex;
	gap: var(--space-6);
	justify-content: center;
}

.stat-item {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	align-items: center;
}

.stat-label {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-base);
}

.stat-value {
	font-size: var(--font-size-lg);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
}

// Player Settings Section
.player-settings {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

.setting-group {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.setting-label {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

// Player Name Input
.name-input {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3) var(--space-4);
	font-size: var(--font-size-base);
	color: var(--text-color);
	font-family: var(--font-family-base), sans-serif;
	transition: all 0.2s ease;

	&:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 0.125rem rgba(79, 70, 229, 0.25);
	}

	&:hover {
		border-color: var(--primary-color);
	}

	&::placeholder {
		color: var(--text-muted);
	}
}

// Avatar Selector
.avatar-selector {
	display: grid;
	grid-template-columns: repeat(5, 1fr);
	gap: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	padding: var(--space-3);
}

.avatar-option {
	display: flex;
	align-items: center;
	justify-content: center;
	width: 100%;
	aspect-ratio: 1;
	border: 2px solid transparent;
	border-radius: var(--border-radius-lg);
	background-color: var(--card-bg-hover);
	color: var(--text-color);
	cursor: pointer;
	transition: all 0.2s ease;
	padding: 0;

	&:hover {
		background-color: var(--card-border);
		transform: translateY(-2px);
		box-shadow: var(--card-shadow-hover);
	}

	&:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 2px;
	}

	&--active {
		background-color: var(--primary-color);
		border-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
			border-color: var(--primary-hover);
		}
	}
}

.avatar-icon {
	display: flex;
	align-items: center;
	justify-content: center;
	color: inherit;
}

// Inventory Section
.inventory-simple {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.inventory-item {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.item-icon {
	font-size: var(--font-size-lg);
	width: 32px;
	display: flex;
	justify-content: center;
}

.item-name {
	flex: 1;
	font-size: var(--font-size-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-medium);
}

.item-quantity {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	background-color: var(--card-border);
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
}

// Empty Inventory
.inventory-empty {
	text-align: center;
	padding: var(--space-4);
	color: var(--text-secondary);

	p {
		margin: 0;
		font-size: var(--font-size-sm);
	}
}
</style>