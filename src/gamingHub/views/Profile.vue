<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { useInventory} from '../composables/useInventory.js'
import Icon from "../../components/Icon.vue"
import Header from "../components/Header.vue";
import {RARITY_CONFIG} from '../config/shopConfig.js'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import {ACHIEVEMENTS} from "../config/achievementsConfig.js";

// Services
const { gameData, updatePlayer } = useLocalStorage()
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
	const allGames = ['memory', 'fruitMerge', 'numMerge']
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

	return {
		levels: totalCompleted,
		totalLevels,
		totalAchievements: ACHIEVEMENTS.definitions.length,
		percentage: totalLevels > 0 ? Math.round((totalCompleted / totalLevels) * 100) : 0,
		stars: totalStars,
		maxStars
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

const mysteryItems = computed(() => organizedItems.value.mystery)
const giftItems = computed(() => organizedItems.value.gifts)
const consumableItems = computed(() => organizedItems.value.consumables)
const regularItems = computed(() => organizedItems.value.regular)

const hasAnyItems = computed(() => {
	return mysteryItems.value.length > 0 ||
			giftItems.value.length > 0 ||
			consumableItems.value.length > 0 ||
			regularItems.value.length > 0
})

const getMysteryBoxDate = (itemId) => {
	const inventoryData = gameData.player.inventory.items[itemId]
	return inventoryData?.purchasedAt ? new Date(inventoryData.purchasedAt).toLocaleDateString() : 'Unknown'
}

// Navigation helper
const navigateToShop = () => {
	router.push('/shop')
}

const organizedItems = computed(() => {
	const allItems = getAllOwnedItems()

	const mystery = []
	const gifts = []
	const consumables = []
	const regular = []

	allItems.forEach(item => {
		const inventoryData = gameData.player.inventory.items[item.id]

		// Check if it's a mystery box item
		if (inventoryData && inventoryData.mysteryBoxNumber !== undefined) {
			mystery.push(item)
		}
		// Check if it's a received gift item
		else if (inventoryData && inventoryData.isGift) {
			gifts.push({
				...item,
				giftType: 'received',
				giftFrom: inventoryData.giftFrom,
				giftDate: inventoryData.receivedAt
			})
		}
		// Check if it's a sent gift item (from today's sent gifts)
		else if (isSentGiftItem(item.id)) {
			const sentGiftInfo = getSentGiftInfo(item.id)
			gifts.push({
				...item,
				giftType: sentGiftInfo.received ? 'sent' : 'pending',
				giftTo: sentGiftInfo.recipient || 'Unknown',
				giftDate: sentGiftInfo.receivedAt || sentGiftInfo.sentDate,
				giftCode: sentGiftInfo.code,
				giftReceived: sentGiftInfo.received
			})
		}
		// Check if it's a consumable
		else if (item.type === 'consumable') {
			consumables.push(item)
		}
		// Regular cosmetic items (not sent as gifts)
		else {
			regular.push(item)
		}
	})

	return {
		mystery: mystery.sort((a, b) => {
			const aBox = gameData.player.inventory.items[a.id].mysteryBoxNumber
			const bBox = gameData.player.inventory.items[b.id].mysteryBoxNumber
			return bBox - aBox // Newest mystery boxes first
		}),
		gifts: gifts.sort((a, b) => {
			const aDate = new Date(a.giftDate)
			const bDate = new Date(b.giftDate)
			return bDate - aDate // Newest gifts first
		}),
		consumables: consumables.sort((a, b) => b.quantity - a.quantity), // Highest quantity first
		regular: regular.sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical
	}
})

// Helper functions for sent gifts
const isSentGiftItem = (itemId) => {
	const sentGifts = gameData.player.gifts?.sentGifts || []
	return sentGifts.some(gift => gift.itemId === itemId && hasItem(itemId))
}

const getSentGiftInfo = (itemId) => {
	const sentGifts = gameData.player.gifts?.sentGifts || []

	// Get the most recent sent gift for this item
	const recentGift = sentGifts
			.filter(gift => gift.itemId === itemId)
			.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]

	return {
		recipient: 'Friend', // Could be enhanced to show actual recipient
		sentDate: recentGift?.createdAt,
		code: recentGift?.code,
		received: recentGift?.received || false
	}
}

