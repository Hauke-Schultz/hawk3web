<template>
  <div class="game-container">
    <div class="mole-game">
      <div class="stats-container">
        <div class="hit-count">WHACK: {{ hitCount }}</div>
        <div class="best-time">BEST: {{ bestHitCount }}</div>
      </div>
      <div class="level-indicator">
        Level {{ currentLevel }}
      </div>
      <div class="progress-bar">
        <div class="progress" :style="{ width: `${progressPercentage}%` }"></div>
      </div>
      <div class="grid" :class="{ 'grid--rotate': gridRotate }">
        <div v-for="(hole, index) in holes" :key="index" class="hole" @mousedown="whack(index)" :style="hole.backgroundStyle">
          <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="grassGradient" cx="50%" cy="100%" r="50%" fx="50%" fy="100%">
                <stop offset="0%" style="stop-color:#4CAF50;stop-opacity:1" />
                <stop offset="70%" style="stop-color:#4CAF50;stop-opacity:0.7" />
                <stop offset="100%" style="stop-color:#4CAF50;stop-opacity:0" />
              </radialGradient>
              <linearGradient id="dirtGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" style="stop-color:#8B4513;stop-opacity:1" />
                <stop offset="100%" style="stop-color:#654321;stop-opacity:1" />
              </linearGradient>
            </defs>
            <rect width="100" height="100" fill="url(#grassGradient)"/>
            <ellipse cx="50" cy="80" :rx="40 + (hole.holeDiff * 2)" ry="20" fill="url(#dirtGradient)"/>
            <path d="M 10 80 Q 50 50 90 80" fill="url(#dirtGradient)"/>
            <ellipse cx="30" cy="70" rx="10" ry="5" fill="#A0522D" opacity="0.7"/>
            <ellipse cx="70" cy="75" rx="8" ry="4" fill="#A0522D" opacity="0.7"/>
            <ellipse cx="50" cy="65" rx="12" ry="6" fill="#A0522D" opacity="0.7"/>
            <g opacity="0.9">
              <path d="M 15 80 C 13 70, 17 70, 15 60" stroke="#2E8B57" stroke-width="1" fill="none"/>
              <path d="M 25 75 C 23 65, 27 65, 25 55" stroke="#2E8B57" stroke-width="1" fill="none"/>
              <path d="M 85 80 C 87 70, 83 70, 85 60" stroke="#2E8B57" stroke-width="1" fill="none"/>
              <path d="M 75 75 C 77 65, 73 65, 75 55" stroke="#2E8B57" stroke-width="1" fill="none"/>
            </g>
            <ellipse cx="50" cy="75" :rx="20 + hole.holeDiff" ry="10" fill="#1a1a1a"/>
            <ellipse cx="50" cy="75" :rx="13 + hole.holeDiff" ry="8" fill="#000000"/>
          </svg>
          <div
              v-if="hole.show"
              v-html="hole.svg"
              class="mole"
              :class="{ 'mole--animation': isGameStarted, 'mole--fix': !isGameStarted }"
              :style="{ 'animation-duration': `${getMoleDisplayTime()}ms` }"
          />
          <svg v-if="hole.hit" class="pow" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="60" r="35" fill="#FFD700" class="pow-background"/>
            <polygon points="50,5 61,40 95,40 67,62 79,95 50,75 21,95 33,62 5,40 39,40" fill="#FF6347" class="pow-star"/>
            <text x="50" y="60" font-family="Arial" font-size="24" fill="#FF0000" text-anchor="middle" class="pow-text">POW!</text>
            <circle cx="20" cy="20" r="3" fill="#FFFFFF" class="star star1" />
            <circle cx="80" cy="20" r="2" fill="#FFFFFF" class="star star2" />
            <circle cx="20" cy="80" r="2" fill="#FFFFFF" class="star star3" />
            <circle cx="80" cy="80" r="3" fill="#FFFFFF" class="star star4" />
            <polygon points="50,10 52,15 58,15 53,19 55,25 50,21 45,25 47,19 42,15 48,15" fill="#FFFFFF" class="star star5" />
          </svg>
        </div>
      </div>
      <div class="game-status">{{ gameStatus }}</div>
      <div v-if="!isGameStarted" class="start-message">
        Whack the mole to start!
      </div>

      <svg class="hammer-cursor" width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="hammerHandle" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" style="stop-color:#5a5a5a;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#808080;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#5a5a5a;stop-opacity:1" />
          </linearGradient>
          <linearGradient id="hammerHead" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:#1a1a1a;stop-opacity:1" />
            <stop offset="50%" style="stop-color:#303030;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#1a1a1a;stop-opacity:1" />
          </linearGradient>
        </defs>

        <g transform="rotate(45 40 40)">
          <rect x="35" y="5" width="10" height="55" fill="url(#hammerHandle)" />
          <rect x="20" y="5" width="40" height="20" fill="url(#hammerHead)" />
          <rect x="22" y="7" width="36" height="2" fill="#4a4a4a" opacity="0.5" />
          <rect x="35" y="25" width="10" height="5" fill="#4a4a4a" />
        </g>
      </svg>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted, onUnmounted } from 'vue'

