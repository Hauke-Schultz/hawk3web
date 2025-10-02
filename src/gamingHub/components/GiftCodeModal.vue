<script setup>
import { ref, computed } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	giftData: {
		type: Object,
		default: null
	}
})

const emit = defineEmits(['mark-received', 'close'])

const { t } = useI18n()

const giftReceived = computed(() => {
	return props.giftData?.received || false
})

const copyGiftCode = async () => {
	if (props.giftData?.code) {
		try {
			await navigator.clipboard.writeText(props.giftData.code)
			console.log('Gift code copied:', props.giftData.code)
		} catch (error) {
			console.error('Failed to copy gift code:', error)
		}
	}
}

const handleMarkReceived = () => {
	emit('mark-received')
}

const handleUnmarkReceived = () => {
	emit('unmark-received')
}

const handleClose = () => {
	emit('close')
}
</script>

<template>
	<Teleport to="body">
		<div
				v-if="visible && giftData"
				class="gift-code-modal-overlay"
				@click="handleClose"
		>
			<div
					class="gift-code-modal"
					@click.stop
					role="dialog"
					aria-modal="true"
			>
				<!-- Modal Header -->
				<div class="modal-header">
					<h3 class="modal-title">
						<Icon name="mail" size="24" />
						{{ t('shop.gifts.sent_gift_details') }}
					</h3>
					<button
							class="modal-close-btn"
							@click="handleClose"
							:aria-label="t('common.close')"
					>
						<Icon name="close" size="20" />
					</button>
				</div>

				<!-- Modal Content -->
				<div class="modal-content">
					<!-- Gift Item Display -->
					<div class="gift-item-display">
						<div class="gift-item-icon">
							<span class="gift-emoji">{{ giftData.itemIcon }}</span>
						</div>
						<div class="gift-item-info">
							<h4>{{ giftData.itemName }}</h4>
							<p>{{ t('shop.gifts.sent_on', { date: new Date(giftData.createdAt).toLocaleDateString() }) }}</p>
						</div>
						<div class="gift-status-icon">
							<Icon
									:name="giftReceived ? 'completion-badge' : 'mail'"
									size="24"
									:class="giftReceived ? 'text-success' : 'text-warning'"
							/>
						</div>
					</div>

					<!-- Gift Code Section -->
					<div v-if="!giftReceived" class="gift-code-section">
						<label class="code-label">{{ t('shop.gifts.gift_code') }}</label>
						<div class="gift-code-display">
							<code class="gift-code">{{ giftData.code }}</code>
							<button
									class="btn btn--ghost btn--small"
									@click="copyGiftCode"
							>
								<Icon name="document" size="16" />
								{{ t('shop.gifts.copy_code') }}
							</button>
						</div>
					</div>

					<!-- Reception Status -->
					<div class="reception-status">
						<div class="status-header">
							<Icon name="info" size="20" />
							<h4>{{ t('shop.gifts.reception_status') }}</h4>
						</div>

						<div v-if="giftReceived" class="status-received">
							<label class="checkbox-label">
								<input
									type="checkbox"
									@change="handleUnmarkReceived"
									class="status-checkbox"
									checked="checked"
								/>
								<span>{{ t('shop.gifts.gift_was_received') }}</span>
							</label>
							<small>{{ t('shop.gifts.marked_on', {
								date: new Date(giftData.receivedAt).toLocaleDateString()
							}) }}</small>
						</div>

						<div v-else class="status-pending">
							<div class="checkbox-container">
								<label class="checkbox-label">
									<input
										type="checkbox"
										@change="handleMarkReceived"
										class="status-checkbox"
									/>
									<span>{{ t('shop.gifts.mark_as_received') }}</span>
								</label>
							</div>
							<p class="status-note">
								{{ t('shop.gifts.mark_received_note') }}
							</p>
						</div>
					</div>

					<!-- Expiration Info -->
					<div v-if="!giftReceived" class="expiration-info">
						<Icon name="info" size="16" />
						<span>{{ t('shop.gifts.expires_on', {
							date: new Date(giftData.expiresAt).toLocaleDateString()
						}) }}</span>
					</div>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
.gift-code-modal-overlay {
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

.gift-code-modal {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	border: 1px solid var(--card-border);
	max-width: 90%;
	width: 420px;
	box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
	animation: slideIn 0.3s ease;
	max-height: 90vh;
	overflow-y: auto;
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-4);
	border-bottom: 1px solid var(--card-border);
}

.modal-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
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

.modal-content {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
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
	width: var(--space-12);
	height: var(--space-12);
	background-color: var(--card-bg);
	border-radius: var(--border-radius-lg);
	border: 2px solid var(--card-border);
	display: flex;
	align-items: center;
	justify-content: center;
}

.gift-emoji {
	font-size: var(--font-size-2xl);
}

.gift-item-info {
	flex: 1;
}

.gift-item-info h4 {
	margin: 0 0 var(--space-1) 0;
	font-size: var(--font-size-base);
	color: var(--text-color);
}

.gift-item-info p {
	margin: 0;
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
}

.gift-status-icon {
	display: flex;
	align-items: center;
}

.text-success {
	color: var(--success-color);
}

.text-warning {
	color: var(--warning-color);
}

.gift-code-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.code-label {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.gift-code-display {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
	border: 2px solid var(--primary-color);
}

.gift-code {
	flex: 1;
	font-family: 'Courier New', monospace;
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--primary-color);
	letter-spacing: 1px;
}

.reception-status {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.status-header {
	display: flex;
	align-items: center;
	gap: var(--space-2);
}

.status-header h4 {
	margin: 0;
	font-size: var(--font-size-base);
	color: var(--text-color);
}

.status-received {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--success-color);
	color: white;
	border-radius: var(--border-radius-md);
	flex-wrap: wrap;
}

.status-received small {
	width: 100%;
	opacity: 0.9;
	font-style: italic;
}

.status-pending {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.checkbox-container {
	display: flex;
	align-items: center;
}

.checkbox-label {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	cursor: pointer;
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.status-checkbox {
	width: 18px;
	height: 18px;
	cursor: pointer;
}

.status-note {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	font-style: italic;
}

.expiration-info {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--warning-color);
	color: white;
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
}

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