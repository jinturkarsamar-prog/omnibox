import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon-192.png', 'icon-512.png', 'OmniBox-Icon.png'],
        devOptions: {
          enabled: true
        },
        manifest: {
          name: "OmniBox Content Aggregator",
          short_name: "OmniBox",
          description: "Universal local-first content aggregator and media visualizer.",
          theme_color: "#6366f1",
          background_color: "#121214",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "icon-192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any maskable"
            },
            {
              src: "icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any maskable"
            }
          ],
          share_target: {
            action: "/",
            method: "GET",
            enctype: "application/x-www-form-urlencoded",
            params: {
              title: "share_title",
              text: "share_text",
              url: "share_url"
            }
          }
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg}']
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
