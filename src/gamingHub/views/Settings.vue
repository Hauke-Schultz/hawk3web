<script setup>
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useLocalStorage } from '../composables/useLocalStorage.js'
import { useScreenshot } from '../composables/useScreenshot.js'
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'
import ConfirmationModal from '../components/ConfirmationModal.vue'
import Header from "../components/Header.vue"
import InstallPrompt from "../../components/InstallPrompt.vue"

// Props
const props = defineProps({
	currentTheme: {
		type: String,
		default: 'dark'
	}
})

// Emits
const emit = defineEmits(['theme-change', 'font-size-change', 'language-change', 'back', 'menu-click'])

// LocalStorage service
const { gameData, clearStorage, updateSettings, downloadData, uploadData } = useLocalStorage()

// Screenshot service
const { clearAllScreenshots } = useScreenshot()

// Internationalization
const { t, currentLanguage, availableLanguages, setLanguage } = useI18n()
const router = useRouter()

// State
const selectedTheme = ref(props.currentTheme)
const selectedLanguage = ref(currentLanguage.value)
const selectedFontSize = ref(gameData.settings.fontSize || 'small')
const isDeleteUnlocked = ref(false)
const showDeleteConfirmation = ref(false)

// Data Export/Import State
const fileInput = ref(null)
const importStatus = ref(null)
const exportStatus = ref(null)

// PWA Install State
const showInstallPrompt = ref(false)

// Theme options
const themeOptions = [
	{ value: 'dark', label: () => t('settings.themes.dark') },
	{ value: 'light', label: () => t('settings.themes.light') },
	{ value: 'system', label: () => t('settings.themes.system') }
]

const fontSizeOptions = [
	{ value: 'small', label: () => t('settings.font_sizes.small') },
	{ value: 'medium', label: () => t('settings.font_sizes.medium') },
	{ value: 'large', label: () => t('settings.font_sizes.large') }
]

// PWA Install methods
const showInstallOptions = () => {
	showInstallPrompt.value = true
}

const closeInstallPrompt = () => {
	showInstallPrompt.value = false
}

// Check if PWA is already installed
const isPWAInstalled = () => {
	// SSR-safe: Check if window is available (browser only)
	if (typeof window === 'undefined') {
		return false
	}

	// Check various standalone indicators
	const matchMedia = window.matchMedia && window.matchMedia('(display-mode: standalone)').matches
	const navigatorStandalone = typeof navigator !== 'undefined' && navigator.standalone
	const androidApp = typeof document !== 'undefined' && document.referrer.includes('android-app://')

	return matchMedia || navigatorStandalone || androidApp
}

// Watch for prop changes
watch(() => props.currentTheme, (newTheme) => {
	selectedTheme.value = newTheme
})

// Watch for language changes
watch(currentLanguage, (newLang) => {
	selectedLanguage.value = newLang
})

watch(() => gameData.settings.fontSize, (newSize) => {
	selectedFontSize.value = newSize || 'medium'
})

// Methods
const selectTheme = (theme) => {
	selectedTheme.value = theme
	emit('theme-change', theme)
}

const selectLanguage = async (languageCode) => {
	const success = await setLanguage(languageCode)
	if (success) {
		selectedLanguage.value = languageCode
		emit('language-change', languageCode)
	}
}

const selectFontSize = (fontSize) => {
	selectedFontSize.value = fontSize
	updateSettings({ fontSize })
	document.documentElement.setAttribute('data-font-size', fontSize)
	emit('font-size-change', fontSize)
}

const handleBack = () => {
	emit('back')
}

// Profile Reset Methods
const toggleDeleteLock = () => {
	isDeleteUnlocked.value = !isDeleteUnlocked.value

	// Auto-lock after 10 seconds if unlocked
	if (isDeleteUnlocked.value) {
		setTimeout(() => {
			isDeleteUnlocked.value = false
		}, 10000)
	}
}

const handleDeleteProfile = () => {
	if (!isDeleteUnlocked.value) return
	showDeleteConfirmation.value = true
}

const confirmDelete = () => {
	// Clear all game data from localStorage
	clearStorage()

	// Clear all screenshots from localStorage
	clearAllScreenshots()

	showDeleteConfirmation.value = false
	isDeleteUnlocked.value = false

	console.log('🗑️ Profile deleted: All game data and screenshots have been cleared')

	// Return to Home Page after reset
	handleBack()
}

