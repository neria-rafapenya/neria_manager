// vite.widget.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  define: {
    // Evitamos el "process is not defined"
    "process.env.NODE_ENV": JSON.stringify("development"),
    "process.env": "{}",
  },
  build: {
    outDir: "dist", // 👈 ahora el bundle se genera en dist/index.js
    lib: {
      entry: path.resolve(__dirname, "src/chatbot-widget.tsx"),
      name: "ChatbotWidget", // window.ChatbotWidget
      fileName: () => "index.js", // nombre fijo
      formats: ["iife"], // para <script src="...">
    },
    rollupOptions: {
      output: {
        inlineDynamicImports: true, // todo en un único JS
      },
    },
    cssCodeSplit: false, // 👈 importante: no separar CSS
    minify: "esbuild",
    sourcemap: false,
  },
});
