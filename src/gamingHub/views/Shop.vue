<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop.js'
import { useInventory } from '../composables/useInventory.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { SHOP_ITEMS, SHOP_CATEGORIES, RARITY_CONFIG } from '../config/shopConfig.js'
import { GIFT_CONFIG, isItemGiftable } from '../config/giftConfig.js'
import GiftModal from '../components/GiftModal.vue'
import Header from '../components/Header.vue'
import Icon from '../../components/Icon.vue'
import CurrencyDisplay from '../components/CurrencyDisplay.vue'
import ShopModal from '../components/ShopModal.vue'

// Services
const { gameData, buyItem, canSendGiftToday, getGiftableItems, createGift } = useLocalStorage()
const { selectedCategory, currentCategoryItems, canAffordItem, canPurchaseItem } = useShop()
const { hasItem } = useInventory()
const { t } = useI18n()
const router = useRouter()

// Modal state
const showModal = ref(false)
const showGiftModal = ref(false)
const selectedItem = ref(null)
const modalType = ref('purchase') // 'purchase', 'insufficient', 'owned'
const justPurchasedItems = ref([])

// Reactive player balance
const playerBalance = computed(() => ({
	coins: gameData.player.coins || 0,
	diamonds: gameData.player.diamonds || 0
}))

// Category management
const categories = computed(() => Object.values(SHOP_CATEGORIES))

const selectCategory = (categoryId) => {
	selectedCategory.value = categoryId
}

// Item purchase flow
const handleItemClick = (item) => {
	selectedItem.value = item

	// Für Consumables ohne purchaseLimit: nie als "owned" behandeln
	if (item.type === 'consumable' && !item.purchaseLimit) {
		if (!canAffordItem(item)) {
			modalType.value = 'insufficient'
		} else {
			modalType.value = 'purchase'
		}
	} else {
		// Normale Items
		if (hasItem(item.id)) {
			modalType.value = 'owned'
		} else if (!canAffordItem(item)) {
			modalType.value = 'insufficient'
		} else {
			modalType.value = 'purchase'
		}
	}

	showModal.value = true
}

const handlePurchaseConfirm = async () => {
	if (!selectedItem.value || modalType.value !== 'purchase') {
		closeModal()
		return
	}

	try {
		const result = buyItem(selectedItem.value)

		if (result.success) {
			console.log(`✅ Item purchased: ${selectedItem.value.name}`)
			justPurchasedItems.value.push(selectedItem.value.id)
			await nextTick()
			setTimeout(() => {
				closeModal()
			}, 300)
			showPurchaseSuccess(selectedItem.value)
		} else {
			console.error('Purchase failed:', result.error)
			closeModal()
		}
	} catch (error) {
		console.error('Purchase error:', error)
		closeModal()
	}
}

const handleModalCancel = () => {
	closeModal()
}

const closeModal = () => {
	showModal.value = false
	selectedItem.value = null
	modalType.value = 'purchase'
}

const showPurchaseSuccess = (item) => {
	console.log(`🎉 Successfully purchased: ${item.name}`)

	nextTick(() => {
		console.log(`✅ Item ownership updated for: ${item.name}`)
	})
}

// Item display helpers
const getItemRarityStyle = (rarity) => {
	const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.common
	return {
		borderColor: config.borderColor,
		backgroundColor: `${config.color}20`
	}
}

const inventoryItems = computed(() => {
	return gameData.player.inventory.items || {}
})

const isItemOwned = (item) => {
	// Für Consumables ohne purchaseLimit: NIEMALS als owned betrachten
	if (item.type === 'consumable' && !item.purchaseLimit) {
		return false
	}
	// Für normale Items mit purchaseLimit
	return !!inventoryItems.value[item.id]
}

const getItemQuantity = (item) => {
	return inventoryItems.value[item.id]?.quantity || 0
}

const isItemAffordable = (item) => {
	return canAffordItem(item)
}

