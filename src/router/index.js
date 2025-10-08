import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Gaming from '../gamingHub/views/Gaming.vue'
import MemoryLevels from '../gamingHub/games/memory/MemoryLevels.vue'
import MemoryGame from '../gamingHub/games/memory/MemoryGame.vue'
import FruitMergeLevels from '../gamingHub/games/fruitmerge/FruitMergeLevels.vue'
import FruitMergeGame from '../gamingHub/games/fruitmerge/FruitMergeGame.vue'
import Shop from '../gamingHub/views/Shop.vue'
import Profile from '../gamingHub/views/Profile.vue'
import Trophy from '../gamingHub/views/Trophy.vue'
import Settings from '../gamingHub/views/Settings.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/games/memory',
    name: 'MemoryLevels',
    component: MemoryLevels
  },
  {
    path: '/games/memory/:level',
    name: 'MemoryGame',
    component: MemoryGame,
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/memory')
      } else {
        next()
      }
    }
  },
  {
    path: '/games/fruitmerge',
    name: 'FruitMergeLevels',
    component: FruitMergeLevels
  },
  {
    path: '/games/fruitmerge/:level',
    name: 'FruitMergeGame',
    component: FruitMergeGame,
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/fruitmerge')
      } else {
        next()
      }
    }
  },
  {
    path: '/games/nummerge',
    name: 'NumMergeLevels',
    component: () => import('../gamingHub/games/nummerge/NumMergeLevels.vue')
  },
  {
    path: '/games/nummerge/:level',
    name: 'NumMergeGame',
    component: () => import('../gamingHub/games/nummerge/NumMergeGame.vue'),
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/nummerge')
      } else {
        next()
      }
    }
  },
  {
    path: '/games/stackmerge',
    name: 'StackMerge',
    component: () => import('../gamingHub/games/stackmerge/StackMergeLevels.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/games/stackmerge/:level',
    name: 'StackMergeLevels',
    component: () => import('../gamingHub/games/stackmerge/StackMerge.vue'),
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/stackmerge')
      } else {
        next()
      }
    }
  },
  {
    path: '/shop',
    name: 'Shop',
    component: Shop
  },
  {
    path: '/shop/redeem/:giftCode',
    name: 'ShopRedeem',
    component: Shop,
    props: route => ({
      autoRedeemCode: route.params.giftCode
    })
  },
  {
    path: '/profile',
    name: 'Profile',
    component: Profile
  },
  {
    path: '/trophies',
    name: 'Trophy',
    component: Trophy
  },
  {
    path: '/settings',
    name: 'Settings',
    component: Settings
  },
  {
    path: '/about',
    name: 'About',
    component: About
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router