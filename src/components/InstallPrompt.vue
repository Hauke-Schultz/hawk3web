<script setup>
import { ref, onMounted } from 'vue'
import { useI18n } from '../composables/useI18n.js'
import Icon from './Icon.vue'

const { t } = useI18n()

const showInstallPrompt = ref(false)
const deferredPrompt = ref(null)
const isStandalone = ref(false)
const installReason = ref('')

// Safe navigator checks
const getUserAgent = () => {
	return typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : ''
}

const isIOSDevice = () => {
	const userAgent = getUserAgent()
	return /iPad|iPhone|iPod/.test(userAgent)
}

const isStandaloneModeActive = () => {
	if (typeof window === 'undefined') return false

	// Check various standalone indicators
	const matchMedia = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
	const navigatorStandalone = typeof navigator !== 'undefined' && navigator.standalone
	const androidApp = typeof document !== 'undefined' && document.referrer.includes('android-app://')

	return matchMedia || navigatorStandalone || androidApp
}

const checkStandalone = () => {
	isStandalone.value = isStandaloneModeActive()
	console.log('🔍 PWA Standalone check:', isStandalone.value)
}

const handleBeforeInstallPrompt = (e) => {
	console.log('💾 PWA install prompt available (Android/Desktop)')
	installReason.value = 'Browser triggered beforeinstallprompt'
	e.preventDefault()
	deferredPrompt.value = e

	if (!isStandalone.value) {
		showInstallPrompt.value = true
	}
}

const installApp = async () => {
	if (!deferredPrompt.value) return

	console.log('📱 Installing PWA...')
	deferredPrompt.value.prompt()

	const { outcome } = await deferredPrompt.value.userChoice
	console.log(`👤 PWA install outcome: ${outcome}`)

	if (outcome === 'accepted') {
		console.log('✅ PWA installed successfully')
	}

	deferredPrompt.value = null
	showInstallPrompt.value = false
}

const dismissInstall = () => {
	showInstallPrompt.value = false
	sessionStorage.setItem('pwa-dismissed', 'true')
	console.log('❌ PWA prompt dismissed')
}

const forceShowPrompt = () => {
	installReason.value = 'Manually triggered for testing'
	showInstallPrompt.value = true
	console.log('🔧 PWA prompt force-shown for testing')
}

onMounted(() => {
	// Guard against SSR or missing window
	if (typeof window === 'undefined') return

	checkStandalone()

	const wasDismissed = sessionStorage.getItem('pwa-dismissed')
	if (wasDismissed) {
		console.log('⏭️ PWA prompt skipped - dismissed this session')
		return
	}

	console.log('🚀 PWA InstallPrompt mounted')

	// Listen for install prompt
	window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

	// iOS detection with safe checks
	const isIOS = isIOSDevice()
	const isInStandaloneMode = isStandaloneModeActive()

	console.log('📱 Device check:', {
		isIOS,
		isInStandaloneMode,
		userAgent: getUserAgent(),
		hasNavigator: typeof navigator !== 'undefined'
	})

	if (isIOS && !isInStandaloneMode && !wasDismissed) {
		installReason.value = 'iOS device detected'
		console.log('🍎 iOS detected - showing install instructions after 3s')
		setTimeout(() => {
			showInstallPrompt.value = true
		}, 3000)
	}

	// DEBUG: Development mode test
	if (import.meta.env.DEV) {
		console.log('🔧 DEV mode - will show test prompt in 5s')
		setTimeout(() => {
			if (!showInstallPrompt.value && !wasDismissed) {
				forceShowPrompt()
			}
		}, 5000)
	}

	// Expose debug function globally (safe check)
	if (typeof window !== 'undefined') {
		window.showPWAPrompt = forceShowPrompt
	}
})
</script>

<template>
	<Teleport to="body">
		<div v-if="showInstallPrompt" class="install-prompt-overlay">
			<div class="install-prompt">
				<div class="install-header">
					<div class="hawk-logo">🦅</div>
					<div>
						<h3 class="install-title">{{ t('pwa.install_title') }}</h3>
					</div>
				</div>

				<p class="install-message">{{ t('pwa.install_message') }}</p>

				<!-- iOS specific instructions -->
				<div v-if="isIOSDevice()" class="ios-instructions">
					<p><strong>{{ t('pwa.ios_instructions') }}</strong></p>
					<div class="ios-steps">
						<div>1. {{ t('pwa.ios_step1') }} <span class="share-icon">⬆️</span></div>
						<div>2. {{ t('pwa.ios_step2') }} <span class="add-icon">➕</span></div>
					</div>
				</div>

				<!-- Android/Desktop instructions -->
				<div v-else class="android-instructions">
					<p>{{ t('pwa.android_instructions') }}</p>
				</div>

				<div class="install-actions">
					<button class="btn btn--ghost" @click="dismissInstall">
						{{ t('common.cancel') }}
					</button>
					<button
							v-if="deferredPrompt"
							class="btn btn--primary"
							@click="installApp"
					>
						📱 {{ t('pwa.install_button') }}
					</button>
					<button
							v-else
							class="btn btn--info"
							@click="dismissInstall"
					>
						👍 {{ t('common.ok') }}
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
.install-prompt-overlay {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.8);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	animation: fadeIn 0.3s ease;
}

.install-prompt {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	border: 1px solid var(--card-border);
	max-width: 90%;
	width: 360px;
	padding: var(--space-6);
	box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.5);
	animation: slideIn 0.4s ease;
}

.install-header {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	margin-bottom: var(--space-4);
}

.hawk-logo {
	font-size: 2rem;
	filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
}

.install-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.debug-reason {
	font-size: var(--font-size-xs);
	color: var(--text-muted);
	font-style: italic;
}

.install-message {
	color: var(--text-secondary);
	margin-bottom: var(--space-4);
	line-height: 1.5;
}

.ios-instructions, .android-instructions {
	background-color: var(--bg-secondary);
	padding: var(--space-3);
	border-radius: var(--border-radius-md);
	margin-bottom: var(--space-4);
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
}

.ios-steps {
	margin-top: var(--space-2);
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.ios-steps div {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.share-icon, .add-icon {
	font-size: 1.2rem;
	margin-left: var(--space-2);
}

.install-actions {
	display: flex;
	gap: var(--space-3);
	justify-content: flex-end;
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