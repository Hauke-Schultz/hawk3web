<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { useInventory} from '../composables/useInventory.js'
import Icon from "../../components/Icon.vue"
import Header from "../components/Header.vue";
import {ACHIEVEMENTS} from "../config/achievementsConfig.js";
import {RARITY_CONFIG, SHOP_ITEMS} from '../config/shopConfig.js'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import GiftCodeModal from '../components/GiftCodeModal.vue'
import {MYSTERY_ITEMS} from "../config/mysteryBoxConfig.js";

// Services
const { gameData, updatePlayer, markGiftAsReceived, unmarkGiftAsReceived  } = useLocalStorage()
const { t } = useI18n()
const { getAllOwnedItems, hasItem } = useInventory()
const router = useRouter()

const giftRedeemResult = ref(null)
const showGiftModal = ref(false)

const showAvatarSelector = ref(false)
const editingName = ref(gameData.player.name)
const nameInput = ref(null)

// Enhanced player summary
const playerSummary = computed(() => ({
	level: gameData.player.level,
	totalScore: gameData.player.totalScore,
	gamesPlayed: gameData.player.gamesPlayed,
	coins: gameData.player.coins,
	diamonds: gameData.player.diamonds,
	achievements: gameData.achievements.filter(a => a.earned).length
}))

// Overall Progress (similar to Home.vue)
const overallProgress = computed(() => {
	const allGames = ['memory', 'hawkFruit', 'hawkDoubleUp']
	let totalCompleted = 0
	let totalLevels = 0
	let totalStars = 0
	let maxStars = 0

	allGames.forEach(gameId => {
		const levels = gameData.games[gameId].levels || {}
		const completed = Object.values(levels).filter(level => level.completed).length
		const stars = Object.values(levels).reduce((sum, level) => sum + (level.stars || 0), 0)

		totalCompleted += completed
		totalLevels += 6 // Each game has 6 levels
		totalStars += stars
		maxStars += 18 // 6 levels * 3 stars each
	})

	// Calculate achievements progress
	const earnedAchievements = gameData.achievements.filter(a => a.earned).length
	const totalAchievements = ACHIEVEMENTS.definitions.length

	// Combined percentage calculation
	// Weight: 40% levels, 35% stars, 25% achievements
	const levelPercentage = totalLevels > 0 ? (totalCompleted / totalLevels) * 100 : 0
	const starPercentage = maxStars > 0 ? (totalStars / maxStars) * 100 : 0
	const achievementPercentage = totalAchievements > 0 ? (earnedAchievements / totalAchievements) * 100 : 0

	const combinedPercentage = Math.round(
			(levelPercentage * 0.40) +
			(starPercentage * 0.35) +
			(achievementPercentage * 0.25)
	)

	return {
		levels: totalCompleted,
		totalLevels,
		stars: totalStars,
		maxStars,
		achievements: earnedAchievements,
		totalAchievements,
		percentage: combinedPercentage,
		// Individual percentages for potential display
		levelPercentage: Math.round(levelPercentage),
		starPercentage: Math.round(starPercentage),
		achievementPercentage: Math.round(achievementPercentage)
	}
})

// Avatar Methods
const toggleAvatarSelector = () => {
	showAvatarSelector.value = !showAvatarSelector.value
}

const finishNameEdit = () => {
	const sanitizedName = sanitizeName(editingName.value)

	if (sanitizedName.length > 0) {
		playerName.value = sanitizedName
	} else {
		playerName.value = gameData.player.name // Revert to previous valid name
	}

	editingName.value = playerName.value
}

const sanitizeName = (name) => {
	if (!name || typeof name !== 'string') return ''

	return name
			.trim() // Remove whitespace from start/end
			.replace(/[^a-zA-Z0-9\s\-]/g, '') // Only allow letters, numbers, spaces, and hyphens
			.replace(/\s+/g, ' ') // Replace multiple spaces with single space
			.replace(/\-+/g, '-') // Replace multiple hyphens with single hyphen
			.substring(0, 20) // Limit to 30 characters
			.trim() // Final trim in case we cut off in the middle of spaces
}

// Close dropdowns when clicking outside
const handleOutsideClick = (event) => {
	if (!event.target.closest('.avatar-section') && !event.target.closest('.name-section')) {
		showAvatarSelector.value = false
	}
}

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

const consumableItems = computed(() => regularInventory.value.consumables)

