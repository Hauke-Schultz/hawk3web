<script setup>
import { computed } from 'vue'
import { useI18n } from '../composables/useI18n.js'
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
	playerBalance: {
		type: Object,
		default: () => ({ coins: 0, diamonds: 0 })
	},
	type: {
		type: String,
		default: 'purchase', // 'purchase', 'insufficient', 'owned'
		validator: (value) => ['purchase', 'insufficient', 'owned'].includes(value)
	}
})

const emit = defineEmits([
	'confirm',
	'cancel',
	'close'
])

const { t } = useI18n()

// Computed properties for modal content
const modalConfig = computed(() => {
	if (!props.item) return {}

	switch (props.type) {
		case 'purchase':
			const isConsumable = props.item.type === 'consumable'
			return {
				title: t('shop.buy_item'),
				message: isConsumable ? t('shop.buy_consumable_confirm') : t('shop.buy_confirm'),
				confirmText: t('shop.buy_now'),
				confirmVariant: 'success',
			}
		case 'insufficient':
			return {
				title: t('shop.cant_afford'),
				message: t('shop.insufficient_funds_message'),
				confirmText: t('common.ok'),
				confirmVariant: 'info',
				hideCancel: true
			}
		case 'owned':
			return {
				title: t('shop.already_owned'),
				message: t('shop.already_owned_message'),
				confirmText: t('common.ok'),
				confirmVariant: 'info',
				hideCancel: true
			}
		default:
			return {}
	}
})

const canAfford = computed(() => {
	if (!props.item || !props.playerBalance) return false

	return props.playerBalance.coins >= props.item.price.coins &&
			props.playerBalance.diamonds >= props.item.price.diamonds
})

const rarityConfig = computed(() => {
	if (!props.item) return {}

	const rarities = {
		common: { color: '#6B7280', borderColor: '#9CA3AF' },
		uncommon: { color: '#10B981', borderColor: '#34D399' },
		rare: { color: '#3B82F6', borderColor: '#60A5FA' },
		epic: { color: '#8B5CF6', borderColor: '#A78BFA' },
		legendary: { color: '#F59E0B', borderColor: '#FBBF24' }
	}

	return rarities[props.item.rarity] || rarities.common
})

// Event handlers
const handleConfirm = () => {
	emit('confirm')
}

const handleCancel = () => {
	emit('cancel')
	emit('close')
}

const handleOverlayClick = () => {
	emit('cancel')
	emit('close')
}

const handleKeyDown = (event) => {
	if (event.key === 'Escape') {
		handleCancel()
	}
}
</script>

<template>
	<Teleport to="body">
		<div
				v-if="visible && item"
				class="shop-modal-overlay"
				@click="handleOverlayClick"
				@keydown="handleKeyDown"
				tabindex="-1"
		>
			<div
					class="shop-modal"
					@click.stop
					role="dialog"
					aria-modal="true"
					:aria-labelledby="modalConfig.title"
			>
				<!-- Modal Header -->
				<div class="modal-header">
					<h3 class="modal-title">{{ modalConfig.title }}</h3>
					<button
							class="modal-close-btn"
							@click="handleCancel"
							:aria-label="t('common.close')"
					>
						<Icon name="close" size="20" />
					</button>
				</div>

				<!-- Modal Content -->
				<div class="modal-content">
					<!-- Item Display -->
					<div class="item-preview">
						<div
								class="item-icon"
								:style="{
                borderColor: rarityConfig.borderColor,
                backgroundColor: `${rarityConfig.color}20`
              }"
						>
							<span class="item-emoji">{{ item.icon }}</span>
						</div>

						<div class="item-details">
							<h4 class="item-name">{{ item.name }}</h4>
							<p class="item-description">{{ item.description }}</p>
							<div class="item-rarity" :style="{ color: rarityConfig.color }">
								{{ t(`shop.rarities.${item.rarity}`) }}
							</div>
						</div>
					</div>
					<!-- Price Display -->
					<div class="price-section">
						<CurrencyDisplay
								:coins="item.price.coins"
								:diamonds="item.price.diamonds"
								layout="horizontal"
								size="large"
								variant="default"
								:show-zero-values="true"
						/>
					</div>

					<!-- Insufficient Funds Warning -->
					<div v-if="type === 'insufficient'" class="warning-section">
						<Icon name="info" size="20" />
						<span>{{ t('shop.earn_more_currency') }}</span>
					</div>
				</div>

				<!-- Modal Actions -->
				<div class="modal-actions">
					<button
						v-if="!modalConfig.hideCancel"
						class="btn btn--ghost"
						@click="handleCancel"
					>
						{{ t('common.cancel') }}
					</button>

					<button
						class="btn"
						:class="`btn--${modalConfig.confirmVariant}`"
						@click="handleConfirm"
						:disabled="type === 'purchase' && !canAfford"
					>
						{{ modalConfig.confirmText }}
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
// Modal Overlay
.shop-modal-overlay {
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

// Modal Container
.shop-modal {
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

// Modal Header
.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-4);
	border-bottom: 1px solid var(--card-border);
}

.modal-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.modal-close-btn {
	background: none;
	border: none;
	color: var(--text-secondary);
	cursor: pointer;
	padding: var(--space-1);
	border-radius: var(--border-radius-sm);
	transition: all 0.2s ease;

	&:hover {
		background-color: var(--card-bg-hover);
		color: var(--text-color);
	}
}

// Modal Content
.modal-content {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

// Item Preview
.item-preview {
	display: flex;
	gap: var(--space-3);
	align-items: center;
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
}

.item-icon {
	width: var(--space-12);
	height: var(--space-12);
	border-radius: var(--border-radius-lg);
	border: 2px solid;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	padding: var(--space-8);
}

.item-emoji {
	font-size: var(--font-size-4xl);
	line-height: 1;
}

.item-details {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.item-name {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.item-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.item-rarity {
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
	letter-spacing: 0.05em;
}

// Modal Message
.modal-message {
	text-align: center;
}

.modal-message p {
	font-size: var(--font-size-base);
	color: var(--text-color);
	margin: 0;
	line-height: 1.4;
}

// Price Sections
.price-section {
	display: flex;
	flex-direction: column;
	align-items: flex-end;
	gap: var(--space-2);
}

.price-label {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
}

// Warning Section
.warning-section {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--warning-color);
	color: white;
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

// Modal Actions
.modal-actions {
	padding: var(--space-4);
	border-top: 1px solid var(--card-border);
	display: flex;
	gap: var(--space-3);
	justify-content: flex-end;
	background-color: var(--bg-secondary);
	border-radius: 0 0 var(--border-radius-xl) var(--border-radius-xl);
}

.modal-actions .btn {
	min-width: 100px;
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

// Responsive adjustments
@media (max-width: 375px) {
	.shop-modal {
		width: calc(100vw - 2 * var(--space-4));
		margin: var(--space-4);
	}

	.modal-actions {
		flex-direction: column;
	}

	.modal-actions .btn {
		width: 100%;
	}
}
</style>