// Enhanced gift helper functions
const getGiftSender = (item) => {
	if (item.giftType === 'received') {
		return item.giftFrom || 'Unknown'
	}
	return null
}

const getGiftRecipient = (item) => {
	if (item.giftType === 'sent' || item.giftType === 'pending') {
		return item.giftTo || 'Friend'
	}
	return null
}

const getGiftDate = (item) => {
	if (item.giftDate) {
		return new Date(item.giftDate).toLocaleDateString()
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

const getGiftCount = (item) => {
	const inventoryData = gameData.player.inventory.items[item.id]
	if (!inventoryData || !inventoryData.giftsReceived) return 0
	return inventoryData.giftsReceived.length
}

const getLatestGiftSender = (item) => {
	const inventoryData = gameData.player.inventory.items[item.id]
	if (!inventoryData || !inventoryData.giftsReceived || inventoryData.giftsReceived.length === 0) {
		return item.giftFrom || 'Unknown'
	}

	// Get the most recent gift
	const latestGift = inventoryData.giftsReceived[inventoryData.giftsReceived.length - 1]
	return latestGift.giftFrom
}

const getGiftHistory = (item) => {
	const inventoryData = gameData.player.inventory.items[item.id]
	if (!inventoryData || !inventoryData.giftsReceived) {
		// Fallback to single gift data
		if (item.giftFrom && item.giftDate) {
			return [{
				sender: item.giftFrom,
				date: new Date(item.giftDate).toLocaleDateString()
			}]
		}
		return []
	}

	// Return all gifts sorted by date (newest first)
	return inventoryData.giftsReceived
			.map(gift => ({
				sender: gift.giftFrom,
				date: new Date(gift.receivedAt).toLocaleDateString()
			}))
			.sort((a, b) => new Date(b.date) - new Date(a.date))
}

// Methods
const selectAvatar = (avatar) => {
	selectedAvatar.value = avatar
	showAvatarSelector.value = false
}

const handleMenuClick = () => {
	router.push('/')
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
						<div class="stat-compact">
							<span class="stat-number">{{ playerSummary.achievements }}/{{ overallProgress.totalAchievements }}</span>
							<span class="stat-label">{{ t('nav.trophies') }}</span>
						</div>
						<div class="stat-compact">
							<span class="stat-number">{{ playerSummary.gamesPlayed }}</span>
							<span class="stat-label">{{ t('profile.stats.played') }}</span>
						</div>
						<div class="stat-compact">
							<span class="stat-number">{{ overallProgress.levels }}/{{ overallProgress.totalLevels }}</span>
							<span class="stat-label">{{ t('gaming.stats.levels') }}</span>
						</div>
						<div class="stat-compact">
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
									<span class="item-source item-source--consumable">
			              {{ t('profile.inventory.power_up') }}
			            </span>
								</div>
								<span class="item-quantity item-quantity--consumable">x{{ item.quantity }}</span>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Inventory Section -->
			<div class="profile-section">
				<div v-if="hasAnyItems" class="inventory-organized">
					<div class="inventory-group">
						<h4 class="inventory-group-title">
							<Icon name="star-filled" size="16" />
							{{ t('profile.inventory.title') }}
						</h4>
						<div class="inventory-items">
							<!-- Mystery Box Items -->
							<div
								v-for="item in mysteryItems"
								:key="item.id"
								class="inventory-item inventory-item--mystery"
							>
                <span
			            class="item-icon item-icon--mystery"
			            :style="getItemRarityStyle(item.rarity)"
                >{{ item.icon }}</span>
								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>
									<span class="item-source item-source--mystery">
		                {{ t('profile.inventory.mystery_box_item', {
												boxNumber: gameData.player.inventory.items[item.id].mysteryBoxNumber
											}) }}
		              </span>
									<span class="item-quantity">{{ getMysteryBoxDate(item.id) }}</span>
								</div>
							</div>

							<!-- Enhanced Gift Items (Received + Sent) -->
							<div
								v-for="item in giftItems"
								:key="`gift-${item.id}-${item.giftType}`"
								class="inventory-item"
								:class="{
									'inventory-item--gift-received': item.giftType === 'received',
									'inventory-item--gift-pending': item.giftType === 'pending',
									'inventory-item--gift-sent': item.giftType === 'sent',
								}"
							>
								<span
									class="item-icon"
									:class="{
										'item-icon--gift-received': item.giftType === 'received',
										'item-icon--gift-pending': item.giftType === 'pending',
										'item-icon--gift-sent': item.giftType === 'sent'
									}"
									:style="getItemRarityStyle(item.rarity)"
								>{{ item.icon }}</span>

								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>

									<!-- Received Gift -->
									<div v-if="item.giftType === 'received'" class="gift-received-section">
										<span class="item-source item-source--gift-received">
											<template v-if="getGiftCount(item) > 1">
												{{ t('profile.inventory.gifts_from_multiple', {
													count: getGiftCount(item),
													sender: getLatestGiftSender(item)
												}) }}
											</template>
											<template v-else>
												{{ t('profile.inventory.gift_from', {
													sender: getGiftSender(item)
												}) }}
											</template>
										</span>

										<!-- Gift History List -->
										<div v-if="getGiftHistory(item).length > 0" class="gift-history">
											<div
												v-for="(gift, index) in getGiftHistory(item)"
												:key="`gift-history-${index}`"
												class="gift-history-item"
											>
												<span class="gift-sender">{{ gift.sender }}</span>
												<span class="gift-date">{{ gift.date }}</span>
											</div>
										</div>
									</div>

									<!-- Sent Gift -->
									<span
										v-if="item.giftType === 'sent'"
										class="item-source item-source--gift-sent"
									>
										{{ t('profile.inventory.gift_sent_to', {
												recipient: getGiftRecipient(item)
											}) }}
									</span>

									<!-- Pending Gift -->
									<span
											v-if="item.giftType === 'pending'"
											class="item-source item-source--gift-pending"
									>
										{{ t('profile.inventory.gift_pending_to', {
												recipient: getGiftRecipient(item)
											}) }}
									</span>

									<div v-if="item.giftType !== 'received'" class="gift-meta">
										<span class="item-quantity">{{ getGiftDate(item) }}</span>
									</div>
								</div>
							</div>

							<!-- Regular Items -->
							<div
								v-for="item in regularItems"
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
		                {{ t('profile.inventory.cosmetic_item') }}
		              </span>
									<span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Empty state remains the same -->
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
	}

	&--gift {
		border-color: var(--error-color);
		background: rgba(239, 68, 68, 0.05);
	}

	&--consumable {
		border-color: var(--warning-color);
		background: rgba(245, 158, 11, 0.05);
	}

	&--regular {
		border-color: var(--card-border);
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
	flex: 1;
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-1);
	justify-content: space-between;
	align-items: center;
}

.item-name {
	font-size: var(--font-size-base);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	line-height: 1.2;
	width: 100%;
}

.item-source {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	line-height: 1.2;

	&--mystery {
		color: var(--primary-color);
	}

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

.inventory-item--gift-received {
	border-color: var(--success-color);
	background: rgba(16, 185, 129, 0.05);
}

.inventory-item--gift-pending {
	border-color: var(--warning-color);
	background: rgba(245, 158, 11, 0.05);
}

.inventory-item--gift-sent {
	border-color: var(--pink-color);
	background: rgba(16, 185, 129, 0.05);
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

.gift-history {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-sm);
	border-left: 3px solid var(--success-color);
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
</style>