const getMysteryBoxDate = (itemId) => {
	const inventoryData = gameData.player.inventory.items[itemId]
	return inventoryData?.purchasedAt ? new Date(inventoryData.purchasedAt).toLocaleDateString() : 'Unknown'
}

// Navigation helper
const navigateToShop = () => {
	router.push('/shop')
}

const regularInventory = computed(() => {
	const allItems = getAllOwnedItems()

	const mystery = []
	const consumables = []
	const regular = []

	allItems.forEach(item => {
		const inventoryData = gameData.player.inventory.items[item.id]

		// Skip received gifts - they belong in separate section
		if (inventoryData?.isGift) return

		// Skip sent gifts that are marked as received - they're removed from inventory
		if (isSentGiftAndReceived(item.id)) return

		// Mystery box items
		if (inventoryData?.mysteryBoxNumber !== undefined) {
			mystery.push(item)
		}
		// Consumables
		else if (item.type === 'consumable') {
			consumables.push(item)
		}
		// Regular cosmetic items
		else {
			regular.push(item)
		}
	})

	return {
		mystery: mystery.sort((a, b) => {
			const aBox = gameData.player.inventory.items[a.id].mysteryBoxNumber
			const bBox = gameData.player.inventory.items[b.id].mysteryBoxNumber
			return bBox - aBox
		}),
		consumables: consumables.sort((a, b) => b.quantity - a.quantity),
		regular: regular.sort((a, b) => a.name.localeCompare(b.name))
	}
})

const receivedGifts = computed(() => {
	const receivedGiftsData = gameData.player.gifts?.receivedGifts || []

	return receivedGiftsData
			.map(gift => {
				let shopItem = SHOP_ITEMS.find(item => item.id === gift.itemId)
				if (!shopItem) {
					shopItem = MYSTERY_ITEMS.find(item => item.id === gift.itemId)
				}
				if (!shopItem) return null

				return {
					...shopItem,
					senderName: gift.senderName,
					receivedAt: gift.receivedAt,
					giftCode: gift.code,
					giftType: 'received'
				}
			})
			.filter(Boolean)
			.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
})

const sentGifts = computed(() => {
	const allSentGifts = gameData.player.gifts?.sentGifts || []

	return allSentGifts
			.map(gift => {
				let shopItem = SHOP_ITEMS.find(item => item.id === gift.itemId)

				if (!shopItem) {
					const { MYSTERY_ITEMS } = require('../config/mysteryBoxConfig.js')
					shopItem = MYSTERY_ITEMS.find(item => item.id === gift.itemId)
				}

				if (!shopItem) return null

				return {
					...shopItem,
					giftCode: gift.code,
					sentDate: gift.createdAt,
					received: gift.received || false,
					receivedAt: gift.receivedAt,
					expiresAt: gift.expiresAt,
					giftType: gift.received ? 'sent-received' : 'sent-pending'
				}
			})
			.filter(Boolean)
			.sort((a, b) => new Date(b.sentDate) - new Date(a.sentDate))
})

const isSentGiftAndReceived = (itemId) => {
	const sentGifts = gameData.player.gifts?.sentGifts || []
	return sentGifts.some(gift =>
			gift.itemId === itemId &&
			gift.received === true
	)
}

const selectedSentGift = ref(null)
const showSentGiftModal = ref(false)

const handleSentGiftClick = (gift) => {
	selectedSentGift.value = {
		code: gift.giftCode,
		itemId: gift.id,
		itemName: gift.name,
		itemIcon: gift.icon,
		itemRarity: gift.rarity,
		createdAt: gift.sentDate,
		expiresAt: gift.expiresAt,
		received: gift.received,
		receivedAt: gift.receivedAt
	}
	showSentGiftModal.value = true
}

const closeSentGiftModal = () => {
	showSentGiftModal.value = false
	selectedSentGift.value = null
}

const handleSentGiftMarkReceived = () => {
	if (selectedSentGift.value) {
		const success = markGiftAsReceived(selectedSentGift.value.code)
		if (success) {
			selectedSentGift.value.received = true
			selectedSentGift.value.receivedAt = new Date().toISOString()
		}
	}
}

const handleSentGiftUnmarkReceived = () => {
	if (selectedSentGift.value) {
		const success = unmarkGiftAsReceived(selectedSentGift.value.code)
		if (success) {
			selectedSentGift.value.received = false
			selectedSentGift.value.receivedAt = null
		}
	}
}

const getGiftDate = (item) => {
	const date = item.receivedAt || item.sentDate || item.giftDate
	if (date) {
		return new Date(date).toLocaleDateString()
	}
	return 'Unknown'
}

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


