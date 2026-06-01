import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// base: '' keeps asset paths relative so the static build works under any
// sub-path (e.g. a GitHub Pages project URL) without extra configuration.
//
// The alias points `edfi-profile-core` at its TypeScript source so Vite/Rollup
// compile it directly (the published CommonJS build re-exports via __exportStar,
// which Rollup's static analyzer cannot trace). This keeps the studio bound to
// the exact same shared core the plugin uses — no drift.
export default defineConfig({
  plugins: [react()],
  base: '',
  resolve: {
    alias: {
      'edfi-profile-core': fileURLToPath(
        new URL('../edfi-profile-core/src/index.ts', import.meta.url),
      ),
    },
  },
  build: {
    outDir: 'dist',
  },
});
