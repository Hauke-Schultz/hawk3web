<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop.js'
import { useInventory } from '../composables/useInventory.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import { SHOP_CATEGORIES, RARITY_CONFIG } from '../config/shopConfig.js'
import Header from '../components/Header.vue'
import Icon from '../components/Icon.vue'
import CurrencyDisplay from '../components/CurrencyDisplay.vue'
import ShopModal from '../components/ShopModal.vue'

// Services
const { gameData, buyItem } = useLocalStorage()
const { selectedCategory, currentCategoryItems, canAffordItem, canPurchaseItem } = useShop()
const { hasItem } = useInventory()
const { t } = useI18n()
const router = useRouter()

// Modal state
const showModal = ref(false)
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
			<div v-if="currentCategoryItems.length === 0" class="empty-state">
				<Icon name="shop" size="48" />
				<h3>{{ t('shop.empty_category') }}</h3>
				<p>{{ t('shop.empty_category_description') }}</p>
			</div>

			<!-- Items Grid -->
			<div v-else class="items-grid">
				<div
					v-for="item in currentCategoryItems"
					:key="item.id"
					class="shop-item"
					:class="{
						'shop-item--owned': isItemOwned(item),
						'shop-item--just-purchased': justPurchasedItems.includes(item.id),
						'shop-item--consumable': item.type === 'consumable'
					}"
					@click="handleItemClick(item)"
				>
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

						<!-- Item Rarity -->
						<div
								class="item-rarity"
								:style="{ color: RARITY_CONFIG[item.rarity]?.color }"
						>
							{{ t(`shop.rarities.${item.rarity}`) }}
						</div>
					</div>

					<!-- Item Price & Action -->
					<div class="item-action">
						<!-- Price Display -->
						<div class="item-price">
							<CurrencyDisplay
									:coins="item.price.coins"
									:diamonds="item.price.diamonds"
									layout="horizontal"
									size="small"
									variant="compact"
									:show-zero-values="false"
							/>
						</div>

						<!-- Action Button -->
						<button
								class="item-button"
								:class="getItemButtonClass(item)"
						>
							<Icon
									v-if="isItemOwned(item)"
									name="completion-badge"
									size="16"
							/>
							<span>{{ getItemButtonText(item) }}</span>
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
	padding: var(--space-2) var(--space-3);
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
	min-width: 80px;

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

.item-rarity {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	letter-spacing: 0.05em;
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