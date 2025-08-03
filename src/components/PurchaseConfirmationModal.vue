<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
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

// Check if player can afford the item
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
						{{ item.icon }}
					</div>

					<div class="preview-info">
						<h4 class="preview-name">{{ item.name }}</h4>
						<p class="preview-description">{{ item.description }}</p>
					</div>
				</div>

				<!-- Simple Price Display -->
				<div class="price-section">
					<div class="price-label">{{ t('shop.price') }}</div>
					<CurrencyDisplay
							:coins="item.price.coins"
							:diamonds="item.price.diamonds"
							layout="horizontal"
							size="large"
							variant="card"
							:format-numbers="true"
							:show-zero-values="false"
					/>
				</div>

				<!-- Warning for insufficient funds -->
				<div v-if="!canAfford" class="insufficient-funds-warning">
					⚠️ {{ t('shop.insufficient_funds') }}
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
	width: 350px;
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
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);
	border-bottom: 1px solid var(--card-border);
}

.preview-icon {
	font-size: 64px;
	line-height: 1;
}

.preview-info {
	text-align: center;
}

.preview-name {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.preview-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.price-section {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-2);
}

.price-label {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
}

.insufficient-funds-warning {
	margin: 0 var(--space-4);
	padding: var(--space-3);
	background-color: var(--error-light);
	border-radius: var(--border-radius-md);
	border: 1px solid var(--error-color);
	text-align: center;
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