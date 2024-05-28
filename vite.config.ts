import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig(({ command: _cmd }) => {
  return {
    plugins: [react(), tsConfigPaths()],
    build: {
      chunkSizeWarningLimit: 2000
    }
  };
});
