<template>
  <div class="game-hud">
    <div class="hud-left">
      <div class="indicator-container">
        <LiquidIndicator
          :current-value="health"
          :max-value="maxHealth"
          :color-from="'rgb(185, 28, 28)'"
          :color-to="'rgb(239, 68, 68)'"
          :show-value="true"
          :size="64"
          :regeneration-interval="10000"
          type="health"
        />
      </div>
      <div class="indicator-container">
        <LiquidIndicator
          :current-value="mana"
          :max-value="maxMana"
          :color-from="'rgb(29, 78, 216)'"
          :color-to="'rgb(59, 130, 246)'"
          :show-value="true"
          :size="64"
          :regeneration-interval="10000"
          type="mana"
        />
      </div>
    </div>

    <div class="hud-center"></div>

    <div class="hud-right">
      <div class="indicator-container">
        <LiquidIndicator
          :current-value="kills"
          :max-value="killGoal"
          :color-from="'rgb(217, 119, 6)'"
          :color-to="'rgb(251, 191, 36)'"
          :show-value="true"
          :size="64"
          :regeneration-interval="null"
          type="kills"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import LiquidIndicator from './LiquidIndicator.vue'

defineProps({
  health: {
    type: Number,
    required: true
  },
  maxHealth: {
    type: Number,
    required: true
  },
  mana: {
    type: Number,
    required: true
  },
  maxMana: {
    type: Number,
    required: true
  },
  kills: {
    type: Number,
    required: true
  },
  killGoal: {
    type: Number,
    required: true
  },
  coins: {
    type: Number,
    required: true
  }
})
</script>

<style scoped>
.game-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  background: linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 100%);
  z-index: 100;
  font-family: 'Arial', sans-serif;
  font-weight: bold;
}

.hud-left,
.hud-center,
.hud-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.indicator-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

.indicator-label {
  position: absolute;
  bottom: -8px;
  font-size: 20px;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));
  pointer-events: none;
}

.kills-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.6);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid rgba(255,255,255,0.2);
}

.coin-icon {
  font-size: 20px;
}

.kills-text {
  color: white;
  font-size: 16px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
  color: #ffaa44;
}
</style>