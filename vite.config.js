import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env regardless of VITE_ prefix (third arg = '')
  const env = loadEnv(mode, process.cwd(), '')
  const PHABRICATOR_API_TOKEN = env.PHABRICATOR_API_TOKEN

  return {
    // GitHub Pages serves from /<repo>/ ; set VITE_BASE=/lingua-plus/ in CI
    base: env.VITE_BASE || '/',
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      environment: 'node',
    },
    server: {
      host: true,
      proxy: {
        '/phabricator-api': {
          target: 'https://phabricator.wikimedia.org',
          changeOrigin: true,
          rewrite: (path) =>
            path.replace('/phabricator-api', '/api').replace('?', `?api.token=${PHABRICATOR_API_TOKEN}&`),
        },
      },
    },
  }
})
