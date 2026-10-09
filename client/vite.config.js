import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The codebase names React components with .js extensions (App.js,
// components/EditorSandbox.js, ...) — teach esbuild to parse JSX in .js files.
export default defineConfig({
  plugins: [react()],
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: { '.js': 'jsx' },
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    // The Arena live-preview proxy serves the app under a dynamic
    // {port}-{sandboxId}.e2b.app host — allow it (and any host) explicitly.
    allowedHosts: true,
    proxy: {
      // Browser only ever calls same-origin relative URLs; Vite proxies them.
      '/api': { target: 'http://localhost:5000', changeOrigin: true },
      '/socket.io': { target: 'http://localhost:5000', changeOrigin: true, ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
