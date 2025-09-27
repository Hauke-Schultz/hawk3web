<script setup>
import {computed, onMounted, onUnmounted, ref} from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { useInventory } from '../composables/useInventory.js'
import Icon from "../../components/Icon.vue"
import CurrencyDisplay from "../components/CurrencyDisplay.vue";
import Header from "../components/Header.vue";
import {RARITY_CONFIG, SHOP_ITEMS} from '../config/shopConfig.js'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import {ACHIEVEMENTS} from "../config/achievementsConfig.js";

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


const showAvatarSelector = ref(false)
const isEditingName = ref(false)
const editingName = ref('')
const nameInput = ref(null)

const isEditing = computed(() => showAvatarSelector.value || isEditingName.value)

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
	if (isEditingName.value) {
		cancelNameEdit()
	}
}

// Name Editing Methods
const startNameEdit = () => {
	if (showAvatarSelector.value) {
		showAvatarSelector.value = false
	}
	isEditingName.value = true
	editingName.value = playerName.value
	nextTick(() => {
		if (nameInput.value) {
			nameInput.value.focus()
			nameInput.value.select()
		}
	})
}

const finishNameEdit = () => {
	if (editingName.value.trim()) {
		playerName.value = editingName.value.trim()
	}
	isEditingName.value = false
}

const cancelNameEdit = () => {
	isEditingName.value = false
	editingName.value = ''
}

// Close dropdowns when clicking outside
const handleOutsideClick = (event) => {
	if (!event.target.closest('.avatar-section') && !event.target.closest('.name-section')) {
		showAvatarSelector.value = false
	}
	if (!event.target.closest('.name-editor') && !event.target.closest('.name-section')) {
		if (isEditingName.value) {
			cancelNameEdit()
		}
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

// Helper function to get gift sender
const getGiftSender = (itemId) => {
	const inventoryData = gameData.player.inventory.items[itemId]
	return inventoryData?.giftFrom || 'Unknown'
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
		// Check if it's a gift item
		else if (inventoryData && inventoryData.isGift) {
			gifts.push(item)
		}
		// Check if it's a consumable
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
			return bBox - aBox // Newest mystery boxes first
		}),
		gifts: gifts.sort((a, b) => {
			const aReceived = gameData.player.inventory.items[a.id].receivedAt
			const bReceived = gameData.player.inventory.items[b.id].receivedAt
			return new Date(bReceived) - new Date(aReceived) // Newest gifts first
		}),
		consumables: consumables.sort((a, b) => b.quantity - a.quantity), // Highest quantity first
		regular: regular.sort((a, b) => a.name.localeCompare(b.name)) // Alphabetical
	}
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
								<Icon :name="selectedAvatar" size="48" />
								<div class="avatar-edit-hint">
									<Icon name="settings" size="12" />
								</div>
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
											<Icon :name="option.icon" size="24" />
										</button>
									</div>
								</div>
							</transition>
						</div>

						<div class="player-info">
							<div class="name-section" @click="startNameEdit" v-if="!isEditingName">
								<h2 class="player-name">{{ playerName }}</h2>
								<div class="name-edit-hint">
									<Icon name="settings" size="12" />
								</div>
							</div>

							<!-- Name Editor -->
							<div v-else class="name-editor" @click.stop>
								<input
										ref="nameInput"
										v-model="editingName"
										type="text"
										class="name-input-inline"
										:placeholder="t('profile.display_name')"
										maxlength="20"
										@blur="finishNameEdit"
										@keydown.enter="finishNameEdit"
										@keydown.escape="cancelNameEdit"
								/>
								<div class="name-actions">
									<button class="btn-icon btn-icon--success" @click="finishNameEdit">
										<Icon name="completion-badge" size="14" />
									</button>
									<button class="btn-icon btn-icon--cancel" @click="cancelNameEdit">
										<Icon name="close" size="14" />
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
									<span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
								</div>
							</div>

							<!-- Gift Items -->
							<div
									v-for="item in giftItems"
									:key="`gift-${item.id}`"
									class="inventory-item inventory-item--gift"
							>
          <span
		          class="item-icon item-icon--gift"
		          :style="getItemRarityStyle(item.rarity)"
          >{{ item.icon }}</span>
								<div class="item-details">
									<span class="item-name">{{ item.name }}</span>
									<span class="item-source item-source--gift">
              {{ t('profile.inventory.gift_from', {
										sender: getGiftSender(item.id)
									}) }}
            </span>
									<span v-if="item.quantity > 1" class="item-quantity">x{{ item.quantity }}</span>
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
	position: relative;
	cursor: pointer;
	border-radius: var(--border-radius-lg);
	padding: var(--space-1);
	transition: all 0.2s ease;

	&--clickable:hover {
		background-color: var(--card-bg-hover);
		transform: scale(1.05);
	}

	.avatar-edit-hint {
		opacity: 1;
	}
}

.avatar-edit-hint {
	position: absolute;
	bottom: -2px;
	right: -2px;
	background-color: var(--primary-color);
	color: white;
	border-radius: 50%;
	width: var(--space-5);
	height: var(--space-5);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.2s ease;
	font-size: var(--font-size-xs);
}

// Avatar Dropdown
.avatar-dropdown {
	position: absolute;
	top: 100%;
	left: 50%;
	transform: translateX(-50%);
	margin-top: var(--space-2);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
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
	width: var(--space-10);
	height: var(--space-10);
	border: 2px solid transparent;
	border-radius: var(--border-radius-md);
	background-color: var(--card-bg-hover);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--card-border);
		transform: scale(1.05);
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
	position: relative;
	cursor: pointer;
	padding: var(--space-2);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--card-border);
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--card-bg-hover);
	}

	.name-edit-hint {
		opacity: 1;
	}
}

.player-name {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	line-height: 1.2;
}

.player-level {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
}

.name-edit-hint {
	position: absolute;
	top: 2px;
	right: 2px;
	background-color: var(--primary-color);
	color: white;
	border-radius: 50%;
	width: var(--space-4);
	height: var(--space-4);
	display: flex;
	align-items: center;
	justify-content: center;
	opacity: 0;
	transition: opacity 0.2s ease;
}

// Name Editor
.name-editor {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.name-input-inline {
	background-color: var(--card-bg);
	border: 2px solid var(--primary-color);
	border-radius: var(--border-radius-md);
	padding: var(--space-2) var(--space-3);
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	font-family: var(--font-family-base);
	flex: 1;
	max-width: 205px;

	&:focus {
		outline: none;
		box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.25);
	}
}

.name-actions {
	display: flex;
	gap: var(--space-1);
}

.btn-icon {
	width: var(--space-7);
	height: var(--space-7);
	border: none;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	transition: all 0.2s ease;
	aspect-ratio: 1;

	&--success {
		background-color: var(--success-color);
		color: white;

		&:hover {
			background-color: var(--success-hover);
		}
	}

	&--cancel {
		background-color: var(--error-color);
		color: white;

		&:hover {
			background-color: var(--error-hover);
		}
	}
}

// Currency Section
.currency-section {
	display: flex;
	justify-content: center;
	align-items: center;
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
	flex-direction: column;
	gap: var(--space-1);
}

.item-name {
	font-size: var(--font-size-base);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);
	line-height: 1.2;
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

</style>