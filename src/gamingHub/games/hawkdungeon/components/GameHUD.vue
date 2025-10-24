<template>
  <div class="game-hud">
    <div class="hud-left">
      <div class="health-display">
        <span class="heart-icon">❤️</span>
        <span class="health-text">{{ health }}/{{ maxHealth }}</span>
      </div>
      <div class="mana-display">
        <span class="mana-icon">🧪</span>
        <span class="mana-text">{{ mana }}/{{ maxMana }}</span>
      </div>
    </div>

    <div class="hud-center"></div>

    <div class="hud-right">
      <div class="kills-display">
        <span class="kills-text">{{ kills }}/{{ killGoal }}</span>
        <span class="coin-icon">💰</span>
      </div>
    </div>
  </div>
</template>

<script setup>
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

.health-display,
.mana-display,
.kills-display {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0,0,0,0.6);
  padding: 8px 16px;
  border-radius: 20px;
  border: 2px solid rgba(255,255,255,0.2);
}

.heart-icon,
.mana-icon,
.coin-icon {
  font-size: 20px;
}

.health-text,
.mana-text,
.kills-text {
  color: white;
  font-size: 16px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.health-text {
  color: #ff4444;
}

.mana-text {
  color: #44aaff;
}

.kills-text {
  color: #ffaa44;
}
</style>