const getGiftHistory = (item) => {
	const inventoryData = gameData.player.inventory.items[item.id]
	if (!inventoryData?.giftsReceived) return []

	return inventoryData.giftsReceived
			.map(gift => ({
				sender: gift.giftFrom,
				receivedAt: gift.receivedAt,
				date: new Date(gift.receivedAt).toLocaleDateString()
			}))
			.sort((a, b) => new Date(b.receivedAt) - new Date(a.receivedAt))
}

// Methods
const selectAvatar = (avatar) => {
	selectedAvatar.value = avatar
	showAvatarSelector.value = false
}

const handleMenuClick = () => {
	router.push('/gaming')
}

onMounted(() => {
	document.addEventListener('click', handleOutsideClick)
})

// Add to onUnmounted
onUnmounted(() => {
	document.removeEventListener('click', handleOutsideClick)
})
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

			<section class="player-progress-card">
				<div class="progress-card" :class="{ 'progress-card--editing': isEditing }">
					<!-- Player Header -->
					<div class="progress-header">
						<div class="avatar-section" @click="toggleAvatarSelector">
							<div class="avatar-display" :class="{ 'avatar-display--clickable': !showAvatarSelector }">
								<Icon :name="selectedAvatar" size="54" />
							</div>

							<!-- Avatar Selector -->
							<transition name="avatar-dropdown">
								<div v-if="showAvatarSelector" class="avatar-dropdown" @click.stop>
									<div class="avatar-options">
										<button
											v-for="option in avatarOptions"
											:key="option.value"
											class="avatar-option"
											:class="{ 'avatar-option--active': selectedAvatar === option.value }"
											@click="selectAvatar(option.value)"
											:aria-label="option.label"
										>
											<Icon :name="option.icon" size="84" />
										</button>
									</div>
								</div>
							</transition>
						</div>

						<div class="player-info">
							<!-- Name Editor -->
							<div class="name-editor" @click.stop>
								<input
										ref="nameInput"
										v-model="editingName"
										type="text"
										class="name-input-inline"
										:placeholder="t('profile.display_name')"
										maxlength="20"
										@blur="finishNameEdit"
										@keydown.enter="finishNameEdit"
										@keydown.escape="finishNameEdit"
								/>
								<div class="name-actions">
									<button class="btn btn--save" @click="finishNameEdit">
										<Icon name="save" size="14" />
									</button>
								</div>
							</div>
						</div>
					</div>


					<!-- Compact Stats Grid -->
					<div class="progress-stats-compact">
						<div class="stat-compact stat-compact--highlight">
							<span class="stat-number">{{ overallProgress.percentage }}%</span>
							<span class="stat-label">{{ t('common.complete') }}</span>
						</div>
						<div class="stat-compact">
							<span class="stat-number">{{ gameData.player.coins.toLocaleString() }}</span>
							<span class="stat-label">{{ t('profile.currency.coins') }}</span>
						</div>
						<div class="stat-compact">
							<span class="stat-number">{{ gameData.player.diamonds.toLocaleString() }}</span>
							<span class="stat-label">{{ t('profile.currency.diamonds') }}</span>
						</div>
						<div
							class="stat-compact"
							:class="{
								'stat-compact--highlight': playerSummary.achievements === overallProgress.totalAchievements
							}"
						>
							<span class="stat-number">{{ playerSummary.achievements }}/{{ overallProgress.totalAchievements }}</span>
							<span class="stat-label">{{ t('nav.trophies') }}</span>
						</div>
						<div class="stat-compact">
							<span class="stat-number">{{ playerSummary.gamesPlayed }}</span>
							<span class="stat-label">{{ t('profile.stats.played') }}</span>
						</div>
						<div
							class="stat-compact"
							:class="{
								'stat-compact--highlight': overallProgress.levels === overallProgress.totalLevels
							}"
						>
							<span class="stat-number">{{ overallProgress.levels }}/{{ overallProgress.totalLevels }}</span>
							<span class="stat-label">{{ t('gaming.stats.levels') }}</span>
						</div>
						<div
							class="stat-compact"
							:class="{
								'stat-compact--highlight': overallProgress.stars === overallProgress.maxStars
							}"
						>
							<span class="stat-number">{{ overallProgress.stars }}/{{ overallProgress.maxStars }}</span>
							<span class="stat-label">{{ t('gaming.stats.stars') }}</span>
						</div>
						<div class="stat-compact">
							<span class="stat-number">{{ gameData.player.level }}</span>
							<span class="stat-label">{{ t('profile.stats.level') }}</span>
						</div>
					</div>

					<!-- Consumable Items -->
					<div v-if="consumableItems.length > 0">
						<div class="inventory-items">
							<div
								v-for="item in consumableItems"
								:key="`consumable-${item.id}`"
								class="inventory-item inventory-item--consumable"
							>
		          <span
			          class="item-icon item-icon--consumable"
			          :style="getItemRarityStyle(item.rarity)"
		          >{{ item.icon }}</span>
								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>
									<span class="item-source item-source--consumable">{{ item.description }}</span>
								</div>
								<span class="item-quantity item-quantity--consumable">x{{ item.quantity }}</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Inventory Section -->
			<div class="profile-section">
				<div v-if="regularInventory.mystery.length > 0 ||
              regularInventory.consumables.length > 0 ||
              regularInventory.regular.length > 0 ||
              receivedGifts.length > 0 ||
              sentGifts.length > 0"
				     class="inventory-organized">

					<!-- Section 1: My Inventory -->
					<div v-if="regularInventory.mystery.length > 0 ||
                regularInventory.consumables.length > 0 ||
                regularInventory.regular.length > 0"
					     class="inventory-group">
						<h4 class="inventory-group-title">
							<Icon name="star-filled" size="16" />
							{{ t('profile.inventory.title') }}
						</h4>
						<div class="inventory-items">
							<!-- Mystery Box Items -->
							<div
								v-for="item in regularInventory.mystery"
								:key="`mystery-${item.id}`"
								class="inventory-item inventory-item--mystery"
							>
			          <span
				          class="item-icon item-icon--mystery"
				          :style="getItemRarityStyle(item.rarity)"
			          >{{ item.icon }}</span>
								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>
									<span class="item-source item-source--mystery">
										{{ item.description }}
			            </span>
									<span class="item-quantity">{{ getMysteryBoxDate(item.id) }}</span>
								</div>
							</div>

							<!-- Regular Cosmetic Items -->
							<div
								v-for="item in regularInventory.regular"
								:key="`regular-${item.id}`"
								class="inventory-item inventory-item--regular"
							>
			          <span
				          class="item-icon item-icon--regular"
				          :style="getItemRarityStyle(item.rarity)"
			          >{{ item.icon }}</span>
								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>
									<span class="item-source item-source--regular">
			              {{ item.description }}
			            </span>
								</div>
							</div>
						</div>
					</div>

					<!-- Section 2: Received Gifts -->
					<div v-if="receivedGifts.length > 0" class="inventory-group inventory-group--received-gifts">
						<h4 class="inventory-group-title">
							<Icon name="heart" size="16" />
							{{ t('profile.inventory.gift_items') }}
						</h4>
						<div class="inventory-items">
							<div
								v-for="item in receivedGifts"
								:key="`received-${item.giftCode}`"
								class="inventory-item inventory-item--gift-received"
							>
							  <span
								  class="item-icon item-icon--gift-received"
								  :style="getItemRarityStyle(item.rarity)"
							  >{{ item.icon }}</span>

								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>
									<span class="item-source item-source--gift-received">
			              {{ item.description }}
			            </span>

									<!-- Gift Date -->
									<div class="gift-history">
										<div class="gift-history-item">
											<span class="gift-sender">{{ item.senderName }}</span>
											<span class="gift-date">{{ getGiftDate(item) }}</span>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					<!-- Section 3: Sent Gifts -->
					<div v-if="sentGifts.length > 0" class="inventory-group inventory-group--sent-gifts">
						<h4 class="inventory-group-title">
							<Icon name="mail" size="16" />
							{{ t('profile.inventory.sent_gifts') }}
						</h4>
						<div class="inventory-items">
							<div
								v-for="gift in sentGifts"
								:key="`sent-gift-${gift.giftCode}`"
								class="inventory-item inventory-item--sent-gift"
								:class="{
			            'inventory-item--gift-received': gift.received,
			            'inventory-item--gift-pending': !gift.received
			          }"
								@click="handleSentGiftClick(gift)"
							>
			          <span
				          class="item-icon"
				          :class="{
			              'item-icon--gift-received': gift.received,
			              'item-icon--gift-pending': !gift.received
			            }"
				          :style="getItemRarityStyle(gift.rarity)"
			          >{{ gift.icon }}</span>

								<div class="item-details">
									<div class="item-name">{{ gift.name }}</div>

									<div
										class="item-source"
										:class="{
			                'item-source--gift-received': gift.received,
			                'item-source--gift-pending': !gift.received
			              }"
									>
										<Icon
											:name="gift.received ? 'completion-badge' : 'clock'"
											size="20"
											:class="{
			                  'text-success': gift.received,
			                  'text-warning': !gift.received
			                }"
										/>
										{{ gift.received
											? t('profile.inventory.gift_received_by_friend')
											: t('profile.inventory.gift_sent_waiting')
										}}
									</div>
									<span class="item-quantity">{{ getGiftDate(gift) }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty state -->
				<div v-else class="inventory-empty">
					<Icon name="shop" size="48" />
					<h3>{{ t('profile.inventory.empty') }}</h3>
					<p>{{ t('profile.inventory.empty_description') }}</p>
					<button class="btn btn--primary" @click="navigateToShop">
						{{ t('nav.shop') }}
					</button>
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

		<GiftCodeModal
				:visible="showSentGiftModal"
				:gift-data="selectedSentGift"
				mode="view"
				@mark-received="handleSentGiftMarkReceived"
				@unmark-received="handleSentGiftUnmarkReceived"
				@close="closeSentGiftModal"
		/>
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
// Player Progress Card
.player-progress-card {
	margin-bottom: var(--space-4);
}

.progress-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	transition: all 0.2s ease;
	position: relative;

	&--editing {
		border-color: var(--primary-color);
		box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.1);
	}
}

