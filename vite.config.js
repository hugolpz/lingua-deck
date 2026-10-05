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
      allowedHosts: ['localhost:4000'],
      proxy: {
        '/phabricator-api': {
          target: 'https://phabricator.wikimedia.org',
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              // Present as a plain API client: Wikimedia rejects some browser-forwarded requests
              ;['origin', 'referer', 'sec-fetch-dest', 'sec-fetch-mode', 'sec-fetch-site', 'sec-gpc', 'priority', 'accept-language'].forEach((h) =>
                proxyReq.removeHeader(h),
              )
              proxyReq.setHeader('user-agent', 'lingua-libre-org-dev/0.1 (https://github.com/hugolpz; hugo.lpz@gmail.com)')
              proxyReq.setHeader('accept-encoding', 'identity')
            })
          },
          // The token is added server-side so it never reaches the browser (nor the logs)
          rewrite: (p) => {
            const [base, query] = p.replace('/phabricator-api', '/api').split('?', 2)
            return `${base}?api.token=${PHABRICATOR_API_TOKEN}${query ? `&${query}` : ''}`
          },
        },
      },
    },
  }
})
