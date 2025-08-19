  // vite.config.ts
  import { defineConfig } from "vite";
  import react from "@vitejs/plugin-react";

  import path from "path";

  export default defineConfig({
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('node_modules/firebase/')) {
              return 'firebase-vendor';
            }
            if (id.includes('node_modules/localforage/')) {
              return 'localforage-vendor';
            }
            if (id.includes('node_modules/react-hook-form/')) {
              return 'react-hook-form-vendor';
            }
            if (id.includes('node_modules/recharts')) {
              return 'recharts-vendor';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'lucide-vendor';
            }
            if (id.includes('node_modules/zod')) {
              return 'zod-vendor';
            }
            if (id.includes('node_modules/zustand')) {
              return 'zustand-vendor';
            }
          },
        },
      },
    },
  });
