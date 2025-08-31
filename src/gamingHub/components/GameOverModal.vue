<!-- src/components/GameOverModal.vue -->
<script setup>
import { useI18n } from '../../composables/useI18n.js'
import Icon from '../../components/Icon.vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	level: {
		type: Number,
		required: true
	},
	gameTitle: {
		type: String,
		default: 'Game'
	},
	finalScore: {
		type: Number,
		required: true
	},

	// Game Over specific props
	gameOverIcon: {
		type: String,
		default: '💥'
	},

	// Action buttons
	showTryAgain: {
		type: Boolean,
		default: true
	},
	showBackToGames: {
		type: Boolean,
		default: true
	},
	tryAgainLabel: {
		type: String,
		default: 'Try Again'
	},
	backToGamesLabel: {
		type: String,
		default: 'Back'
	}
})

const emit = defineEmits([
	'try-again',
	'back-to-games',
	'close'
])

const { t } = useI18n()

// Event handlers
const handleTryAgain = () => {
	emit('try-again')
}

const handleBackToGames = () => {
	emit('back-to-games')
}

const handleOverlayClick = () => {
	emit('close')
}

const handleKeyDown = (event) => {
	if (event.key === 'Escape') {
		emit('close')
	}
}
</script>

<template>
	<Teleport to="body">
		<div
				v-if="visible"
				class="game-over-overlay"
				@click="handleOverlayClick"
				@keydown="handleKeyDown"
				tabindex="-1"
		>
			<div class="game-over-content">
				<!-- Game Over Icon Animation -->
				<div class="game-over-icon">{{ gameOverIcon }}</div>

				<!-- Score Display -->
				<div class="game-over-score">
					<div class="score-label">{{ t('stats.final_score') }}</div>
					<div class="score-value">{{ finalScore }}</div>
				</div>

				<!-- Action Buttons -->
				<div class="game-over-actions">
					<button
						v-if="showTryAgain"
						class="btn btn--primary"
						@click="handleTryAgain"
					>
						{{ tryAgainLabel }}
					</button>
					<button
						v-if="showBackToGames"
						class="btn btn--info"
						@click="handleBackToGames"
					>
						{{ backToGamesLabel }}
					</button>
				</div>
			</div>
		</div>
	</Teleport>
</template>

<style lang="scss" scoped>
.game-over-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  animation: fadeInOverlay 0.5s ease;

  &:focus-visible {
    outline: none;
  }
}

.game-over-content {
	position: relative;
	z-index: 1001;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: var(--space-6);
	text-align: center;
	pointer-events: none;
	justify-content: center;
	height: 100vh;
}

.game-over-icon {
	font-size: calc(var(--font-size-4xl) * 2);
	animation: gameOverExplosion 2s ease-in-out infinite;
	filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.8));
	pointer-events: none;
}

.game-over-score {
	background: linear-gradient(135deg, var(--error-color), #dc2626);
	border: 3px solid var(--error-color);
	border-radius: var(--border-radius-xl);
	padding: var(--space-6) var(--space-8);
	box-shadow:
			0 8px 32px rgba(239, 68, 68, 0.4),
			0 0 20px rgba(239, 68, 68, 0.6);
	animation: scoreSlideIn 0.8s ease-out 0.5s both;
	pointer-events: none;
}

.score-label {
	font-size: var(--font-size-sm);
	color: rgba(255, 255, 255, 0.8);
	text-transform: uppercase;
	font-weight: var(--font-weight-bold);
	margin-bottom: var(--space-2);
	display: block;
}

.score-value {
	font-size: var(--font-size-4xl);
	font-weight: var(--font-weight-bold);
	color: white;
	line-height: 1;
	text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
}

.game-over-actions {
	display: flex;
	gap: var(--space-4);
	justify-content: center;
	flex-wrap: wrap;
	animation: buttonsSlideIn 0.6s ease-out 1.2s both;
	pointer-events: auto;
}

.game-over-actions {
	.btn {
		min-width: 140px;
	}

	.btn--ghost {
		background-color: rgba(255, 255, 255, 0.2);
	}
}

// Animationen
@keyframes fadeInOverlay {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes gameOverExplosion {
	0% {
		transform: scale(0.8) rotate(-5deg);
		opacity: 0.8;
	}
	25% {
		transform: scale(1.3) rotate(2deg);
		opacity: 1;
	}
	50% {
		transform: scale(1.1) rotate(-1deg);
		opacity: 0.9;
	}
	75% {
		transform: scale(1.2) rotate(1deg);
		opacity: 1;
	}
	95% {
		transform: scale(1) rotate(0deg);
		opacity: 0.8;
	}
	100% {
		transform: scale(0.8) rotate(-5deg);
		opacity: 0.8;
	}
}

@keyframes scoreSlideIn {
	from {
		transform: translateY(30px) scale(0.8);
		opacity: 0;
	}
	to {
		transform: translateY(0) scale(1);
		opacity: 1;
	}
}

@keyframes buttonsSlideIn {
	from {
		transform: translateY(20px);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

</style>