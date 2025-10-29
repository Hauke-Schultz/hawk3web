import {ref, reactive, computed, watch, readonly} from 'vue'

// Available languages
export const AVAILABLE_LANGUAGES = {
	en: {
		code: 'en',
		name: 'English',
		nativeName: 'English',
		flag: '🇺🇸'
	},
	de: {
		code: 'de',
		name: 'German',
		nativeName: 'Deutsch',
		flag: '🇩🇪'
	}
}

// Default language
const DEFAULT_LANGUAGE = 'en'

// Current language state
const currentLanguage = ref(DEFAULT_LANGUAGE)
const translations = reactive({})

// Load translation files dynamically
const loadTranslations = async (locale) => {
	try {
		// Dynamic import of translation files
		const translationModule = await import(`../locales/${locale}.js`)
		translations[locale] = translationModule.default || translationModule
		return translations[locale]
	} catch (error) {
		console.warn(`Failed to load translations for locale: ${locale}`, error)

		// Fallback to English if available
		if (locale !== DEFAULT_LANGUAGE && !translations[DEFAULT_LANGUAGE]) {
			try {
				const fallbackModule = await import(`../locales/${DEFAULT_LANGUAGE}.js`)
				translations[DEFAULT_LANGUAGE] = fallbackModule.default || fallbackModule
			} catch (fallbackError) {
				console.error('Failed to load fallback translations:', fallbackError)
			}
		}

		return null
	}
}

// Get nested value from object using dot notation
const getNestedValue = (obj, path) => {
	return path.split('.').reduce((current, key) => {
		return current && current[key] !== undefined ? current[key] : null
	}, obj)
}

// Translation function with interpolation support
const translateText = (key, params = {}, locale = currentLanguage.value) => {
	// Get translations for current locale
	const localeTranslations = translations[locale]

	if (!localeTranslations) {
		console.warn(`No translations loaded for locale: ${locale}`)

		// Try fallback to default language
		if (locale !== DEFAULT_LANGUAGE && translations[DEFAULT_LANGUAGE]) {
			return translateText(key, params, DEFAULT_LANGUAGE)
		}

		return key // Return key as fallback
	}

	// Get translation text
	let text = getNestedValue(localeTranslations, key)

	if (text === null || text === undefined) {
		console.warn(`Translation missing for key: ${key} in locale: ${locale}`)

		// Try fallback to default language
		if (locale !== DEFAULT_LANGUAGE && translations[DEFAULT_LANGUAGE]) {
			text = getNestedValue(translations[DEFAULT_LANGUAGE], key)
		}

		if (text === null || text === undefined) {
			return key // Return key as ultimate fallback
		}
	}

	// Handle interpolation and pluralization
	if (typeof text === 'string' && Object.keys(params).length > 0) {
		// First handle ICU-style plurals
		if (text.includes('plural')) {
			text = processPluralForm(text, params.count, params)
		}

		// Then handle simple parameter replacement
		return text.replace(/\{(\w+)\}/g, (match, paramKey) => {
			return params[paramKey] !== undefined ? String(params[paramKey]) : match
		})
	}

	return text
}

const processPluralForm = (text, count, params) => {
	// Simple ICU plural processor
	// Handles: {count, plural, =1 {singular} other {plural}}
	const pluralRegex = /\{(\w+),\s*plural,\s*(.*?)\}/g

	return text.replace(pluralRegex, (match, varName, forms) => {
		const currentCount = params[varName] || count

		// Parse forms: =1 {one} =2 {two} other {many}
		const formRegex = /(=(\d+)|other)\s*\{([^}]*)\}/g
		let result = ''
		let hasMatch = false

		let formMatch
		while ((formMatch = formRegex.exec(forms)) !== null) {
			const [, condition, exactNumber, content] = formMatch

			if (condition === 'other' && !hasMatch) {
				result = content
			} else if (exactNumber && parseInt(exactNumber) === currentCount) {
				result = content
				hasMatch = true
				break
			}
		}

		// Replace parameters in the result
		return result.replace(/\{(\w+)\}/g, (paramMatch, paramKey) => {
			return params[paramKey] !== undefined ? String(params[paramKey]) : paramMatch
		})
	})
}
// Format numbers according to locale
const formatNumber = (number, locale = currentLanguage.value) => {
	try {
		return new Intl.NumberFormat(locale).format(number)
	} catch (error) {
		return number.toString()
	}
}

// Format dates according to locale
const formatDate = (date, options = {}, locale = currentLanguage.value) => {
	try {
		const defaultOptions = {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		}

		const formatOptions = { ...defaultOptions, ...options }
		return new Intl.DateTimeFormat(locale, formatOptions).format(new Date(date))
	} catch (error) {
		return date.toString()
	}
}

