<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { RARITY_CONFIG } from '../config/shopConfig.js'
import Icon from './Icon.vue'
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

// Computed properties
const rarityConfig = computed(() => {
	return RARITY_CONFIG[props.item.rarity] || RARITY_CONFIG.common
})

const canAfford = computed(() => {
	const hasCoins = props.playerCurrency.coins >= props.item.price.coins
	const hasDiamonds = props.playerCurrency.diamonds >= props.item.price.diamonds
	return hasCoins && hasDiamonds
})

const canPurchase = computed(() => {
	if (props.isOwned && props.item.purchaseLimit === 1) {
		return false
	}
	return canAfford.value
})

const itemClass = computed(() => {
	return {
		'shop-item': true,
		'shop-item--owned': props.isOwned,
		'shop-item--affordable': canAfford.value,
		'shop-item--unaffordable': !canAfford.value,
		[`shop-item--${props.item.rarity}`]: true
	}
})

const purchaseButtonText = computed(() => {
	if (props.isOwned && props.item.purchaseLimit === 1) {
		return t('shop.owned')
	}
	if (!canAfford.value) {
		return t('shop.insufficient_funds')
	}
	return t('shop.purchase')
})

// Methods
const handlePurchase = () => {
	if (canPurchase.value) {
		emit('purchase', props.item)
	}
}
</script>

<template>
	<div :class="itemClass">
		<!-- Item Header -->
		<div class="shop-item__header">
			<!-- Owned Badge -->
			<div v-if="isOwned" class="shop-item__owned-badge">
				<Icon name="completion-badge" size="16" />
				<span>{{ t('shop.owned') }}</span>
			</div>

			<!-- Rarity Badge -->
			<div
					class="shop-item__rarity-badge"
					:style="{
          backgroundColor: rarityConfig.color,
          borderColor: rarityConfig.borderColor
        }"
			>
				{{ t(`shop.rarities.${item.rarity}`) }}
			</div>
		</div>

		<!-- Item Icon -->
		<div class="shop-item__icon">
			<Icon :name="item.icon" size="48" />
		</div>

		<!-- Item Info -->
		<div class="shop-item__info">
			<h3 class="shop-item__name">{{ item.name }}</h3>
			<p class="shop-item__description">{{ item.description }}</p>
		</div>

		<!-- Item Details -->
		<div class="shop-item__details">
			<!-- Item Type -->
			<div class="shop-item__type">
				<Icon name="info" size="12" />
				<span>{{ t(`shop.types.${item.type}`) }}</span>
			</div>

			<!-- Purchase Limit -->
			<div v-if="item.purchaseLimit === 1" class="shop-item__limit">
				<Icon name="lock" size="12" />
				<span>{{ t('shop.one_time_purchase') }}</span>
			</div>
		</div>

		<!-- Item Price -->
		<div class="shop-item__price">
			<div class="price-label">{{ t('shop.price') }}</div>
			<CurrencyDisplay
					:coins="item.price.coins"
					:diamonds="item.price.diamonds"
					layout="horizontal"
					size="small"
					variant="compact"
					:format-numbers="true"
					:show-zero-values="false"
			/>
		</div>

		<!-- Purchase Button -->
		<div class="shop-item__actions">
			<button
					class="btn shop-item__purchase-btn"
					:class="{
          'btn--primary': canPurchase,
          'btn--ghost': isOwned && item.purchaseLimit === 1,
          'btn--info': !canAfford && !isOwned
        }"
					:disabled="!canPurchase"
					@click="handlePurchase"
			>
				<Icon
						v-if="isOwned && item.purchaseLimit === 1"
						name="completion-badge"
						size="16"
				/>
				<Icon
						v-else-if="canPurchase"
						name="trophy"
						size="16"
				/>
				<Icon
						v-else
						name="lock"
						size="16"
				/>
				{{ purchaseButtonText }}
			</button>
		</div>
	</div>
</template>

<style lang="scss" scoped>
// Base Shop Item
.shop-item {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-lg);
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
	transition: all 0.2s ease;
	position: relative;
	min-height: 280px;

	&:hover {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-1px);
	}

	// Rarity variants
	&--common {
		border-left: 4px solid #6B7280;
	}

	&--uncommon {
		border-left: 4px solid #10B981;
	}

	&--rare {
		border-left: 4px solid #3B82F6;
	}

	&--epic {
		border-left: 4px solid #8B5CF6;
	}

	&--legendary {
		border-left: 4px solid #F59E0B;
		box-shadow: 0 0 20px rgba(245, 158, 11, 0.3);
	}

	// State variants
	&--owned {
		opacity: 0.8;
		background-color: var(--bg-secondary);
	}

	&--unaffordable {
		opacity: 0.6;
	}
}

// Item Header
.shop-item__header {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	margin-bottom: var(--space-2);
}

.shop-item__owned-badge {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	background-color: var(--success-color);
	color: white;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
}

.shop-item__rarity-badge {
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	color: white;
	text-transform: uppercase;
	border: 1px solid;
}

// Item Icon
.shop-item__icon {
	display: flex;
	align-items: center;
	justify-content: center;
	width: var(--space-16);
	height: var(--space-16);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
	color: var(--primary-color);
	align-self: center;
}

// Item Info
.shop-item__info {
	text-align: center;
	flex: 1;
}

.shop-item__name {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
	line-height: 1.2;
}

.shop-item__description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.3;
}

// Item Details
.shop-item__details {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.shop-item__type,
.shop-item__limit {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
}

// Item Price
.shop-item__price {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
	align-items: center;
}

.price-label {
	font-size: var(--font-size-xs);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
}

// Purchase Actions
.shop-item__actions {
	margin-top: auto;
}

.shop-item__purchase-btn {
	width: 100%;
	min-height: var(--space-12);
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

// Legendary item special effects
.shop-item--legendary {
	.shop-item__icon {
		background: linear-gradient(135deg, #F59E0B, #FBBF24);
		color: white;
	}

	.shop-item__name {
		background: linear-gradient(135deg, #F59E0B, #FBBF24);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
}
</style>