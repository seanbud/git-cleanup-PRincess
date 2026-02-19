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
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`
          input: 'electron/preload.ts',
        },
        // Optional: Use Node.js API in the Renderer process
        renderer: {},
      }),
    ],
    // Security: Sensitive API keys must not be bundled into client-side code.
    // They should be managed via environment variables and accessed only within the Electron main process.
    define: {
      'process.env.APP_MODE': JSON.stringify(mode),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    }
  };
});
