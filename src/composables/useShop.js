import { ref, computed } from 'vue'
import { useLocalStorage } from './useLocalStorage.js'
import { useInventory } from './useInventory.js'
import { SHOP_ITEMS, SHOP_CATEGORIES } from '../config/shopConfig.js'

export function useShop() {
  const { gameData, updatePlayer } = useLocalStorage()
  const { addItem, hasItem } = useInventory()

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

  // Purchase item
  const purchaseItem = (item) => {
    if (!canPurchaseItem(item)) {
      return {
        success: false,
        error: 'Cannot purchase this item'
      }
    }

    // Deduct currency
    const newCoins = gameData.player.coins - item.price.coins
    const newDiamonds = gameData.player.diamonds - item.price.diamonds

    updatePlayer({
      coins: newCoins,
      diamonds: newDiamonds
    })

    // Add to inventory
    addItem(item.id, 1)

    // Record transaction
    const transaction = {
      id: `purchase_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      type: 'spend',
      source: 'shop_purchase',
      description: `Purchased: ${item.name}`,
      amounts: {
        coins: -item.price.coins,
        diamonds: -item.price.diamonds
      },
      balanceAfter: {
        coins: newCoins,
        diamonds: newDiamonds
      },
      metadata: {
        itemId: item.id,
        itemName: item.name,
        category: item.category
      }
    }

    if (!gameData.currency) {
      gameData.currency = { transactions: [] }
    }
    gameData.currency.transactions.push(transaction)

    console.log(`🛒 Item purchased: ${item.name} for ${item.price.coins} coins, ${item.price.diamonds} diamonds`)

    return {
      success: true,
      item: item,
      transaction: transaction
    }
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
    purchaseItem,
    getPurchaseSummary
  }
}