import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
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
        // Split heavy 3D libs into their own cacheable chunks. Quality is
        // unchanged — just reduces initial JS parse cost and lets the browser
        // cache vendor chunks separately from app code.
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
