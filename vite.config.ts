import path from "path"
import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Dev only: VITE_API_PROXY=https://<admin host> in .env.local makes the dev
  // server forward /api to a deployed admin, with the browser's Origin
  // header dropped so the admin's CORS (which allows localhost only outside
  // production) does not refuse it. Pair it with
  // VITE_ADMIN_API_URL=http://localhost:5180 so the app calls itself.
  // Nothing of this reaches a build.
  const env = loadEnv(mode, __dirname, "")
  const proxyTarget = env.VITE_API_PROXY
  return {
  plugins: [react(), tailwindcss()],
  server: proxyTarget
    ? {
        proxy: {
          "/api": {
            target: proxyTarget,
            changeOrigin: true,
            configure: (proxy) => {
              proxy.on("proxyReq", (proxyReq) => {
                proxyReq.removeHeader("origin")
                proxyReq.removeHeader("cookie")
              })
            },
          },
        },
      }
    : undefined,
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
  }
})
