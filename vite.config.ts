import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

const page = (relative: string) => new URL(relative, import.meta.url).pathname;

export default defineConfig({
  base: '/tabletop/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'Tabletop',
        short_name: 'Tabletop',
        description: 'Liczniki punktów i narzędzia do gier karcianych',
        lang: 'pl',
        start_url: '/tabletop/',
        scope: '/tabletop/',
        display: 'standalone',
        background_color: '#0f1115',
        theme_color: '#0f1115',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
        // Multi-page app: disable the SPA navigation fallback so a controlled
        // page is never answered with the dashboard's index.html.
        navigateFallback: null,
      },
    }),
  ],
  build: {
    rolldownOptions: {
      input: {
        dashboard: page('index.html'),
        picker: page('picker/index.html'),
        flip7: page('flip7/index.html'),
      },
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    passWithNoTests: true,
  },
});
