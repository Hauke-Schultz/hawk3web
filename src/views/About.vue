<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Icon from '../components/Icon.vue'
import Header from '../gamingHub/components/Header.vue'
import {useLocalStorage} from "../gamingHub/composables/useLocalStorage.js";

const { t } = useI18n()
const { gameData } = useLocalStorage()
const router = useRouter()

const developerInfo = {
	name: 'Hauke Schultz',
	location: 'Germany',
	email: 'me@haukeschultz.com'
}

const platformInfo = {
	version: '0.3.3',
	technologies: [
		'Vue 3',
		'Vite',
		'SCSS',
		'JavaScript',
		'Matter.js',
		'Vue Router',
		'PWA',
		'i18n',
		'LocalStorage'
	],
	features: [
		'three_games',
		'achievement_system',
		'shop_currency',
		'daily_rewards',
		'offline_storage',
		'multilingual'
	]
}

const sendEmail = () => {
	window.location.href = `mailto:${developerInfo.email}`
}

const handleMenuClick = () => {
	router.push('/')
}
</script>

<template>
	<Header
			:show-menu-button="true"
			:show-game-info="false"
			@menu-click="handleMenuClick"
	/>
	<main class="content">
		<!-- About Header -->
		<section class="about-header">
			<div class="about-hero">
				<Icon name="heart" size="48" />
				<h2 class="about-title">{{ t('about.title') }}</h2>
				<p class="about-subtitle">{{ t('about.subtitle') }}</p>
			</div>
		</section>

		<!-- About Sections -->
		<div class="about-sections">

			<!-- About the Platform -->
			<section class="about-section">
				<h3 class="section-title">
					<Icon name="info" size="24" />
					{{ t('about.platform.title') }}
				</h3>
				<div class="section-content">
					<p class="section-description">{{ t('about.platform.description') }}</p>

					<div class="info-grid">
						<div class="info-item">
							<span class="info-label">{{ t('about.platform.version') }}</span>
							<span class="info-value">v{{ platformInfo.version }}</span>
						</div>
						<div class="info-item">
							<span class="info-label">{{ t('about.platform.status') }}</span>
							<span class="info-value status-active">{{ t('about.platform.status_value') }}</span>
						</div>
					</div>

					<div class="feature-list">
						<h4 class="feature-title">{{ t('about.platform.features') }}</h4>
						<ul class="features">
							<li v-for="feature in platformInfo.features" :key="feature" class="feature-item">
								<Icon name="star-filled" size="16" />
								{{ t(`about.platform.feature_list.${feature.toLowerCase().replace(/\s+/g, '_')}`) }}
							</li>
						</ul>
					</div>

					<div class="tech-stack">
						<h4 class="tech-title">{{ t('about.platform.technologies') }}</h4>
						<div class="tech-badges">
              <span v-for="tech in platformInfo.technologies" :key="tech" class="tech-badge">
                {{ tech }}
              </span>
						</div>
					</div>
				</div>
			</section>

			<!-- About the Developer -->
			<section class="about-section">
				<h3 class="section-title">
					<Icon name="user" size="24" />
					{{ t('about.developer.title') }}
				</h3>
				<div class="section-content">
					<p class="section-description">{{ t('about.developer.description') }}</p>

					<div class="developer-info">
						<div class="info-item">
							<Icon name="code" size="16" />
							<span class="info-label">{{ t('about.developer.name') }}</span>
							<span class="info-value">{{ developerInfo.name }}</span>
						</div>
						<div class="info-item">
							<Icon name="globe" size="16" />
							<span class="info-label">{{ t('about.developer.location') }}</span>
							<span class="info-value">{{ developerInfo.location }}</span>
						</div>
					</div>
				</div>
			</section>

			<!-- Privacy Information -->
			<section class="about-section">
				<h3 class="section-title">
					<Icon name="shield" size="24" />
					{{ t('about.privacy.title') }}
				</h3>
				<div class="section-content">
					<p class="section-description">{{ t('about.privacy.description') }}</p>

					<div class="privacy-points">
						<div class="privacy-item">
							<div class="privacy-content">
								<h4 class="privacy-point-title">{{ t('about.privacy.local_storage.title') }}</h4>
								<p class="privacy-point-description">{{ t('about.privacy.local_storage.description') }}</p>
							</div>
						</div>

						<div class="privacy-item">
							<div class="privacy-content">
								<h4 class="privacy-point-title">{{ t('about.privacy.no_tracking.title') }}</h4>
								<p class="privacy-point-description">{{ t('about.privacy.no_tracking.description') }}</p>
							</div>
						</div>

						<div class="privacy-item">
							<div class="privacy-content">
								<h4 class="privacy-point-title">{{ t('about.privacy.data_control.title') }}</h4>
								<p class="privacy-point-description">{{ t('about.privacy.data_control.description') }}</p>
							</div>
						</div>
					</div>
				</div>
			</section>

			<!-- Legal Information -->
			<section class="about-section">
				<h3 class="section-title">
					<Icon name="document" size="24" />
					{{ t('about.legal.title') }}
				</h3>
				<div class="section-content">
					<p class="section-description">{{ t('about.legal.description') }}</p>

					<div class="legal-points">
						<div class="legal-item">
							<h4 class="legal-point-title">{{ t('about.legal.license.title') }}</h4>
							<p class="legal-point-description">{{ t('about.legal.license.description') }}</p>
						</div>

						<div class="legal-item">
							<h4 class="legal-point-title">{{ t('about.legal.disclaimer.title') }}</h4>
							<p class="legal-point-description">{{ t('about.legal.disclaimer.description') }}</p>
						</div>

						<div class="legal-item">
							<h4 class="legal-point-title">{{ t('about.legal.usage.title') }}</h4>
							<p class="legal-point-description">{{ t('about.legal.usage.description') }}</p>
						</div>

						<div class="legal-item">
							<h4 class="legal-point-title">{{ t('about.legal.games.title') }}</h4>
							<p class="legal-point-description">{{ t('about.legal.games.description') }}</p>
						</div>

						<div class="legal-item">
							<h4 class="legal-point-title">{{ t('about.legal.ai_development.title') }}</h4>
							<p class="legal-point-description">{{ t('about.legal.ai_development.description') }}</p>
						</div>
					</div>
				</div>
			</section>

			<!-- Contact & Feedback -->
			<section class="about-section">
				<h3 class="section-title">
					<Icon name="mail" size="24" />
					{{ t('about.contact.title') }}
				</h3>
				<div class="section-content">
					<p class="section-description">{{ t('about.contact.description') }}</p>

					<div class="contact-info">
						<div class="contact-methods">
							<button @click="sendEmail" class="btn btn--ghost">
								<span>{{ t('about.contact.email') }}</span>
							</button>
						</div>
					</div>
				</div>
			</section>

		</div>
	</main>
