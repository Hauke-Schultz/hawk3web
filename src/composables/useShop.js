import { ref, computed } from 'vue'
import { useLocalStorage } from './useLocalStorage.js'
import { useInventory } from './useInventory.js'
import { SHOP_ITEMS, SHOP_CATEGORIES } from '../config/shopConfig.js'

export function useShop() {
  const { gameData, purchaseShopItem } = useLocalStorage()
  const { hasItem } = useInventory()

  const selectedCategory = ref('cosmetics')

  // Get items by category
  const getItemsByCategory = (categoryId) => {
    return SHOP_ITEMS.filter(item => item.category === categoryId)
  }

  // Current category items
  const currentCategoryItems = computed(() => {
    return getItemsByCategory(selectedCategory.value)
  })

  // Check if player can afford item
  const canAffordItem = (item) => {
    const playerCoins = gameData.player.coins || 0
    const playerDiamonds = gameData.player.diamonds || 0

    return playerCoins >= item.price.coins &&
        playerDiamonds >= item.price.diamonds
  }

  // Check if item is purchasable (not owned if limited)
  const canPurchaseItem = (item) => {
    if (!canAffordItem(item)) return false

    // Check purchase limit
    if (item.purchaseLimit === 1 && hasItem(item.id)) {
      return false
    }

    return true
  }

  // Get purchase summary for confirmation
  const getPurchaseSummary = (item) => {
    return {
      item: item,
      canAfford: canAffordItem(item),
      canPurchase: canPurchaseItem(item),
      playerBalance: {
        coins: gameData.player.coins || 0,
        diamonds: gameData.player.diamonds || 0
      },
      afterPurchase: {
        coins: (gameData.player.coins || 0) - item.price.coins,
        diamonds: (gameData.player.diamonds || 0) - item.price.diamonds
      }
    }
  }

  return {
    selectedCategory,
    currentCategoryItems,
    categories: Object.values(SHOP_CATEGORIES),
    getItemsByCategory,
    canAffordItem,
    canPurchaseItem,
    getPurchaseSummary
  }
}