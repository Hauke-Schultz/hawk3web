<script setup>
import { ref, computed, nextTick } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import { GIFT_CONFIG } from '../config/giftConfig.js'
import Icon from '../../components/Icon.vue'

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
	}
})

const emit = defineEmits([
	'confirm',
	'cancel',
	'close'
])

const { t } = useI18n()

// State
const isConfirming = ref(false)
const showConfirmation = ref(false)

// Computed properties
const giftExpiration = computed(() => {
	return GIFT_CONFIG.giftCodeExpirationDays
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

// Methods
const handleFirstConfirm = () => {
	showConfirmation.value = true
}

const handleFinalConfirm = async () => {
	isConfirming.value = true

	try {
		await nextTick()
		emit('confirm', props.item)
	} catch (error) {
		console.error('Gift sending error:', error)
	} finally {
		isConfirming.value = false
		showConfirmation.value = false
	}
}

const handleCancel = () => {
	showConfirmation.value = false
	emit('cancel')
	emit('close')
}

const handleOverlayClick = () => {
	if (!showConfirmation.value) {
		handleCancel()
	}
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
				class="gift-modal-overlay"
				@click="handleOverlayClick"
				@keydown="handleKeyDown"
				tabindex="-1"
		>
			<div
					class="gift-modal"
					@click.stop
					role="dialog"
					aria-modal="true"
					:aria-labelledby="t('shop.gifts.send_gift')"
			>
				<!-- Modal Header -->
				<div class="modal-header">
					<div class="header-content">
						<Icon name="heart" size="24" />
						<h3 class="modal-title">
							{{ showConfirmation ? t('shop.gifts.confirm_send') : t('shop.gifts.send_gift') }}
						</h3>
					</div>
					<button
							class="modal-close-btn"
							@click="handleCancel"
							:aria-label="t('common.close')"
					>
						<Icon name="close" size="20" />
					</button>
				</div>

				<!-- Initial Gift Preview -->
				<div v-if="!showConfirmation" class="modal-content">
					<!-- Item Preview -->
					<div class="gift-preview">
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

					<!-- Gift Information -->
					<div class="gift-info">
						<div class="info-section">
							<Icon name="info" size="20" />
							<div class="info-content">
								<h4>{{ t('shop.gifts.how_it_works') }}</h4>
								<ul class="info-list">
									<li>{{ t('shop.gifts.info_step1') }}</li>
									<li>{{ t('shop.gifts.info_step2') }}</li>
									<li>{{ t('shop.gifts.info_step3') }}</li>
								</ul>
							</div>
						</div>

						<div class="warning-section">
							<Icon name="clock" size="20" />
							<span>{{ t('shop.gifts.gift_expires_in', { days: giftExpiration }) }}</span>
						</div>
					</div>
				</div>

				<!-- Confirmation Step -->
				<div v-else class="modal-content confirmation-content">
					<div class="confirmation-icon">
						<Icon name="heart" size="48" />
					</div>

					<div class="confirmation-text">
						<h4>{{ t('shop.gifts.final_confirmation') }}</h4>
						<p>{{ t('shop.gifts.final_confirmation_text', { itemName: item.name }) }}</p>
					</div>

					<div class="confirmation-warnings">
						<div class="warning-item">
							<Icon name="info" size="16" />
							<span>{{ t('shop.gifts.one_gift_per_day') }}</span>
						</div>
						<div class="warning-item">
							<Icon name="clock" size="16" />
							<span>{{ t('shop.gifts.expires_warning', { days: giftExpiration }) }}</span>
						</div>
					</div>
				</div>

				<!-- Modal Actions -->
				<div class="modal-actions">
					<button
							class="btn btn--ghost"
							@click="handleCancel"
							:disabled="isConfirming"
					>
						{{ t('common.cancel') }}
					</button>

					<button
							v-if="!showConfirmation"
							class="btn btn--success"
							@click="handleFirstConfirm"
					>
						<Icon name="heart" size="16" />
						{{ t('shop.gifts.prepare_gift') }}
					</button>

					<button
							v-else
							class="btn btn--warning"
							@click="handleFinalConfirm"
							:disabled="isConfirming"
					>
						<Icon v-if="!isConfirming" name="heart" size="16" />
						<Icon v-else name="loading" size="16" class="icon-spin" />
						{{ isConfirming ? t('shop.gifts.creating_gift') : t('shop.gifts.send_now') }}
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
// Modal Overlay
.gift-modal-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 1000;
	animation: fadeIn 0.2s ease;
}

// Modal Container
.gift-modal {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	border: 1px solid var(--success-color);
	box-shadow: 0 0 20px rgba(16, 185, 129, 0.3);
	max-width: 90%;
	width: 420px;
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
	background: linear-gradient(135deg, var(--success-color), var(--success-hover));
	color: white;
	border-radius: var(--border-radius-xl) var(--border-radius-xl) 0 0;
}

.header-content {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.modal-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	margin: 0;
}

.modal-close-btn {
	background: none;
	border: none;
	color: white;
	cursor: pointer;
	padding: var(--space-1);
	border-radius: var(--border-radius-sm);
	transition: all 0.2s ease;

	&:hover {
		background-color: rgba(255, 255, 255, 0.2);
	}
}

// Modal Content
.modal-content {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

// Gift Preview
.gift-preview {
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
}

.item-emoji {
	font-size: var(--font-size-2xl);
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

// Gift Information
.gift-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.info-section {
	display: flex;
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--info-color);
	color: white;
	border-radius: var(--border-radius-lg);
}

.info-content {
	flex: 1;
}

.info-content h4 {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	margin: 0 0 var(--space-2) 0;
}

.info-list {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: var(--space-1);
}

.info-list li {
	font-size: var(--font-size-sm);
	opacity: 0.9;
	position: relative;
	padding-left: var(--space-3);
}

.info-list li::before {
	content: '•';
	position: absolute;
	left: 0;
	color: rgba(255, 255, 255, 0.7);
}

.warning-section {
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

// Confirmation Content
.confirmation-content {
	text-align: center;
	align-items: center;
}

.confirmation-icon {
	color: var(--success-color);
	margin-bottom: var(--space-2);
}

.confirmation-text {
	margin-bottom: var(--space-4);
}

.confirmation-text h4 {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.confirmation-text p {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.confirmation-warnings {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.warning-item {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	color: var(--warning-color);
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
	min-width: 120px;
}

// Loading Animation
.icon-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
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
	.gift-modal {
		width: calc(100vw - 2 * var(--space-4));
		margin: var(--space-4);
	}

	.modal-actions {
		flex-direction: column;
	}

	.modal-actions .btn {
		width: 100%;
	}

	.gift-preview {
		flex-direction: column;
		text-align: center;
	}
}
</style>