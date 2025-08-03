import { ref, computed } from 'vue'
import { useLocalStorage } from './useLocalStorage.js'
import { SHOP_ITEMS, SHOP_CATEGORIES } from '../config/shopConfig.js'

export function useInventory() {
  const {
    gameData,
    updatePlayer,
    addItemToInventory,
    removeItemFromInventory,
    hasInventoryItem,
    getInventoryItemQuantity,
    equipItem,
    getEquippedItem,
    activateBoost,
    updateActiveBoosts,
    getActiveBoost
  } = useLocalStorage()

  const inventory = computed(() => gameData.player.inventory)

  // Use methods from localStorage service
  const hasItem = (itemId) => {
    return hasInventoryItem(itemId)
  }

  const getItemQuantity = (itemId) => {
    return getInventoryItemQuantity(itemId)
  }

  const addItem = (itemId, quantity = 1, itemData = {}) => {
    return addItemToInventory(itemId, quantity, itemData)
  }

  const useConsumableItem = (itemId) => {
    return removeItemFromInventory(itemId, 1)
  }

  // Get all owned items by category
  const getItemsByCategory = (category) => {
    return Object.keys(inventory.value.items).filter(itemId => {
      const item = SHOP_ITEMS.find(i => i.id === itemId)
      return item?.category === category
    })
  }

  // Get item details with ownership info
  const getItemDetails = (itemId) => {
    const shopItem = SHOP_ITEMS.find(item => item.id === itemId)
    const inventoryItem = inventory.value.items[itemId]

    if (!shopItem) return null

    return {
      ...shopItem,
      owned: !!inventoryItem,
      quantity: inventoryItem?.quantity || 0,
      purchasedAt: inventoryItem?.purchasedAt || null
    }
  }

  // Get all owned items with details
  const getAllOwnedItems = () => {
    return Object.keys(inventory.value.items).map(itemId => {
      return getItemDetails(itemId)
    }).filter(Boolean)
  }

  // Get equipped items
  const getEquippedItems = () => {
    return {
      avatar: getEquippedItem('avatar'),
      theme: getEquippedItem('theme'),
      frame: getEquippedItem('frame')
    }
  }

  return {
    inventory,
    hasItem,
    getItemQuantity,
    addItem,
    useConsumableItem,
    equipItem,
    getEquippedItem,
    getEquippedItems,
    getItemsByCategory,
    getItemDetails,
    getAllOwnedItems,
    activateBoost,
    updateActiveBoosts,
    getActiveBoost
  }
}