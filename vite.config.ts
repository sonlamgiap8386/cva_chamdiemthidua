import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'node:url';
import {defineConfig} from 'vite';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(projectRoot, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    build: {
      // Keep generated artifacts separate from the legacy dist folder that may
      // be locked by desktop sync clients such as OneDrive.
      outDir: 'build',
      sourcemap: false,
      rollupOptions: {
        output: {
          // Keep frequently cached framework code out of the application entry chunk.
          manualChunks(id) {
            if (!id.includes('node_modules')) return;
            if (id.includes('react') || id.includes('scheduler')) return 'react-vendor';
            if (id.includes('firebase')) return 'firebase-vendor';
            if (id.includes('lucide-react')) return 'icons-vendor';
            if (id.includes('xlsx')) return 'xlsx-vendor';
            return 'vendor';
          },
        },
      },
    },
  };
});