export default {
  setup() {
    const progress = ref(5)
    const gameInterval = ref(null)
    const gameStatus = ref('')
    const isGameOver = ref(false)
    const gridRotate = ref(false)
    const hitCount = ref(0)
    const bestHitCount = ref(parseInt(localStorage.getItem('bestHitCount')) || '-')
    const currentLevel = ref(1)
    const isGameStarted = ref(false)
    const startMoleIndex = ref(-1)
    const moleData = [
      {
        "name": "standard",
        "svg": `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="furGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:#4A4A4A;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2A2A2A;stop-opacity:1" />
          </radialGradient>
        </defs>
        <!-- Körper -->
        <ellipse cx="50" cy="60" rx="40" ry="35" fill="url(#furGradient)" />
        <!-- Kopf -->
        <circle cx="50" cy="40" r="30" fill="url(#furGradient)" />
        <!-- Schnauze -->
        <ellipse cx="50" cy="50" rx="15" ry="10" fill="#FFDBAC" />
        <!-- Nase -->
        <circle cx="50" cy="48" r="5" fill="#FF9999" />
        <!-- Augen -->
        <circle cx="35" cy="35" r="5" fill="black" />
        <circle cx="65" cy="35" r="5" fill="black" />
        <circle cx="37" cy="33" r="2" fill="white" />
        <circle cx="67" cy="33" r="2" fill="white" />
        <!-- Schnurrhaare -->
        <line x1="40" y1="50" x2="25" y2="45" stroke="white" stroke-width="1" />
        <line x1="40" y1="52" x2="25" y2="52" stroke="white" stroke-width="1" />
        <line x1="40" y1="54" x2="25" y2="59" stroke="white" stroke-width="1" />
        <line x1="60" y1="50" x2="75" y2="45" stroke="white" stroke-width="1" />
        <line x1="60" y1="52" x2="75" y2="52" stroke="white" stroke-width="1" />
        <line x1="60" y1="54" x2="75" y2="59" stroke="white" stroke-width="1" />
        <!-- Pfoten -->
        <ellipse cx="30" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(-30 30 85)" />
        <ellipse cx="70" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(30 70 85)" />
      </svg>
    `
      },
      {
        "name": "glasses",
        "svg": `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="furGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:#4A4A4A;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2A2A2A;stop-opacity:1" />
          </radialGradient>
        </defs>
        <!-- Körper -->
        <ellipse cx="50" cy="60" rx="40" ry="35" fill="url(#furGradient)" />
        <!-- Kopf -->
        <circle cx="50" cy="40" r="30" fill="url(#furGradient)" />
        <!-- Schnauze -->
        <ellipse cx="50" cy="50" rx="15" ry="10" fill="#FFDBAC" />
        <!-- Nase -->
        <circle cx="50" cy="48" r="5" fill="#FF9999" />
        <!-- Augen mit Brille -->
        <circle cx="35" cy="35" r="8" fill="white" stroke="#FFD700" stroke-width="2" />
        <circle cx="65" cy="35" r="8" fill="white" stroke="#FFD700" stroke-width="2" />
        <circle cx="35" cy="35" r="4" fill="black" />
        <circle cx="65" cy="35" r="4" fill="black" />
        <path d="M 43 35 L 57 35" stroke="#FFD700" stroke-width="2" fill="none" />
        <!-- Schnurrhaare -->
        <line x1="40" y1="50" x2="25" y2="45" stroke="white" stroke-width="1" />
        <line x1="40" y1="52" x2="25" y2="52" stroke="white" stroke-width="1" />
        <line x1="40" y1="54" x2="25" y2="59" stroke="white" stroke-width="1" />
        <line x1="60" y1="50" x2="75" y2="45" stroke="white" stroke-width="1" />
        <line x1="60" y1="52" x2="75" y2="52" stroke="white" stroke-width="1" />
        <line x1="60" y1="54" x2="75" y2="59" stroke="white" stroke-width="1" />
        <!-- Pfoten -->
        <ellipse cx="30" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(-30 30 85)" />
        <ellipse cx="70" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(30 70 85)" />
      </svg>
    `
      },
      {
        "name": "hat",
        "svg": `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="furGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:#4A4A4A;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2A2A2A;stop-opacity:1" />
          </radialGradient>
        </defs>
        <!-- Körper -->
        <ellipse cx="50" cy="60" rx="40" ry="35" fill="url(#furGradient)" />
        <!-- Kopf -->
        <circle cx="50" cy="40" r="30" fill="url(#furGradient)" />
        <!-- Schnauze -->
        <ellipse cx="50" cy="50" rx="15" ry="10" fill="#FFDBAC" />
        <!-- Nase -->
        <circle cx="50" cy="48" r="5" fill="#FF9999" />
        <!-- Augen -->
        <circle cx="35" cy="35" r="5" fill="black" />
        <circle cx="65" cy="35" r="5" fill="black" />
        <circle cx="37" cy="33" r="2" fill="white" />
        <circle cx="67" cy="33" r="2" fill="white" />
        <!-- Hut -->
        <path d="M 20 40 Q 50 0 80 40" fill="#8B4513" />
        <ellipse cx="50" cy="40" rx="35" ry="10" fill="#8B4513" />
        <rect x="15" y="38" width="70" height="5" fill="#DAA520" />
        <!-- Schnurrhaare -->
        <line x1="40" y1="50" x2="25" y2="45" stroke="white" stroke-width="1" />
        <line x1="40" y1="52" x2="25" y2="52" stroke="white" stroke-width="1" />
        <line x1="40" y1="54" x2="25" y2="59" stroke="white" stroke-width="1" />
        <line x1="60" y1="50" x2="75" y2="45" stroke="white" stroke-width="1" />
        <line x1="60" y1="52" x2="75" y2="52" stroke="white" stroke-width="1" />
        <line x1="60" y1="54" x2="75" y2="59" stroke="white" stroke-width="1" />
        <!-- Pfoten -->
        <ellipse cx="30" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(-30 30 85)" />
        <ellipse cx="70" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(30 70 85)" />
      </svg>
    `
      },
      {
        "name": "sleepy",
        "svg": `
      <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="furGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style="stop-color:#4A4A4A;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#2A2A2A;stop-opacity:1" />
          </radialGradient>
        </defs>
        <!-- Körper -->
        <ellipse cx="50" cy="60" rx="40" ry="35" fill="url(#furGradient)" />
        <!-- Kopf -->
        <circle cx="50" cy="40" r="30" fill="url(#furGradient)" />
        <!-- Schnauze -->
        <ellipse cx="50" cy="50" rx="15" ry="10" fill="#FFDBAC" />
        <!-- Nase -->
        <circle cx="50" cy="48" r="5" fill="#FF9999" />
        <!-- Geschlossene Augen -->
        <path d="M 30 35 Q 35 30 40 35" fill="none" stroke="white" stroke-width="2" />
        <path d="M 60 35 Q 65 30 70 35" fill="none" stroke="white" stroke-width="2" />
        <!-- Mund (gähnend) -->
        <ellipse cx="50" cy="60" rx="10" ry="8" fill="#FF9999" />
        <path d="M 43 60 Q 50 70 57 60" fill="none" stroke="white" stroke-width="2" />
        <!-- Schlafblasen -->
        <circle cx="75" cy="25" r="5" fill="white" opacity="0.7" />
        <circle cx="85" cy="15" r="7" fill="white" opacity="0.7" />
        <circle cx="95" cy="5" r="4" fill="white" opacity="0.7" />
        <!-- Schnurrhaare -->
        <line x1="40" y1="50" x2="25" y2="45" stroke="white" stroke-width="1" />
        <line x1="40" y1="52" x2="25" y2="52" stroke="white" stroke-width="1" />
        <line x1="40" y1="54" x2="25" y2="59" stroke="white" stroke-width="1" />
        <line x1="60" y1="50" x2="75" y2="45" stroke="white" stroke-width="1" />
        <line x1="60" y1="52" x2="75" y2="52" stroke="white" stroke-width="1" />
        <line x1="60" y1="54" x2="75" y2="59" stroke="white" stroke-width="1" />
        <!-- Pfoten -->
        <ellipse cx="30" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(-30 30 85)" />
        <ellipse cx="70" cy="85" rx="10" ry="7" fill="#FFDBAC" transform="rotate(30 70 85)" />
      </svg>
    `
      }
    ];
    const progressPercentage = computed(() => (progress.value / 10) * 100);

    const getRandomColor = (r1, r2, g1, g2, b1, b2) => {
      const r = Math.floor(Math.random() * (r2 - r1 + 1)) + r1;
      const g = Math.floor(Math.random() * (g2 - g1 + 1)) + g1;
      const b = Math.floor(Math.random() * (b2 - b1 + 1)) + b1;
      return `rgb(${r},${g},${b})`;
    };

    const adjustColor = (color, rDiff, gDiff, bDiff, alpha) => {
      const [r, g, b] = color.match(/\d+/g).map(Number);
      const newR = Math.min(255, Math.max(0, r + rDiff));
      const newG = Math.min(255, Math.max(0, g + gDiff));
      const newB = Math.min(255, Math.max(0, b + bDiff));
      return `rgba(${newR},${newG},${newB},${alpha})`;
    };

    const generateHoleBackground = () => {
      const baseColor = getRandomColor(65, 115, 149, 199, 27, 67);
      const lightColor = adjustColor(baseColor, 0, 10, 0, 0.4);
      return `linear-gradient(0deg, ${baseColor} 46%, ${lightColor} 100%)`;
    };

    const holes = ref(Array(9).fill().map(() => ({
      show: false,
      hit: false,
      svg: '',
      holeDiff: Math.random() * 10 - 4,
      backgroundStyle: {
        background: generateHoleBackground(),
      }
    })));

    let moleAnimation = ref(false)

    const showRandomMole = () => {
      if (!isGameStarted.value || isGameOver.value) return

      const availableHoles = holes.value.map((hole, index) => ({ hole, index }))
          .filter(item => !item.hole.show && !item.hole.hit);
      if (availableHoles.length > 0) {
        const numMoles = currentLevel.value >= 2 ? 2 : 1;
        for (let i = 0; i < numMoles; i++) {
          if (availableHoles.length > 0) {
            const randomIndex = Math.floor(Math.random() * availableHoles.length);
            const selectedHole = availableHoles[randomIndex];

            const showMole = () => {
              if (isGameOver.value) return;  // Nochmalige Prüfung vor dem Anzeigen
              holes.value[selectedHole.index].show = true;
              holes.value[selectedHole.index].svg = getRandomMoleSVG();

              setTimeout(() => {
                if (holes.value[selectedHole.index].show) {
                  holes.value[selectedHole.index].show = false;
                  holes.value[selectedHole.index].svg = '';
                  if (!isGameOver.value) {
                    updateProgress(-1);
                  }
                }
              }, getMoleDisplayTime());
            };

            if (currentLevel.value >= 2 && i === 1) {
              setTimeout(showMole, 500);
            } else {
              showMole();
            }

            availableHoles.splice(randomIndex, 1);
          }
        }
      }
    };

    const getRandomMoleSVG = () => {
      const randomIndex = Math.floor(Math.random() * moleData.length);
      return moleData[randomIndex].svg;
    }

    const getMoleDisplayTime = () => {
      switch (currentLevel.value) {
        case 1: return 1400;
        case 2: return 1200;
        case 3: return 1000;
        case 4: return 900;
        case 5: return 800;
        default: return 800;
      }
    }

    const whack = (index) => {
      if (!isGameStarted.value && index === startMoleIndex.value) {
        isGameStarted.value = true
        isGameOver.value = false
        currentLevel.value = 1
        progress.value = 5
        gameStatus.value = ''
        hitCount.value = 0
        gameInterval.value = setInterval(showRandomMole, getMoleDisplayTime())
      }

      if (holes.value[index].show || (!isGameStarted.value && index === startMoleIndex.value)) {
        holes.value[index].show = false
        holes.value[index].hit = true
        hitCount.value++
        updateProgress(1)
        animateHammer()
        setTimeout(() => {
          holes.value[index].hit = false
        }, 700)
      }
    }

    const animateHammer = () => {
      const hammer = document.querySelector('.hammer-cursor')
      hammer.classList.add('hammer-swing')
      setTimeout(() => {
        hammer.classList.remove('hammer-swing')
      }, 200)
    }

    const updateProgress = (value) => {
      progress.value += value
      progress.value = progress.value >= 10 ? 10 : progress.value;
      console.log(value, progress.value, hitCount.value % 7, hitCount.value % 7 === 0);
      if (progress.value <= 0) {
        endGame()
      } else if (hitCount.value % 7 === 0) {
        startNextLevel()
      }
    }

    const startNextLevel = () => {
      currentLevel.value++;
      clearInterval(gameInterval.value);
      gameInterval.value = setInterval(showRandomMole, getMoleDisplayTime());

      if (currentLevel.value === 3) {
        gridRotate.value = true;
      }
    }

    const showStartMole = () => {
      const randomIndex = Math.floor(Math.random() * holes.value.length)
      startMoleIndex.value = randomIndex
      holes.value = holes.value.map(() => ({
        show: false,
        hit: false,
        svg: '',
        holeDiff: Math.random() * 10 - 4,
        backgroundStyle: {
          background: generateHoleBackground()
        }
      }))
      holes.value[randomIndex].show = true
      holes.value[randomIndex].svg = getRandomMoleSVG()
    }

    const endGame = () => {
      isGameOver.value = true
      isGameStarted.value = false
      clearInterval(gameInterval.value)
      gameStatus.value = `You've whacked ${hitCount.value} moles!`;
      if (bestHitCount.value === '-' || hitCount.value > parseInt(bestHitCount.value)) {
        bestHitCount.value = hitCount.value;
        localStorage.setItem('bestHitCount', hitCount.value)
      }
      gridRotate.value = false;
      clearInterval(gameInterval.value)
      showStartMole()
    }

    const startGameWithMole = () => {
      isGameStarted.value = false
      clearInterval(gameInterval.value)
      showStartMole()
    }

    onMounted(() => {
      startGameWithMole()

      const hammer = document.querySelector('.hammer-cursor')
      const gameContainer = document.querySelector('.game-container')

      gameContainer.addEventListener('mousemove', (e) => {
        const rect = gameContainer.getBoundingClientRect()
        const x = e.clientX - hammer.clientWidth / 2
        const y = e.clientY - hammer.clientHeight * 0.2
        hammer.style.left = `${x}px`
        hammer.style.top = `${y}px`
      })

      gameContainer.addEventListener('mousedown', (e) => {
        e.preventDefault()
      })
    })

    onUnmounted(() => {
      clearInterval(gameInterval.value)
    })

    return {
      holes,
      progressPercentage,
      whack,
      moleAnimation,
      getMoleDisplayTime,
      currentLevel,
      hitCount,
      bestHitCount,
      gameStatus,
      gridRotate,
      isGameStarted
    }
  }
}
</script>

