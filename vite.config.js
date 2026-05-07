import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deploying to GitHub Pages the site is served from
// https://<user>.github.io/<repo>/, so all built asset URLs need the
// `/<repo>/` prefix. Locally (dev + Replit preview) we keep `/`.
const isGhPages = process.env.DEPLOY_TARGET === 'gh-pages'

export default defineConfig({
    base: isGhPages ? '/Virtual_Museum/' : '/',
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: true,
    },
    preview: {
        host: '0.0.0.0',
        port: 5000,
        allowedHosts: true,
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    'three': ['three'],
                    'r3f': ['@react-three/fiber', '@react-three/drei'],
                    'motion': ['framer-motion'],
                },
            },
        },
        chunkSizeWarningLimit: 1500,
    },
})
