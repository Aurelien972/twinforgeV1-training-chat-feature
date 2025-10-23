import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'favicon-f.svg', 'brand/**/*.svg'],
      manifest: false,
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: null,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/kwipydbtjagypocpvbwn\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/kwipydbtjagypocpvbwn\.supabase\.co\/functions\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-functions-cache',
              networkTimeoutSeconds: 10,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react-router-dom',
      'framer-motion',
      '@tanstack/react-query',
      'react-hook-form',
      '@hookform/resolvers',
      'zod',
      'zustand',
      'lucide-react',
      '@supabase/supabase-js',
      'nanoid',
      'clsx'
    ],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 800, // Increased for 3D-heavy app (realistic for Avatar3DViewer)
    rollupOptions: {
      output: {
        manualChunks(id) {
          // OPTIMIZATION: Three.js separation - 30MB library loaded only when needed (Avatar3DViewer)
          if (id.includes('node_modules')) {
            // Separate Three.js core from React-Three wrappers for better caching
            if (id.includes('node_modules/three/')) {
              return 'three-core';
            }
            if (id.includes('@react-three')) {
              return 'react-three';
            }

            // OPTIMIZATION: Recharts separation - 5.6MB library loaded only in charts/insights
            if (id.includes('recharts')) {
              return 'recharts';
            }

            // Core vendor libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            if (id.includes('framer-motion')) {
              return 'motion';
            }
            if (id.includes('react-router-dom')) {
              return 'router';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('@supabase/supabase-js')) {
              return 'supabase';
            }
            if (id.includes('react-hook-form') || id.includes('@hookform') || id.includes('zod')) {
              return 'forms';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('date-fns')) {
              return 'date-utils';
            }
            if (id.includes('react-leaflet') || id.includes('leaflet')) {
              return 'maps';
            }
            if (id.includes('nanoid') || id.includes('zustand') || id.includes('clsx')) {
              return 'utils';
            }
          }

          // OPTIMIZATION: 3D-related code (loaded with Avatar3DViewer)
          if (id.includes('/src/lib/3d/') || id.includes('/src/components/3d/')) {
            return 'three-app';
          }

          // App-specific chunking
          if (id.includes('/src/system/store/')) {
            return 'stores';
          }
          if (id.includes('/src/app/pages/Fridge/')) {
            return 'page-fridge';
          }
          if (id.includes('/src/app/pages/FridgeScan/')) {
            return 'page-fridge-scan';
          }
          if (id.includes('/src/app/pages/Profile/')) {
            return 'page-profile';
          }
          if (id.includes('/src/app/pages/Avatar/')) {
            return 'page-avatar';
          }
          if (id.includes('/src/app/pages/Activity/')) {
            return 'page-activity';
          }
          if (id.includes('/src/ui/')) {
            return 'ui-components';
          }
        },
      },
    },
  },
});