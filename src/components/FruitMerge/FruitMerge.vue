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
const boardHeight = ref(350);
const wallThickness = 20;
const targetFruitLevel = computed(() => Math.min(5 + level.value, fruitTypes.length - 1));
const level = ref(1);
const levelCompleted = ref(false);
const nextLevel = ref(2);
const showNextFruit = ref(true);
const canDropFruit = ref(true);
const gameOver = ref(false);
const topBoundary = 30;
const topViolations = ref({});
const gameOverDelay = 4000;
const showStartScreen = ref(true)
const gameActive = ref(false)
const maxUnlockedLevel = ref(1)
const maxLevels = 9
const highscores = ref([])
const showHighscores = ref(false)
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

let engine = null;
let runner = null;

const fruitTypes = [
  {
    size: 32, color: '#9C27B0', level: 1, name: 'Blueberry',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#9C27B0" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 38, color: '#E91E63', level: 2, name: 'Strawberry',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#E91E63" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 44, color: '#FF9800', level: 3, name: 'Orange',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#FF9800" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 50, color: '#FFEB3B', level: 4, name: 'Lemon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#FFEB3B" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 56, color: '#8BC34A', level: 5, name: 'Apple',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#8BC34A" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 64, color: '#795548', level: 6, name: 'Avocado',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#795548" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 72, color: '#CDDC39', level: 7, name: 'Melon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#CDDC39" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 80, color: '#F44336', level: 8, name: 'Watermelon',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#F44336" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 88, color: '#2196F3', level: 9, name: 'Jackfruit',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#2196F3" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 100, color: '#9575CD', level: 10, name: 'Dragon Fruit',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#9575CD" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 112, color: '#4CAF50', level: 11, name: 'Durian',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#4CAF50" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 126, color: '#FF5722', level: 12, name: 'Pomegranate',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#FF5722" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 142, color: '#009688', level: 13, name: 'Coconut',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#009688" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 166, color: '#3F51B5', level: 14, name: 'Giant Grape',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#3F51B5" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
      </svg>`
  },
  {
    size: 192, color: '#FFC107', level: 15, name: 'Super Fruit',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r="32" fill="#FFC107" />
        <circle cx="22" cy="27" r="6" fill="white" />
        <circle cx="42" cy="27" r="6" fill="white" />
        <circle cx="22" cy="27" r="3" fill="black" />
        <circle cx="42" cy="27" r="3" fill="black" />
        <path d="M24,42 Q32,48 40,42" stroke="black" stroke-width="2" fill="none" />
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
    x: 0,
    y: 0,
    rotation: 0,
    body: null,
    merging: false
  };
}

function initPhysics() {
  // Create engine with appropriate gravity
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 0.5, scale: 0.001 } // Adjusted gravity for better gameplay
  });

  // Create and start Matter Runner - this was the missing piece!
  runner = Matter.Runner.create();
  Matter.Runner.run(runner, engine);

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

  Matter.Composite.add(engine.world, walls);
  Matter.Events.on(engine, 'collisionStart', handleCollision);
}

function levelUp() {
  levelCompleted.value = true
  nextLevel.value = level.value + 1

  // Speichere den Highscore für das aktuelle Level
  const isNewHighscore = saveHighscore(level.value, score.value)

  // Freischalten des nächsten Levels, wenn es noch nicht freigeschaltet ist
  if (nextLevel.value <= maxLevels && nextLevel.value > maxUnlockedLevel.value) {
    maxUnlockedLevel.value = nextLevel.value
    // Aktualisiere die verfügbaren Levels
    updateAvailableLevels()
  }

  // Verstecke next fruit und deaktiviere dropping wenn Level abgeschlossen
  showNextFruit.value = false
  canDropFruit.value = false
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

function startLevel(levelNumber) {
  // Stelle sicher, dass das Level freigeschaltet ist
  if (levelNumber > maxUnlockedLevel.value) return

  // Score zurücksetzen
  score.value = 0

  // Physik-Engine zurücksetzen und Wände neu erstellen wie in startNextLevel
  Matter.World.clear(engine.world, false)

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
  ]

  // Add walls back to the world
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

  // Verstecke den Startbildschirm und starte das Spiel
  showStartScreen.value = false
  gameActive.value = true
  showHighscores.value = false
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

            // Create new fruit of the next level if not already at max level
            if (levelA < fruitTypes.length) {
              const nextLevelIndex = levelA; // Current level is 1-based, array is 0-based

              const newFruit = {
                id: nextFruitId.value++,
                color: fruitTypes[nextLevelIndex].color,
                size: fruitTypes[nextLevelIndex].size,
                level: levelA + 1, // Next level number
                name: fruitTypes[nextLevelIndex].name,
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
        label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}` // Label for identification
      }
  );

  fruit.body = fruitBody;
  Matter.Composite.add(engine.world, fruitBody);
  fruits.value.push(fruit);
}

