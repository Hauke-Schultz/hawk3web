<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import { apiService } from '../services/apiService.js'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	giftData: {
		type: Object,
		default: null
	},
	mode: {
		type: String,
		default: 'view',
		validator: (value) => ['view', 'send', 'success'].includes(value)
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

const emit = defineEmits(['mark-received', 'unmark-received', 'close', 'confirm'])

const { t } = useI18n()

const isProcessing = ref(false)
const giftReceived = computed(() => {
	return props.giftData?.received || false
})

// User selection for sending gifts
const availableUsers = ref([])
const selectedUser = ref(null)
const isLoadingUsers = ref(false)

const modalTitle = computed(() => {
	if (props.mode === 'send') {
		return t('shop.gifts.send_gift')
	}
	if (props.mode === 'success') {
		return t('shop.gifts.gift_sent_successfully')
	}
	return t('shop.gifts.sent_gift_details')
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

const shareGiftLink = async () => {
	if (props.giftData?.code) {
		const baseUrl = window.location.origin
		const giftUrl = `${baseUrl}/shop/redeem/${props.giftData.code}`

		try {
			await navigator.clipboard.writeText(giftUrl)
			console.log('Gift link copied:', giftUrl)
		} catch (error) {
			console.error('Failed to copy gift link:', error)
		}
	}
}

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

const isUpdating = ref(false)

const handleMarkReceived = async () => {
	isUpdating.value = true
	try {
		emit('mark-received')
		// Short delay for better UX feedback
		await new Promise(resolve => setTimeout(resolve, 300))
	} finally {
		isUpdating.value = false
	}
}

const handleUnmarkReceived = async () => {
	isUpdating.value = true
	try {
		emit('unmark-received')
		// Short delay for better UX feedback
		await new Promise(resolve => setTimeout(resolve, 300))
	} finally {
		isUpdating.value = false
	}
}

const handleClose = () => {
	emit('close')
}

const loadAvailableUsers = async () => {
	isLoadingUsers.value = true
	try {
		const response = await apiService.getUserStats()
		if (response.users) {
			// Filter out current user
			const currentUsername = localStorage.getItem('hawk3_current_username')
			availableUsers.value = response.users
				.filter(user => user.username !== currentUsername)
				.map(user => ({
					username: user.username,
					level: user.level || 0,
					totalScore: user.totalScore || 0
				}))
		}
	} catch (error) {
		console.error('Failed to load users:', error)
		availableUsers.value = []
	} finally {
		isLoadingUsers.value = false
	}
}

const handleFinalConfirm = async () => {
	if (props.mode === 'send' && !selectedUser.value) {
		return
	}

	isProcessing.value = true
	try {
		await emit('confirm', {
			item: props.item,
			recipientUsername: selectedUser.value
		})
	} finally {
		isProcessing.value = false
	}
}

// Load users when modal opens in send mode
watch(() => props.visible, (newVal) => {
	if (newVal && props.mode === 'send') {
		loadAvailableUsers()
		selectedUser.value = null
	}
})
</script>

<template>
	<Teleport to="body">
		<div
				v-if="visible"
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

				<!-- Modal Content - Send Mode -->
				<div v-if="mode === 'send' && item" class="modal-content">
					<!-- Gift Preview -->
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
						</div>
					</div>

					<!-- User Selection Dropdown -->
					<div class="user-selection-section">
						<label class="selection-label">
							<Icon name="users" size="20" />
							{{ t('shop.gifts.select_recipient') }}
						</label>

						<div v-if="isLoadingUsers" class="loading-state">
							<Icon name="loading" size="20" class="icon-spin" />
							<span>{{ t('common.loading') }}</span>
						</div>

						<select
							v-else
							v-model="selectedUser"
							class="user-select"
							:disabled="availableUsers.length === 0"
						>
							<option :value="null" disabled>
								{{ availableUsers.length === 0 ? t('shop.gifts.no_users_available') : t('shop.gifts.choose_user') }}
							</option>
							<option
								v-for="user in availableUsers"
								:key="user.username"
								:value="user.username"
							>
								{{ user.username }} (Level {{ user.level }})
							</option>
						</select>
					</div>

					<!-- Gift Information -->
					<div class="share-instructions">
						<h4><Icon name="info" size="20" /> {{ t('shop.gifts.direct_send_info') }}</h4>
						<ul class="info-list">
							<li>{{ t('shop.gifts.direct_send_step1') }}</li>
							<li>{{ t('shop.gifts.direct_send_step2') }}</li>
							<li>{{ t('shop.gifts.one_gift_per_day') }}</li>
						</ul>
					</div>
				</div>

				<!-- Modal Content - Success Mode -->
				<div v-else-if="mode === 'success' && giftData" class="modal-content">
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
							<Icon name="heart" size="24" class="text-success" />
						</div>
					</div>

					<!-- Gift Code Section -->
					<div class="gift-code-section">
						<div class="gift-code-display">
							<code class="gift-code">{{ giftData.code }}</code>
							<div class="gift-actions">
								<button
										class="btn btn--ghost btn--small"
										@click="copyGiftCode"
								>
									<Icon name="document" size="16" />
									{{ t('shop.gifts.copy_code') }}
								</button>
								<button
										class="btn btn--primary btn--small"
										@click="shareGiftLink"
								>
									<Icon name="heart" size="16" />
									{{ t('shop.gifts.share_link') }}
								</button>
							</div>
						</div>
					</div>

					<!-- Share Instructions -->
					<div class="share-instructions">
						<h4>{{ t('shop.gifts.share_instructions') }}</h4>
						<h5><Icon name="info" size="16" /> {{ t('shop.gifts.expires_on', {
							date: new Date(giftData.expiresAt).toLocaleDateString()
						}) }}</h5>
					</div>
				</div>

				<!-- Modal Content - View Mode -->
				<div v-else-if="mode === 'view' && giftData" class="modal-content">
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
						<div class="gift-code-display">
							<code class="gift-code">{{ giftData.code }}</code>
							<div class="gift-actions">
								<button
										class="btn btn--ghost btn--small"
										@click="copyGiftCode"
								>
									<Icon name="document" size="16" />
									{{ t('shop.gifts.copy_code') }}
								</button>
								<button
										class="btn btn--primary btn--small"
										@click="shareGiftLink"
								>
									<Icon name="heart" size="16" />
									{{ t('shop.gifts.share_link') }}
								</button>
							</div>
						</div>
					</div>

					<!-- Reception Status -->
					<div class="reception-status">
						<div v-if="giftReceived" class="status-received">
							<label class="checkbox-label" :class="{ 'checkbox-label--disabled': isUpdating }">
								<input
										type="checkbox"
										@change="handleUnmarkReceived"
										class="status-checkbox"
										checked="checked"
										:disabled="isUpdating"
								/>
								<Icon v-if="isUpdating" name="loading" size="14" class="icon-spin" />
								<span>{{ t('shop.gifts.gift_was_received') }}</span>
							</label>
							<small>{{ t('shop.gifts.marked_on', {
								date: new Date(giftData.receivedAt).toLocaleDateString()
							}) }}</small>
							<span>
								<Icon name="info" size="16" /> {{ t('shop.gifts.item_removed_from_inventory') }}
							</span>
						</div>

						<div v-else class="status-pending">
							<div class="checkbox-container">
								<label class="checkbox-label" :class="{ 'checkbox-label--disabled': isUpdating }">
									<input
											type="checkbox"
											@change="handleMarkReceived"
											class="status-checkbox"
											:disabled="isUpdating"
									/>
									<Icon v-if="isUpdating" name="loading" size="14" class="icon-spin" />
									<span>{{ t('shop.gifts.mark_as_received') }}</span>
								</label>
							</div>
						</div>
					</div>

					<!-- Expiration Info -->
					<div v-if="!giftReceived" class="share-instructions">
						<h4>{{ t('shop.gifts.mark_received_note') }}</h4>
						<h5><Icon name="info" size="16" /> {{ t('shop.gifts.item_will_be_removed') }}</h5>
						<h5><Icon name="info" size="16" /> {{ t('shop.gifts.expires_on', { date: new Date(giftData.expiresAt).toLocaleDateString() }) }}</h5>
					</div>
				</div>

				<!-- Modal Actions - Send Mode -->
				<div v-if="mode === 'send'" class="modal-actions">
					<button
							class="btn btn--ghost"
							@click="handleClose"
							:disabled="isProcessing"
					>
						{{ t('common.cancel') }}
					</button>

					<button
							class="btn btn--warning"
							@click="handleFinalConfirm"
							:disabled="isProcessing || !selectedUser || isLoadingUsers"
							:class="{ 'btn--loading': isProcessing }"
					>
						<Icon v-if="isProcessing" name="loading" size="16" class="icon-spin" />
						{{ isProcessing ? t('shop.gifts.sending_gift') : t('shop.gifts.send_now') }}
					</button>
				</div>

				<!-- Modal Actions - Success Mode -->
				<div v-else-if="mode === 'success'" class="modal-actions">
					<button class="btn btn--primary" @click="handleClose">
						{{ t('common.close') }}
					</button>
				</div>

				<!-- Modal Actions - View Mode -->
				<div v-else class="modal-actions">
					<button class="btn btn--ghost" @click="handleClose">
						{{ t('common.close') }}
					</button>
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

.gift-code-display {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
	border: 2px solid var(--primary-color);
}

.gift-actions {
	display: flex;
	gap: var(--space-2);
	width: 100%;
}

.gift-actions .btn {
	flex: 1; // Buttons gleich breit
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

.gift-preview {
	display: flex;
	gap: var(--space-3);
	align-items: center;
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-lg);
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

.share-instructions {
	display: flex;
	align-items: flex-start;
	flex-direction: column;
	gap: var(--space-2);
	padding: var(--space-3);
	background-color: var(--info-color);
	color: white;
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);

	h4, h5 {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: var(--space-2);
		margin: 0;
	}

	h5 {
		font-size: var(--font-size-xs);
		font-weight: var(--font-weight-normal);
	}
}

.info-list {
	margin: 0;
	padding-left: var(--space-6);
}

.user-selection-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.selection-label {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
}

.user-select {
	width: 100%;
	padding: var(--space-3);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-md);
	color: var(--text-color);
	font-size: var(--font-size-base);
	font-family: var(--font-family-base);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(:disabled) {
		border-color: var(--primary-color);
	}

	&:focus {
		outline: none;
		border-color: var(--primary-color);
		box-shadow: 0 0 0 0.125rem rgba(79, 70, 229, 0.25);
	}

	&:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	option {
		background-color: var(--card-bg);
		color: var(--text-color);
		padding: var(--space-2);
	}
}

.loading-state {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: var(--space-2);
	padding: var(--space-4);
	color: var(--text-secondary);
	font-size: var(--font-size-sm);
}

.btn--loading {
	opacity: 0.8;
	cursor: wait;
}

.checkbox-label--disabled {
	opacity: 0.6;
	cursor: wait;
}

.inventory-note {
	display: flex;
	align-items: center;
	gap: var(--space-1);
	font-size: var(--font-size-xs);
	color: var(--info-color);
	font-style: italic;
	margin-top: var(--space-1);
}

.icon-spin {
	animation: spin 1s linear infinite;
}

@keyframes spin {
	from { transform: rotate(0deg); }
	to { transform: rotate(360deg); }
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