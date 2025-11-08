// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  ssgOptions: {
    script: 'async',
    formatting: 'minify',
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  plugins: [
    vue(),
    VitePWA({
      // Custom Service Worker Strategy
      strategies: 'injectManifest',
      srcDir: 'public',
      filename: 'sw-custom.js',

      // Development Options
      devOptions: {
        enabled: true,
        type: 'module'
      },

      // Workbox Optionen
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,woff,ttf,eot}'],
        maximumFileSizeToCacheInBytes: 15000000, // 15MB
      },

      // PWA Assets
      includeAssets: [
        'hawk3.svg',
        'favicon.ico',
        'apple-touch-icon.png',
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'apple-touch-icon-180x180.png'
      ],

      // Web App Manifest
      manifest: {
        name: 'Hawk3 Gaming Platform',
        short_name: 'Hawk3',
        description: 'Mobile gaming platform with Memory, HawkFruit & HawkDoubleUp games. Play offline!',
        theme_color: '#4F46E5',
        background_color: '#0F0F0F',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['games', 'entertainment'],
        lang: 'en',
        dir: 'ltr',

        // Badge API Support
        display_override: ["window-controls-overlay", "standalone"],
        prefer_related_applications: false,

        // Icons
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

        // App Shortcuts
        shortcuts: [
          {
            name: 'Hawk Memory',
            short_name: 'HawkMemory',
            description: 'Play the Hawk Memory card matching game',
            url: '/games/memory',
            icons: [{
              src: '/shortcut-memory.svg',
              sizes: '96x96',
              type: 'image/svg+xml'
            }]
          },
          {
            name: 'Hawk Fruit',
            short_name: 'HawkFruit',
            description: 'Play the Hawk Fruit puzzle game',
            url: '/games/hawkfruit',
            icons: [{
              src: '/shortcut-fruit.svg',
              sizes: '96x96',
              type: 'image/svg+xml'
            }]
          },
          {
            name: 'Hawk Double Up',
            short_name: 'HawkDoubleUp',
            description: 'Play the Number Merge game',
            url: '/games/hawkdoubleup',
            icons: [{
              src: '/shortcut-numbers.svg',
              sizes: '96x96',
              type: 'image/svg+xml'
            }]
          }
        ]
      }
    })
  ]
})