const cancelDelete = () => {
	showDeleteConfirmation.value = false
	isDeleteUnlocked.value = false
}

const handleMenuClick = () => {
	router.push('/gaming')
}

// Data Export/Import Methods
const handleExportData = () => {
	try {
		const result = downloadData()
		if (result.success) {
			exportStatus.value = { type: 'success', message: `Data exported to ${result.filename}` }
			setTimeout(() => {
				exportStatus.value = null
			}, 5000)
		} else {
			exportStatus.value = { type: 'error', message: 'Export failed: ' + result.error }
			setTimeout(() => {
				exportStatus.value = null
			}, 5000)
		}
	} catch (error) {
		exportStatus.value = { type: 'error', message: 'Export failed: ' + error.message }
		setTimeout(() => {
			exportStatus.value = null
		}, 5000)
	}
}

const handleImportClick = () => {
	fileInput.value?.click()
}

const handleFileChange = async (event) => {
	const file = event.target.files?.[0]
	if (!file) return

	try {
		importStatus.value = { type: 'loading', message: 'Importing data...' }
		const result = await uploadData(file)

		if (result.success) {
			importStatus.value = { type: 'success', message: `Data imported from ${result.filename}` }
			setTimeout(() => {
				importStatus.value = null
				// Reload page to reflect changes
				window.location.reload()
			}, 2000)
		}
	} catch (error) {
		importStatus.value = { type: 'error', message: 'Import failed: ' + error.message }
		setTimeout(() => {
			importStatus.value = null
		}, 5000)
	} finally {
		// Reset file input
		if (fileInput.value) {
			fileInput.value.value = ''
		}
	}
}
</script>

