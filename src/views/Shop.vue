<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useShop } from '../composables/useShop.js'
import { useInventory } from '../composables/useInventory.js'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useI18n } from '../composables/useI18n.js'
import Icon from '../components/Icon.vue'
import CurrencyDisplay from '../components/CurrencyDisplay.vue'
import ShopItem from '../components/ShopItem.vue'
import PurchaseConfirmationModal from '../components/PurchaseConfirmationModal.vue'
import Header from '../components/Header.vue'

// Services
const { gameData } = useLocalStorage()
const {
	selectedCategory,
	currentCategoryItems,
	categories,
	purchaseItem,
	getPurchaseSummary
} = useShop()
const { hasItem } = useInventory()
const { t } = useI18n()
const router = useRouter()

// State
const showPurchaseModal = ref(false)
const selectedItem = ref(null)
const purchaseResult = ref(null)

// Computed
const playerCurrency = computed(() => ({
	coins: gameData.player.coins || 0,
	diamonds: gameData.player.diamonds || 0
}))

// Methods
const selectCategory = (categoryId) => {
	selectedCategory.value = categoryId
}

const handleItemPurchase = (item) => {
	selectedItem.value = item
	showPurchaseModal.value = true
}

const confirmPurchase = () => {
	if (selectedItem.value) {
		const result = purchaseItem(selectedItem.value)
		purchaseResult.value = result

		if (result.success) {
			showPurchaseModal.value = false
			console.log('Purchase successful!')
		}
	}
}

const cancelPurchase = () => {
	showPurchaseModal.value = false
	selectedItem.value = null
}

const handleMenuClick = () => {
	router.push('/')
}
</script>

<template>
	<Header
			:game-data="gameData"
			:show-profile="true"
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

			<!-- Player Currency Display -->
			<CurrencyDisplay
					:coins="playerCurrency.coins"
					:diamonds="playerCurrency.diamonds"
					layout="horizontal"
					size="large"
					variant="card"
					:format-numbers="true"
					:show-labels="true"
					:coins-label="t('currency.coins')"
					:diamonds-label="t('currency.diamonds')"
			/>
		</div>

		<!-- Category Navigation -->
		<div class="category-nav">
			<button
					v-for="category in categories"
					:key="category.id"
					class="category-btn"
					:class="{
          'category-btn--active': selectedCategory === category.id,
          [`category-btn--${category.color}`]: true
        }"
					@click="selectCategory(category.id)"
			>
				<Icon :name="category.icon" size="20" />
				<span class="category-name">{{ t(`shop.categories.${category.id}`) }}</span>
			</button>
		</div>

		<!-- Items Grid -->
		<div class="items-section">
			<h3 class="section-title">
				{{ t(`shop.categories.${selectedCategory}`) }}
			</h3>

			<div class="items-grid">
				<ShopItem
						v-for="item in currentCategoryItems"
						:key="item.id"
						:item="item"
						:is-owned="hasItem(item.id)"
						:player-currency="playerCurrency"
						@purchase="handleItemPurchase"
				/>
			</div>

			<!-- Empty State -->
			<div v-if="currentCategoryItems.length === 0" class="empty-state">
				<Icon name="info" size="48" />
				<h3>{{ t('shop.empty_category') }}</h3>
				<p>{{ t('shop.empty_category_description') }}</p>
			</div>
		</div>

		<!-- Purchase Confirmation Modal -->
		<PurchaseConfirmationModal
				:visible="showPurchaseModal"
				:item="selectedItem"
				:purchase-summary="selectedItem ? getPurchaseSummary(selectedItem) : null"
				@confirm="confirmPurchase"
				@cancel="cancelPurchase"
		/>
	</main>
</template>

<style lang="scss" scoped>
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
	gap: var(--space-4);
}

.shop-title-section {
	text-align: center;
}

.shop-title {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.shop-subtitle {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
}

// Category Navigation
.category-nav {
	display: flex;
	gap: var(--space-2);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	padding: var(--space-2);
}

.category-btn {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-1);
	padding: var(--space-3);
	border: none;
	border-radius: var(--border-radius-lg);
	background-color: transparent;
	color: var(--text-secondary);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--font-family-base);

	&:hover {
		background-color: var(--card-bg-hover);
	}

	&--active {
		background-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
		}
	}

	&--primary.category-btn--active {
		background-color: var(--primary-color);
	}

	&--success.category-btn--active {
		background-color: var(--success-color);
	}

	&--warning.category-btn--active {
		background-color: var(--warning-color);
	}

	&--info.category-btn--active {
		background-color: var(--info-color);
	}
}

.category-name {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
}

// Items Section
.items-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.section-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	text-align: center;
}

.items-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: var(--space-2);
	max-width: 100%;
}

// Empty State
.empty-state {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-8) var(--space-4);
	text-align: center;
	color: var(--text-secondary);

	h3 {
		margin: 0;
		font-size: var(--font-size-lg);
	}

	p {
		margin: 0;
		font-size: var(--font-size-sm);
	}
}
</style>