// Progress Header
.progress-header {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}

// Avatar Section
.avatar-section {
	position: relative;
	flex-shrink: 0;
}

.avatar-display {
	display: flex;
	position: relative;
	cursor: pointer;
	border-radius: var(--border-radius-lg);
	transition: all 0.2s ease;
	border: 2px solid var(--primary-color);
	padding: var(--space-1) var(--space-2);

	&--clickable:hover {
		background-color: var(--card-bg-hover);
	}
}

// Avatar Dropdown
.avatar-dropdown {
	position: absolute;
	top: 100%;
	left: 0;
	margin-top: var(--space-2);
	background-color: var(--card-bg);
	border: 1px solid var(--primary-color);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
	box-shadow: var(--card-shadow-hover);
	z-index: 100;
}

.avatar-options {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: var(--space-1);
}

.avatar-option {
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2px solid var(--card-border);
	border-radius: var(--border-radius-md);
	background-color: var(--card-bg-hover);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--primary-color);
	}

	&--active {
		background-color: var(--primary-color);
		border-color: var(--primary-color);
		color: white;
	}
}

// Player Info
.player-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.name-section {
	background-color: var(--bg-secondary);
	position: relative;
	cursor: pointer;
	padding: var(--space-2);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--card-border);
	transition: all 0.2s ease;

	&:hover {
		border: 1px solid var(--primary-color);
	}
}