<template>
	<Header
			:game-data="gameData"
			:player="gameData.player"
			:achievements="gameData.achievements"
			:show-menu-button="true"
			@menu-click="handleMenuClick"
	/>
	<main class="content">
		<!-- Theme Section -->
		<section class="theme-section">
			<h2 class="section-title">{{ t('settings.theme') }}</h2>

			<div class="theme-selector">
				<button
						v-for="option in themeOptions"
						:key="option.value"
						class="theme-option"
						:class="{ 'theme-option--active': selectedTheme === option.value }"
						@click="selectTheme(option.value)"
						:aria-pressed="selectedTheme === option.value"
				>
					{{ option.label() }}
				</button>
			</div>
		</section>

		<!-- Font Size Section -->
		<section class="font-size-section">
			<h2 class="section-title">{{ t('settings.font_size') }}</h2>

			<div class="font-size-selector">
				<button
						v-for="option in fontSizeOptions"
						:key="option.value"
						class="font-size-option"
						:class="{ 'font-size-option--active': selectedFontSize === option.value }"
						@click="selectFontSize(option.value)"
						:aria-pressed="selectedFontSize === option.value"
				>
					<span class="font-size-label" :class="`font-size-preview--${option.value}`">{{ option.label() }}</span>
				</button>
			</div>
		</section>

		<!-- Language Section -->
		<section class="language-section">
			<h2 class="section-title">{{ t('settings.language') }}</h2>

			<div class="language-selector">
				<button
						v-for="language in availableLanguages"
						:key="language.code"
						class="language-option"
						:class="{ 'language-option--active': selectedLanguage === language.code }"
						@click="selectLanguage(language.code)"
						:aria-pressed="selectedLanguage === language.code"
				>
					<span class="language-flag">{{ language.flag }}</span>
					<span class="language-name">{{ language.nativeName }}</span>
				</button>
			</div>
		</section>

		<!-- PWA Install Section -->
		<section class="pwa-section">
			<h2 class="section-title">{{ t('settings.app_installation') }}</h2>

			<div class="pwa-container">
				<div class="pwa-info">
					<h3 class="pwa-title">{{ t('settings.install_app') }}</h3>
					<p class="pwa-description">
						{{ t('settings.install_app_description') }}
					</p>
				</div>

				<div class="pwa-controls">
					<button
							v-if="!isPWAInstalled()"
							class="btn btn--primary"
							@click="showInstallOptions"
							:aria-label="t('settings.install_app')"
					>
						<Icon name="download" size="20" />
						{{ t('settings.install_app') }}
					</button>

					<div v-else class="pwa-installed">
						<Icon name="completion-badge" size="20" />
						<span>{{ t('settings.app_already_installed') }}</span>
					</div>
				</div>
			</div>
		</section>

		<!-- Data Export/Import Section -->
		<section class="data-management-section">
			<h2 class="section-title">{{ t('settings.data_management') }}</h2>

			<div class="data-management-container">
				<div class="data-management-info">
					<h3 class="data-management-title">{{ t('settings.backup_restore') }}</h3>
					<p class="data-management-description">
						{{ t('settings.backup_restore_description') }}
					</p>
				</div>

				<div class="data-management-controls">
					<!-- Export Button -->
					<button
							class="btn btn--primary"
							@click="handleExportData"
							:aria-label="t('settings.export_data')"
					>
						<Icon name="download" size="20" />
						{{ t('settings.export_data') }}
					</button>

					<!-- Import Button -->
					<button
							class="btn btn--secondary"
							@click="handleImportClick"
							:aria-label="t('settings.import_data')"
					>
						<Icon name="save" size="20" />
						{{ t('settings.import_data') }}
					</button>

					<!-- Hidden File Input -->
					<input
							ref="fileInput"
							type="file"
							accept=".json,application/json"
							style="display: none"
							@change="handleFileChange"
					/>
				</div>

				<!-- Export Status Message -->
				<div v-if="exportStatus" class="status-message" :class="`status-message--${exportStatus.type}`">
					<Icon :name="exportStatus.type === 'success' ? 'completion-badge' : 'error'" size="16" />
					<span>{{ exportStatus.message }}</span>
				</div>

				<!-- Import Status Message -->
				<div v-if="importStatus" class="status-message" :class="`status-message--${importStatus.type}`">
					<Icon
						:name="importStatus.type === 'success' ? 'completion-badge' : importStatus.type === 'loading' ? 'loading' : 'error'"
						size="16"
					/>
					<span>{{ importStatus.message }}</span>
				</div>
			</div>
		</section>

		<!-- Profile Reset Section -->
		<section class="profile-section">
			<h2 class="section-title">{{ t('settings.profile_management') }}</h2>

			<div class="reset-container">
				<div class="reset-info">
					<h3 class="reset-title">{{ t('settings.delete_profile') }}</h3>
					<p class="reset-description">
						{{ t('settings.delete_profile_description') }}
					</p>
				</div>

				<div class="reset-controls">
					<!-- Lock/Unlock Button -->
					<button
							class="btn btn--circle"
							:class="isDeleteUnlocked ? 'btn--unlock' : 'btn--lock'"
							@click="toggleDeleteLock"
							:aria-label="isDeleteUnlocked ? t('common.lock') : t('common.unlock')"
					>
						<Icon :name="isDeleteUnlocked ? 'unlock' : 'lock'" size="20" />
					</button>

					<!-- Delete Profile Button -->
					<button
							class="btn"
							:class="isDeleteUnlocked ? 'btn--delete-active' : 'btn--delete'"
							:disabled="!isDeleteUnlocked"
							@click="handleDeleteProfile"
							:aria-label="t('settings.delete_profile')"
					>
						{{ t('settings.delete_profile') }}
					</button>
				</div>
			</div>
		</section>

		<!-- Confirmation Modal -->
		<ConfirmationModal
				:visible="showDeleteConfirmation"
				:title="t('settings.delete_confirmation.title')"
				:message="t('settings.delete_confirmation.message')"
				:items="[
				t('settings.delete_confirmation.items.0'),
				t('settings.delete_confirmation.items.1'),
				t('settings.delete_confirmation.items.2'),
				t('settings.delete_confirmation.items.3')
			]"
				:warning="t('settings.delete_confirmation.warning')"
				:confirm-text="t('settings.delete_confirmation.confirm')"
				:cancel-text="t('common.cancel')"
				confirm-variant="danger"
				@confirm="confirmDelete"
				@cancel="cancelDelete"
		/>

		<!-- Manual PWA Install Prompt (only shows when button is clicked) -->
		<InstallPrompt
				v-if="showInstallPrompt"
				:force-show="true"
				@close="closeInstallPrompt"
		/>
	</main>
