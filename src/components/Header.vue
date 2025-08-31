<script setup>
import { useRouter } from 'vue-router'
import { useI18n } from '../composables/useI18n.js'
import Icon from "./Icon.vue";

const { t } = useI18n()
const router = useRouter()

</script>

<template>
	<header class="header">
		<div class="header-container">
			<div class="header-left" @click="router.push('/')">
				<h1 class="site-title">{{ t('portfolio.pageTitle') }}</h1>
			</div>
			<button class="btn btn--circle-ghost" style="border-width: 0" @click="router.push('/about')">
				<Icon name="info" size="20" />
			</button>
			<button class="btn btn--circle-ghost" style="border-width: 0" @click="router.push('/settings')">
				<Icon name="settings" size="20" />
			</button>
		</div>
	</header>
</template>

<style lang="scss" scoped>
.header {
	background-color: var(--bg-header);
	border-bottom: 1px solid var(--card-border);
	width: 100%;
}

.header-container {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: var(--space-3) var(--space-4);
	max-width: var(--content-width);
	margin: 0 auto;
}

.header-left {
	cursor: pointer;
	flex: 1;
}

.site-title {
	font-size: var(--font-size-xl);
	font-weight: var(--font-weight-bold);
	color: var(--text-color);
	margin: 0;
}
</style>