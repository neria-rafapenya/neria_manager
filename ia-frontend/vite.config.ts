import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const isLib = mode === "lib";

  // En SPA sí aplica base/basename. En widget normalmente no importa,
  // pero lo dejamos seguro.
  const rawBase = env.VITE_ROUTER_BASENAME || "/";
  const base = (rawBase.startsWith("/") ? rawBase : `/${rawBase}`).replace(
    /([^/])$/,
    "$1/",
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

    // IMPORTANTE: en SPA build normal, Vite usará index.html y generará dist/index.html
    // En widget build con --mode lib, se activa esta config de librería.
    build: isLib
      ? {
          outDir: "dist",
          lib: {
            entry: path.resolve(__dirname, "src/widget.ts"),
            name: "IAChatWidget",
            fileName: () => "index.js",
            formats: ["iife"],
          },
          rollupOptions: {
            external: [],
          },
        }
      : {
          outDir: "dist",
        },
  };
});
