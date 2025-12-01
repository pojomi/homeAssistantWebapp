import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/homeAssistantWebapp',
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    allowedHosts: ['.local', 'localhost', 'romana-taintless-marlon.ngrok-free.dev']
  }
})