import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import tailwindcss from "@tailwindcss/vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
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
          // Keep @typeberry/state-merkleization in its own chunk
          if (id.includes('@typeberry/state-merkleization')) {
            return 'typeberry-state-merkleization';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@typeberry/state-merkleization'],
    esbuildOptions: {
      // Preserve class names during dependency pre-bundling
      keepNames: true,
    },
  },
});