// Name Editor
.name-editor {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.name-input-inline {
	background-color: var(--bg-secondary);
	border: 2px solid var(--primary-color);
	border-radius: var(--border-radius-md);
	padding: var(--space-2) var(--space-3);
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	font-family: var(--font-family-base);
	flex: 1;
	max-width: 200px;

	&:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.25);
	}
}

.name-actions {
	display: flex;
	gap: var(--space-1);
}

.btn--save {
	padding: var(--space-4);
}


// Compact Stats
.progress-stats-compact {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	grid-auto-columns: auto;
	gap: var(--space-2);
}

.stat-compact {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
	text-align: center;

	&--highlight {
		background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
		color: white;

		.stat-label {
			color: rgba(255, 255, 255, 0.9);
		}
	}
}

.stat-number {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	line-height: 1;

	.stat-compact--highlight & {
		color: white;
	}
}

.stat-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	line-height: 1;
}

// Transitions
.avatar-dropdown-enter-active,
.avatar-dropdown-leave-active {
	transition: all 0.2s ease;
}

.avatar-dropdown-enter-from {
	opacity: 0;
	transform: translateX(-50%) translateY(-10px) scale(0.95);
}

.avatar-dropdown-leave-to {
	opacity: 0;
	transform: translateX(-50%) translateY(-10px) scale(0.95);
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
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--card-border);
	position: relative;
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
		box-shadow: var(--card-shadow-hover);
	}

	&--mystery {
		border-color: var(--primary-color);
		background: rgba(139, 92, 246, 0.05);
		box-shadow: rgb(55 63 229) 0 0 10px 0 !important;
	}

	&--consumable {
		border-color: var(--warning-color);
		background: rgba(245, 158, 11, 0.05);
		box-shadow: rgb(245 158 11) 0 0 5px 0 !important;
	}

	&--regular {
		border-color: var(--card-border);
	}

	&--gift-received {
		border-color: var(--success-color);
		box-shadow: rgb(16 185 129) 0 0 5px 0 !important;
	}

	&--gift-pending {
		border-color: var(--warning-color);
		box-shadow: rgb(234 179 8) 0 0 5px 0 !important;
	}
}

