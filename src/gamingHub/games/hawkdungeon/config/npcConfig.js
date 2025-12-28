// NPC configuration for HawkDungeon
// NPCs can provide information, quests, or dialogue to the player

export const NPC_TYPES = {
  guide: {
    id: 'guide',
    name: 'Alter Weiser',
    sprite: 'wizard', // Using wizard from player-v1 spritesheet
    dialogues: {
      greeting: [
        'Willkommen im Dungeon, tapferer Ritter!',
        'Sei vorsichtig, hier lauern viele Gefahren.',
        'Nutze deine Waffen weise!'
      ],
      level1: [
        'Willkommen in der Eingangshalle!',
        'Ich werde dir helfen, dich vorzubereiten.',
        'Öffne die Truhen und rüste dich aus.',
        'Wenn du bereit bist, werden die Monster erscheinen.',
        'Viel Erfolg, tapferer Ritter!'
      ],
      level2: [
        'Die Katakomben sind gefährlich.',
        'Hier gibt es viele verschlossene Türen.',
        'Sammle Schlüssel aus den Truhen!'
      ],
      level3: [
        'Die Krypta ist voller Untote.',
        'Stelle sicher, dass du gut ausgerüstet bist.',
        'Der Boss wartet am Ende auf dich!'
      ]
    }
  },

  merchant: {
    id: 'merchant',
    name: 'Händler',
    sprite: 'merchant',
    dialogues: {
      greeting: [
        'Willkommen, Abenteurer!',
        'Ich habe viele nützliche Gegenstände.',
        'Was kann ich für dich tun?'
      ]
    }
  },

  questGiver: {
    id: 'questGiver',
    name: 'Dorfältester',
    sprite: 'elder',
    dialogues: {
      greeting: [
        'Bitte hilf uns!',
        'Monster haben unser Dorf bedroht.',
        'Kannst du sie besiegen?'
      ],
      quest: [
        'Besiege 10 Monster im Dungeon.',
        'Kehre dann zu mir zurück.',
        'Ich werde dich belohnen!'
      ],
      completed: [
        'Du hast es geschafft!',
        'Vielen Dank für deine Hilfe.',
        'Hier ist deine Belohnung.'
      ]
    }
  }
}

// NPC dialogue states
export const DIALOGUE_STATE = {
  IDLE: 'idle',
  SPEAKING: 'speaking',
  COMPLETED: 'completed'
}

// Dialogue configuration
export const DIALOGUE_CONFIG = {
  bubbleWidth: 200,
  bubbleHeight: 80,
  bubblePadding: 12,
  bubbleOffset: { x: 0, y: -60 }, // Offset from NPC position
  textSpeed: 30, // Characters per second
  autoClose: true,
  autoCloseDelay: 3000, // ms
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  borderColor: '#fff',
  borderWidth: 2,
  textColor: '#fff',
  fontSize: 14,
  fontFamily: 'Arial, sans-serif'
}

/**
 * Create an NPC instance with position and dialogue
 * @param {string} type - NPC type from NPC_TYPES
 * @param {number} gridX - Grid X position
 * @param {number} gridY - Grid Y position
 * @param {string} dialogueKey - Which dialogue to use (e.g., 'greeting', 'level1')
 * @param {object} options - Additional options
 * @returns {object} NPC instance
 */
export function createNPC(type, gridX, gridY, dialogueKey = 'greeting', options = {}) {
  const npcType = NPC_TYPES[type]

  if (!npcType) {
    console.warn(`NPC type ${type} not found`)
    return null
  }

  const dialogue = npcType.dialogues[dialogueKey] || npcType.dialogues.greeting

  return {
    id: `${type}_${gridX}_${gridY}`,
    type: type,
    name: npcType.name,
    sprite: npcType.sprite,
    gridX,
    gridY,
    dialogue: dialogue,
    dialogueKey: dialogueKey,
    state: DIALOGUE_STATE.IDLE,
    currentDialogueIndex: 0,
    interactionRadius: options.interactionRadius || 2, // Grid units
    blockMovement: options.blockMovement !== undefined ? options.blockMovement : true,
    onDialogueComplete: options.onDialogueComplete || null,
    pauseEnemySpawning: options.pauseEnemySpawning !== undefined ? options.pauseEnemySpawning : true,
    requireInitialDialogue: options.requireInitialDialogue !== undefined ? options.requireInitialDialogue : false,
    dialogueCompleted: false, // Track if dialogue was completed
    animationFrame: 0, // Current animation frame (0 or 1 for idle animation)
    animationTimer: 0, // Timer for animation frame changes
    ...options
  }
}

/**
 * Get the current dialogue text for an NPC
 * @param {object} npc - NPC instance
 * @returns {string} Current dialogue text
 */
export function getCurrentDialogue(npc) {
  if (!npc.dialogue || npc.currentDialogueIndex >= npc.dialogue.length) {
    return null
  }

  return npc.dialogue[npc.currentDialogueIndex]
}

/**
 * Advance to the next dialogue line
 * @param {object} npc - NPC instance
 * @returns {boolean} True if there are more dialogue lines, false if completed
 */
export function advanceDialogue(npc) {
  npc.currentDialogueIndex++

  if (npc.currentDialogueIndex >= npc.dialogue.length) {
    npc.state = DIALOGUE_STATE.COMPLETED
    return false
  }

  return true
}

/**
 * Reset NPC dialogue to the beginning
 * @param {object} npc - NPC instance
 */
export function resetDialogue(npc) {
  npc.currentDialogueIndex = 0
  npc.state = DIALOGUE_STATE.IDLE
}

/**
 * Check if player is in interaction range with NPC
 * @param {object} npc - NPC instance
 * @param {number} playerX - Player grid X
 * @param {number} playerY - Player grid Y
 * @returns {boolean} True if in range
 */
export function isInInteractionRange(npc, playerX, playerY) {
  const distance = Math.abs(npc.gridX - playerX) + Math.abs(npc.gridY - playerY)
  return distance <= npc.interactionRadius
}
