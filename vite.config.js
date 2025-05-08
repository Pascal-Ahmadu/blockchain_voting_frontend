import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import nodePolyfills from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Polyfills for Node.js core modules
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
    })
  ],
  resolve: {
    alias: {
      // This helps with modules that expect Node.js environments
      process: 'process/browser',
      stream: 'stream-browserify',
      zlib: 'browserify-zlib',
      util: 'util',
      http: 'stream-http',
      https: 'https-browserify',
      os: 'os-browserify/browser',
      crypto: 'crypto-browserify',
      path: 'path-browserify',
    },
  },
  optimizeDeps: {
    include: ['web3', 'web3-utils', 'web3-core'],
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis',
      },
    },
  },
  build: {
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      external: ['web3'], // Move this line up from inside output
      output: {
        manualChunks: {
          'web3': ['web3'],
        }
      }
    }
  }
})