const getItemButtonClass = (item) => {
	if (selectedCategory.value === 'gifts') {
		return getGiftButtonClass(item)
	}

	// Für Consumables ohne purchaseLimit: immer basierend auf Affordability
	if (item.type === 'consumable' && !item.purchaseLimit) {
		return canAffordItem(item) ? 'item-button--buyable' : 'item-button--expensive'
	}

	// Für normale Items
	if (isItemOwned(item)) return 'item-button--owned'
	if (!canAffordItem(item)) return 'item-button--expensive'
	return 'item-button--buyable'
}

const getItemButtonText = (item) => {
	// Für Consumables ohne purchaseLimit: immer "Buy" oder "Can't afford"
	if (item.type === 'consumable' && !item.purchaseLimit) {
		return canAffordItem(item) ? t('shop.buy') : t('shop.cant_afford')
	}

	// Für normale Items
	if (isItemOwned(item)) return t('shop.owned')
	if (!canAffordItem(item)) return t('shop.cant_afford')
	return t('shop.buy')
}

// Gift-specific computed properties
const giftCategoryItems = computed(() => {
	// Alle Items aus der gifts category
	return currentCategoryItems.value.filter(item => item.category === 'gifts')
})

const giftableProfileItems = computed(() => {
	// Profile items die als Geschenk versendet werden können
	if (selectedCategory.value !== 'gifts') return []

	return getGiftableItems()
			.map(itemId => {
				const shopItem = SHOP_ITEMS.find(item => item.id === itemId && item.category === 'profile')
				return shopItem
			})
			.filter(Boolean)
})

// Gift-specific computed properties
const giftableItems = computed(() => {
	if (selectedCategory.value !== 'gifts') return []

	return getGiftableItems().map(itemId => {
		const shopItem = currentCategoryItems.value.find(item => item.id === itemId)
		return shopItem
	}).filter(Boolean)
})

const displayItems = computed(() => {
	if (selectedCategory.value === 'gifts') {
		// Zeige sowohl Gift-Items als auch besitzbare Profile-Items
		return [...giftCategoryItems.value, ...giftableProfileItems.value]
	}
	return currentCategoryItems.value
})

// Gift-related methods
const handleGiftClick = (item) => {
	if (selectedCategory.value !== 'gifts') {
		handleItemClick(item)
		return
	}

	// If gift item is not owned, allow purchase
	if (item.category === 'gifts' && !hasItem(item.id)) {
		handleItemClick(item) // Use normal purchase flow
		return
	}

	// Check if can send gift today
	if (!canSendGiftToday()) {
		modalType.value = 'gift_limit'
		selectedItem.value = item
		showModal.value = true
		return
	}

	// Check if item is owned
	if (!hasItem(item.id)) {
		modalType.value = 'gift_not_owned'
		selectedItem.value = item
		showModal.value = true
		return
	}

	// Open gift modal
	selectedItem.value = item
	showGiftModal.value = true
}

const handleGiftSend = async (item) => {
	try {
		const result = createGift(item.id)

		if (result.success) {
			showGiftModal.value = false
			// Show success with gift code
			modalType.value = 'gift_success'
			selectedItem.value = { ...item, giftCode: result.gift.code, giftData: result.gift }
			showModal.value = true
		} else {
			showGiftModal.value = false
			modalType.value = 'gift_error'
			selectedItem.value = { ...item, error: result.error }
			showModal.value = true
		}
	} catch (error) {
		console.error('Gift creation error:', error)
		showGiftModal.value = false
		modalType.value = 'gift_error'
		selectedItem.value = { ...item, error: 'unknown_error' }
		showModal.value = true
	}
}

const closeGiftModal = () => {
	showGiftModal.value = false
	selectedItem.value = null
}

