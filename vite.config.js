import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  // Define a convenient alias for cleaner import paths.
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  server: {
    port: 5173, // Explicitly define your frontend port

    // This proxy is essential for the dev server. It forwards any request
    // from your React app that starts with '/api' to your backend server.
    proxy: {
      "/api": {
        target: "http://localhost:5000", // Your backend server address
        changeOrigin: true, // Recommended to avoid CORS-like issues
        secure: false, // Set to false if your backend runs on http

        // The 'configure' block below with its 'proxy.on' listeners is
        // excellent for debugging but can be commented out for a cleaner
        // production configuration. Uncomment it if you need to trace requests.
        /*
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from Target:', req.method, req.url, proxyRes.statusCode);
          });
        }
        */
      },
    },
  },

  // This setting ensures that only environment variables prefixed
  // with "VITE_" are exposed to your client-side code, which is a
  // crucial security practice.
  envPrefix: "VITE_",
});
