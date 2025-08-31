<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Header from '../components/Header.vue'
import Icon from '../components/Icon.vue'

const { t } = useI18n()
const router = useRouter()

const navigateToAbout = () => {
	router.push('/about')
}
</script>

<template>
	<Header />

	<main class="portfolio">
		<!-- Portfolio Hero -->
		<section class="hero">
			<div class="hero-title"><h1>{{ t('portfolio.title') }}</h1></div>
			<p class="hero-subtitle">{{ t('portfolio.subtitle') }}</p>
		</section>

		<!-- Projekte -->
		<section class="projects">
			<div class="projects-grid">
				<!-- Gaming Platform -->
				<div class="project-card" @click="router.push('/games')">
					<div class="project-icon">
						<Icon name="play" size="48" />
					</div>
					<div class="project-content">
						<h2 class="project-title">{{ t('portfolio.gamingHub.title') }}</h2>
						<p class="project-description">{{ t('portfolio.gamingHub.description') }}</p>
					</div>
				</div>

				<!-- Coming Soon Projekte -->
				<div class="project-card project-card--coming-soon">
					<div class="project-icon">
						<Icon name="code" size="48" />
					</div>
					<div class="project-content">
						<h2 class="project-title">{{ t('portfolio.commingSoon.title') }}</h2>
						<p class="project-description">{{ t('portfolio.commingSoon.description') }}</p>
					</div>
				</div>
			</div>
		</section>
	</main>
</template>

<style lang="scss" scoped>
.portfolio {
	padding: var(--space-4);
	display: flex;
	flex-direction: column;
	gap: var(--space-8);
}

.hero {
	text-align: center;
	padding: var(--space-8) 0;
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

.projects {
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

.projects-grid {
	display: grid;
	gap: var(--space-4);
}

.project-card {
	background-color: var(--card-bg);
	border: 1px solid var(--card-border);
	border-radius: var(--border-radius-xl);
	padding: var(--space-4);
	display: flex;
	gap: var(--space-4);
	cursor: pointer;
	transition: all 0.2s ease;

	&:hover:not(&--coming-soon) {
		background-color: var(--card-bg-hover);
		box-shadow: var(--card-shadow-hover);
		transform: translateY(-2px);
	}

	&--coming-soon {
		opacity: 0.6;
		cursor: default;
	}
}

.project-icon {
	color: var(--primary-color);
	flex-shrink: 0;
}

.project-content {
	display: flex;
	flex-direction: column;
	gap: var(--space-2);
}

.project-title {
	font-size: var(--font-size-lg);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}

.project-description {
	font-size: var(--font-size-base);
	color: var(--text-secondary);
	margin: 0;
}

.project-tech {
	display: flex;
	gap: var(--space-2);
	flex-wrap: wrap;
}

.tech-tag {
	background-color: var(--primary-color);
	color: white;
	padding: var(--space-1) var(--space-2);
	border-radius: var(--border-radius-sm);
	font-size: var(--font-size-xs);
	font-weight: var(--font-weight-bold);
}

.quick-links {
	display: flex;
	justify-content: center;
	gap: var(--space-3);
}

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