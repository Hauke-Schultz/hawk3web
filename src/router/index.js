import { createRouter, createWebHistory } from 'vue-router'
import HaukeSchultz from '../views/HaukeSchultz.vue'
import Home from '../views/Home.vue'
import Gaming from '../gamingHub/views/Gaming.vue'
import MemoryLevels from '../gamingHub/games/memory/MemoryLevels.vue'
import MemoryGame from '../gamingHub/games/memory/MemoryGame.vue'
import HawkFruitLevels from '../gamingHub/games/hawkfruit/HawkFruitLevels.vue'
import HawkFruitGame from '../gamingHub/games/hawkfruit/HawkFruitGame.vue'
import HawkDungeonLevels from '../gamingHub/games/hawkdungeon/HawkDungeonLevels.vue'
import HawkDungeon from '../gamingHub/games/hawkdungeon/HawkDungeon.vue'
import Shop from '../gamingHub/views/Shop.vue'
import Profile from '../gamingHub/views/Profile.vue'
import Trophy from '../gamingHub/views/Trophy.vue'
import Settings from '../gamingHub/views/Settings.vue'
import About from '../views/About.vue'
import HawkGymHome from '../hawkGym/views/HawkGymHome.vue'
import HawkGymTimer from '../hawkGym/views/HawkGymTimer.vue'
import HawkGymSettings from "../hawkGym/views/HawkGymSettings.vue";
import PartyInfo from '../party/PartyInfo.vue'

const routes = [
  {
    path: '/',
    name: 'Landing',
    component: HaukeSchultz
  },
  {
    path: '/gaming',
    name: 'GamingHub',
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
    path: '/games/hawkfruit',
    name: 'HawkFruitLevels',
    component: HawkFruitLevels
  },
  {
    path: '/games/hawkfruit/:level',
    name: 'HawkFruitGame',
    component: HawkFruitGame,
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/hawkfruit')
      } else {
        next()
      }
    }
  },
  {
    path: '/games/hawkdoubleup',
    name: 'HawkDoubleUpLevels',
    component: () => import('../gamingHub/games/hawkdoubleup/HawkDoubleUpLevels.vue')
  },
  {
    path: '/games/hawkdoubleup/:level',
    name: 'HawkDoubleUpGame',
    component: () => import('../gamingHub/games/hawkdoubleup/HawkDoubleUpGame.vue'),
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/hawkdoubleup')
      } else {
        next()
      }
    }
  },
  {
    path: '/games/hawkdungeon',
    name: 'HawkDungeonLevels',
    component: HawkDungeonLevels
  },
  {
    path: '/games/hawkdungeon/:level',
    name: 'HawkDungeon',
    component: HawkDungeon,
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/hawkdungeon')
      } else {
        next()
      }
    }
  },
  {
    path: '/games/hawktower',
    name: 'Hawk Tower',
    component: () => import('../gamingHub/games/hawktower/HawkTowerLevels.vue'),
    meta: { requiresAuth: false }
  },
  {
    path: '/games/hawktower/:level',
    name: 'Hawk TowerLevels',
    component: () => import('../gamingHub/games/hawktower/HawkTower.vue'),
    props: route => ({ level: parseInt(route.params.level) || 1 }),
    beforeEnter: (to, from, next) => {
      const level = parseInt(to.params.level)
      if (isNaN(level) || level < 1 || level > 6) {
        next('/games/hawktower')
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
    path: '/hawk-gym',
    name: 'HawkGymHome',
    component: HawkGymHome
  },
  {
    path: '/hawk-gym/timer',
    name: 'HawkGymTimer',
    component: HawkGymTimer
  },
  {
    path: '/hawk-gym/settings',
    name: 'HawkGymSettings',
    component: HawkGymSettings,
    meta: {
      title: 'Hawk Gym Settings'
    }
  },
  {
    path: '/party',
    name: 'Party',
    component: PartyInfo,
    meta: {
      title: 'Party Einladung'
    }
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