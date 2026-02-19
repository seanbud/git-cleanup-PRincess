import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        server: {
            port: 3000,
            host: '127.0.0.1',
        },
        plugins: [
            react(),
        ],
        // Security: Sensitive API keys must not be bundled into client-side code.
        define: {
            'process.env.APP_MODE': JSON.stringify(mode),
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, './src'),
            },
        },
    };
});