// Format time according to locale
const formatTime = (seconds, locale = currentLanguage.value) => {
	const mins = Math.floor(seconds / 60)
	const secs = seconds % 60

	// Use locale-specific number formatting
	const formattedMins = formatNumber(mins, locale).padStart(2, '0')
	const formattedSecs = formatNumber(secs, locale).padStart(2, '0')

	return `${formattedMins}:${formattedSecs}`
}

// Detect browser language
const detectBrowserLanguage = () => {
	// SSR-safe: Check if navigator is available (browser only)
	if (typeof navigator === 'undefined') {
		return DEFAULT_LANGUAGE
	}

	const browserLang = navigator.language || navigator.userLanguage || DEFAULT_LANGUAGE
	const langCode = browserLang.split('-')[0] // Extract language code (e.g., 'en' from 'en-US')

	// Check if detected language is supported
	return AVAILABLE_LANGUAGES[langCode] ? langCode : DEFAULT_LANGUAGE
}

// Get language from localStorage or detect from browser
const getStoredLanguage = () => {
	// SSR-safe: Check if localStorage is available (browser only)
	if (typeof localStorage === 'undefined') {
		return DEFAULT_LANGUAGE
	}

	try {
		const stored = localStorage.getItem('hawk3_language')
		if (stored && AVAILABLE_LANGUAGES[stored]) {
			return stored
		}
	} catch (error) {
		console.warn('Error reading language from localStorage:', error)
	}

	return detectBrowserLanguage()
}

// Save language to localStorage
const saveLanguageToStorage = (locale) => {
	try {
		localStorage.setItem('hawk3_language', locale)
	} catch (error) {
		console.error('Error saving language to localStorage:', error)
	}
}

/**
 * Main i18n composable
 * @returns {Object} i18n methods and reactive data
 */
export function useI18n() {
	// Initialize language from storage
	const initLanguage = () => {
		const storedLang = getStoredLanguage()
		currentLanguage.value = storedLang
		loadTranslations(storedLang)
	}

	// Set language and load translations
	const setLanguage = async (locale) => {
		if (!AVAILABLE_LANGUAGES[locale]) {
			console.warn(`Unsupported language: ${locale}`)
			return false
		}

		currentLanguage.value = locale
		saveLanguageToStorage(locale)

		// Load translations if not already loaded
		if (!translations[locale]) {
			await loadTranslations(locale)
		}

		return true
	}

	// Computed properties
	const currentLanguageInfo = computed(() => {
		return AVAILABLE_LANGUAGES[currentLanguage.value] || AVAILABLE_LANGUAGES[DEFAULT_LANGUAGE]
	})

	const availableLanguages = computed(() => {
		return Object.values(AVAILABLE_LANGUAGES)
	})

	const isLanguageLoaded = computed(() => {
		return !!translations[currentLanguage.value]
	})

	// Translation function (short alias)
	const t = (key, params = {}) => {
		return translateText(key, params, currentLanguage.value)
	}

	// Pluralization helper
	const tp = (key, count, params = {}) => {
		const pluralParams = { ...params, count }

		// Handle plural forms
		let pluralKey = key

		// Check for ICU-style plurals: {count, plural, =1 {one} other {many}}
		const baseTranslation = translateText(key, pluralParams, currentLanguage.value)

		if (baseTranslation.includes('{') && baseTranslation.includes('plural')) {
			return processPluralForm(baseTranslation, count, pluralParams)
		}

		// Try to get plural form (traditional .singular/.plural)
		if (count === 1) {
			const singular = translateText(`${key}.singular`, pluralParams)
			if (singular !== `${key}.singular`) {
				return singular
			}
		} else {
			const plural = translateText(`${key}.plural`, pluralParams)
			if (plural !== `${key}.plural`) {
				return plural
			}
		}

		// Fallback to base key with parameter replacement
		return translateText(key, pluralParams)
	}

	// Initialize on composable creation
	if (!isLanguageLoaded.value) {
		initLanguage()
	}

	return {
		// Reactive state
		currentLanguage: readonly(currentLanguage),
		currentLanguageInfo,
		availableLanguages,
		isLanguageLoaded,

		// Translation methods
		t,
		tp,
		translate: t, // Explicit alias

		// Language management
		setLanguage,
		initLanguage,

		// Formatting utilities
		formatNumber,
		formatDate,
		formatTime,

		// Utilities
		getAvailableLanguages: () => Object.keys(AVAILABLE_LANGUAGES),
		isLanguageSupported: (locale) => !!AVAILABLE_LANGUAGES[locale],
		detectBrowserLanguage
	}
}