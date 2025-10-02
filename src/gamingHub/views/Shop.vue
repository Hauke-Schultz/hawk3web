<script setup>
import {ref, computed, watch, nextTick} from 'vue'
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop.js'
import { useInventory } from '../composables/useInventory.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../../composables/useI18n.js'
import { SHOP_ITEMS, SHOP_CATEGORIES, RARITY_CONFIG } from '../config/shopConfig.js'
import { validateGiftCodeFormat } from '../config/giftConfig.js'
import GiftModal from '../components/GiftModal.vue'
import Header from '../components/Header.vue'
import Icon from '../../components/Icon.vue'
import CurrencyDisplay from '../components/CurrencyDisplay.vue'
import ShopModal from '../components/ShopModal.vue'
import GiftCodeModal from "../components/GiftCodeModal.vue";

// Services
const { gameData, buyItem, canSendGiftToday, getGiftableItems, createGift, canReceiveGiftToday, redeemGift, markGiftAsReceived, unmarkGiftAsReceived } = useLocalStorage()
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
const giftCode = ref('')
const giftRedeemResult = ref(null)
const isRedeeming = ref(false)

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

const handleGiftRedeem = async () => {
	if (!giftCode.value.trim()) return

	const code = giftCode.value.trim().toUpperCase()

	if (!validateGiftCodeFormat(code)) {
		giftRedeemResult.value = {
			success: false,
			error: 'invalid_code_format',
			message: t('shop.gifts.invalid_gift_code')
		}
		return
	}

	isRedeeming.value = true

	try {
		const result = redeemGift(code)

		if (result.success) {
			giftRedeemResult.value = {
				success: true,
				gift: result.gift,
				message: t('shop.gifts.gift_redeemed')
			}
			giftCode.value = ''
			showGiftModal.value = true
		} else {
			const errorMessages = {
				invalid_code_format: t('shop.gifts.invalid_gift_code'),
				already_redeemed: t('shop.gifts.already_redeemed'),
				daily_receive_limit: t('shop.gifts.daily_limit_message'),
				own_gift: t('shop.gifts.cannot_redeem_own_gift'),
				already_owned: t('shop.gifts.item_already_owned'),
				expired: t('shop.gifts.gift_expired'),
				item_not_found: t('shop.gifts.item_not_found'),
				invalid_code: t('shop.gifts.invalid_gift_code')
			}

			giftRedeemResult.value = {
				success: false,
				error: result.error,
				message: errorMessages[result.error] || t('shop.gifts.unknown_error')
			}
		}
	} catch (error) {
		console.error('Gift redemption error:', error)
		giftRedeemResult.value = {
			success: false,
			error: 'unknown_error',
			message: t('shop.gifts.unknown_error')
		}
	} finally {
		isRedeeming.value = false
	}
}

const closeGiftModal = () => {
	showGiftModal.value = false
	giftRedeemResult.value = null
}

const canRedeemGiftsToday = computed(() => {
	return canReceiveGiftToday()
})

