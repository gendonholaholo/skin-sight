import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true, // Allow all hosts (required for ngrok)
    host: '0.0.0.0', // Listen on all network interfaces
    strictPort: false,
    hmr: {
      clientPort: 443,
    },
    proxy: {
      '/api/perfectcorp': {
        target: 'https://yce-api-01.makeupar.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/perfectcorp/, ''),
        secure: true,
      }
    }
  }
})