function addFruitToWorld(fruit, x, y) {
  const fruitBody = Matter.Bodies.circle(
      x,
      y,
      fruit.size / 2,
      {
        restitution: 0.6,
        friction: 0.05,
        frictionAir: 0.008,
        density: 0.001,
        label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}`
      }
  );

  fruit.body = fruitBody;
  Matter.Composite.add(engine.world, fruitBody);
  fruits.value.push(fruit);

  // Hide next fruit temporarily
  showNextFruit.value = false;

  // Show next fruit after delay
  setTimeout(() => {
    // Only show next fruit if level is not completed
    if (!levelCompleted.value) {
      nextFruit.value = generateFruit();
      showNextFruit.value = true;
    }
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

  const clientX = event.clientX || (event.touches && event.touches[0].clientX) || 0;
  const boardRect = gameBoard.value.getBoundingClientRect();
  const relativeX = clientX - boardRect.left;

  const minX = nextFruit.value.size / 2 + wallThickness / 4;
  const maxX = boardWidth.value - nextFruit.value.size / 2 - wallThickness / 4;
  nextFruitPosition.value = Math.max(minX, Math.min(maxX, relativeX));
}

function endDrag(event) {
  if (!isDragging.value) return;
  isDragging.value = false;

  const newFruit = { ...nextFruit.value };
  addFruitToWorld(newFruit, nextFruitPosition.value - wallThickness / 4, -10);

  const moveEvent = 'ontouchstart' in window ? 'touchmove' : 'mousemove';
  const endEvent = 'ontouchstart' in window ? 'touchend' : 'mouseup';
  document.removeEventListener(moveEvent, handleDrag);
  document.removeEventListener(endEvent, endDrag);
}

function checkGameOver() {
  const currentTime = Date.now();

  // Check for fruits that are above the top boundary
  for (const fruit of fruits.value) {
    if (fruit.body && fruit.body.position.y < topBoundary) {
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
  const now = new Date()
  const dateString = now.toLocaleDateString('de-DE')

  // Neuen Highscore erstellen
  const newHighscore = {
    level,
    score,
    date: dateString
  }

  // Highscores nach Level gruppieren
  const levelHighscores = highscores.value.filter(hs => hs.level === level)

  // Prüfen, ob es ein neuer Highscore für das Level ist
  if (levelHighscores.length === 0 || Math.max(...levelHighscores.map(hs => hs.score)) < score) {
    // Alte Highscores für dieses Level entfernen
    highscores.value = highscores.value.filter(hs => hs.level !== level)
    // Neuen Highscore hinzufügen
    highscores.value.push(newHighscore)
    // Sortieren nach Level und Score
    highscores.value.sort((a, b) => {
      if (a.level !== b.level) return a.level - b.level
      return b.score - a.score
    })

    // Im LocalStorage speichern
    localStorage.setItem('fruitMergeHighscores', JSON.stringify(highscores.value))

    return true // Neuer Highscore wurde gesetzt
  }

  return false // Kein neuer Highscore
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
        <h3>Fruit Merge</h3>
        <p>Kombiniere gleiche Früchte und erreiche hohe Punktzahlen!</p>

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
              <th>Score</th>
              <th>Datum</th>
            </tr>
            </thead>
            <tbody>
            <tr v-for="(score, index) in highscores" :key="index">
              <td>{{ score.level }}</td>
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
          <div v-if="gameOver" class="game-over-message">
            <span>Game Over</span>
            <button class="btn restart-btn" @click="restartGame">Play Again</button>
          </div>
          <div v-else-if="!levelCompleted" class="level-row">
            <div class="score">
              <span>Score</span>
              <span>{{ score }}</span>
            </div>
            <div class="highscore" :class="{ 'new-record': score > currentLevelHighscore }">
              <span>Best</span>
              <span>{{ score > currentLevelHighscore ? score : currentLevelHighscore }}</span>
            </div>
            <div class="level-display">
              <span>Level</span>
              <span>{{ level }}</span>
            </div>
            <div class="level" :style="{ background: targetFruit.color }">
              <span>Goal</span>
              <span>{{ targetFruit.fruitLevel }} {{ targetFruit.name }}</span>
            </div>
          </div>
          <div v-else class="level-complete-message">
            <button class="btn next-level-btn" @click="startNextLevel">Start Next Level</button>
          </div>
        </div>

        <div class="game-frame">
          <div class="next-fruit-area">
            <div
                v-if="showNextFruit"
                class="next-fruit fruit"
                :style="{
              backgroundColor: nextFruit.color,
              width: `${nextFruit.size}px`,
              height: `${nextFruit.size}px`,
              left: `${nextFruitPosition}px`
            }"
                @mousedown="startDrag"
                @touchstart="startDrag"
            >
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
                :class="{ 'merging': fruit.merging }"
                :style="{
              left: `${fruit.x}px`,
              top: `${fruit.y}px`,
              backgroundColor: fruit.color,
              width: `${fruit.size}px`,
              height: `${fruit.size}px`,
              transform: `rotate(${fruit.rotation}deg)`
            }"
            >
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
  min-height: 350px;
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
  padding: 8px 0;
  display: flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  font-size: 1rem;
  font-weight: bold;
  gap: 1rem;
  text-shadow: 0 1px 3px #000, 0 -1px 3px #000;
  height: 60px;
}

.level-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: 1rem;
}

.game-frame {
  position: relative;
  width: 270px;
  height: 350px;
  display: flex;
  flex-direction: column;
}

.next-fruit-area {
  height: 70px;
  width: 100%;
  position: relative;
}

.game-board {
  position: relative;
  width: 100%;
  height: 350px;
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

.fruit {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.2);
  transition: transform 0.1s ease;
  color: white;
  font-weight: bold;
  text-shadow: 1px 1px 1px rgba(0,0,0,0.5);
}

.fruit-level {
  font-size: 1rem;
  line-height: 1;
}

.fruit-name {
  font-size: 0.5rem;
  opacity: 0.8;
}

.fruit.merging {
  transform: scale(1.2);
  opacity: 0.8;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.next-fruit {
  bottom: 0;
  transform: translateX(-50%);
  z-index: 2;
  cursor: grab;

  &::after {
    content: '';
    position: absolute;
    margin: auto;
    top: 100%;
    left: 0;
    right: 0;
    height: 288px;
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
  justify-content: center;
  padding: 1rem;
  text-align: center;
  background-color: rgba(234, 231, 214, 0.9);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  margin: 0 auto;
  height: 410px;

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

.level-button {
  position: relative;
  background-color: #6b89c9;
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

.lock-icon {
  position: absolute;
  top: -8px;
  right: -8px;
  font-size: 1.2rem;
}
.start-screen-buttons {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.highscore-btn {
  background-color: #6b89c9;
  margin-bottom: 0.5rem;
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

.highscore.new-record {
  color: #FFEB3B;
  animation: pulse 1s infinite;
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