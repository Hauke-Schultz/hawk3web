<script setup>
import { computed } from 'vue'

const props = defineProps({
	// Currency amounts
	coins: {
		type: Number,
		default: 0
	},
	diamonds: {
		type: Number,
		default: 0
	},

	// Display options
	showCoins: {
		type: Boolean,
		default: true
	},
	showDiamonds: {
		type: Boolean,
		default: true
	},
	showZeroValues: {
		type: Boolean,
		default: true
	},

	// Layout options
	layout: {
		type: String,
		default: 'horizontal', // 'horizontal', 'vertical'
		validator: (value) => ['horizontal', 'vertical'].includes(value)
	},
	size: {
		type: String,
		default: 'normal', // 'small', 'normal', 'large'
		validator: (value) => ['small', 'normal', 'large'].includes(value)
	},

	// Style options
	variant: {
		type: String,
		default: 'default', // 'default', 'compact', 'card'
		validator: (value) => ['default', 'compact', 'card'].includes(value)
	},

	// Formatting options
	formatNumbers: {
		type: Boolean,
		default: true
	},
	showLabels: {
		type: Boolean,
		default: false
	},

	// Labels
	coinsLabel: {
		type: String,
		default: 'Coins'
	},
	diamondsLabel: {
		type: String,
		default: 'Diamonds'
	}
})

// Format currency numbers
const formatCurrency = (amount) => {
	if (!props.formatNumbers) return amount.toString()

	if (amount >= 1000000) {
		return `${(amount / 1000000).toFixed(1)}M`
	} else if (amount >= 1000) {
		return `${(amount / 1000).toFixed(1)}K`
	}
	return amount.toString()
}

// Computed items to display
const displayItems = computed(() => {
	const items = []

	if (props.showCoins && (props.coins > 0 || props.showZeroValues)) {
		items.push({
			type: 'coins',
			icon: '💰',
			amount: formatCurrency(props.coins),
			rawAmount: props.coins,
			label: props.coinsLabel,
			premium: false
		})
	}

	if (props.showDiamonds && (props.diamonds > 0 || props.showZeroValues)) {
		items.push({
			type: 'diamonds',
			icon: '💎',
			amount: formatCurrency(props.diamonds),
			rawAmount: props.diamonds,
			label: props.diamondsLabel,
			premium: true
		})
	}

	return items
})

// Container classes
const containerClass = computed(() => {
	return {
		'currency-display': true,
		[`currency-display--${props.layout}`]: true,
		[`currency-display--${props.size}`]: true,
		[`currency-display--${props.variant}`]: true,
		'currency-display--with-labels': props.showLabels
	}
})
</script>

<template>
	<div :class="containerClass">
		<div
				v-for="item in displayItems"
				:key="item.type"
				class="currency-item"
				:class="{
        'currency-item--premium': item.premium,
        'currency-item--with-label': showLabels
      }"
		>
			<span class="currency-icon">{{ item.icon }}</span>

			<div v-if="showLabels" class="currency-info">
				<span class="currency-amount">{{ item.amount }}</span>
				<span class="currency-label">{{ item.label }}</span>
			</div>

			<span v-else class="currency-amount">{{ item.amount }}</span>
		</div>
	</div>
</template>

<style lang="scss" scoped>
// Base Currency Display Container
.currency-display {
	display: flex;
	align-items: center;
	gap: var(--space-2);

	// Layout variants
	&--horizontal {
		flex-direction: row;
	}

	&--vertical {
		flex-direction: column;
		align-items: stretch;
	}

	// Size variants
	&--small {
		gap: var(--space-1);

		.currency-icon {
			font-size: var(--font-size-sm);
		}

		.currency-amount {
			font-size: var(--font-size-xs);
		}

		.currency-label {
			font-size: var(--font-size-xxs);
		}
	}

	&--large {
		gap: var(--space-3);

		.currency-icon {
			font-size: var(--font-size-xl);
		}

		.currency-amount {
			font-size: var(--font-size-lg);
		}

		.currency-label {
			font-size: var(--font-size-sm);
		}

		.currency-item {
			padding: var(--space-2);
			background-color: var(--bg-secondary);
			border-radius: var(--border-radius-sm);
		}
	}

	// Style variants
	&--compact {
		gap: var(--space-1);

		.currency-item {
			padding: var(--space-1);
			background-color: var(--bg-secondary);
			border-radius: var(--border-radius-sm);
		}
	}

	&--card {
		.currency-item {
			padding: var(--space-2) var(--space-3);
			background-color: var(--card-bg);
			border: 1px solid var(--card-border);
			border-radius: var(--border-radius-md);
		}
	}

	// With labels layout
	&--with-labels {
		.currency-display--horizontal & {
			gap: var(--space-4);
		}

		.currency-display--vertical & {
			gap: var(--space-3);
		}
	}
}

// Currency Items
.currency-item {
	display: flex;
	align-items: center;
	gap: var(--space-1);

	.currency-display--vertical & {
		justify-content: space-between;
		width: 100%;
	}

	&--premium {
		background: linear-gradient(135deg, var(--button-gradient-start), var(--button-gradient-end));

		.currency-icon {
			filter: drop-shadow(0 0 4px rgba(96, 165, 250, 0.6));
		}
	}

	&--with-label {
		flex-direction: column;
		align-items: center;
		gap: var(--space-1);

		.currency-display--horizontal & {
			min-width: 60px;
		}
	}
}

.currency-icon {
	font-size: var(--font-size-base);
	line-height: 1;
	flex-shrink: 0;
}

.currency-amount {
	font-size: var(--font-size-sm);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	line-height: 1;
	white-space: nowrap;
}

.currency-info {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 0;
}

.currency-label {
	font-size: var(--font-size-xxs);
	color: var(--text-secondary);
	text-transform: uppercase;
	font-weight: var(--font-weight-bold);
	line-height: 1;
}
</style>