<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import * as Matter from 'matter-js'

const score = ref(0)
const fruits = ref([]);
const nextFruitId = ref(0);
const gameBoard = ref(null);
const nextFruitPosition = ref(0);
const isDragging = ref(false);
const boardWidth = ref(270);
const boardHeight = ref(490);
const wallThickness = 20;
const targetFruitLevel = computed(() => Math.min(5 + level.value, fruitTypes.length - 1));
const level = ref(1);
const levelCompleted = ref(false);
const showNextFruit = ref(true);
const canDropFruit = ref(true);
const dropCooldown = ref(false);
const gameOver = ref(false);
const topViolations = ref({});
const gameOverDelay = 4000;
const showStartScreen = ref(true)
const gameActive = ref(false)
const maxUnlockedLevel = ref(1)
const highscores = ref([])
const showHighscores = ref(false)
const showFruitList = ref(false)
const showNameInput = ref(false)
const playerName = ref('')
const newHighscoreLevel = ref(0)
const newHighscoreScore = ref(0)
const availableLevels = ref([
  { number: 1, name: "Level 1", unlocked: true },
  { number: 2, name: "Level 2", unlocked: false },
  { number: 3, name: "Level 3", unlocked: false },
  { number: 4, name: "Level 4", unlocked: false },
  { number: 5, name: "Level 5", unlocked: false },
  { number: 6, name: "Level 6", unlocked: false },
  { number: 7, name: "Level 7", unlocked: false },
  { number: 8, name: "Level 8", unlocked: false },
  { number: 9, name: "Level 9", unlocked: false },
])
const hammerCount = ref(0)
const hammerActive = ref(false)
const showHammerEffect = ref(false)
const rocketCount = ref(0)
const rocketActive = ref(false)
const showRocketEffect = ref(false)
const topBoundary = computed(() => {
  return Math.max(30, 200 - (level.value - 1) * 15);
});
const nextFruitFading = ref(false);
const lastHammerThreshold = ref(0)
const lastRocketThreshold = ref(0)

let engine = null;
let runner = null;

