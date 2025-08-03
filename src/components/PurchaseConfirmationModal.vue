<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import { RARITY_CONFIG } from '../config/shopConfig.js'
import Icon from './Icon.vue'
import CurrencyDisplay from './CurrencyDisplay.vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	item: {
		type: Object,
		default: null
	},
	purchaseSummary: {
		type: Object,
		default: null
	}
})

const emit = defineEmits(['confirm', 'cancel'])

const { t } = useI18n()

// Computed
const rarityConfig = computed(() => {
	if (!props.item) return RARITY_CONFIG.common
	return RARITY_CONFIG[props.item.rarity] || RARITY_CONFIG.common
})

const canAfford = computed(() => {
	return props.purchaseSummary?.canAfford || false
})

// Methods
const handleConfirm = () => {
	emit('confirm')
}

const handleCancel = () => {
	emit('cancel')
}

const handleOverlayClick = () => {
	emit('cancel')
}
</script>

<template>
	<Teleport to="body">
		<div
				v-if="visible && item"
				class="modal-overlay"
				@click="handleOverlayClick"
		>
			<div class="purchase-modal" @click.stop>
				<!-- Modal Header -->
				<div class="modal-header">
					<h3 class="modal-title">{{ t('shop.confirm_purchase') }}</h3>
				</div>

				<!-- Item Preview -->
				<div class="item-preview">
					<div class="preview-icon">
						<Icon :name="item.icon" size="48" />
					</div>

					<div class="preview-info">
						<h4 class="preview-name">{{ item.name }}</h4>
						<div
								class="preview-rarity"
								:style="{ color: rarityConfig.color }"
						>
							{{ t(`shop.rarities.${item.rarity}`) }}
						</div>
						<p class="preview-description">{{ item.description }}</p>
					</div>
				</div>

				<!-- Purchase Summary -->
				<div class="purchase-summary">
					<div class="summary-section">
						<h5 class="summary-title">{{ t('shop.item_cost') }}</h5>
						<CurrencyDisplay
								:coins="item.price.coins"
								:diamonds="item.price.diamonds"
								layout="horizontal"
								size="normal"
								variant="card"
								:format-numbers="true"
								:show-zero-values="false"
						/>
					</div>

					<div class="summary-section">
						<h5 class="summary-title">{{ t('shop.your_balance') }}</h5>
						<CurrencyDisplay
								:coins="purchaseSummary?.playerBalance.coins || 0"
								:diamonds="purchaseSummary?.playerBalance.diamonds || 0"
								layout="horizontal"
								size="normal"
								variant="card"
								:format-numbers="true"
						/>
					</div>

					<div class="summary-section">
						<h5 class="summary-title">{{ t('shop.after_purchase') }}</h5>
						<CurrencyDisplay
								:coins="purchaseSummary?.afterPurchase.coins || 0"
								:diamonds="purchaseSummary?.afterPurchase.diamonds || 0"
								layout="horizontal"
								size="normal"
								variant="card"
								:format-numbers="true"
								:class="{ 'balance-negative': !canAfford }"
						/>
					</div>
				</div>

				<!-- Warning for insufficient funds -->
				<div v-if="!canAfford" class="insufficient-funds-warning">
					<Icon name="warning" size="20" />
					<span>{{ t('shop.insufficient_funds') }}</span>
				</div>

				<!-- Modal Actions -->
				<div class="modal-actions">
					<button class="btn btn--ghost" @click="handleCancel">
						{{ t('common.cancel') }}
					</button>
					<button
							class="btn"
							:class="canAfford ? 'btn--primary' : 'btn--info'"
							:disabled="!canAfford"
							@click="handleConfirm"
					>
						<Icon name="trophy" size="16" />
						{{ t('shop.purchase_now') }}
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
.modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.75);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.2s ease;
}

.purchase-modal {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	border: 1px solid var(--card-border);
	max-width: 90%;
	width: 400px;
	box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
	animation: slideIn 0.3s ease;
	max-height: 90vh;
	overflow-y: auto;
}

.modal-header {
	padding: var(--space-4) var(--space-4) 0;
	text-align: center;
}

.modal-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.item-preview {
	padding: var(--space-4);
	display: flex;
	gap: var(--space-4);
	align-items: flex-start;
	border-bottom: 1px solid var(--card-border);
}

.preview-icon {
	width: var(--space-14);
	height: var(--space-14);
	border-radius: var(--border-radius-lg);
	background-color: var(--bg-secondary);
	display: flex;
	align-items: center;
	justify-content: center;
	color: var(--primary-color);
	flex-shrink: 0;
}

.preview-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.preview-name {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.preview-rarity {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
}

.preview-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.purchase-summary {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.summary-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.summary-title {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.balance-negative {
	opacity: 0.6;
}

.insufficient-funds-warning {
	margin: 0 var(--space-4);
	padding: var(--space-3);
	background-color: var(--error-light);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--error-color);
	display: flex;
	align-items: center;
	gap: var(--space-2);
	color: var(--error-color);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

.modal-actions {
	padding: var(--space-4);
	border-top: 1px solid var(--card-border);
	display: flex;
	gap: var(--space-3);
	justify-content: flex-end;
	background-color: var(--bg-secondary);
	border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
}

// Animations
@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateY(-20px) scale(0.95);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}
</style>