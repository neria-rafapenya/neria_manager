// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isLib = mode === "lib";

  const rawBase = env.VITE_ROUTER_BASENAME || "/";
  const base = (rawBase.startsWith("/") ? rawBase : `/${rawBase}`).replace(
    /([^/])$/,
    "$1/"
  );

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      host: "0.0.0.0",
      port: parseInt(env.VITE_PORT ?? "8611"),
    },
    build: isLib
      ? {
          lib: {
            entry: path.resolve(__dirname, "src/widget.ts"),
            name: "IAChatWidget",
            fileName: () => "index.js",
            formats: ["iife"],
          },
          rollupOptions: {
            // Incluimos React dentro del bundle (más pesado pero plug & play)
            external: [],
          },
        }
      : undefined,
  };
});
