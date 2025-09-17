import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          }
        ]
      },
      includeAssets: ['hawk3.svg', 'favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Hawk3 Gaming Platform',
        short_name: 'Hawk3',
        description: 'Mobile gaming platform with Memory, FruitMerge & NumNum games. Play offline!',
        theme_color: '#4F46E5',
        background_color: '#0F0F0F',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['games', 'entertainment'],
        lang: 'en',
        dir: 'ltr',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/apple-touch-icon-180x180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'apple touch icon'
          }
        ],
        shortcuts: [
          {
            name: 'Memory Game',
            short_name: 'Memory',
            description: 'Play the Memory card matching game',
            url: '/games/memory',
            icons: [{ src: '/shortcut-memory.png', sizes: '96x96' }]
          },
          {
            name: 'Fruit Merge',
            short_name: 'FruitMerge',
            description: 'Play the Fruit Merge puzzle game',
            url: '/games/fruitmerge',
            icons: [{ src: '/shortcut-fruit.png', sizes: '96x96' }]
          },
          {
            name: 'Num Num Merge',
            short_name: 'NumNum',
            description: 'Play the Number Merge game',
            url: '/games/numnummerge',
            icons: [{ src: '/shortcut-numbers.png', sizes: '96x96' }]
          }
        ]
      }
    })
  ]
})