<script setup>
import { ref, onMounted, computed, onBeforeUnmount } from 'vue'
import * as Matter from 'matter-js'

const score = ref(0)
const fruits = ref([]);
const nextFruitId = ref(0);
const gameBoard = ref(null);
const nextFruitPosition = ref(0);
const isDragging = ref(false);
const boardWidth = ref(280);
const boardHeight = ref(350);
const wallThickness = 20;
const targetFruitLevel = computed(() => Math.min(4 + level.value, fruitTypes.length - 1));
const level = ref(1);
const levelCompleted = ref(false);
const nextLevel = ref(2);
// Added flag to control next fruit visibility
const showNextFruit = ref(true);
// Added flag to control if dropping is allowed
const canDropFruit = ref(true);

let engine = null;
let runner = null;

// Fruit types with increasing sizes for each level
const fruitTypes = [
  { size: 32, color: '#9C27B0', level: 1, name: 'Cherry' },
  { size: 38, color: '#E91E63', level: 2, name: 'Strawberry' },
  { size: 44, color: '#FF9800', level: 3, name: 'Orange' },
  { size: 50, color: '#FFEB3B', level: 4, name: 'Lemon' },
  { size: 56, color: '#8BC34A', level: 5, name: 'Apple' },
  { size: 64, color: '#795548', level: 6, name: 'Avocado' },
  { size: 72, color: '#CDDC39', level: 7, name: 'Melon' },
  { size: 80, color: '#F44336', level: 8, name: 'Watermelon' },
  { size: 88, color: '#2196F3', level: 9, name: 'Jackfruit' },
  { size: 100, color: '#9575CD', level: 10, name: 'Dragon Fruit' },
  { size: 112, color: '#4CAF50', level: 11, name: 'Durian' },
  { size: 126, color: '#FF5722', level: 12, name: 'Pomegranate' },
  { size: 142, color: '#009688', level: 13, name: 'Coconut' },
  { size: 166, color: '#3F51B5', level: 14, name: 'Giant Grape' },
  { size: 192, color: '#FFC107', level: 15, name: 'Super Fruit' },
];

const nextFruit = ref(generateFruit());
const targetFruit = computed(() => ({
  name: fruitTypes[targetFruitLevel.value].name,
  color: fruitTypes[targetFruitLevel.value].color,
  fruitLevel: fruitTypes[targetFruitLevel.value].level,
  level: targetFruitLevel.value + 1
}));

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
  levelCompleted.value = true;
  nextLevel.value = level.value + 1;
  // Hide next fruit and disable dropping when level is completed
  showNextFruit.value = false;
  canDropFruit.value = false;
}

function startNextLevel() {
  // Clear the physics world completely
  Matter.World.clear(engine.world, false);

  // Recreate the walls
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

  // Add walls back to the world
  Matter.Composite.add(engine.world, walls);

  // Reset the fruits array
  fruits.value = [];

  // Increment the level
  level.value = nextLevel.value;

  // Reset level completion status
  levelCompleted.value = false;

  // Reset next fruit position
  nextFruitPosition.value = boardWidth.value / 2;

  // Re-enable fruit dropping and show next fruit
  canDropFruit.value = true;
  showNextFruit.value = true;

  // Generate new next fruit
  nextFruit.value = generateFruit();
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

onMounted(() => {
  if (gameBoard.value) {
    const rect = gameBoard.value.getBoundingClientRect();
    boardWidth.value = rect.width;
    boardHeight.value = rect.height;
  }
  initPhysics();
  nextFruitPosition.value = boardWidth.value / 2;
  updateFruitPositions();
});

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
      <div class="game-header">
        <div v-if="!levelCompleted" class="level-row">
          <div class="score">
            <span>Score</span>
            <span>{{ score }}</span>
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
  width: 280px;
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
.level-display {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem;
  width: 33.33%;

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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>