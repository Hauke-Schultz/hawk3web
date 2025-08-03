import { ref, computed } from 'vue'
import { useLocalStorage } from './useLocalStorage.js'
import { SHOP_ITEMS } from '../config/shopConfig.js'

export function useInventory() {
  const { gameData, updatePlayer } = useLocalStorage()

  // Initialize inventory if it doesn't exist
  if (!gameData.player.inventory) {
    gameData.player.inventory = {
      items: {},
      equipped: {
        avatar: gameData.player.avatar || 'avatar/user',
        theme: 'default',
        frame: null
      },
      activeBoosts: [],
      consumables: {}
    }
  }

  const inventory = computed(() => gameData.player.inventory)

  // Check if item is owned
  const hasItem = (itemId) => {
    return !!inventory.value.items[itemId]
  }

  // Get owned quantity of item
  const getItemQuantity = (itemId) => {
    return inventory.value.items[itemId]?.quantity || 0
  }

  // Add item to inventory
  const addItem = (itemId, quantity = 1) => {
    if (!inventory.value.items[itemId]) {
      const item = SHOP_ITEMS.find(i => i.id === itemId)
      inventory.value.items[itemId] = {
        id: itemId,
        quantity: 0,
        purchasedAt: new Date().toISOString(),
        type: item?.type || 'unknown'
      }
    }
    inventory.value.items[itemId].quantity += quantity
  }

  // Use consumable item
  const useConsumableItem = (itemId) => {
    const item = inventory.value.items[itemId]
    if (item && item.quantity > 0) {
      item.quantity -= 1
      if (item.quantity === 0) {
        delete inventory.value.items[itemId]
      }
      return true
    }
    return false
  }

  // Equip item (for cosmetics)
  const equipItem = (itemId, slot) => {
    if (hasItem(itemId)) {
      inventory.value.equipped[slot] = itemId

      // Update player data accordingly
      if (slot === 'avatar') {
        updatePlayer({ avatar: itemId })
      }

      return true
    }
    return false
  }

  // Get equipped item for slot
  const getEquippedItem = (slot) => {
    return inventory.value.equipped[slot]
  }

  // Get all owned items by category
  const getItemsByCategory = (category) => {
    return Object.keys(inventory.value.items).filter(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId)
      return item?.category === category
    })
  }

  // Activate boost
  const activateBoost = (itemId) => {
    const item = SHOP_ITEMS.find(i => i.id === itemId)
    if (item && item.type === 'boost' && hasItem(itemId)) {
      if (useConsumableItem(itemId)) {
        const boost = {
          id: itemId,
          effect: item.effect,
          activatedAt: Date.now(),
          expiresAt: Date.now() + (item.effect.duration * 1000)
        }
        inventory.value.activeBoosts.push(boost)
        return true
      }
    }
    return false
  }

  // Check and remove expired boosts
  const updateActiveBoosts = () => {
    const now = Date.now()
    inventory.value.activeBoosts = inventory.value.activeBoosts.filter(
        boost => boost.expiresAt > now
    )
  }

  // Get active boost for type
  const getActiveBoost = (type) => {
    updateActiveBoosts()
    return inventory.value.activeBoosts.find(boost => boost.effect.type === type)
  }

  return {
    inventory,
    hasItem,
    getItemQuantity,
    addItem,
    useConsumableItem,
    equipItem,
    getEquippedItem,
    getItemsByCategory,
    activateBoost,
    updateActiveBoosts,
    getActiveBoost
  }
}