import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  server: {
    middlewareMode: false,
    host: '0.0.0.0',
    port: 5173,
    strictPort: false,
    watch: {
      usePolling: true,
      interval: 1000,
      binaryInterval: 1000,
      ignored: ['**/node_modules/**', '**/.git/**']
    },
    hmr: {
      host: 'localhost',
      port: 5173,
      protocol: 'ws',
    },
  }
})
