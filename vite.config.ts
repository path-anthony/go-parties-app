import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Production serves dist/ through `npm start` (vite preview). It is a single
  // page app, so every path has to fall back to index.html for React Router;
  // preview does that on its own. Railway fronts it with its own hostname, so
  // the host check is off, or every request there is refused.
  preview: {
    host: true,
    allowedHosts: true,
  },
})
