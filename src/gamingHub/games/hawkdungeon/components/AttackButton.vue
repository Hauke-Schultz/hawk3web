<template>
  <div class="attack-button-container">
    <button
      class="attack-button"
      :class="{ 'on-cooldown': cooldown > 0 }"
      @click="handleAttack"
      @touchstart.prevent="handleAttack"
    >
      <div class="button-content">
        <div class="weapon-icon">⚔️</div>
        <div class="button-text">ATTACK</div>
      </div>
      <div
        v-if="cooldown > 0"
        class="cooldown-overlay"
        :style="{ height: `${(cooldown / maxCooldown) * 100}%` }"
      />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  cooldown: {
    type: Number,
    default: 0
  },
  weapon: {
    type: String,
    default: 'sword'
  }
})

const emit = defineEmits(['attack'])

const maxCooldown = ref(0.5)

const handleAttack = () => {
  if (props.cooldown <= 0) {
    emit('attack')
  }
}
</script>

<style scoped>
.attack-button-container {
  position: relative;
}

.attack-button {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ff4444 0%, #cc0000 100%);
  border: 4px solid #ffffff;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.3);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: transform 0.1s, box-shadow 0.1s;
}

.attack-button:active:not(.on-cooldown) {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(0,0,0,0.4), inset 0 -2px 8px rgba(0,0,0,0.3);
}

.attack-button.on-cooldown {
  opacity: 0.6;
  cursor: not-allowed;
}

.button-content {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: white;
  font-weight: bold;
}

.weapon-icon {
  font-size: 32px;
  margin-bottom: 4px;
}

.button-text {
  font-size: 12px;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
}

.cooldown-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0.5);
  transition: height 0.05s linear;
  z-index: 1;
}
</style>