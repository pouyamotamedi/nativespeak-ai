import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  // AI Studio / Cloud Run need absolute base "/". Android APK uses vite.android.config.ts (base './').
  const enablePwa = process.env.ENABLE_PWA === 'true';

  return {
    base: '/',
    plugins: [
      react(),
      tailwindcss(),
      // PWA often breaks AI Studio iframe preview — enable only when ENABLE_PWA=true
      ...(enablePwa
        ? [
            VitePWA({
              registerType: 'autoUpdate',
              includeAssets: ['icon.svg'],
              manifest: {
                id: '/',
                name: 'NativeSpeak AI - مربی اسپیکینگ آمریکایی',
                short_name: 'NativeSpeak',
                description:
                  'اپلیکیشن هوشمند تقویت اسپیکینگ و لهجه امریکن برای فارسی‌زبانان با هوش مصنوعی',
                theme_color: '#4f46e5',
                background_color: '#020617',
                display: 'standalone',
                start_url: '/',
                scope: '/',
                icons: [
                  {
                    src: '/icon.svg',
                    sizes: '192x192 512x512',
                    type: 'image/svg+xml',
                    purpose: 'any',
                  },
                  {
                    src: '/icon.svg',
                    sizes: '512x512',
                    type: 'image/svg+xml',
                    purpose: 'maskable',
                  },
                ],
              },
              devOptions: { enabled: false },
            }),
          ]
        : []),
    ],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
