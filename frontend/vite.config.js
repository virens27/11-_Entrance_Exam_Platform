import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
    },
    esbuild: {
        // This tells Vite to treat .js files as .jsx so JSX works everywhere
        loader: 'jsx',
        include: /src\/.*\.[jt]sx?$/,
    },
    optimizeDeps: {
        esbuildOptions: {
            loader: {
                '.js': 'jsx',
            },
        },
    },
})