const giftStats = computed(() => {
	return {
		sentToday: gameData.player.gifts?.sentToday || 0,
		receivedToday: gameData.player.gifts?.receivedToday || 0,
		totalSent: gameData.player.gifts?.sentGifts?.length || 0,
		totalReceived: gameData.player.gifts?.receivedGifts?.length || 0
	}
})

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
	if (item.category === 'gifts' && !isItemOwned(item)) {
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
	if (!isItemOwned(item)) {
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

const getGiftButtonText = (item) => {
	if (item.category === 'gifts' && !isItemOwned(item)) {
		return t('shop.gifts.buy_to_gift')
	}

	if (!isItemOwned(item)) {
		return t('shop.gifts.not_owned')
	}

	if (!canSendGiftToday()) {
		return t('shop.gifts.daily_limit')
	}

	return t('shop.gifts.send_gift')
}

const getGiftButtonClass = (item) => {
	if (item.category === 'gifts' && !isItemOwned(item)) {
		return 'item-button--buy-to-gift'
	}

	if (!isItemOwned(item)) {
		return 'item-button--disabled'
	}

	if (!canSendGiftToday()) {
		return 'item-button--disabled'
	}

	return 'item-button--gift'
}

const getGiftStatus = (item) => {
	if (selectedCategory.value !== 'gifts') return null

	const today = new Date().toISOString().split('T')[0]
	const sentGifts = gameData.player.gifts?.sentGifts || []
	const receivedGifts = gameData.player.gifts?.receivedGifts || []

	// Check if sent today
	const sentToday = sentGifts.find(gift =>
			gift.itemId === item.id && gift.sentDate === today
	)

	// Check if received today
	const receivedToday = receivedGifts.find(gift =>
			gift.itemId === item.id &&
			gift.receivedAt &&
			gift.receivedAt.split('T')[0] === today
	)

	return {
		sentToday: sentToday || null,
		receivedToday: receivedToday || null,
		hasSentHistory: sentGifts.some(gift => gift.itemId === item.id),
		hasReceivedHistory: receivedGifts.some(gift => gift.itemId === item.id)
	}
}

// Gift Code Modal State
const showGiftCodeModal = ref(false)
const selectedGiftCode = ref(null)

const handleGiftStatusClick = (item) => {
	const status = getGiftStatus(item)

	if (status.sentToday) {
		// Show gift code modal
		selectedGiftCode.value = status.sentToday
		showGiftCodeModal.value = true
	} else {
		// Normal gift flow
		handleGiftClick(item)
	}
}

const closeGiftCodeModal = () => {
	showGiftCodeModal.value = false
	selectedGiftCode.value = null
}

const unMarkAsReceived = () => {
	if (selectedGiftCode.value) {
		const success = markGiftAsReceived(selectedGiftCode.value.code)
		if (success) {
			selectedGiftCode.value.received = false
			selectedGiftCode.value.receivedAt = null
		}
	}
}

const markAsReceived = async () => {
	if (selectedGiftCode.value) {
		const success = markGiftAsReceived(selectedGiftCode.value.code)
		if (success) {
			// Update local state
			selectedGiftCode.value.received = true
			selectedGiftCode.value.receivedAt = new Date().toISOString()
		}
	}
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

		<div
				v-if="selectedCategory === 'gifts'"
				class="gift-section"
		>
			<label class="item-name">{{ t('shop.gifts.enter_gift_code') }}</label>
			<div class="gift-redeem-section">
				<div class="gift-input-group">
					<input
							v-model="giftCode"
							type="text"
							class="gift-code-input"
							:placeholder="t('shop.gifts.gift_code_placeholder')"
							:disabled="!canRedeemGiftsToday || isRedeeming"
							maxlength="50"
							@keydown.enter="handleGiftRedeem"
					/>
					<button
							class="btn btn--primary"
							:class="{ 'btn--loading': isRedeeming }"
							@click="handleGiftRedeem"
					>
						{{ isRedeeming ? t('common.loading') : t('shop.gifts.redeem_gift') }}
					</button>
				</div>

				<!-- Gift Limit Warning -->
				<div v-if="!canRedeemGiftsToday" class="gift-limit-warning">
					<Icon name="info" size="16" />
					<span>{{ t('shop.gifts.daily_limit_message') }}</span>
				</div>

				<!-- Gift Redeem Result -->
				<div v-if="giftRedeemResult && !showGiftModal" class="gift-result">
					<div v-if="giftRedeemResult.success" class="gift-result--success">
						<Icon name="completion-badge" size="20" />
						<span>{{ giftRedeemResult.message }}</span>
					</div>
					<div v-else class="gift-result--error">
						<Icon name="close" size="20" />
						<span>{{ giftRedeemResult.message }}</span>
					</div>
				</div>
			</div>
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
			      'shop-item--too-expensive': !isItemAffordable(item) && !isItemOwned(item),
			      'shop-item--gift-mode': selectedCategory === 'gifts',
			      'shop-item--giftable': selectedCategory === 'gifts' && hasItem(item.id),
			      'shop-item--gift-purchasable': selectedCategory === 'gifts' && item.category === 'gifts' && !hasItem(item.id),
			      'shop-item--gift-sent': selectedCategory === 'gifts' && getGiftStatus(item)?.sentToday,
			      'shop-item--gift-received': selectedCategory === 'gifts' && getGiftStatus(item)?.receivedToday
			    }"
					@click="selectedCategory === 'gifts' ? handleGiftStatusClick(item) : handleItemClick(item)"
				>
					<!-- Item Icon mit Status Badges -->
					<div
							class="item-icon"
							:style="getItemRarityStyle(item.rarity)"
					>
						<span class="item-emoji">{{ item.icon }}</span>
						<!-- Consumable Quantity Badge (existing) -->
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
						<!-- Gift Status Text -->
						<div v-if="selectedCategory === 'gifts'" class="gift-status-text">
			        <span v-if="getGiftStatus(item)?.sentToday" class="status-indicator status-indicator--sent">
			          {{ getGiftStatus(item)?.sentToday?.received ?
					        t('shop.gifts.gift_received') :
					        t('shop.gifts.gift_sent_today')
				        }}
			        </span>
							<span v-else-if="getGiftStatus(item)?.receivedToday" class="status-indicator status-indicator--received">
			          {{ t('shop.gifts.gift_received_today') }}
			        </span>
						</div>
						<!-- Price Display -->
						<div v-if="selectedCategory !== 'gifts' || (item.category === 'gifts' && !isItemOwned(item))" class="item-price">
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
								v-if="selectedCategory === 'gifts' && isItemOwned(item)"
								name="heart"
								size="16"
							/>
							<Icon
								v-else-if="selectedCategory === 'gifts' && item.category === 'gifts'"
								name="shop"
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

		<GiftCodeModal
				:visible="showGiftCodeModal"
				:gift-data="selectedGiftCode"
				@mark-received="markAsReceived"
				@unmark-received="unMarkAsReceived"
				@close="closeGiftCodeModal"
		/>
	</main>
</template>

<style lang="scss">
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
	display: grid;
	grid-template-areas:
		"icon info info"
		"action action action";
	grid-template-columns: auto 1fr auto;
	grid-template-rows: auto auto;
	align-items: flex-start;
	gap: var(--space-2) var(--space-4);
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
		border-color: var(--success-color);

		&:hover {
			transform: none;
		}
	}

	&--too-expensive {
		border-color: var(--error-color);
	}
}

