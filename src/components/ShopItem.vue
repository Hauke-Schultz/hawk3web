<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { RARITY_CONFIG } from '../config/shopConfig.js'
import CurrencyDisplay from './CurrencyDisplay.vue'

const props = defineProps({
	item: {
		type: Object,
		required: true
	},
	isOwned: {
		type: Boolean,
		default: false
	},
	playerCurrency: {
		type: Object,
		required: true
	}
})

const emit = defineEmits(['purchase'])

const { t } = useI18n()

// Check if player can afford the item
const canAfford = computed(() => {
	const hasCoins = props.playerCurrency.coins >= props.item.price.coins
	const hasDiamonds = props.playerCurrency.diamonds >= props.item.price.diamonds
	return hasCoins && hasDiamonds
})

// Check if item can be purchased
const canPurchase = computed(() => {
	if (props.isOwned && props.item.purchaseLimit === 1) {
		return false
	}
	return canAfford.value
})

// Get button text based on state
const purchaseButtonText = computed(() => {
	if (props.isOwned && props.item.purchaseLimit === 1) {
		return t('shop.owned')
	}
	if (!canAfford.value) {
		return t('shop.insufficient_funds')
	}
	return t('shop.purchase')
})

// Handle purchase click
const handlePurchase = () => {
	if (canPurchase.value) {
		emit('purchase', props.item)
	}
}
</script>

<template>
	<div class="shop-item">
		<!-- Owned Badge -->
		<div v-if="isOwned" class="shop-item__owned-badge">
			✅ {{ t('shop.owned') }}
		</div>

		<!-- Item Icon (Emoji) -->
		<div class="shop-item__icon">
			{{ item.icon }}
		</div>

		<!-- Item Info -->
		<div class="shop-item__info">
			<h3 class="shop-item__name">{{ item.name }}</h3>
		</div>

		<!-- Item Price -->
		<div class="shop-item__price">
			<CurrencyDisplay
					:coins="item.price.coins"
					:diamonds="item.price.diamonds"
					layout="horizontal"
					size="medium"
					variant="compact"
					:format-numbers="true"
					:show-zero-values="false"
				/>
		</div>

		<!-- Purchase Button -->
		<button
				class="btn btn--small shop-item__purchase-btn"
				:class="{
        'btn--primary': canPurchase,
        'btn--ghost': isOwned && item.purchaseLimit === 1,
        'btn--info': !canAfford && !isOwned
      }"
				:disabled="!canPurchase"
				@click="handlePurchase"
		>
			{{ purchaseButtonText }}
		</button>
	</div>
</template>

<style lang="scss" scoped>
.shop-item {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-2);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	transition: all 0.2s ease;
	position: relative;
	min-height: 160px;
	width: 100%;

	&:hover {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-1px);
	}
}

.shop-item__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36px;
	height: 40px;
	margin: var(--space-1) 0;
}

.shop-item__info {
	text-align: center;
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.shop-item__name {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	line-height: 1.2;
}

.shop-item__price {
	display: flex;
	justify-content: center;
	margin: var(--space-2) 0;
}

.shop-item__purchase-btn {
	width: 100%;
	min-height: var(--space-10);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
		transform: none;

		&:hover {
			transform: none;
			box-shadow: none;
		}
	}
}

.shop-item__owned-badge {
	position: absolute;
	top: var(--space-1);
	right: var(--space-1);
	background-color: var(--success-color);
	color: white;
	padding: 2px var(--space-1);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	line-height: 1;
	z-index: 1;
}
</style>