const getGiftButtonText = (item) => {
	if (item.category === 'gifts' && !hasItem(item.id)) {
		return t('shop.gifts.buy_to_gift')
	}

	if (!hasItem(item.id)) {
		return t('shop.gifts.not_owned')
	}

	if (!canSendGiftToday()) {
		return t('shop.gifts.daily_limit')
	}

	return t('shop.gifts.send_gift')
}

const getGiftButtonClass = (item) => {
	if (item.category === 'gifts' && !hasItem(item.id)) {
		return 'item-button--buy-to-gift'
	}

	if (!hasItem(item.id)) {
		return 'item-button--disabled'
	}

	if (!canSendGiftToday()) {
		return 'item-button--disabled'
	}

	return 'item-button--gift'
}

// Navigation
const handleMenuClick = () => {
	router.push('/')
}

// watch gameData if changes are needed
watch(() => gameData, (newData) => {
	// Handle any necessary updates when gameData changes
	console.log('Game data updated:', newData)
}, { deep: true })
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>

	<main class="shop">
		<!-- Shop Header -->
		<div class="shop-header">
			<div class="shop-title-section">
				<h2 class="shop-title">{{ t('shop.title') }}</h2>
				<p class="shop-subtitle">{{ t('shop.subtitle') }}</p>
			</div>
		</div>

		<!-- Category Navigation -->
		<div class="category-nav">
			<button
					v-for="category in categories"
					:key="category.id"
					class="category-btn"
					:class="{ 'category-btn--active': selectedCategory === category.id }"
					@click="selectCategory(category.id)"
			>
				<Icon :name="category.icon" size="20" />
				<span>{{ t(`shop.categories.${category.id}`) }}</span>
			</button>
		</div>

		<!-- Items Grid -->
		<div class="items-section">
			<!-- Empty State -->
			<div v-if="displayItems.length === 0" class="empty-state">
				<Icon name="shop" size="48" />
				<h3>
					{{ selectedCategory === 'gifts'
						? t('shop.gifts.no_giftable_items')
						: t('shop.empty_category')
					}}
				</h3>
				<p>
					{{ selectedCategory === 'gifts'
						? t('shop.gifts.no_giftable_items_description')
						: t('shop.empty_category_description')
					}}
				</p>
			</div>

			<!-- Items Grid -->
			<div v-else class="items-grid">
				<div
					v-for="item in displayItems"
					:key="item.id"
					class="shop-item"
					:class="{
		        'shop-item--owned': isItemOwned(item),
		        'shop-item--gift-mode': selectedCategory === 'gifts',
		        'shop-item--giftable': selectedCategory === 'gifts' && hasItem(item.id),
		        'shop-item--gift-purchasable': selectedCategory === 'gifts' && item.category === 'gifts' && !hasItem(item.id)
		      }"
					@click="selectedCategory === 'gifts' ? handleGiftClick(item) : handleItemClick(item)"
				>
					<!-- Gift Category Badge -->
					<div v-if="selectedCategory === 'gifts' && item.category === 'gifts'" class="gift-category-badge">
						<Icon name="heart" size="14" />
						{{ t('shop.gifts.gift_item') }}
					</div>

					<!-- Profile Item Badge in Gift Mode -->
					<div v-if="selectedCategory === 'gifts' && item.category === 'profile'" class="profile-gift-badge">
						<Icon name="user" size="14" />
						{{ t('shop.gifts.owned_item') }}
					</div>

					<!-- Item Icon -->
					<div
						class="item-icon"
						:style="getItemRarityStyle(item.rarity)"
					>
						<span class="item-emoji">{{ item.icon }}</span>
						<div
							v-if="item.type === 'consumable' && getItemQuantity(item) > 0"
							class="item-quantity-badge"
						>
							{{ getItemQuantity(item) }}
						</div>
					</div>

					<!-- Item Info -->
					<div class="item-info">
						<h4 class="item-name">{{ item.name }}</h4>
						<p class="item-description">{{ item.description }}</p>
					</div>

					<!-- Item Price & Action -->
					<div class="item-action">
						<!-- Price Display -->
						<div v-if="selectedCategory !== 'gifts' || (item.category === 'gifts' && !hasItem(item.id))" class="item-price">
							<CurrencyDisplay
									:coins="item.price.coins"
									:diamonds="item.price.diamonds"
									layout="horizontal"
									size="small"
									variant="compact"
									:show-zero-values="false"
							/>
						</div>

						<!-- Gift Instructions for owned items -->
						<div v-if="selectedCategory === 'gifts' && hasItem(item.id)" class="gift-ready-indicator">
							<Icon name="heart" size="16" />
							<span>{{ t('shop.gifts.ready_to_send') }}</span>
						</div>

						<!-- Action Button -->
						<button
								class="item-button"
								:class="getItemButtonClass(item)"
						>
							<Icon
									v-if="selectedCategory === 'gifts' && hasItem(item.id)"
									name="heart"
									size="16"
							/>
							<Icon
									v-else-if="selectedCategory === 'gifts' && item.category === 'gifts'"
									name="shop"
									size="16"
							/>
							<Icon
									v-else-if="isItemOwned(item)"
									name="completion-badge"
									size="16"
							/>
							<span>
		            {{ selectedCategory === 'gifts'
											? getGiftButtonText(item)
											: getItemButtonText(item)
										}}
		          </span>
						</button>
					</div>
				</div>
			</div>
		</div>

		<!-- Shop Modal -->
		<ShopModal
				:visible="showModal"
				:item="selectedItem"
				:player-balance="playerBalance"
				:type="modalType"
				@confirm="handlePurchaseConfirm"
				@cancel="handleModalCancel"
				@close="closeModal"
		/>

		<!-- Gift Modal -->
		<GiftModal
				:visible="showGiftModal"
				:item="selectedItem"
				:player-balance="playerBalance"
				@confirm="handleGiftSend"
				@cancel="closeGiftModal"
				@close="closeGiftModal"
		/>
	</main>