<style>
.grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  width: 300px;
  height: 300px;
  margin: 40px auto 0;
  transform-origin: center center;
}

.grid--rotate {
  animation: rotateGrid 10s linear infinite;
}

.grid--rotate .hole {
  animation: rotateHole 10s linear infinite;
}

.game-container {
  max-width: 350px;
  margin: 0 auto;
  cursor: none;
  user-select: none;
  position: relative;
  overflow: hidden;
  padding: 20px;
}

.mole-game {
  position: relative;
}

.stats-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 18px;
  font-weight: bold;
}

.hit-count {
  color: #4CAF50;
}

.best-time {
  color: #2196F3;
}

.level-indicator {
  text-align: center;
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 10px;
  position: absolute;
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #ddd;
  margin-bottom: 20px;
  border-radius: 10px;
}

.progress {
  height: 100%;
  background-color: #4CAF50;
  transition: width 0.3s ease;
  border-radius: 10px;
}

.start-message {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  margin: 20px 0;
  color: #4CAF50;
}

.hole {
  aspect-ratio: 1;
  border-radius: 50%;
  overflow: hidden;
  position: relative;
}

.mole, .pow {
  width: 100%;
  height: 100%;
  position: absolute;
  bottom: 0;
  left: 0;
}

.mole {
  transform: translateY(100%);
}

