import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The browser always calls /graphql on its own origin; the dev and preview
// servers forward it to Django, so no CORS setup is needed in the browser.
const apiProxy = {
  "/graphql": { target: process.env.API_PROXY_TARGET || "http://localhost:8001", changeOrigin: true },
};

export default defineConfig({
  plugins: [react()],
  server: { host: true, port: 3000, strictPort: true, proxy: apiProxy },
  preview: { host: true, port: 3000, strictPort: true, proxy: apiProxy },
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js"],
  },
});
