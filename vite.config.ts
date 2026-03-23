import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    base: './', // Important for Electron to load relative assets
    server: {
      port: 3000,
      host: '127.0.0.1',
    },
    plugins: [
      react(),
      electron({
        main: {
          // Shortcut of `build.lib.entry`
          entry: 'electron/main.ts',
          vite: {
            build: {
              rollupOptions: {
                external: ['electron', 'path', 'fs', 'child_process', 'node:url', 'node:path'],
              },
            },
            define: {
              'process.env.GITHUB_CLIENT_ID': JSON.stringify(env.GITHUB_CLIENT_ID || 'Ov23lil6obiLhsHkt1R2'),
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`
          input: 'electron/preload.ts',
        },
        // Optional: Use Node.js API in the Renderer process
        renderer: {},
      }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