</template>

<style lang="scss" scoped>
.theme-section,
.language-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.section-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

// Theme Selector
.theme-selector {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	padding: var(--space-2);
	display: flex;
	gap: var(--space-1);
}

.theme-option {
	flex: 1;
	padding: var(--space-3) var(--space-4);
	border-radius: var(--border-radius-lg);
	border: none;
	background-color: transparent;
	color: var(--text-color);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--font-family-base), serif;

	&:hover {
		background-color: var(--card-bg-hover);
	}

	&:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 2px;
	}

	&--active {
		background-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
		}
	}
}

// Language Selector
.language-selector {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	padding: var(--space-2);
	display: flex;
	flex-direction: row;
	gap: var(--space-1);
}

.language-option {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	padding: var(--space-3) var(--space-4);
	border-radius: var(--border-radius-lg);
	border: none;
	background-color: transparent;
	color: var(--text-color);
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-base);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--font-family-base), serif;
	text-align: left;

	&:hover {
		background-color: var(--card-bg-hover);
	}

	&:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 2px;
	}

	&--active {
		background-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
		}
	}
}

.language-flag {
	font-size: var(--font-size-lg);
	flex-shrink: 0;
}

.language-name {
	font-weight: var(--font-weight-bold);
}

.font-size-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

// Font Size Selector
.font-size-selector {
	background-color: var(--card-bg);
	border-radius: var(--border-radius-xl);
	padding: var(--space-2);
	display: flex;
	gap: var(--space-1);
	flex-direction: row;
	justify-content: space-between;
}

.font-size-option {
	display: flex;
	align-items: center;
	padding: var(--space-3) var(--space-4);
	border-radius: var(--border-radius-lg);
	border: none;
	background-color: transparent;
	color: var(--text-color);
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-base);
	cursor: pointer;
	transition: all 0.2s ease;
	font-family: var(--font-family-base), serif;
	text-align: left;
	width: 100%;
	justify-content: center;

	&:hover {
		background-color: var(--card-bg-hover);
	}

	&:focus-visible {
		outline: var(--focus-outline);
		outline-offset: 2px;
	}

	&--active {
		background-color: var(--primary-color);
		color: white;

		&:hover {
			background-color: var(--primary-hover);
		}

		.font-size-preview {
			color: white;
		}
	}
}

.font-size-label {
	font-weight: var(--font-weight-bold);
}

.font-size-preview {
	font-weight: var(--font-weight-bold);
	color: var(--text-secondary);
	transition: color 0.2s ease;

	&--small {
		font-size: var(--font-size-sm);
	}

	&--medium {
		font-size: var(--font-size-base);
	}

	&--large {
		font-size: var(--font-size-lg);
	}
}

// Profile Reset Section
.profile-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	margin-top: var(--space-8);
}

.reset-container {
	background-color: var(--card-bg);
	border: 1px solid var(--error-color);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.reset-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.reset-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--error-color);
	margin: 0;
}

.reset-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.reset-controls {
	display: flex;
	align-items: center;
	gap: var(--space-3);
}


// PWA Install Section
.pwa-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.pwa-container {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.pwa-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.pwa-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.pwa-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.pwa-controls {
	display: flex;
	align-items: center;
	justify-content: center;
}

.pwa-installed {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3) var(--space-4);
	background-color: var(--success-color);
	color: white;
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

// Data Management Section
.data-management-section {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.data-management-container {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.data-management-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.data-management-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.data-management-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.data-management-controls {
	display: flex;
	align-items: center;
	gap: var(--space-3);
	flex-wrap: wrap;
}

.status-message {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-3);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-medium);
	animation: fadeIn 0.3s ease;

	&--success {
		background-color: rgba(var(--success-color-rgb, 34, 197, 94), 0.1);
		color: var(--success-color);
		border: 1px solid var(--success-color);
	}

	&--error {
		background-color: rgba(var(--error-color-rgb, 239, 68, 68), 0.1);
		color: var(--error-color);
		border: 1px solid var(--error-color);
	}

	&--loading {
		background-color: rgba(var(--primary-color-rgb, 59, 130, 246), 0.1);
		color: var(--primary-color);
		border: 1px solid var(--primary-color);
	}
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(-10px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}
</style>