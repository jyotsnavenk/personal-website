import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Pre-bundle Strudel (and its many sub-packages) at startup so the first
  // lazy import on the Exhibits page doesn't trigger a mid-session
  // dependency re-optimization + full page reload.
  optimizeDeps: {
    include: ['@strudel/web'],
  },
})
