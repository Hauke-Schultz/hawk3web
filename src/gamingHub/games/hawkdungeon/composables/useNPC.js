// NPC management composable for HawkDungeon
import { ref, reactive } from 'vue'
import {
  createNPC,
  getCurrentDialogue,
  advanceDialogue,
  resetDialogue,
  isInInteractionRange,
  DIALOGUE_STATE
} from '../config/npcConfig'

export function useNPC() {
  // Array of all NPCs in the current level
  const npcs = ref([])

  // Currently active NPC (if player is interacting)
  const activeNPC = ref(null)

  // Dialogue state
  const dialogueState = reactive({
    visible: false,
    text: '',
    npcName: '',
    hasMoreText: false,
    position: { x: 0, y: 0 }
  })

  // Enemy spawning pause state
  const enemySpawningPaused = ref(false)

  /**
   * Add an NPC to the level
   * @param {string} type - NPC type (from NPC_TYPES)
   * @param {number} gridX - Grid X position
   * @param {number} gridY - Grid Y position
   * @param {string} dialogueKey - Dialogue key to use
   * @param {object} options - Additional options
   */
  const addNPC = (type, gridX, gridY, dialogueKey = 'greeting', options = {}) => {
    const npc = createNPC(type, gridX, gridY, dialogueKey, options)

    if (npc) {
      npcs.value.push(npc)
      console.log(`Added NPC: ${npc.name} at (${gridX}, ${gridY})`)
      return npc
    }

    return null
  }

  /**
   * Remove an NPC from the level
   * @param {string} npcId - NPC ID
   */
  const removeNPC = (npcId) => {
    const index = npcs.value.findIndex(npc => npc.id === npcId)
    if (index !== -1) {
      npcs.value.splice(index, 1)
      console.log(`Removed NPC: ${npcId}`)
    }
  }

  /**
   * Clear all NPCs from the level
   */
  const clearNPCs = () => {
    npcs.value = []
    activeNPC.value = null
    dialogueState.visible = false
    enemySpawningPaused.value = false
    console.log('Cleared all NPCs')
  }

  /**
   * Check if player is near any NPCs and trigger interaction
   * @param {number} playerX - Player grid X
   * @param {number} playerY - Player grid Y
   * @param {object} screenPosition - Screen position for dialogue bubble {x, y}
   */
  const checkNPCInteraction = (playerX, playerY, screenPosition = null) => {
    // Find NPCs in interaction range
    const nearbyNPC = npcs.value.find(npc =>
      isInInteractionRange(npc, playerX, playerY)
    )

    if (nearbyNPC && nearbyNPC !== activeNPC.value) {
      // Start interaction with this NPC
      startDialogue(nearbyNPC, screenPosition)
    } else if (!nearbyNPC && activeNPC.value) {
      // Player moved away from NPC
      endDialogue()
    }
  }

  /**
   * Start dialogue with an NPC
   * @param {object} npc - NPC instance
   * @param {object} screenPosition - Screen position for dialogue bubble {x, y}
   */
  const startDialogue = (npc, screenPosition = null) => {
    // Reset dialogue if it was completed before
    if (npc.state === DIALOGUE_STATE.COMPLETED) {
      resetDialogue(npc)
    }

    activeNPC.value = npc
    npc.state = DIALOGUE_STATE.SPEAKING

    // Pause enemy spawning if NPC has this flag
    if (npc.pauseEnemySpawning) {
      enemySpawningPaused.value = true
    }

    // Get current dialogue text
    const text = getCurrentDialogue(npc)

    if (text) {
      dialogueState.visible = true
      dialogueState.text = text
      dialogueState.npcName = npc.name
      dialogueState.hasMoreText = npc.currentDialogueIndex < npc.dialogue.length - 1

      // Calculate default position (center of screen - NPC is at center when near player)
      // This will be overridden by the component if screenPosition is provided
      if (screenPosition) {
        dialogueState.position = { ...screenPosition }
      } else {
        // Default to center-top of screen
        dialogueState.position = { x: window.innerWidth / 2, y: 200 }
      }

      console.log(`Started dialogue with ${npc.name}:`, text)
    }
  }

  /**
   * Advance to the next dialogue line
   */
  const advanceNPCDialogue = () => {
    if (!activeNPC.value) return

    const hasMore = advanceDialogue(activeNPC.value)

    if (hasMore) {
      // More dialogue available
      const text = getCurrentDialogue(activeNPC.value)
      dialogueState.text = text
      dialogueState.hasMoreText = activeNPC.value.currentDialogueIndex < activeNPC.value.dialogue.length - 1
    } else {
      // Dialogue completed
      completeDialogue()
    }
  }

  /**
   * Complete the dialogue and trigger callback
   */
  const completeDialogue = () => {
    if (!activeNPC.value) return

    const npc = activeNPC.value

    console.log(`Completed dialogue with ${npc.name}`)

    // Mark dialogue as completed
    npc.dialogueCompleted = true

    // Resume enemy spawning
    if (npc.pauseEnemySpawning) {
      enemySpawningPaused.value = false
    }

    // Call completion callback if provided
    if (npc.onDialogueComplete) {
      npc.onDialogueComplete(npc)
    }

    // Hide dialogue
    dialogueState.visible = false
    activeNPC.value = null
  }

  /**
   * End dialogue (player moved away)
   */
  const endDialogue = () => {
    if (!activeNPC.value) return

    console.log(`Ended dialogue with ${activeNPC.value.name}`)

    // Resume enemy spawning
    if (activeNPC.value.pauseEnemySpawning) {
      enemySpawningPaused.value = false
    }

    dialogueState.visible = false
    activeNPC.value = null
  }

  /**
   * Manually trigger dialogue with a specific NPC
   * @param {string} npcId - NPC ID
   * @param {object} screenPosition - Screen position for dialogue bubble
   */
  const triggerDialogue = (npcId, screenPosition = null) => {
    const npc = npcs.value.find(n => n.id === npcId)
    if (npc) {
      startDialogue(npc, screenPosition)
    }
  }

  /**
   * Check if a position is blocked by an NPC
   * @param {number} gridX - Grid X position
   * @param {number} gridY - Grid Y position
   * @returns {boolean} True if blocked
   */
  const isBlockedByNPC = (gridX, gridY) => {
    return npcs.value.some(npc =>
      npc.blockMovement &&
      npc.gridX === gridX &&
      npc.gridY === gridY
    )
  }

  /**
   * Get NPC at a specific position
   * @param {number} gridX - Grid X position
   * @param {number} gridY - Grid Y position
   * @returns {object|null} NPC instance or null
   */
  const getNPCAtPosition = (gridX, gridY) => {
    return npcs.value.find(npc =>
      npc.gridX === gridX &&
      npc.gridY === gridY
    ) || null
  }

  return {
    npcs,
    activeNPC,
    dialogueState,
    enemySpawningPaused,
    addNPC,
    removeNPC,
    clearNPCs,
    checkNPCInteraction,
    advanceNPCDialogue,
    completeDialogue,
    endDialogue,
    triggerDialogue,
    isBlockedByNPC,
    getNPCAtPosition
  }
}