</template>

<style lang="scss" scoped>
// Main Shop Container
.shop {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
	min-height: calc(100vh - 80px);
}

// Shop Header
.shop-header {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.shop-title-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.shop-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.shop-subtitle {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
}

.shop-balance {
	display: flex;
	justify-content: center;
}

// Category Navigation
.category-nav {
	display: flex;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	border: 1px solid var(--card-border);
	overflow-x: auto;
}

.category-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-2);
	background: none;
	border: none;
	border-radius: var(--border-radius-md);
	color: var(--text-secondary);
	font-family: var(--font-family-base);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	cursor: pointer;
	transition: all 0.2s ease;
	white-space: nowrap;
	min-width: 60px;

	&:hover {
		background-color: var(--card-bg-hover);
		color: var(--text-color);
	}

	&--active {
		background-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
		}
	}
}

// Items Section
.items-section {
	flex: 1;
	min-height: 300px;
}

// Empty State
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: var(--space-3);
	padding: var(--space-8) var(--space-4);
	color: var(--text-secondary);
	text-align: center;

	h3 {
		font-size: var(--font-size-lg);
		font-weight: var(--font-weight-bold);
		margin: 0;
	}

	p {
		font-size: var(--font-size-sm);
		margin: 0;
	}
}

// Items Grid
.items-grid {
	display: grid;
	grid-template-columns: 1fr;
	gap: var(--space-3);
}

// Shop Item Card
.shop-item {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	display: flex;
	align-items: center;
	gap: var(--space-3);
	cursor: pointer;
	transition: all 0.2s ease;
	position: relative;
	overflow: hidden;

	&:hover {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-1px);
	}

	&--owned {
		opacity: 0.8;

		&:hover {
			transform: none;
		}
	}
}

