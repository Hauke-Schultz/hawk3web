<script setup>
import { ref, onMounted, onUnmounted, onBeforeUnmount, watch } from 'vue'
import * as Matter from 'matter-js'

const score = ref(0)
const fruits = ref([]);
const nextFruitId = ref(0);
const gameBoard = ref(null);
const nextFruitPosition = ref(0);
const isDragging = ref(false);
const boardWidth = ref(300);
const boardHeight = ref(400);
const wallThickness = 20;

let engine = null;
let render = null;

const fruitTypes = [
  { size: 40, color: '#9C27B0', level: 1 },
  { size: 40, color: '#E91E63', level: 2 },
  { size: 40, color: '#FF9800', level: 3 },
  { size: 40, color: '#FFEB3B', level: 4 },
  { size: 40, color: '#8BC34A', level: 5 },
  { size: 40, color: '#795548', level: 6 },
  { size: 40, color: '#CDDC39', level: 7 },
  { size: 40, color: '#F44336', level: 8 },
  { size: 40, color: '#2196F3', level: 9 },
];

const nextFruit = ref(generateFruit());

function generateFruit() {
  const randomFruitType = fruitTypes[Math.floor(Math.random() * fruitTypes.length)];

  return {
    id: nextFruitId.value++,
    color: randomFruitType.color,
    size: randomFruitType.size,
    level: randomFruitType.level,
    x: 0,
    y: 0,
    rotation: 0,
    body: null
  };
}

function initPhysics() {
  engine = Matter.Engine.create({
    gravity: { x: 0, y: 1, scale: 0.001 }
  });

  const walls = [
    // Boden
    Matter.Bodies.rectangle(
        boardWidth.value / 2,
        boardHeight.value + wallThickness / 2,
        boardWidth.value,
        wallThickness,
        { isStatic: true, label: 'wall-bottom' }
    ),
    // Linke Wand
    Matter.Bodies.rectangle(
        -wallThickness / 2,
        boardHeight.value / 2,
        wallThickness,
        boardHeight.value,
        { isStatic: true, label: 'wall-left' }
    ),
    // Rechte Wand
    Matter.Bodies.rectangle(
        boardWidth.value + wallThickness / 2,
        boardHeight.value / 2,
        wallThickness,
        boardHeight.value,
        { isStatic: true, label: 'wall-right' }
    )
  ];

  Matter.World.add(engine.world, walls);
  Matter.Events.on(engine, 'collisionStart', handleCollision);
}

// Kollisionen verarbeiten
function handleCollision(event) {
  // TODO
}

function addFruitToWorld(fruit, x, y) {
  const fruitBody = Matter.Bodies.circle(
      x,
      y,
      fruit.size / 2,
      {
        restitution: 0.3,
        friction: 0.1,
        frictionAir: 0.01,
        density: 0.001,
        label: `fruit-${fruit.id}-${fruit.color}-${fruit.level}` // Label zum Identifizieren
      }
  );

  fruit.body = fruitBody;
  Matter.World.add(engine.world, fruitBody);
  fruits.value.push(fruit);
  nextFruit.value = generateFruit();
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

  const minX = nextFruit.value.size / 2;
  const maxX = boardWidth.value - nextFruit.value.size / 2;
  nextFruitPosition.value = Math.max(minX, Math.min(maxX, relativeX));
}

function endDrag(event) {
  if (!isDragging.value) return;
  isDragging.value = false;

  const newFruit = { ...nextFruit.value };
  addFruitToWorld(newFruit, nextFruitPosition.value, 50);

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

onUnmounted(() => {
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
        <div class="score">Punkte: {{ score }}</div>
      </div>

      <div class="game-frame">
        <div class="next-fruit-area">
          <div
              class="next-fruit fruit"
              :style="{
            backgroundColor: nextFruit.color,
            width: `${nextFruit.size}px`,
            height: `${nextFruit.size}px`,
            left: `${nextFruitPosition}px`
          }"
              @mousedown="startDrag"
              @touchstart="startDrag"
          ></div>
        </div>

        <div class="game-board" ref="gameBoard">
          <div
              v-for="fruit in fruits"
              :key="fruit.id"
              class="fruit"
              :style="{
            left: `${fruit.x}px`,
            top: `${fruit.y}px`,
            backgroundColor: fruit.color,
            width: `${fruit.size}px`,
            height: `${fruit.size}px`,
            transform: `rotate(${fruit.rotation}deg)`
          }"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.fruit-merge {
  width: 100%;
  height: 100%;
  min-height: 400px;
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

.game-frame {
  position: relative;
  width: 300px;
  height: 450px;
  display: flex;
  flex-direction: column;
}

.next-fruit-area {
  height: 50px;
  width: 100%;
  position: relative;
  margin-bottom: 10px;
}

.game-board {
  position: relative;
  width: 100%;
  height: 400px;
  background-color: rgba(234, 231, 214, 0.8);
  border: 4px solid #c9b991;
  overflow: hidden;
}

.fruit {
  position: absolute;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1;
  box-shadow: inset 0 -3px 0 rgba(0,0,0,0.2);
  transition: transform 0.1s ease;
}

.fruit.merging {
  transform: scale(1.2);
}

.next-fruit {
  top: 5px;
  transform: translateX(-50%);
  z-index: 2;
  cursor: grab;
}
</style>