const fruitTypes = [
  {
    size: 32, color: '#9C27B0', level: 1, name: 'Blueberry',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="blueberryGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#BA68C8"/>
            <stop offset="100%" style="stop-color:#9C27B0"/>
        </radialGradient>
        <radialGradient id="mouthGrad" cx="0.5" cy="0.3">
            <stop offset="0%" style="stop-color:#2E2E2E"/>
            <stop offset="100%" style="stop-color:#000000"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#blueberryGrad)" stroke="#6A1B9A" stroke-width="2"/>
    <circle cx="20" cy="20" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#7B1FA2" opacity="0.6"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="6" ry="6" fill="white"/>
        <ellipse cx="40" cy="26" rx="6" ry="6" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <ellipse cx="24" cy="26" rx="7" ry="7" fill="white"/>
        <ellipse cx="40" cy="26" rx="7" ry="7" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <ellipse cx="32" cy="42" rx="10" ry="8" fill="url(#mouthGrad)" stroke="#000" stroke-width="1.5"/>
        <ellipse cx="32" cy="45" rx="6" ry="4" fill="#FF6B9D" opacity="0.8"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#8E24AA" opacity="0.4"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#8E24AA" opacity="0.4"/>
</svg>`
  },
  {
    size: 38, color: '#E91E63', level: 2, name: 'Strawberry',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="strawberryGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#F06292"/>
            <stop offset="100%" style="stop-color:#E91E63"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#strawberryGrad)" stroke="#C2185B" stroke-width="2"/>
    <circle cx="22" cy="22" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="40" cy="20" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="20" cy="38" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="44" cy="40" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="32" cy="46" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="28" cy="16" r="1" fill="#FFEB3B" opacity="0.8"/>
    <circle cx="36" cy="48" r="1" fill="#FFEB3B" opacity="0.8"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="6" ry="6" fill="white"/>
        <ellipse cx="40" cy="26" rx="6" ry="6" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <ellipse cx="24" cy="26" rx="9" ry="9" fill="white" stroke="#ddd" stroke-width="1"/>
        <ellipse cx="40" cy="26" rx="9" ry="9" fill="white" stroke="#ddd" stroke-width="1"/>
        <circle cx="24" cy="26" r="3" fill="black"/>
        <circle cx="40" cy="26" r="3" fill="black"/>
        <circle cx="25.5" cy="24.5" r="1.5" fill="white"/>
        <circle cx="41.5" cy="24.5" r="1.5" fill="white"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#F8BBD9" opacity="0.6"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#F8BBD9" opacity="0.6"/>
    <path d="M30,8 L34,8 L36,12 L28,12 Z" fill="#4CAF50"/>
</svg>`
  },
  {
    size: 42, color: '#FFEB3B', level: 3, name: 'Lemon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
      <radialGradient id="lemonGrad" cx="0.3" cy="0.3">
        <stop offset="0%" style="stop-color:#FFF176"/>
        <stop offset="100%" style="stop-color:#FFEB3B"/>
      </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#lemonGrad)" stroke="#F57F17" stroke-width="2"/>
    <ellipse cx="22" cy="20" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="42" cy="18" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="18" cy="40" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="46" cy="42" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <ellipse cx="32" cy="48" rx="2" ry="1" fill="#F9A825" opacity="0.5"/>
    <g id="openEyes">
      <ellipse cx="24" cy="26" rx="4" ry="5" fill="white"/>
      <ellipse cx="40" cy="26" rx="4" ry="5" fill="white"/>
      <circle cx="24" cy="26" r="2.5" fill="black"/>
      <circle cx="40" cy="26" r="2.5" fill="black"/>
      <circle cx="25" cy="25" r="1" fill="white"/>
      <circle cx="41" cy="25" r="1" fill="white"/>
      <animate
        attributeName="opacity"
        values="1; 1; 0; 1; 1"
        dur="3s"
        repeatCount="indefinite"
        calcMode="discrete"/>
    </g>
    <g id="closedEyes">
      <line x1="20" y1="26" x2="28" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
      <line x1="36" y1="26" x2="44" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
      <animate
        attributeName="opacity"
        values="0; 0; 1; 0; 0"
        dur="3s"
        repeatCount="indefinite"
        calcMode="discrete"/>
    </g>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FFC107" opacity="0.4"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FFC107" opacity="0.4"/>
</svg>`
  },
  {
    size: 48, color: '#FF9800', level: 4, name: 'Orange',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="orangeGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#FFB74D"/>
            <stop offset="100%" style="stop-color:#FF9800"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#orangeGrad)" stroke="#E65100" stroke-width="2"/>
    <circle cx="20" cy="20" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#FF7043" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#FF7043" opacity="0.6"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="6s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <ellipse cx="24" cy="26" rx="4" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <line x1="36" y1="26" x2="44" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="6s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FF5722" opacity="0.4"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FF5722" opacity="0.4"/>
</svg>`
  },
  {
    size: 56, color: '#8BC34A', level: 5, name: 'Apple',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="appleGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color: #5fe865"/>
            <stop offset="100%" style="stop-color: #36c904"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#appleGrad)" stroke="#4b9916" stroke-width="2"/>
    <circle cx="20" cy="20" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="44" cy="18" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="18" cy="40" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="46" cy="42" r="1.5" fill="#689F38" opacity="0.6"/>
    <circle cx="32" cy="48" r="1.5" fill="#689F38" opacity="0.6"/>
    <g id="openEyes">
        <ellipse cx="24" cy="26" rx="7" ry="7" fill="white"/>
        <ellipse cx="40" cy="26" rx="6" ry="6" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#C8E6C9" opacity="0.6"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#C8E6C9" opacity="0.6"/>
        <animate
                attributeName="opacity"
                values="1; 1; 0; 1; 1"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <g id="closedEyes">
        <line x1="20" y1="25" x2="28" y2="26" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <line x1="36" y1="26" x2="44" y2="25" stroke="black" stroke-width="2" stroke-linecap="round"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="14" cy="32" rx="9" ry="8" fill="#FF0000" opacity="0.4"/>
        <ellipse cx="50" cy="32" rx="9" ry="8" fill="#FF0000" opacity="0.4"/>
        <animate
                attributeName="opacity"
                values="0; 0; 1; 0; 0"
                dur="10s"
                repeatCount="indefinite"
                calcMode="discrete"/>
    </g>
    <ellipse cx="30" cy="8" rx="4" ry="2" fill="#795548"/>
    <ellipse cx="34" cy="6" rx="2" ry="3" fill="#4CAF50"/>
</svg>`
  },
  {
    size: 64, color: '#FFAB91', level: 6, name: 'Peach',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="peachGrad" cx="0.3" cy="0.3">
          <stop offset="0%" style="stop-color:#FFCC80"/>
          <stop offset="100%" style="stop-color:#FFAB91"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#peachGrad)" stroke="#FF8A65" stroke-width="2"/>
      <path d="M28,8 Q32,12 36,8" stroke="#FF7043" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M24,16 Q32,20 40,16" stroke="#FF7043" stroke-width="1.5" fill="none" opacity="0.5"/>
      <path d="M20,28 Q32,32 44,28" stroke="#FF7043" stroke-width="1.5" fill="none" opacity="0.4"/>
      <path d="M22,44 Q32,40 42,44" stroke="#FF7043" stroke-width="1.5" fill="none" opacity="0.4"/>
      <circle cx="20" cy="20" r="1.5" fill="#FF8A65" opacity="0.6"/>
      <circle cx="44" cy="18" r="1.5" fill="#FF8A65" opacity="0.6"/>
      <circle cx="18" cy="40" r="1.5" fill="#FF8A65" opacity="0.6"/>
      <circle cx="46" cy="42" r="1.5" fill="#FF8A65" opacity="0.6"/>
      <circle cx="32" cy="48" r="1.5" fill="#FF8A65" opacity="0.6"/>
      <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
      <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
      <circle cx="24" cy="26" r="2.5" fill="black"/>
      <circle cx="40" cy="26" r="2.5" fill="black"/>
      <circle cx="25" cy="25" r="1" fill="white"/>
      <circle cx="41" cy="25" r="1" fill="white"/>
      <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FFCDD2" opacity="0.6"/>
      <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FFCDD2" opacity="0.6"/>
      <ellipse cx="26" cy="16" rx="6" ry="3" fill="#FFE0B2" opacity="0.5"/>
      <ellipse cx="14" cy="26" rx="4" ry="6" fill="#F8BBD0" opacity="0.3"/>
    </svg>`
  },
  {
    size: 72, color: '#FF9800', level: 7, name: 'Mango',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="mangoOuterGrad" cx="0.3" cy="0.25">
            <stop offset="0%" style="stop-color:#FFB74D"/>
            <stop offset="50%" style="stop-color:#FF9800"/>
            <stop offset="100%" style="stop-color:#F57C00"/>
        </radialGradient>
        <radialGradient id="mangoInnerGrad" cx="0.4" cy="0.3">
            <stop offset="0%" style="stop-color:#FFF8E1"/>
            <stop offset="20%" style="stop-color:#FFECB3"/>
            <stop offset="60%" style="stop-color:#FFD54F"/>
            <stop offset="100%" style="stop-color:#FFC107"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#mangoOuterGrad)" stroke="#E65100" stroke-width="1"/>
    <circle cx="32" cy="32" r="28" fill="url(#mangoInnerGrad)" opacity="0.9"/>
    <g fill="#FF5722" opacity="0.4">
        <ellipse cx="20" cy="20" rx="4" ry="6"/>
        <ellipse cx="44" cy="18" rx="3" ry="5"/>
        <ellipse cx="46" cy="38" rx="2.5" ry="4"/>
        <ellipse cx="18" cy="42" rx="3.5" ry="3"/>
    </g>
    <g fill="#8BC34A" opacity="0.3">
        <ellipse cx="16" cy="28" rx="2" ry="4"/>
        <ellipse cx="48" cy="32" rx="1.5" ry="3"/>
        <ellipse cx="32" cy="50" rx="3" ry="2"/>
    </g>
    <g fill="#FFEB3B" opacity="0.7">
        <ellipse cx="26" cy="18" rx="2.5" ry="1.5"/>
        <ellipse cx="38" cy="16" rx="2" ry="2"/>
        <ellipse cx="24" cy="32" rx="3" ry="1.8"/>
        <ellipse cx="40" cy="30" rx="2.5" ry="1.5"/>
        <ellipse cx="28" cy="44" rx="2" ry="1.2"/>
        <ellipse cx="36" cy="46" rx="1.8" ry="1"/>
    </g>
    <g fill="#8D6E63" opacity="0.5">
        <circle cx="24" cy="20" r="0.8"/>
        <circle cx="40" cy="44" r="0.6"/>
        <circle cx="16" cy="36" r="0.7"/>
        <circle cx="48" cy="24" r="0.9"/>
    </g>
    <ellipse cx="24" cy="28" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="28" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="28" r="2.5" fill="black"/>
    <circle cx="40" cy="28" r="2.5" fill="black"/>
    <circle cx="25" cy="27" r="1" fill="white"/>
    <circle cx="41" cy="27" r="1" fill="white"/>
    <path d="M26,40 Q32,46 38,40" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
</svg>`
  },
  {
    size: 80, color: '#FFA726', level: 8, name: 'Pineapple',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="pineappleInnerGrad" cx="0.4" cy="0.4">
            <stop offset="0%" style="stop-color:#FFF9C4"/>
            <stop offset="30%" style="stop-color:#FFF176"/>
            <stop offset="70%" style="stop-color:#FFEB3B"/>
            <stop offset="100%" style="stop-color:#FDD835"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="#FFEE58" stroke="#5D4037" stroke-width="2"/>
    <g stroke="#4CAF50" stroke-width="5.5" fill="#F9A825" opacity="0.8">
        <path d="M20,12 L22,6 L24,12 L26,8 L28,14 Z"/>
        <path d="M28,8 L30,4 L32,10 L34,6 L36,12 Z"/>
        <path d="M36,8 L38,4 L40,10 L42,6 L44,12 Z"/>
    </g>
    <g stroke="#F9A825" stroke-width="2" fill="none" opacity="0.8">
        <path d="M12,24 Q32,20 52,24"/>
        <path d="M10,32 Q32,28 54,32"/>
        <path d="M12,40 Q32,36 52,40"/>
        <path d="M14,48 Q32,44 50,48"/>
        <path d="M18,20 L22,24 L26,20 L30,24 L34,20 L38,24 L42,20 L46,24"/>
        <path d="M16,28 L20,32 L24,28 L28,32 L32,28 L36,32 L40,28 L44,32 L48,28"/>
        <path d="M18,36 L22,40 L26,36 L30,40 L34,36 L38,40 L42,36 L46,40"/>
        <path d="M20,44 L24,48 L28,44 L32,48 L36,44 L40,48 L44,44"/>
    </g>
    <g fill="#FFEE58" opacity="0.6">
        <path d="M24,22 L26,20 L28,22 L26,24 Z"/>
        <path d="M36,22 L38,20 L40,22 L38,24 Z"/>
        <path d="M18,30 L20,28 L22,30 L20,32 Z"/>
        <path d="M30,30 L32,28 L34,30 L32,32 Z"/>
        <path d="M42,30 L44,28 L46,30 L44,32 Z"/>
        <path d="M24,38 L26,36 L28,38 L26,40 Z"/>
        <path d="M36,38 L38,36 L40,38 L38,40 Z"/>
        <path d="M30,46 L32,44 L34,46 L32,48 Z"/>
    </g>
    <ellipse cx="24" cy="28" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="28" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="28" r="2.5" fill="black"/>
    <circle cx="40" cy="28" r="2.5" fill="black"/>
    <circle cx="25" cy="27" r="1" fill="white"/>
    <circle cx="41" cy="27" r="1" fill="white"/>
    <path d="M26,40 Q32,46 38,40" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="34" rx="3" ry="2" fill="#FFCC80" opacity="0.7"/>
    <ellipse cx="48" cy="34" rx="3" ry="2" fill="#FFCC80" opacity="0.7"/>
</svg>`
  },
  {
    size: 88, color: '#F48FB1', level: 9, name: 'Watermelon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
    <defs>
        <radialGradient id="watermelonGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#F8BBD0"/>
            <stop offset="100%" style="stop-color:#F48FB1"/>
        </radialGradient>
    </defs>
    <circle cx="32" cy="32" r="30" fill="url(#watermelonGrad)" stroke="#008e00" stroke-width="2"/>
    <circle cx="32" cy="32" r="26" fill="#F06292" opacity="0.8"/>
    <circle cx="22" cy="22" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="42" cy="20" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="20" cy="42" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="44" cy="44" r="2" fill="#1B5E20" opacity="0.9"/>
    <circle cx="32" cy="18" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="18" cy="32" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="46" cy="32" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="32" cy="46" r="1.5" fill="#1B5E20" opacity="0.9"/>
    <circle cx="28" cy="36" r="1" fill="#1B5E20" opacity="0.8"/>
    <circle cx="36" cy="28" r="1" fill="#1B5E20" opacity="0.8"/>
    <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
    <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
    <circle cx="24" cy="26" r="2.5" fill="black"/>
    <circle cx="40" cy="26" r="2.5" fill="black"/>
    <circle cx="25" cy="25" r="1" fill="white"/>
    <circle cx="41" cy="25" r="1" fill="white"/>
    <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <ellipse cx="16" cy="32" rx="3" ry="2" fill="#F8BBD0" opacity="0.6"/>
    <ellipse cx="48" cy="32" rx="3" ry="2" fill="#F8BBD0" opacity="0.6"/>
</svg>`
  },
  {
    size: 96, color: '#2196F3', level: 10, name: 'Jackfruit',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="jackfruitGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#42A5F5"/>
            <stop offset="100%" style="stop-color:#2196F3"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#jackfruitGrad)" stroke="#0D47A1" stroke-width="2"/>
        <circle cx="18" cy="18" r="2" fill="#1976D2" opacity="0.6"/>
        <circle cx="46" cy="16" r="2" fill="#1976D2" opacity="0.6"/>
        <circle cx="14" cy="38" r="2" fill="#1976D2" opacity="0.6"/>
        <circle cx="50" cy="40" r="2" fill="#1976D2" opacity="0.6"/>
        <circle cx="28" cy="50" r="2" fill="#1976D2" opacity="0.6"/>
        <circle cx="36" cy="52" r="2" fill="#1976D2" opacity="0.6"/>
        <circle cx="22" cy="32" r="1.5" fill="#1976D2" opacity="0.6"/>
        <circle cx="42" cy="34" r="1.5" fill="#1976D2" opacity="0.6"/>
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#BBDEFB" opacity="0.6"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#BBDEFB" opacity="0.6"/>
      </svg>`
  },
  {
    size: 104, color: '#9575CD', level: 11, name: 'Dragon Fruit',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="dragonfruitGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#B39DDB"/>
            <stop offset="100%" style="stop-color:#9575CD"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#dragonfruitGrad)" stroke="#512DA8" stroke-width="2"/>
        <circle cx="20" cy="20" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="44" cy="18" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="18" cy="40" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="46" cy="42" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="32" cy="48" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="26" cy="16" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="38" cy="14" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="14" cy="32" r="1" fill="#1B5E20" opacity="0.8"/>
        <circle cx="50" cy="30" r="1" fill="#1B5E20" opacity="0.8"/>
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#E1BEE7" opacity="0.6"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#E1BEE7" opacity="0.6"/>
        <path d="M28,8 L30,4 L32,8 L34,4 L36,8" stroke="#4CAF50" stroke-width="2" fill="none"/>
      </svg>`
  },
  {
    size: 112, color: '#4CAF50', level: 12, name: 'Durian',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="durianGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#66BB6A"/>
            <stop offset="100%" style="stop-color:#4CAF50"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#durianGrad)" stroke="#2E7D32" stroke-width="2"/>
        <path d="M16,16 L20,12 L18,18" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M48,16 L52,12 L50,18" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M16,48 L20,52 L18,46" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M48,48 L52,52 L50,46" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M32,8 L34,4 L30,4" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M32,56 L34,60 L30,60" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M8,32 L4,30 L4,34" stroke="#388E3C" stroke-width="2" fill="none"/>
        <path d="M56,32 L60,30 L60,34" stroke="#388E3C" stroke-width="2" fill="none"/>
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#C8E6C9" opacity="0.6"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#C8E6C9" opacity="0.6"/>
      </svg>`
  },
  {
    size: 120, color: '#8D6E63', level: 13, name: 'Coconut',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
      <defs>
        <radialGradient id="coconutGrad" cx="0.3" cy="0.3">
          <stop offset="0%" style="stop-color:#A1887F"/>
          <stop offset="100%" style="stop-color:#8D6E63"/>
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="30" fill="url(#coconutGrad)" stroke="#5D4037" stroke-width="2"/>
      <path d="M20,16 Q32,20 44,16" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M18,28 Q32,32 46,28" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M18,36 Q32,40 46,36" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
      <path d="M20,48 Q32,44 44,48" stroke="#6D4C41" stroke-width="2" fill="none" opacity="0.6"/>
      <circle cx="22" cy="22" r="1.5" fill="#5D4037" opacity="0.8"/>
      <circle cx="42" cy="20" r="1.5" fill="#5D4037" opacity="0.8"/>
      <circle cx="20" cy="42" r="1.5" fill="#5D4037" opacity="0.8"/>
      <circle cx="44" cy="44" r="1.5" fill="#5D4037" opacity="0.8"/>
      <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
      <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
      <circle cx="24" cy="26" r="2.5" fill="black"/>
      <circle cx="40" cy="26" r="2.5" fill="black"/>
      <circle cx="25" cy="25" r="1" fill="white"/>
      <circle cx="41" cy="25" r="1" fill="white"/>
      <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <ellipse cx="16" cy="32" rx="3" ry="2" fill="#D7CCC8" opacity="0.6"/>
      <ellipse cx="48" cy="32" rx="3" ry="2" fill="#D7CCC8" opacity="0.6"/>
      <circle cx="30" cy="18" r="1" fill="#3E2723" opacity="0.9"/>
      <circle cx="34" cy="18" r="1" fill="#3E2723" opacity="0.9"/>
      <circle cx="32" cy="16" r="1" fill="#3E2723" opacity="0.9"/>
    </svg>`
  },
  {
    size: 128, color: '#3F51B5', level: 14, name: 'Giant Grape',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="grapeGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#5C6BC0"/>
            <stop offset="100%" style="stop-color:#3F51B5"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#grapeGrad)" stroke="#1A237E" stroke-width="2"/>
        <circle cx="24" cy="18" r="3" fill="#303F9F" opacity="0.7"/>
        <circle cx="40" cy="16" r="3" fill="#303F9F" opacity="0.7"/>
        <circle cx="18" cy="32" r="3" fill="#303F9F" opacity="0.7"/>
        <circle cx="46" cy="30" r="3" fill="#303F9F" opacity="0.7"/>
        <circle cx="26" cy="46" r="3" fill="#303F9F" opacity="0.7"/>
        <circle cx="38" cy="48" r="3" fill="#303F9F" opacity="0.7"/>
        <circle cx="32" cy="20" r="2" fill="#303F9F" opacity="0.7"/>
        <circle cx="32" cy="44" r="2" fill="#303F9F" opacity="0.7"/>
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#C5CAE9" opacity="0.6"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#C5CAE9" opacity="0.6"/>
      </svg>`
  },
  {
    size: 136, color: '#FFC107', level: 15, name: 'Super Fruit',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <defs>
          <radialGradient id="superfruitGrad" cx="0.3" cy="0.3">
            <stop offset="0%" style="stop-color:#FFD54F"/>
            <stop offset="100%" style="stop-color:#FFC107"/>
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="30" fill="url(#superfruitGrad)" stroke="#FF8F00" stroke-width="3"/>
        <path d="M32,8 L36,18 L46,16 L40,26 L50,32 L40,38 L46,48 L36,46 L32,56 L28,46 L18,48 L24,38 L14,32 L24,26 L18,16 L28,18 Z" fill="#FFB300" opacity="0.6"/>
        <circle cx="20" cy="20" r="2" fill="#FF8F00" opacity="0.8"/>
        <circle cx="44" cy="18" r="2" fill="#FF8F00" opacity="0.8"/>
        <circle cx="18" cy="40" r="2" fill="#FF8F00" opacity="0.8"/>
        <circle cx="46" cy="42" r="2" fill="#FF8F00" opacity="0.8"/>
        <ellipse cx="24" cy="26" rx="5" ry="5" fill="white"/>
        <ellipse cx="40" cy="26" rx="5" ry="5" fill="white"/>
        <circle cx="24" cy="26" r="2.5" fill="black"/>
        <circle cx="40" cy="26" r="2.5" fill="black"/>
        <circle cx="25" cy="25" r="1" fill="white"/>
        <circle cx="41" cy="25" r="1" fill="white"/>
        <path d="M26,38 Q32,44 38,38" stroke="black" stroke-width="2.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="16" cy="32" rx="3" ry="2" fill="#FFECB3" opacity="0.8"/>
        <ellipse cx="48" cy="32" rx="3" ry="2" fill="#FFECB3" opacity="0.8"/>
        <circle cx="25" cy="22" r="1" fill="white" opacity="0.8"/>
        <circle cx="39" cy="20" r="1" fill="white" opacity="0.8"/>
        <circle cx="45" cy="26" r="1" fill="white" opacity="0.8"/>
      </svg>`
  },
];

const nextFruit = ref(generateFruit());
const targetFruit = computed(() => ({
  name: fruitTypes[targetFruitLevel.value].name,
  color: fruitTypes[targetFruitLevel.value].color,
  fruitLevel: fruitTypes[targetFruitLevel.value].level,
  level: targetFruitLevel.value + 1
}));

const currentLevelHighscore = computed(() => {
  const levelHighscores = highscores.value.filter(hs => hs.level === level.value)
  if (levelHighscores.length === 0) return 0
  return Math.max(...levelHighscores.map(hs => hs.score))
})

const bestOverallHighscore = computed(() => {
  if (highscores.value.length === 0) return null
  const best = highscores.value.reduce((max, current) =>
    current.score > max.score ? current : max
  )
  return best
})

function generateFruit() {
  // Generate fruits from level 1-5 to increase difficulty
  const maxStartingLevel = 5;
  const randomIndex = Math.floor(Math.random() * maxStartingLevel);
  const randomFruitType = fruitTypes[randomIndex];

  return {
    id: nextFruitId.value++,
    color: randomFruitType.color,
    size: randomFruitType.size,
    level: randomFruitType.level,
    name: randomFruitType.name,
    svg: randomFruitType.svg,
    x: 0,
    y: 0,
    rotation: 0,
    body: null,
    merging: false
  };
}

function createWalls(includeTopWall = false) {
  const walls = [
    // Bottom wall
    Matter.Bodies.rectangle(
      boardWidth.value / 2,
      boardHeight.value + wallThickness / 2,
      boardWidth.value,
      wallThickness,
      { isStatic: true, label: 'wall-bottom', restitution: 0.1 }
    ),
    // Left wall
    Matter.Bodies.rectangle(
      -wallThickness / 2,
      boardHeight.value / 2,
      wallThickness,
      boardHeight.value,
      { isStatic: true, label: 'wall-left', restitution: 0.1 }
    ),
    // Right wall
    Matter.Bodies.rectangle(
      boardWidth.value + wallThickness / 2,
      boardHeight.value / 2,
      wallThickness,
      boardHeight.value,
      { isStatic: true, label: 'wall-right', restitution: 0.1 }
    )
  ];

  // Add top wall only if requested
  if (includeTopWall) {
    walls.push(
      Matter.Bodies.rectangle(
        boardWidth.value / 2,
        -wallThickness / 2,
        boardWidth.value,
        wallThickness,
        { isStatic: true, label: 'wall-top', restitution: 0.3 }
      )
    );
  }

  return walls;
}

function initPhysics() {
  // Create engine with appropriate gravity
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 0.5, scale: 0.001 } // Adjusted gravity for better gameplay
  });

  // Create and start Matter Runner - this was the missing piece!
  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

  const walls = createWalls(false); // Keine obere Wand standardmäßig
  Matter.Composite.add(engine.world, walls);
  Matter.Events.on(engine, 'collisionStart', handleCollision);
}

function startLevel(levelNumber) {
  // Ensure level is unlocked
  if (levelNumber > maxUnlockedLevel.value) return

  // Reset score
  score.value = 0

  // Reset physics engine and recreate walls
  Matter.World.clear(engine.world, false)

  const walls = createWalls(false); // Keine obere Wand
  Matter.Composite.add(engine.world, walls)

  // Reset the fruits array
  fruits.value = []

  // Set current level
  level.value = levelNumber

  // Reset level completion status
  levelCompleted.value = false
  gameOver.value = false

  // Reset next fruit position
  nextFruitPosition.value = boardWidth.value / 2

  // Re-enable fruit dropping and show next fruit
  canDropFruit.value = true
  showNextFruit.value = true

  // Generate new next fruit
  nextFruit.value = generateFruit()

  // Reset all items
  hammerCount.value = 0
  hammerActive.value = false
  showHammerEffect.value = false
  rocketCount.value = 0
  rocketActive.value = false
  showRocketEffect.value = false
  lastHammerThreshold.value = 0
  lastRocketThreshold.value = 0

  // Hide start screen and start game
  showStartScreen.value = false
  gameActive.value = true
  showHighscores.value = false
}

function updateAvailableLevels() {
  availableLevels.value = availableLevels.value.map(levelInfo => {
    return {
      ...levelInfo,
      unlocked: levelInfo.number <= maxUnlockedLevel.value
    };
  });

  // Level-Fortschritt im localStorage speichern
  localStorage.setItem('fruitMergeMaxLevel', maxUnlockedLevel.value.toString());
}

function startNextLevel() {
  // Zeige den Startbildschirm anstatt direkt das nächste Level zu starten
  showStartScreen.value = true;
  gameActive.value = false;
  levelCompleted.value = false;
}

// Process collisions to merge fruits
function handleCollision(event) {
  const pairs = event.pairs;

  for (let i = 0; i < pairs.length; i++) {
    const pair = pairs[i];
    const bodyA = pair.bodyA;
    const bodyB = pair.bodyB;

    // Check if both bodies are fruits
    if (bodyA.label.startsWith('fruit-') && bodyB.label.startsWith('fruit-')) {
      // Extract information from labels
      const labelPartsA = bodyA.label.split('-');
      const labelPartsB = bodyB.label.split('-');

      const idA = parseInt(labelPartsA[1]);
      const idB = parseInt(labelPartsB[1]);
      const levelA = parseInt(labelPartsA[3]);
      const levelB = parseInt(labelPartsB[3]);

      // If fruits have the same level, merge them
      if (levelA === levelB && levelA < fruitTypes.length) {
        // Find the fruit objects
        const fruitA = fruits.value.find(f => f.id === idA);
        const fruitB = fruits.value.find(f => f.id === idB);

        // Only merge if both fruits exist and aren't already merging
        if (fruitA && fruitB && !fruitA.merging && !fruitB.merging) {
          // Mark fruits as merging to prevent multiple merges
          fruitA.merging = true;
          fruitB.merging = true;

          // Calculate center position for the new fruit
          const centerX = (bodyA.position.x + bodyB.position.x) / 2;
          const centerY = (bodyA.position.y + bodyB.position.y) / 2;

          // Remove the old fruits
          setTimeout(() => {
            // Remove bodies from the physics world
            Matter.Composite.remove(engine.world, bodyA);
            Matter.Composite.remove(engine.world, bodyB);

            // Remove fruits from the array
            fruits.value = fruits.value.filter(f => f.id !== idA && f.id !== idB);

            // Add score based on the level
            score.value += levelA * 10;
            checkForItemReward();

            // Create new fruit of the next level if not already at max level
            if (levelA < fruitTypes.length) {
              const nextLevelIndex = levelA; // Current level is 1-based, array is 0-based

              const newFruit = {
                id: nextFruitId.value++,
                color: fruitTypes[nextLevelIndex].color,
                size: fruitTypes[nextLevelIndex].size,
                level: levelA + 1, // Next level number
                name: fruitTypes[nextLevelIndex].name,
                svg: fruitTypes[nextLevelIndex].svg, // SVG hinzufügen
                x: centerX,
                y: centerY,
                rotation: 0,
                body: null,
                merging: false
              };

              // Add the new fruit to the world
              addMergedFruit(newFruit, centerX, centerY);

              // Check if this fruit matches the target fruit level
              if (levelA + 1 === targetFruit.value.level) {
                // If yes, trigger level completion
                levelUp();
              }
            }
          }, 100); // Small delay for better visual effect
        }
      }
    }
  }
}

function levelUp() {
  // Mark level as completed
  levelCompleted.value = true;

  // Disable fruit dropping
  canDropFruit.value = false;

  // Hide next fruit
  showNextFruit.value = false;

  // Save highscore
  const isNewHighscore = saveHighscore(level.value, score.value);

  // Unlock next level if not already unlocked
  if (level.value >= maxUnlockedLevel.value) {
    maxUnlockedLevel.value = level.value + 1;
    updateAvailableLevels();
  }
}

function clickToDrop(event) {
  // Only allow click if the player can drop fruit, not currently dragging, and no cooldown
  if (!canDropFruit.value || isDragging.value || dropCooldown.value) return;

  event.preventDefault();
  const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX) || 0;
  const boardRect = gameBoard.value.getBoundingClientRect();
  const relativeX = clientX - boardRect.left;

  const minX = nextFruit.value.size / 2 + wallThickness / 4;
  const maxX = boardWidth.value - nextFruit.value.size / 2 - wallThickness / 4;
  const targetX = Math.max(minX, Math.min(maxX, relativeX));

  // Update fruit position and drop it
  nextFruitPosition.value = targetX;

  const newFruit = { ...nextFruit.value };
  addFruitToWorld(newFruit, targetX - wallThickness / 4, -30);
}

// Add a merged fruit to the world at a specific position
function addMergedFruit(fruit, x, y) {
  const fruitBody = Matter.Bodies.circle(
    x,
    y,
    fruit.size / 2,
    {
      restitution: 0.3, // Bounciness
      friction: 0.05,   // Reduced friction
      frictionAir: 0.005, // Reduced air friction
      density: 0.001,    // Density for weight
      label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}`, // Label for identification
      render: {
        sprite: {
          xScale: 1,
          yScale: 1
        }
      }
    }
  );

  fruit.body = fruitBody;
  Matter.Composite.add(engine.world, fruitBody);
  fruits.value.push(fruit);
}