// Item Icon
.item-icon {
	grid-area: icon;
	width: var(--space-12);
	height: var(--space-12);
	border-radius: var(--border-radius-lg);
	border: 2px solid;
	display: flex;
	align-items: center;
	justify-content: center;
	position: relative;
}

.item-emoji {
	font-size: var(--font-size-2xl);
	line-height: 1;
}

// Item Info
.item-info {
	grid-area: info;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
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
	grid-area: action;
	display: flex;
	align-items: flex-end;
	gap: var(--space-2);
	justify-content: flex-end;
}

.item-price {
	display: flex;
	justify-content: flex-end;

	.currency-item {
		height: 28px;
	}
}

// Item Button
.item-button {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1) var(--space-3);
	border: none;
	border-radius: var(--border-radius-sm);
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
		}
	}

	&--expensive {
		background-color: var(--error-color);
		color: white;

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
.gift-section {
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-3);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.shop-item--gift-mode {
	position: relative;

	&.shop-item--giftable {
		border-color: var(--success-color);
	}

	&:not(.shop-item--giftable) {
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

.gift-ready-indicator {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--success-color);
	font-weight: var(--font-weight-bold);
}

.item-button--buy-to-gift {
	background-color: var(--success-color);
	color: white;

	&:hover {
		background-color: var(--success-hover);
	}
}

.item-button--gift {
	background-color: var(--primary-color);
	color: white;

	&:hover {
		background-color: var(--primary-hover);
	}
}


// Gift Redeem Section
.gift-redeem-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.gift-input-group {
	display: flex;
	gap: var(--space-2);
}

.gift-code-input {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	padding: var(--space-3) var(--space-4);
	font-size: var(--font-size-base);
	color: var(--text-color);
	font-family: 'Courier New', monospace;
	text-transform: uppercase;
	letter-spacing: 1px;
	transition: all 0.2s ease;
	width: 100%;

	&:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 0.125rem rgba(79, 70, 229, 0.25);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	&::placeholder {
		color: var(--text-muted);
		text-transform: none;
		letter-spacing: normal;
	}
}

.gift-limit-warning {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--warning-color);
	color: white;
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

.gift-result {
	padding: var(--space-2);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);

	&--success {
		background-color: var(--success-color);
		color: white;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}

	&--error {
		background-color: var(--error-color);
		color: white;
		display: flex;
		align-items: center;
		gap: var(--space-2);
	}
}

.gift-stats {
	display: grid;
	grid-template-columns: 1fr 1fr;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.gift-success-content {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	align-items: center;
}

.gift-item-display {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
}

.gift-item-icon {
	font-size: var(--font-size-2xl);
}

.gift-item-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.gift-item-info h4 {
	margin: 0;
	font-size: var(--font-size-base);
	color: var(--text-color);
}

.gift-item-info p {
	margin: 0;
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
}

.icon-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
}


.gift-status-badges {
	position: absolute;
	top: -4px;
	right: -4px;
	display: flex;
	flex-direction: column;
	gap: 2px;
	z-index: 3;
}

.gift-badge {
	width: 20px;
	height: 20px;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 2px solid var(--card-bg);
	font-size: 10px;

	&--sent {
		background-color: var(--warning-color);
		color: white;

		&.gift-badge--received {
			background-color: var(--success-color);
		}
	}

	&--received-today {
		background-color: var(--error-color);
		color: white;
	}
}

// Item Status Styling
.shop-item--gift-sent {
	border-color: var(--warning-color);
	background: rgba(245, 158, 11, 0.1);

	&.shop-item--gift-sent .gift-badge--received {
		background-color: var(--success-color);
	}
}

.shop-item--gift-received {
	border-color: var(--success-color);
	background: rgba(16, 185, 129, 0.1);
}

.status-indicator {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-1) var(--space-3);
	border: none;
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	cursor: pointer;
	justify-content: center;

	&--sent {
		background-color: var(--warning-color);
		color: white;
	}

	&--received {
		background-color: var(--success-color);
		color: white;
	}
}
</style>