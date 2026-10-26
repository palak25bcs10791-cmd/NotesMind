import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// proxy /api -> backend in dev so cookies work without CORS issues
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": "http://localhost:5000",
    },
  },
});