.item-icon {
	font-size: var(--font-size-xl);
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--space-12);
	height: var(--space-12);
	border-radius: var(--border-radius-lg);
	border: 2px solid;
	flex-shrink: 0;
	position: relative;

	&--mystery {
		box-shadow: 0 0 12px rgba(139, 92, 246, 0.3);
	}

	&--gift {
		box-shadow: 0 0 12px rgba(239, 68, 68, 0.3);
	}

	&--consumable {
		box-shadow: 0 0 12px rgba(245, 158, 11, 0.3);
	}
}

.item-details {
	display: grid;
	gap: var(--space-1);
	justify-content: space-between;
	align-items: center;
	grid-template-areas:
		"name meta"
		"source source"
		"history history";
	grid-template-columns: 1fr auto;
	width: 100%;
}

.item-name {
	grid-area: name;
	font-size: var(--font-size-base);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	line-height: 1.2;
	width: 100%;
}

.item-source {
	grid-area: source;
	font-size: var(--font-size-xs);
	line-height: 1.2;

	&--gift {
		color: var(--error-color);
	}

	&--consumable {
		color: var(--warning-color);
	}

	&--regular {
		color: var(--text-secondary);
	}
}

.item-quantity {
	grid-area: meta;
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	background-color: var(--card-border);
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	align-self: flex-start;

	&--consumable {
		background-color: var(--warning-color);
		color: white;
		font-weight: var(--font-weight-bold);
	}
}

// Enhanced Empty State
.inventory-empty {
	text-align: center;
	padding: var(--space-8) var(--space-4);
	color: var(--text-secondary);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
	border: 2px dashed var(--card-border);

	h3 {
		font-size: var(--font-size-lg);
		color: var(--text-color);
		margin: 0;
	}

	p {
		margin: 0;
		font-size: var(--font-size-base);
		line-height: 1.4;
	}
}

// Inventory Organization
.inventory-organized {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.inventory-group {
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	position: relative;
	overflow: hidden;
	background: var(--bg-secondary);
	border: 1px solid var(--card-border);
}

.inventory-group-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-3) 0;
	padding-bottom: var(--space-2);
	border-bottom: 1px solid var(--card-border);
}

.inventory-items {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.item-icon--gift-received,
.item-icon--gift-sent {
	box-shadow: 0 0 12px rgba(16, 185, 129, 0.3);
}

.item-source--gift-received {
	color: var(--success-color);
}

.item-source--gift-pending {
	color: var(--warning-color);
}

.item-source--gift-sent {
	color: var(--pink-color);
}

.gift-received-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	width: 100%;
}

// Gift History Styles
.gift-history {
	grid-area: history;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-sm);
	border-left: 3px solid var(--success-color);
	width: 100%;
	margin-top: var(--space-1);
}

.gift-history-item {
	display: flex;
	justify-content: space-between;
	align-items: center;
	font-size: var(--font-size-xs);
	gap: var(--space-2);
}

.gift-sender {
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	flex: 1;
}

.gift-date {
	color: var(--text-secondary);
	font-style: italic;
	white-space: nowrap;
}

.inventory-item--sent-gift {
	cursor: pointer;
	position: relative;

	&:hover {
		background-color: var(--card-bg-hover);
		transform: translateY(-1px);
		box-shadow: var(--card-shadow-hover);
	}
}

.gift-status-row {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	width: 100%;
}

.item-source--gift-received {
	color: var(--success-color);
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

.item-source--gift-pending {
	color: var(--warning-color);
	display: flex;
	align-items: center;
	gap: var(--space-1);
}

.gift-status-badge {
	position: absolute;
	right: var(--space-2);
	top: 50%;
	transform: translateY(-50%);
	display: flex;
	align-items: center;
	justify-content: center;
}

.text-success {
	color: var(--success-color);
}

.text-warning {
	color: var(--warning-color);
}
</style>