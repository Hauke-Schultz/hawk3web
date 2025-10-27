<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Icon from '../components/Icon.vue'

const { t } = useI18n()
const router = useRouter()

const navigateTo = (path) => {
	router.push(path)
}
</script>

<template>
	<main class="landing">
		<!-- Portfolio Hero -->
		<section class="hero">
			<div class="hero-title"><h1>{{ t('portfolio.title') }}</h1></div>
			<p class="hero-subtitle">{{ t('portfolio.subtitle') }}</p>
		</section>

		<!-- Info Card -->
		<section class="info-section">
			<div class="info-card" @click="navigateTo('/about')">
				<div class="info-icon">
					<Icon name="code" size="48" />
				</div>
				<div class="info-content">
					<h2 class="info-title">{{ t('portfolio.welcome.title') }}</h2>
					<p class="info-description">{{ t('portfolio.welcome.description') }}</p>
				</div>
			</div>
		</section>

		<!-- Gaming Hub Card -->
		<section class="info-section">
			<div class="info-card" @click="navigateTo('/gaming')">
				<div class="info-icon">
					<Icon name="play" size="48" />
				</div>
				<div class="info-content">
					<h2 class="info-title">{{ t('gaming.hub.title') }}</h2>
					<p class="info-description">{{ t('gaming.hub.description') }}</p>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.landing {
	min-height: 100vh;
	display: flex;
	flex-direction: column;
	gap: var(--space-4);
	padding: var(--space-4);
}

// Portfolio Hero
.hero {
	text-align: center;
	padding: var(--space-8) 0;
	margin-bottom: var(--space-4);
}

.hero-title {
	position: relative;
	width: 100%;
	height: 80px;
}

.hero-subtitle {
	font-size: var(--font-size-lg);
	color: var(--text-secondary);
	margin: 0;
}

.info-card {
	background: linear-gradient(135deg, var(--card-bg) 0%, var(--bg-secondary) 100%);
	border: 2px solid var(--primary-color);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	gap: var(--space-4);
	align-items: center;
	cursor: pointer;
	transition: all 0.3s ease;
	position: relative;
	overflow: hidden;

	&::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, transparent 0%, rgba(255, 255, 255, 0.05) 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
	}

	&:hover {
		transform: translateY(-4px);
		box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
		border-color: var(--success-color);

		&::before {
			opacity: 1;
		}

		.info-icon {
			color: var(--success-color);
		}
	}
}

.info-icon {
	color: var(--primary-color);
	flex-shrink: 0;
	transition: opacity 0.3s ease;
}

.info-content {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
	flex: 1;
}

.info-title {
	margin: 0;
}

.info-description {
	margin: 0;
}

// H1 Animation (from original)
h1 {
	font-size: var(--font-size-4xl);
	text-shadow:
			1px 1px 0 #f39,
			1px 0 0 #3f9,
			0 1px 0 #3f9,
			1px -1px 0 #3f9,
			-1px 1px 0 #3f9,
			-1px -1px 0 #3f9,
			-1px 0 0 #3f9,
			0 -1px 0 #3f9,
			0 35px 15px rgba(0, 0, 0, 0.8);
	color: #777;
	position: absolute;
	top: 0;
	left: 50%;
	text-align: center;
	text-transform: uppercase;
	transform: translateX(-50%) translateY(-50%) rotate3d(1, 1, 1, 0deg);
	animation-name: shadow;
	animation-duration: 20s;
	animation-iteration-count: infinite;
	perspective: 600px;
	white-space: nowrap;

	&::before {
		content: "HAUKE SCHULTZ";
		position: absolute;
		opacity: 0;
		overflow: hidden;
		text-shadow: none;
		margin: 0;
		left: 0;
		width: 100%;
		height: 30px;
		text-align: center;
		animation-name: foo1;
		animation-duration: 8000ms;
		animation-iteration-count: infinite;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}

	&::after {
		content: "HAUKE SCHULTZ";
		position: absolute;
		opacity: 0;
		overflow: hidden;
		text-shadow: none;
		margin: 0;
		left: 0;
		top: 50%;
		width: 100%;
		height: 30px;
		line-height: 0;
		text-align: center;
		animation-name: foo2;
		animation-duration: 8030ms;
		animation-iteration-count: infinite;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
}

@keyframes foo1 {
	0% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	1% {
		color: #3f9;
		transform: translateX(-1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	2% {
		color: #f39;
		transform: translateX(1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	3% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	10% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	11% {
		color: #3f9;
		transform: translateX(-1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	12% {
		transform: translateX(1%) translateY(0%) rotate3d(1, 1, 1, 0deg);
	}
	13% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	23.9% { opacity: 0; }
	24% { opacity: 1; color: #f39; }
	25% { opacity: 0; color: #000; }
	33.9% { opacity: 0; }
	34% { opacity: 1; color: #3f9; }
	35% { opacity: 0; color: #000; }
}

@keyframes foo2 {
	0% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	1% {
		color: #3f9;
		transform: translateX(3%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	2% {
		transform: translateX(-1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	3% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	10% {
		opacity: 1;
		color: #777;
		transform: translateX(0%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	11% {
		color: #f39;
		transform: translateX(1%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	12% {
		transform: translateX(-3%) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	13% {
		opacity: 0;
		color: #777;
		transform: translateX(0) translateY(0) rotate3d(1, 1, 1, 0deg);
	}
	26.9% { opacity: 0; }
	27% { opacity: 1; color: #3f9; }
	28% { opacity: 0; color: #000; }
	32.9% { opacity: 0; }
	33% { opacity: 1; color: #f39; }
	34% { opacity: 0; color: #000; }
}

@keyframes shadow {
	0% {
		text-shadow:
				1px 1px 0 #f39,
				1px 0 0 #3f9,
				0 1px 0 #3f9,
				1px -1px 0 #3f9,
				-1px 1px 0 #3f9,
				-1px -1px 0 #3f9,
				-1px 0 0 #3f9,
				0 -1px 0 #3f9,
				0 -35px 15px #414;
		transform: translateX(-50%) translateY(0%) rotate3d(1, 1, 1, -5deg);
	}

	50% {
		text-shadow:
				1px 1px 0 #f39,
				1px 0 0 #3f9,
				0 1px 0 #3f9,
				1px -1px 0 #3f9,
				-1px 1px 0 #3f9,
				-1px -1px 0 #3f9,
				-1px 0 0 #3f9,
				0 -1px 0 #3f9,
				0 35px 15px #314;
		transform: translateX(-50%) translateY(-50%) rotate3d(1, 1, 1, 3deg);
	}

	100% {
		text-shadow:
				1px 1px 0 #f39,
				1px 0 0 #3f9,
				0 1px 0 #3f9,
				1px -1px 0 #3f9,
				-1px 1px 0 #3f9,
				-1px -1px 0 #3f9,
				-1px 0 0 #3f9,
				0 -1px 0 #3f9,
				0 -35px 15px #414;
		transform: translateX(-50%) translateY(0%) rotate3d(1, 1, 1, -5deg);
	}
}
</style>