function addFruitToWorld(fruit, x, y) {
  // Prüfe ob Fruit dropping erlaubt ist und kein Cooldown aktiv
  if (!canDropFruit.value || dropCooldown.value) return;

  // Aktiviere Cooldown
  dropCooldown.value = true;

  const fruitBody = Matter.Bodies.circle(
    x,
    y,
    fruit.size / 2,
    {
      restitution: 0.6,
      friction: 0.05,
      frictionAir: 0.008,
      density: 0.001,
      label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}`,
      render: {
        sprite: {
          xScale: 1,
          yScale: 1
        }
      }
    }
  );

  fruit.body = fruitBody;
  Matter.Composite.add(engine.world, fruitBody);
  fruits.value.push(fruit);

  nextFruitFading.value = true;

  // Show next fruit after delay and reset cooldown
  setTimeout(() => {
    // Only show next fruit if level is not completed
    if (!levelCompleted.value) {
      nextFruit.value = generateFruit();
      showNextFruit.value = true;
      nextFruitFading.value = false;
    }

    // Reset cooldown nach 800ms
    setTimeout(() => {
      dropCooldown.value = false;
    }, 300); // Zusätzliche 300ms Cooldown nach dem Anzeigen der neuen Frucht
  }, 500); // 500ms delay
}

function updateFruitPositions() {
  fruits.value.forEach(fruit => {
    if (fruit.body) {
      const pos = fruit.body.position;
      fruit.x = pos.x - fruit.size / 2;
      fruit.y = pos.y - fruit.size / 2;
      fruit.rotation = fruit.body.angle * (180 / Math.PI);
    }
  });

  // Check for game over condition
  if (!gameOver.value && !levelCompleted.value) {
    checkGameOver();
  }

  requestAnimationFrame(updateFruitPositions);
}

function startDrag(event) {
  // Only allow drag if the player can drop fruit (level not completed)
  if (!canDropFruit.value) return;

  event.preventDefault();
  isDragging.value = true;

  const moveEvent = 'ontouchstart' in window ? 'touchmove' : 'mousemove';
  const endEvent = 'ontouchstart' in window ? 'touchend' : 'mouseup';

  document.addEventListener(moveEvent, handleDrag);
  document.addEventListener(endEvent, endDrag);
}

function handleDrag(event) {
  if (!isDragging.value) return;

  const clientX = event.clientX || (event.changedTouches && event.changedTouches[0].clientX) || 0;
  const boardRect = gameBoard.value.getBoundingClientRect();
  const relativeX = clientX - boardRect.left;

  const minX = nextFruit.value.size / 2 + wallThickness / 4;
  const maxX = boardWidth.value - nextFruit.value.size / 2 - wallThickness / 4;
  nextFruitPosition.value = Math.max(minX, Math.min(maxX, relativeX));
}

function endDrag(event) {
  if (!isDragging.value || dropCooldown.value) return; // Prüfe auch Cooldown
  isDragging.value = false;

  const newFruit = { ...nextFruit.value };
  addFruitToWorld(newFruit, nextFruitPosition.value - wallThickness / 4, -30);

  const moveEvent = 'ontouchstart' in window ? 'touchmove' : 'mousemove';
  const endEvent = 'ontouchstart' in window ? 'touchend' : 'mouseup';
  document.removeEventListener(moveEvent, handleDrag);
  document.removeEventListener(endEvent, endDrag);
}

function checkGameOver() {
  const currentTime = Date.now();
  const currentTopBoundary = topBoundary.value; // Get the computed value

  // Check for fruits that are above the top boundary
  for (const fruit of fruits.value) {
    if (fruit.body && fruit.body.position.y < currentTopBoundary) {
      // If this fruit wasn't already violating the boundary, record the time
      if (!topViolations.value[fruit.id]) {
        topViolations.value[fruit.id] = currentTime;
      }
      // If the fruit has been violating for longer than the delay, trigger game over
      else if (currentTime - topViolations.value[fruit.id] >= gameOverDelay) {
        gameOver.value = true;
        // Disable fruit dropping when game is over
        canDropFruit.value = false;
        // Hide next fruit
        showNextFruit.value = false;
        return true;
      }
    } else {
      // If the fruit is no longer violating, remove it from tracking
      if (topViolations.value[fruit.id]) {
        delete topViolations.value[fruit.id];
      }
    }
  }

  // Clean up tracking for fruits that no longer exist
  for (const id in topViolations.value) {
    if (!fruits.value.some(fruit => fruit.id.toString() === id)) {
      delete topViolations.value[id];
    }
  }

  return false;
}

function restartGame() {
  // Zeige den Startbildschirm anstatt direkt das Spiel neu zu starten
  showStartScreen.value = true;
  gameActive.value = false;
  gameOver.value = false;
}

function loadHighscores() {
  const savedHighscores = localStorage.getItem('fruitMergeHighscores')
  if (savedHighscores) {
    highscores.value = JSON.parse(savedHighscores)
  }
}

function toggleHighscores() {
  showHighscores.value = !showHighscores.value
}

function saveHighscore(level, score) {
  const levelHighscores = highscores.value.filter(hs => hs.level === level)

  // Check if it's a new highscore for the level
  if (levelHighscores.length === 0 || Math.max(...levelHighscores.map(hs => hs.score)) < score) {
    // Store the level and score for name input
    newHighscoreLevel.value = level
    newHighscoreScore.value = score
    showNameInput.value = true
    return true // New highscore achieved
  }

  return false // No new highscore
}

function saveHighscoreWithName() {
  const name = playerName.value.toUpperCase().slice(0, 3).padEnd(3, ' ')
  const now = new Date()
  const dateString = now.toLocaleDateString('de-DE')

  const newHighscore = {
    level: newHighscoreLevel.value,
    score: newHighscoreScore.value,
    name: name,
    date: dateString
  }

  // Remove old highscores for this level
  highscores.value = highscores.value.filter(hs => hs.level !== newHighscoreLevel.value)

  // Add new highscore
  highscores.value.push(newHighscore)

  // Sort by level and score
  highscores.value.sort((a, b) => {
    if (a.level !== b.level) return a.level - b.level
    return b.score - a.score
  })

  // Save to localStorage
  localStorage.setItem('fruitMergeHighscores', JSON.stringify(highscores.value))

  // Reset input state
  showNameInput.value = false
  playerName.value = ''
  newHighscoreLevel.value = 0
  newHighscoreScore.value = 0
}

const fruitListForLevel = computed(() => {
  // Show fruits from level 1 up to the target level, descending
  return fruitTypes
    .slice(0, targetFruit.value.level)
    .reverse()
    .map((fruit, index) => ({
      ...fruit,
      isTarget: fruit.level === targetFruit.value.level
    }))
})

const toggleFruitList = () => {
  showFruitList.value = !showFruitList.value
}

function checkForItemReward() {
  const currentHammerThreshold = Math.floor(score.value / 300)

  if (currentHammerThreshold > lastHammerThreshold.value) {
    const newHammers = currentHammerThreshold - lastHammerThreshold.value
    hammerCount.value += newHammers
    lastHammerThreshold.value = currentHammerThreshold

    showHammerEffect.value = true
    setTimeout(() => {
      showHammerEffect.value = false
    }, 2000)
  }

  const currentRocketThreshold = Math.floor(score.value / 800)

  if (currentRocketThreshold > lastRocketThreshold.value) {
    const newRockets = currentRocketThreshold - lastRocketThreshold.value
    rocketCount.value += newRockets
    lastRocketThreshold.value = currentRocketThreshold

    showRocketEffect.value = true
    setTimeout(() => {
      showRocketEffect.value = false
    }, 2000)
  }
}

function activateHammer() {
  if (hammerCount.value > 0 && !hammerActive.value) {
    hammerActive.value = true
  }
}

function deactivateHammer() {
  hammerActive.value = false
}

function hammerFruit(fruit) {
  if (hammerActive.value && hammerCount.value > 0) {
    if (fruit.body) {
      // Temporäre obere Wand erstellen
      const topWall = Matter.Bodies.rectangle(
        boardWidth.value / 2,
        -wallThickness / 2,
        boardWidth.value,
        wallThickness,
        { isStatic: true, label: 'wall-top-temp', restitution: 0.3 }
      );
      Matter.Composite.add(engine.world, topWall);

      // Phase 1: Hammerschlag nach unten (sofort)
      Matter.Body.setVelocity(fruit.body, { x: 0, y: 2 });
      Matter.Body.applyForce(fruit.body, fruit.body.position, { x: 0, y: 0.01 });

      // Phase 2: Nach kurzer Verzögerung - kontrollierter Rückprall
      setTimeout(() => {
        if (fruit.body) {
          const sideForce = (Math.random() - 0.5) * 0.015;
          const upwardForce = -0.02;
          const sideVelocity = (Math.random() - 0.5) * 3;
          const upwardVelocity = -7;

          Matter.Body.setVelocity(fruit.body, {
            x: sideVelocity,
            y: upwardVelocity
          });

          Matter.Body.applyForce(fruit.body, fruit.body.position, {
            x: sideForce,
            y: upwardForce
          });

          const rotationForce = (Math.random() - 0.5) * 0.05;
          Matter.Body.setAngularVelocity(fruit.body, rotationForce);
        }
      }, 150);

      // Entferne die temporäre obere Wand nach 3 Sekunden
      setTimeout(() => {
        const tempWall = engine.world.bodies.find(body => body.label === 'wall-top-temp');
        if (tempWall) {
          Matter.Composite.remove(engine.world, tempWall);
        }
      }, 3000);
    }
    hammerCount.value -= 1;
    hammerActive.value = false;
  }
}

function activateRocket() {
  if (rocketCount.value > 0 && !rocketActive.value) {
    rocketActive.value = true
  }
}


function deactivateRocket() {
  rocketActive.value = false
}

function rocketFruit(fruit) {
  if (rocketActive.value && rocketCount.value > 0) {
    if (fruit.body) {
      // Mark fruit as being rocketed to prevent physics interactions
      fruit.rocketing = true
      fruit.merging = true

      // Make the fruit kinematic (not affected by gravity/collisions)
      Matter.Body.setStatic(fruit.body, true)

      const startY = fruit.body.position.y
      const targetY = -100 // Target position above the game area
      const animationDuration = 1500 // 1.5 seconds
      const startTime = Date.now()

      const animateRocket = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / animationDuration, 1)

        // Ease-out animation curve for smooth deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3)
        const currentY = startY + (targetY - startY) * easeOut

        if (fruit.body) {
          // Move fruit smoothly upward
          Matter.Body.setPosition(fruit.body, {
            x: fruit.body.position.x,
            y: currentY
          })

          if (progress < 1) {
            // Continue animation
            requestAnimationFrame(animateRocket)
          } else {
            // Animation complete - remove fruit
            Matter.Composite.remove(engine.world, fruit.body)
            fruits.value = fruits.value.filter(f => f.id !== fruit.id)
          }
        }
      }

      // Start the rocket animation
      requestAnimationFrame(animateRocket)
    }
    rocketCount.value -= 1
    rocketActive.value = false
  }
}

function backToStartScreen() {
  // Reset game state
  gameActive.value = false;
  showStartScreen.value = true;
  gameOver.value = false;
  levelCompleted.value = false;

  // Reset physics and clear world
  Matter.World.clear(engine.world, false);

  // Recreate walls without top wall
  const walls = createWalls(false);
  Matter.Composite.add(engine.world, walls);

  // Clear fruits array
  fruits.value = [];

  // Reset other game state
  canDropFruit.value = true;
  showNextFruit.value = true;
  nextFruit.value = generateFruit();
  nextFruitPosition.value = boardWidth.value / 2;
}

onMounted(() => {
  if (gameBoard.value) {
    const rect = gameBoard.value.getBoundingClientRect()
    boardWidth.value = rect.width
    boardHeight.value = rect.height
  }
  initPhysics()
  nextFruitPosition.value = boardWidth.value / 2
  updateFruitPositions()

  // Lade den gespeicherten Level-Fortschritt
  const savedMaxLevel = localStorage.getItem('fruitMergeMaxLevel')
  if (savedMaxLevel) {
    maxUnlockedLevel.value = parseInt(savedMaxLevel)
    updateAvailableLevels()
  }

  // Lade gespeicherte Highscores
  loadHighscores()
})

onBeforeUnmount(() => {
  if (runner) {
    Matter.Runner.stop(runner);
  }

  if (engine) {
    Matter.Events.off(engine);
    Matter.World.clear(engine.world);
    Matter.Engine.clear(engine);
  }
});
</script>

<template>
  <div class="fruit-merge">
    <div class="game-container">
      <div v-if="showStartScreen" class="start-screen">
        <div v-if="showNameInput" class="name-input-modal">
          <div class="name-input-content">
            <h3>New Highscore!</h3>
            <p>Level {{ newHighscoreLevel }} - {{ newHighscoreScore }} Points</p>
            <div class="name-input-form">
              <label for="player-name">Enter your name (3 letters):</label>
              <input
                id="player-name"
                v-model="playerName"
                type="text"
                maxlength="3"
                placeholder="ABC"
                @keyup.enter="saveHighscoreWithName"
                class="name-input"
              />
              <div class="name-input-buttons">
                <button @click="saveHighscoreWithName" class="btn save-btn">Save</button>
                <button @click="showNameInput = false; playerName = ''" class="btn cancel-btn">Skip</button>
              </div>
            </div>
          </div>
        </div>

        <h3>Fruit Merge</h3>

        <!-- Best Highscore Display -->
        <div v-if="bestOverallHighscore" class="best-score-display">
          <div class="best-score-label">Best Score</div>
          <div class="best-score-value">{{ bestOverallHighscore.score }}</div>
          <div class="best-score-details">
            {{ bestOverallHighscore.name }} - Level {{ bestOverallHighscore.level }}
          </div>
        </div>
        <div v-else class="best-score-display">
          <div class="best-score-label">Best Score</div>
          <div class="best-score-value">0</div>
          <div class="best-score-details">Play to set a record!</div>
        </div>

        <!-- Highscore Toggle Button -->
        <div class="start-screen-buttons">
          <button @click="toggleHighscores" class="btn highscore-btn">
            {{ showHighscores ? 'Zurück zu Levels' : 'Highscores anzeigen' }}
          </button>
        </div>

        <!-- Level Grid (nur anzeigen, wenn Highscores nicht angezeigt werden) -->
        <div v-if="!showHighscores" class="level-grid">
          <button
            v-for="levelInfo in availableLevels"
            :key="levelInfo.number"
            class="level-button"
            :class="{ 'unlocked': levelInfo.unlocked, 'current': levelInfo.number === maxUnlockedLevel }"
            :disabled="!levelInfo.unlocked"
            @click="startLevel(levelInfo.number)"
          >
            {{ levelInfo.name }}
            <span v-if="!levelInfo.unlocked" class="lock-icon">🔒</span>
          </button>
        </div>

        <!-- Highscore Anzeige -->
        <div v-if="showHighscores" class="highscore-container">
          <h4>Highscores</h4>
          <div v-if="highscores.length === 0" class="no-highscores">
            Noch keine Highscores vorhanden.
          </div>
          <table v-else class="highscore-table">
            <thead>
            <tr>
              <th>Level</th>
              <th>Name</th>
              <th>Score</th>
              <th>Date</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(score, index) in highscores" :key="index">
              <td>{{ score.level }}</td>
              <td>{{ score.name || '---' }}</td>
              <td>{{ score.score }}</td>
              <td>{{ score.date }}</td>
            </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div
        class="play-screen"
        :class="{
          'play-screen--hidden': showStartScreen,
        }"
      >
        <div class="game-header">
          <button
            v-if="gameActive"
            @click="backToStartScreen"
            class="back-btn"
            title="Zurück zum Startbildschirm"
          >
            x
          </button>
          <div v-if="gameOver" class="game-over-message">
            <span>Game Over</span>
            <button class="btn restart-btn" @click="restartGame">Play Again</button>
          </div>
          <div v-else-if="!levelCompleted" class="level-row">
            <div class="score" :class="{ 'new-record': score > currentLevelHighscore }">
              <span>Score</span>
              <span>{{ score }}</span>
            </div>
            <div class="item-container">
              <div class="hammer-item">
                <button
                  class="hammer-btn item-btn"
                  :class="{ 'active': hammerActive, 'has-items': hammerCount > 0, 'effect': showHammerEffect }"
                  :disabled="hammerCount === 0"
                  @click="hammerActive ? deactivateHammer() : activateHammer()"
                  :title="hammerActive ? 'Hammer aktiv - Klicke auf eine Frucht' : `Hammer (${hammerCount}x)`"
                >
                  🔨
                  <span class="item-count" v-if="hammerCount > 0">{{ hammerCount }}</span>
                </button>
              </div>
              <div class="rocket-item">
                <button
                  class="rocket-btn item-btn"
                  :class="{ 'active': rocketActive, 'has-items': rocketCount > 0, 'effect': showRocketEffect }"
                  :disabled="rocketCount === 0"
                  @click="rocketActive ? deactivateRocket() : activateRocket()"
                  :title="rocketActive ? 'Rocket aktiv - Klicke auf eine Frucht' : `Rocket (${rocketCount}x)`"
                >
                  🚀
                  <span class="item-count" v-if="rocketCount > 0">{{ rocketCount }}</span>
                </button>
              </div>
            </div>
            <div class="level">
              <div
                class="goal-fruit-svg"
                v-html="fruitTypes[targetFruit.fruitLevel - 1].svg"
                @click="toggleFruitList"
                role="button"
                tabindex="0"
                :aria-label="`Ziel-Frucht: ${targetFruit.name}. Klicken um Frucht-Liste anzuzeigen`"
                @keydown="(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleFruitList() } }"
              />

              <!-- Fruit list dropdown -->
              <div v-if="showFruitList" class="fruit-list-dropdown">
                <div class="fruit-list-header">
                  <span>Kombiniere zu:</span>
                  <button
                    @click="toggleFruitList"
                    class="close-fruit-list"
                    aria-label="Frucht-Liste schließen"
                  >
                    ✕
                  </button>
                </div>
                <div class="fruit-list-items">
                  <div
                    v-for="fruit in fruitListForLevel"
                    :key="fruit.level"
                    class="fruit-list-item"
                    :class="{ 'target-fruit': fruit.isTarget }"
                  >
                    <div class="fruit-list-svg" :style="`width: ${fruit.size}px; height: ${fruit.size}px;`" v-html="fruit.svg"></div>
                    <div class="fruit-list-info">
                      <span class="fruit-list-name">{{ fruit.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="level-complete-message">
            <button class="btn next-level-btn" @click="startNextLevel">Start Next Level</button>
          </div>
        </div>

        <div class="game-frame">
          <div
            class="next-fruit-area"
            :class="{ 'cooldown': dropCooldown }"
            @click="clickToDrop"
            @touchstart="clickToDrop"
            @touchend="clickToDrop"
          >
            <div
              v-if="showNextFruit"
              class="next-fruit fruit"
              :class="{
                  'disabled': dropCooldown,
                  'fading': nextFruitFading
                }"
              :style="{
                  width: `${nextFruit.size}px`,
                  height: `${nextFruit.size}px`,
                  left: `${nextFruitPosition}px`
                }"
              @mousedown="startDrag"
              @touchstart="startDrag"
              @touchend="endDrag"
              @click.stop
              @touchend.stop
            >
              <div class="fruit-svg" v-html="nextFruit.svg"></div>
              <span class="fruit-level">{{ nextFruit.level }}</span>
              <span class="fruit-name">{{ nextFruit.name }}</span>
            </div>
          </div>

          <div class="game-board" ref="gameBoard">
            <div class="top-boundary-line" :style="{ top: topBoundary + 'px' }"></div>
            <div
              v-for="fruit in fruits"
              :key="fruit.id"
              class="fruit"
              :class="{
                  'merging': fruit.merging,
                  'hammer-target': hammerActive,
                  'rocket-target': rocketActive
                }"
              :style="{
                  left: `${fruit.x}px`,
                  top: `${fruit.y}px`,
                  width: `${fruit.size}px`,
                  height: `${fruit.size}px`,
                  transform: `rotate(${fruit.rotation}deg)`
                }"
              @click="hammerActive ? hammerFruit(fruit) : rocketActive ? rocketFruit(fruit) : null"
            >
              <div class="fruit-svg" v-html="fruit.svg"></div>
              <span class="fruit-level">{{ fruit.level }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fruit-merge {
  width: 100%;
  height: 100%;
  min-height: 490px;
  display: flex;
  flex-direction: column;
}

.game-start {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  text-align: center;
}

.game-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: #6b89c9;
  color: white;
}

.game-header {
  width: 100%;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
  gap: 1rem;
  text-shadow: 0 1px 3px #000, 0 -1px 3px #000;
  height: 60px;
  position: relative;
}

.back-btn {
  position: absolute;
  right: -1.25rem;
  top: 0;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.25rem 0.5rem;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s ease;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);

  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }
}

.level-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 0.1rem;
}

.game-frame {
  position: relative;
  width: 270px;
  height: 490px;
  display: flex;
  flex-direction: column;
}

.next-fruit-area {
  height: 70px;
  width: 100%;
  position: relative;
  background: linear-gradient(180deg, rgba(107, 201, 201, 0.6) 0%, rgba(107, 137, 201, 0.15) 100%);
  border: 2px dashed rgba(107, 137, 201, 0.4);
  border-radius: 8px 8px 0 0;
  cursor: crosshair;
  transition: background-color 0.2s ease;

  &.cooldown {
    overflow: hidden;
  }
}

.game-board {
  position: relative;
  width: 100%;
  height: 490px;
  background-color: rgba(234, 231, 214, 0.8);
  border: 4px solid #c9b991;
  overflow: hidden;
}

.play-screen {
  display: flex;
  margin: auto;
  justify-content: center;
  flex-direction: column;
  align-items: center;

  &--hidden {
    opacity: 0;
    position: absolute;
    z-index: -1;
  }
}

.fruit-svg {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 0;
}

.fruit-level, .fruit-name {
  position: relative;
  z-index: 1;
  opacity: 0;
}

.fruit {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  transition: transform 0.1s ease;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
  overflow: visible;
}

.fruit-level {
  font-size: 1rem;
  line-height: 1;
}

.fruit-name {
  font-size: 0.5rem;
}

.fruit.merging {
  transform: scale(1.2);
  opacity: 0.8;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.next-fruit {
  bottom: 0;
  transform: translateX(-50%);
  transition: opacity 0.2s ease;
  z-index: 2;
  cursor: grab;

  &::after {
    content: '';
    position: absolute;
    margin: auto;
    top: 100%;
    left: 0;
    right: 0;
    height: 428px;
    width: 2px;
    background: #0006;
  }
}

.score {
  font-size: 1rem;
}

.level-display {
  font-size: 1rem;
  font-weight: bold;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.score,
.level,
.highscore,
.level-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  width: 25%;

  > span:last-child {
    font-size: 0.75rem;
    font-weight: normal;
    white-space: nowrap;
  }
}

.level-complete-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #4CAF50;
  animation: fadeIn 0.5s ease;
}

.level {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  width: 25%;
  position: relative; // Add this line

  > span:last-child {
    font-size: 0.75rem;
    font-weight: normal;
    white-space: nowrap;
  }
}

.next-level-btn {
  font-size: 1rem;
}

.game-over-message {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #f44336;
  animation: shake 0.5s ease;
  width: 100%;

  span {
    font-size: 1.2rem;
    text-shadow: 0 1px 3px #000, 0 -1px 3px #000;
  }
}

.restart-btn {
  font-size: 1rem;
  background-color: #f44336;
}

.top-boundary-line {
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: rgba(255, 0, 0, 0.7);
  z-index: 5;
}

.start-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 1rem;
  text-align: center;
  background-color: rgba(234, 231, 214, 0.9);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  margin: 0 auto;
  height: 540px;
  width: 100%;

  h3 {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
    color: #6b89c9;
  }

  p {
    margin-bottom: 1.5rem;
    color: #333;
  }
}

.level-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  width: 100%;
  margin-top: 1rem;
}

.next-level-btn,
.restart-btn,
.highscore-btn,
.level-button {
  position: relative;
  background-color: #33bbbb;
  color: white;
  border: none;
  border-radius: 0.5rem;
  padding: 0.75rem 0.5rem;
  font-size: 0.9rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  }

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.7;
  }

  &.unlocked {
    background-color: #4CAF50;
  }

  &.current {
    background-color: #FF9800;
    transform: scale(1.05);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }
}

.goal-fruit-svg {
  width: 3em;
  height: 3em;
  margin: 0;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.goal-fruit-svg:hover {
  transform: scale(1.1);
}

.goal-fruit-svg:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 2px;
}

.fruit-list-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background-color: rgba(234, 231, 214, 0.95);
  border: 2px solid #c9b991;
  border-radius: 0.5rem;
  padding: 0.5rem;
  min-width: 290px;
  max-height: 350px;
  overflow-y: auto;
  z-index: 10;
  color: #333;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  text-shadow: none;
}

.fruit-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
  font-weight: bold;
  border-bottom: 1px solid #c9b991;
  padding-bottom: 0.25rem;
}

.close-fruit-list {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-fruit-list:hover {
  color: #333;
}

.fruit-list-items {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.fruit-list-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem;
  border-radius: 0.25rem;
  transition: background-color 0.2s ease;
}

.fruit-list-item:hover {
  background-color: rgba(107, 137, 201, 0.1);
}

.fruit-list-item.target-fruit {
  background-color: rgba(255, 235, 59, 0.3);
  border: 1px solid #FFEB3B;
}

.fruit-list-svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.fruit-list-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex-grow: 1;
}

.fruit-list-level {
  font-size: 0.75rem;
  font-weight: bold;
  color: #666;
}

.fruit-list-name {
  font-size: 0.875rem;
  color: #333;
}

.target-indicator {
  font-size: 1rem;
  flex-shrink: 0;
}

.lock-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1.2rem;
}

.start-screen-buttons {
  display: flex;
  justify-content: center;
}

.best-score-display {
  background-color: rgba(107, 137, 201, 0.1);
  border: 2px solid #6b89c9;
  border-radius: 1rem;
  padding: 0.5rem;
  text-align: center;
  margin-bottom: 1rem;
  width: 100%;
}

.best-score-label {
  font-size: 0.9rem;
  color: #666;
}

.best-score-value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #6b89c9;
}

.best-score-details {
  font-size: 0.8rem;
  color: #333;
}

.name-input-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.name-input-content {
  background-color: white;
  padding: 2rem;
  border-radius: 1rem;
  text-align: center;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  max-width: 300px;
  width: 90%;
}

.name-input-content h3 {
  color: #4CAF50;
  margin-bottom: 0.5rem;
}

.name-input-content p {
  color: #333;
  margin-bottom: 1rem;
  font-weight: bold;
}

.name-input-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.name-input-form label {
  font-size: 0.9rem;
  color: #666;
}

.name-input {
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 0.5rem;
  font-size: 1.2rem;
  text-align: center;
  text-transform: uppercase;
  font-weight: bold;
  letter-spacing: 0.2em;
}

.name-input:focus {
  outline: none;
  border-color: #6b89c9;
}

.name-input-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
}

.save-btn {
  background-color: #4CAF50;
}

.cancel-btn {
  background-color: #9E9E9E;
}

.highscore-btn {
  background-color: #6b89c9;
}

.highscore-container {
  width: 100%;
  overflow-y: auto;
  max-height: 250px;
}

.highscore-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.5rem;
  color: #333;
}

.highscore-table th,
.highscore-table td {
  padding: 0.5rem;
  text-align: center;
  border-bottom: 1px solid #ddd;
}

.highscore-table th {
  background-color: #6b89c9;
  color: white;
  font-weight: bold;
}

.highscore-table tr:nth-child(even) {
  background-color: rgba(107, 137, 201, 0.1);
}

.highscore-table tr:hover {
  background-color: rgba(107, 137, 201, 0.2);
}

.no-highscores {
  text-align: center;
  color: #666;
  margin-top: 1rem;
  font-style: italic;
}

.start-screen h4 {
  color: #6b89c9;
  margin-top: 1rem;
  margin-bottom: 0.5rem;
}

.new-record {
  color: #FFEB3B;
}

.hammer-btn {
  position: relative;
  background-color: #795548;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    opacity: 0.5;
  }

  &.has-items:not(:disabled) {
    background-color: #8D6E63;

    &:hover {
      background-color: #6D4C41;
      transform: scale(1.1);
    }
  }

  &.active {
    background-color: #FF5722;
    animation: pulse 0.5s infinite;
    box-shadow: 0 0 10px rgba(255, 87, 34, 0.6);
  }

  &.effect {
    animation: hammerGlow 2s ease;
  }
}

.hammer-count {
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #4CAF50;
  color: white;
  border-radius: 50%;
  width: 16px;
  height: 16px;
  font-size: 0.6rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
}

.fruit.hammer-target {
  cursor: crosshair;

  &:hover {
    filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
    transform: scale(1.05) rotate(var(--rotation, 0deg));
    animation: hammerTargetPulse 0.5s ease-in-out infinite alternate;
  }
}

.item-container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  width: 25%;
}

.next-fruit.fading {
  transform: translateX(-50%) translateY(100%);
  transition: transform 0.3s ease;
}

.hammer-item,
.rocket-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 2rem;
}
.item-btn {
  position: relative;
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3); // Weißer Rahmen für besseren Kontrast
  border-radius: 50%;
  width: 35px;
  height: 35px;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8); // Textschatten für bessere Lesbarkeit

  &:disabled {
    background-color: #9E9E9E; // Helleres Grau
    border-color: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.has-items:not(:disabled):hover {
    transform: scale(1.1);
    border-color: rgba(255, 255, 255, 0.6); // Hellerer Rahmen beim Hover
  }

  &.active {
    animation: pulse 0.5s infinite;
    box-shadow: 0 0 15px rgba(255, 87, 34, 0.8); // Stärkerer Schatten
    border-color: #FFFFFF; // Weißer Rahmen wenn aktiv
  }

  &.effect {
    animation: itemGlow 2s ease;
  }
}

.item-count {
  position: absolute;
  top: -0.5rem;
  right: -0.5rem;
  background-color: #4CAF50;
  color: white;
  border: 2px solid white; // Weißer Rahmen um die Zahl
  border-radius: 50%;
  width: 1rem;
  height: 1rem;
  font-size: 0.75rem;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3); // Schatten für bessere Sichtbarkeit
}

.hammer-btn {
  background-color: #D32F2F; // Kräftiges Rot statt braun

  &.has-items:not(:disabled) {
    background-color: #F44336; // Helleres Rot

    &:hover {
      background-color: #C62828; // Dunkles Rot beim Hover
    }
  }

  &.active {
    background-color: #FF5722; // Orange wenn aktiv
    color: #FFFFFF;
  }
}
.rocket-btn {
  background-color: #1976D2; // Kräftiges Blau

  &.has-items:not(:disabled) {
    background-color: #2196F3; // Helleres Blau

    &:hover {
      background-color: #1565C0; // Dunkles Blau beim Hover
    }
  }

  &.active {
    background-color: #FF5722; // Orange wenn aktiv
    color: #FFFFFF;
  }
}

.fruit.rocket-target {
  cursor: crosshair;

  &:hover {
    filter: brightness(1.2);
    transform: scale(1.05) rotate(var(--rotation, 0deg));
    box-shadow: 0 0 10px rgba(33, 150, 243, 0.6);
  }
}

@keyframes itemGlow {
  0% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.6);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
    transform: scale(1.2);
  }
  100% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.6);
    transform: scale(1);
  }
}

@keyframes hammerTargetPulse {
  0% {
    filter: brightness(1.2) drop-shadow(0 0 8px rgba(255, 193, 7, 0.6));
  }
  100% {
    filter: brightness(1.4) drop-shadow(0 0 12px rgba(255, 193, 7, 0.8));
  }
}

@keyframes hammerGlow {
  0% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.6);
    transform: scale(1);
  }
  50% {
    box-shadow: 0 0 20px rgba(76, 175, 80, 0.8);
    transform: scale(1.2);
  }
  100% {
    box-shadow: 0 0 5px rgba(76, 175, 80, 0.6);
    transform: scale(1);
  }
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}
</style>