// Item Icon
.item-icon {
	width: var(--space-12);
	height: var(--space-12);
	border-radius: var(--border-radius-lg);
	border: 2px solid;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
}

.item-emoji {
	font-size: var(--font-size-2xl);
	line-height: 1;
}

// Item Info
.item-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	min-width: 0; // Prevent text overflow
}

.item-name {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	line-height: 1.2;
}

.item-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.3;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
	overflow: hidden;
}

// Item Action
.item-action {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: var(--space-2);
	flex-shrink: 0;
}

.item-price {
	display: flex;
	justify-content: flex-end;
}

// Item Button
.item-button {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1) var(--space-3);
	border: none;
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	font-family: var(--font-family-base);
	cursor: pointer;
	transition: all 0.2s ease;
	min-width: 80px;
	justify-content: center;

	&--buyable {
		background-color: var(--success-color);
		color: white;

		&:hover {
			background-color: var(--success-hover);
			transform: translateY(-1px);
		}
	}

	&--expensive {
		background-color: var(--error-color);
		color: white;
		opacity: 0.7;

		&:hover {
			background-color: var(--error-hover);
		}
	}

	&--owned {
		background-color: var(--info-color);
		color: white;
		cursor: default;

		&:hover {
			transform: none;
		}
	}
}

// Owned Overlay
.owned-overlay {
	position: absolute;
	top: var(--space-2);
	right: var(--space-2);
	color: var(--success-color);
	background-color: var(--card-bg);
	border-radius: 50%;
	padding: var(--space-1);
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.item-quantity-badge {
	position: absolute;
	top: -8px;
	right: -8px;
	background-color: var(--warning-color);
	color: white;
	border-radius: 50%;
	width: 24px;
	height: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	border: 2px solid var(--card-bg);
	z-index: 2;
}

.shop-item--consumable {
	.item-icon {
		position: relative;
	}
}


// Gift-specific styles
.shop-item--gift-mode {
	position: relative;

	&.shop-item--giftable {
		border-color: var(--success-color);
		box-shadow: 0 0 0 1px rgba(16, 185, 129, 0.2);
	}

	&:not(.shop-item--giftable) {
		opacity: 0.6;
		cursor: not-allowed;
	}
}

.gift-mode-badge {
	position: absolute;
	top: var(--space-1);
	left: var(--space-1);
	background: linear-gradient(135deg, var(--success-color), var(--success-hover));
	color: white;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	display: flex;
	align-items: center;
	gap: var(--space-1);
	z-index: 2;
}

.shop-item--gift-purchasable {
	border-color: var(--warning-color);
	box-shadow: 0 0 0 1px rgba(245, 158, 11, 0.2);
}

.gift-category-badge {
	position: absolute;
	top: var(--space-1);
	left: var(--space-1);
	background: linear-gradient(135deg, var(--success-color), var(--success-hover));
	color: white;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	display: flex;
	align-items: center;
	gap: var(--space-1);
	z-index: 2;
}

.profile-gift-badge {
	position: absolute;
	top: var(--space-1);
	right: var(--space-1);
	background: linear-gradient(135deg, var(--primary-color), var(--primary-hover));
	color: white;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	display: flex;
	align-items: center;
	gap: var(--space-1);
	z-index: 2;
}

.gift-ready-indicator {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--success-color);
	font-weight: var(--font-weight-bold);
}

.item-button--buy-to-gift {
	background-color: var(--warning-color);
	color: white;

	&:hover {
		background-color: var(--warning-hover);
	}
}

.item-button--gift {
	background-color: var(--success-color);
	color: white;

	&:hover {
		background-color: var(--success-hover);
	}
}

// Responsive adjustments
@media (max-width: 375px) {
	.shop-item {
		flex-direction: column;
		text-align: center;
		gap: var(--space-2);
	}

	.item-action {
		align-items: center;
		flex-direction: column-reverse;
	}

	.category-nav {
		justify-content: center;
	}
}
</style>