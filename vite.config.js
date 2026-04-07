import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const runtimePortFile = path.resolve(__dirname, 'backend', '.runtime', 'backend.port')

const readBackendPort = () => {
  try {
    if (!fs.existsSync(runtimePortFile)) return 4000
    const raw = String(fs.readFileSync(runtimePortFile, 'utf8')).trim()
    const port = Number.parseInt(raw, 10)
    return Number.isFinite(port) && port > 0 ? port : 4000
  } catch {
    return 4000
  }
}

const resolveBackendTarget = () => `http://localhost:${readBackendPort()}`

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: resolveBackendTarget(),
        changeOrigin: true,
        router: () => resolveBackendTarget(),
      },
      '/uploads': {
        target: resolveBackendTarget(),
        changeOrigin: true,
        router: () => resolveBackendTarget(),
      },
    },
  },
})
