import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
// import { adapter, analyzer } from 'vite-bundle-analyzer'

// https://vite.dev/config/
export default defineConfig({
  define: {
    'process.env': 'window.process.env',
  },
  plugins: [
    react(),
    tailwindcss(),
    // adapter(analyzer())
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  esbuild: {
    // Preserve class names and function names to prevent mangling
    keepNames: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Keep @typeberry/lib in its own chunk
          if (id.includes('@typeberry/lib')) {
            return 'typeberry-lib';
          }
        },
      },
    },
  },
  optimizeDeps: {
    // Exclude @typeberry/native from pre-bundling - it has a wrapper layer
    // that provides camelCase API (verifyHeaderSeals) over snake_case WASM functions
    exclude: ['@typeberry/native'],
    esbuildOptions: {
      // Preserve class names during dependency pre-bundling
      keepNames: true,
    },
  },
});
