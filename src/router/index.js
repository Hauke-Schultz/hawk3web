import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Gaming from '../views/Gaming.vue'
import MemoryLevels from '../games/memory/MemoryLevels.vue'
import MemoryGame from '../games/memory/MemoryGame.vue'
import FruitMergeLevels from '../games/fruitmerge/FruitMergeLevels.vue'
import FruitMergeGame from '../games/fruitmerge/FruitMergeGame.vue'
import Shop from '../views/Shop.vue'
import Profile from '../views/Profile.vue'
import Trophy from '../views/Trophy.vue'
import Settings from '../views/Settings.vue'
import About from '../views/About.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/games',
    name: 'Gaming',
    component: Gaming
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
    path: '/games/numnummerge',
    name: 'NumNumMergeLevels',
    component: () => import('../games/numnummerge/NumNumMergeLevels.vue')
  },
  {
    path: '/games/numnummerge/:level',
    name: 'NumNumMergeGame',
    component: () => import('../games/numnummerge/NumNumMergeGame.vue'),
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/numnummerge')
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