<script setup>
import {computed, ref} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { useInventory } from '../composables/useInventory.js'
import Icon from "../../components/Icon.vue"
import CurrencyDisplay from "../components/CurrencyDisplay.vue";
import Header from "../components/Header.vue";
import {RARITY_CONFIG, SHOP_ITEMS} from '../config/shopConfig.js'
import ConfirmationModal from '../components/ConfirmationModal.vue'

// Services
const {
	gameData,
	updatePlayer,
	formatCurrency,
	canReceiveGiftToday,
	redeemGift
} = useLocalStorage()
const { t } = useI18n()
const { getAllOwnedItems } = useInventory()
const router = useRouter()

const giftCode = ref('')
const giftRedeemResult = ref(null)
const showGiftModal = ref(false)
const isRedeeming = ref(false)

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
	const allItems = getAllOwnedItems()

	// Separate mystery items from regular shop items
	const mysteryItems = allItems.filter(item => {
		const inventoryData = gameData.player.inventory.items[item.id]
		return inventoryData && inventoryData.mysteryBoxNumber !== undefined
	})

	const regularItems = allItems.filter(item => {
		const inventoryData = gameData.player.inventory.items[item.id]
		return !inventoryData || inventoryData.mysteryBoxNumber === undefined
	})

	// Show mystery items first, then regular items, limit to 12 total
	return [...mysteryItems, ...regularItems].slice(0, 12)
})

const hasMysteryItems = computed(() => {
	return ownedItems.value.some(item => {
		const inventoryData = gameData.player.inventory.items[item.id]
		return inventoryData && inventoryData.mysteryBoxNumber !== undefined
	})
})

const selectedAvatar = computed({
	get: () => gameData.player.avatar,
	set: (value) => {
		updatePlayer({ avatar: value })
	}
})

const getItemRarityStyle = (rarity) => {
	const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common
	return {
		borderColor: config.borderColor,
		backgroundColor: `${config.color}20`
	}
}

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

			<div class="profile-avatar-large">
				<Icon :name="selectedAvatar" size="64" />
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
			<!-- Player Settings -->
			<div class="player-settings">
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

			<!-- Player Avatar Preview -->
			<div class="profile-preview">
				<div class="profile-info">
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
				<label class="setting-label">{{ t('profile.inventory.title') }}</label>

				<div v-if="ownedItems.length > 0" class="inventory-simple">
					<div
						v-for="item in ownedItems"
						:key="item.id"
						class="inventory-item"
						:class="{
							'inventory-item--mystery': item.mysteryBoxNumber > 0
						}"
					>
						<span
							class="item-icon"
							:style="getItemRarityStyle(item.rarity)"
						>{{ item.icon }}</span>
						<span class="item-name">{{ item.name }}</span>
						<span
								v-if="item.mysteryBoxNumber > 0"
								class="item-source"
						>
	            {{
								t('profile.inventory.mystery_box_item', {
									boxNumber: gameData.player.inventory.items[item.id].mysteryBoxNumber
								})
							}}
            </span>
						<span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
					</div>
				</div>

				<div v-if="ownedItems.length === 0" class="inventory-empty">
					<p>{{ t('profile.inventory.empty_description') }}</p>
				</div>
			</div>
		</section>

		<ConfirmationModal
			:visible="showGiftModal && giftRedeemResult?.success"
			:title="t('shop.gifts.gift_redeemed')"
			:message="t('shop.gifts.gift_received_from', {
		    itemName: giftRedeemResult?.gift?.itemName,
		    senderName: giftRedeemResult?.gift?.senderName
		  })"
			:confirm-text="t('common.ok')"
			confirm-variant="success"
			@confirm="closeGiftModal"
			@close="closeGiftModal"
		>
			<template v-if="giftRedeemResult?.gift">
				<div class="gift-success-content">
					<div class="gift-item-display">
						<span class="gift-item-icon">{{ giftRedeemResult.gift.itemIcon }}</span>
						<div class="gift-item-info">
							<h4>{{ giftRedeemResult.gift.itemName }}</h4>
							<p>{{ t('shop.gifts.gift_from', { sender: giftRedeemResult.gift.senderName }) }}</p>
						</div>
					</div>
				</div>
			</template>
		</ConfirmationModal>
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
	display: flex;
	align-items: center;
	justify-content: flex-start;
	color: white;
	gap: var(--space-3);
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
	border-radius: var(--border-radius-md);
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
	justify-content: space-between;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.item-icon {
	font-size: var(--font-size-lg);
	display: flex;
	justify-content: center;
}

.item-name,
.item-source {
	font-size: var(--font-size-sm);
	color: var(--text-color);
	font-weight: var(--font-weight-medium);
	flex-grow: 2;
}

.item-quantity {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	background-color: var(--card-border);
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
}

.item-details {
	display: flex;
	justify-content: space-between;
	gap: var(--space-2);
	align-items: center;
	flex: 1;
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