</template>

<style lang="scss" scoped>
// About Header
.about-header {
	text-align: center;
	margin-bottom: var(--space-6);
}

.about-hero {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-3);
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-6);
}

.about-title {
	font-size: var(--font-size-2xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.about-subtitle {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
	text-align: center;
	line-height: 1.4;
}

// About Sections
.about-sections {
	display: flex;
	flex-direction: column;
	gap: var(--space-6);
}

.about-section {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.section-title {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
	padding-bottom: var(--space-2);
	border-bottom: 1px solid var(--card-border);
}

.section-content {
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
}

.section-description {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.5;
}

.developer-info {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

// Info Grid
.info-grid {
	display: grid;
	grid-template-columns: 1fr 2fr;
	gap: var(--space-3);
}

.info-item {
	display: flex;
	flex-direction: column;
	gap: var(--space-1);

	&:has(.info-label) {
		align-items: flex-start;
	}
}

.developer-info .info-item {
	display: flex;
	flex-direction: row;
	align-items: center;
	gap: var(--space-2);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.info-label {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	font-weight: var(--font-weight-bold);
	text-transform: uppercase;
}

.info-value {
	font-size: var(--font-size-base);
	color: var(--text-color);
	font-weight: var(--font-weight-bold);

	&.status-active {
		color: var(--success-color);
	}
}

// Features List
.feature-list {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.feature-title,
.tech-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.features {
	list-style: none;
	padding: 0;
	margin: 0;
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.feature-item {
	display: flex;
	align-items: center;
	gap: var(--space-2);
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	padding: var(--space-2);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

// Tech Stack
.tech-stack {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.tech-badges {
	display: flex;
	flex-wrap: wrap;
	gap: var(--space-2);
}

.tech-badge {
	background-color: var(--primary-color);
	color: white;
	padding: var(--space-1) var(--space-3);
	border-radius: var(--border-radius-md);
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
}

// Contact Links
.contact-links {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

// Privacy & Legal Points
.privacy-points,
.legal-points {
	display: flex;
	flex-direction: column;
	gap: var(--space-3);
}

.privacy-item {
	display: flex;
	align-items: flex-start;
	gap: var(--space-3);
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.privacy-content {
	flex: 1;
}

.privacy-point-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-1) 0;
}

.privacy-point-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

.legal-item {
	padding: var(--space-3);
	background-color: var(--bg-secondary);
	border-radius: var(--border-radius-md);
}

.legal-point-title {
	font-size: var(--font-size-base);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0 0 var(--space-2) 0;
}

.legal-point-description {
	font-size: var(--font-size-sm);
	color: var(--text-secondary);
	margin: 0;
	line-height: 1.4;
}

// Contact Info
.contact-info {
	display: none;
	flex-direction: column;
	gap: var(--space-3);
}

.contact-methods {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}
</style>