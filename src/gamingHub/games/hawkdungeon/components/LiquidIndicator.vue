<script setup>
  import { ref, watch, computed, onMounted, onUnmounted } from 'vue';

  const props = defineProps({
    currentValue: {
      type: Number,
      required: true
    },
    maxValue: {
      type: Number,
      required: true
    },
    colorFrom: {
      type: String,
      default: 'rgb(185, 28, 28)'
    },
    colorTo: {
      type: String,
      default: 'rgb(239, 68, 68)'
    },
    showValue: {
      type: Boolean,
      default: false
    },
    size: {
      type: Number,
      default: 64
    },
    player: {
      type: Object,
      required: false
    },
    type: {
      type: String,
      default: 'health'
    },
    regenerationInterval: {
      type: Number,
      default: null
    }
  });

  const emit = defineEmits(['regenerated']);

  const value = ref(props.currentValue);
  const regenerationProgress = ref(0);
  let regenerationTimer = null;

  const percentage = computed(() => (value.value / props.maxValue) * 100);
  const bubbleStyle1 = computed(() => ({
    left: `${Math.random() * 80 + 10}%`,
    bottom: `${Math.min(percentage.value, 100)}%`
  }));

  const bubbleStyle2 = computed(() => ({
    left: `${Math.random() * 80 + 10}%`,
    bottom: `${Math.min(percentage.value, 100)}%`
  }));

  const containerStyle = computed(() => ({
    width: `${props.size}px`,
    height: `${props.size}px`
  }));
  const textStyle = computed(() => ({
    top: `${50 - percentage.value / 2}%`
  }));
  const liquidStyle = computed(() => ({
    height: `${percentage.value}%`,
    background: `linear-gradient(to top, ${props.colorFrom}, ${props.colorTo})`
  }));
  const borderGradientStyle = computed(() => {
    if (regenerationProgress.value > 0) {
      return {
        background: `conic-gradient(
        ${props.colorTo} ${regenerationProgress.value * 3.6}deg,
        rgba(0, 0, 0, 1) ${regenerationProgress.value * 3.6}deg
      )`
      };
    }
    return {};
  });

  watch(() => props.currentValue, (newValue) => {
    value.value = newValue;
  });

  const startRegeneration = () => {
    if (!props.regenerationInterval) return;
    const updateRate = 100;
    regenerationTimer = setInterval(() => {
      if (value.value < props.maxValue) {
        regenerationProgress.value += (updateRate / props.regenerationInterval) * 100;
        if (regenerationProgress.value >= 100) {
          regenerationProgress.value = 0;
          emit('regenerated');
        }
      } else {
        regenerationProgress.value = 0;
      }
    }, updateRate);
  };

  onMounted(() => {
    if (props.regenerationInterval) {
      startRegeneration();
    }
  });

  onUnmounted(() => {
    clearInterval(regenerationTimer);
  });
</script>

<template>
  <div class="liquid-indicator" :style="containerStyle">
    <div class="border-container" :style="borderGradientStyle"></div>
    <div class="glass-container"></div>
    <div class="shine-effect"></div>
    <div class="liquid-container">
      <div
          class="liquid"
          :style="liquidStyle"
      ></div>
      <div class="liquid-shine"></div>
      <div class="bubbles">
        <div class="bubble bubble-1" :style="bubbleStyle1"></div>
        <div class="bubble bubble-2" :style="bubbleStyle2"></div>
      </div>
    </div>
    <div v-if="showValue" class="value-text" :style="textStyle">
      <span>{{ value }}</span>
    </div>
  </div>
</template>

<style scoped>
  .liquid-indicator {
    position: relative;
    min-width: 64px;
  }

  .border-container {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background-color: rgba(243, 244, 246, 0.1);
    border: 4px solid rgba(243, 244, 246, 1);
    backdrop-filter: blur(2px);
  }

  .glass-container {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background-color: rgba(0, 0, 0, 0.1);
  }

  .shine-effect {
    position: absolute;
    inset: 4px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 100%);
    clip-path: polygon(0 0, 100% 0, 100% 40%, 0 40%);
  }

  .liquid-container {
    position: absolute;
    border-radius: 50%;
    overflow: hidden;
    background-color: rgba(17, 24, 39, 0.1);
    width: 100%;
    height: 100%;
    left: 0;
    top: 0;
    border: 6px solid transparent;
  }

  .liquid {
    position: absolute;
    bottom: 0;
    width: 100%;
    transition: all 0.3s ease-out;
  }

  .liquid-shine {
    position: absolute;
    inset: 0;
    background: linear-gradient(
        to top,
        transparent,
        rgba(255, 255, 255, 0.05) 50%,
        rgba(255, 255, 255, 0.2) 100%
    );
  }

  .bubbles {
    position: absolute;
    inset: 0;
  }

  .bubble {
    position: absolute;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.3);
    animation: float 2s ease-in-out infinite;
  }

  .bubble-1 {
    width: 4px;
    height: 4px;
    left: 30%;
  }

  .bubble-2 {
    width: 6px;
    height: 6px;
    left: 60%;
    animation-delay: 0.5s;
  }

  .value-text {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 50%;
  }

  .value-text span {
    color: white;
    font-size: 14px;
    font-weight: bold;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  }

  @keyframes float {
    0% {
      transform: translateY(2px);
      opacity: 0;
    }
    50% {
      opacity: 1;
    }
    100% {
      opacity: 0;
      transform: translateY(-10px);
    }
  }
</style>