.mole--animation {
  animation: moleAnimation 1400ms linear;
}

.mole--fix {
  transform: translateY(0%);
  animation: moleFix 1s linear;
}

.game-status {
  text-align: center;
  margin-top: 20px;
  font-size: 24px;
  font-weight: bold;
}

.hammer-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  transition: transform 0.1s ease-out;
  transform-origin: 90% 90%;
}

.hammer-swing {
  animation: hammerSwing 0.2s ease-in-out;
}

.pow {
  width: 100%;
  height: 100%;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 2;
}

.pow-background {
  animation: popAndFade 0.7s ease-out;
  transform-origin: center;
}

.pow-star {
  animation: rotateStar 0.7s ease-out;
  transform-origin: center;
}

.pow-text {
  animation: blink 0.7s ease-out 3;
}

.star {
  animation: moveUpDown 0.7s ease-in-out infinite;
}

.star1 { animation-delay: 0s; }
.star2 { animation-delay: 0.1s; }
.star3 { animation-delay: 0.2s; }
.star4 { animation-delay: 0.3s; }
.star5 {
  animation: moveUpDown 0.7s ease-in-out infinite, rotateStar 2s linear infinite;
  transform-origin: center;
}

@keyframes rotateGrid {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
@keyframes rotateHole {
  from { transform: rotate(360deg); }
  to { transform: rotate(0deg); }
}
@keyframes moleFix {
  0%   { transform: translateY(100%); }
  40%  { transform: translateY(0%); }
  100% { transform: translateY(0%); }
}
@keyframes moleAnimation {
  0%   { transform: translateY(100%); }
  40%  { transform: translateY(0%); }
  60%  { transform: translateY(0%); }
  100% { transform: translateY(100%); }
}
@keyframes hammerSwing {
  0%   { transform: rotate(0deg); }
  50%  { transform: rotate(-50deg); }
  100% { transform: rotate(0deg); }
}
@keyframes popAndFade {
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1.2); opacity: 0; }
}
@keyframes rotateStar {
  0% { opacity: 0.2; transform: rotate(0deg) scale(0.5); }
  100% { opacity: 0.9; transform: rotate(360deg) scale(1); }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
@keyframes moveUpDown {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>