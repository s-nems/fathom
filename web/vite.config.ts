import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) } },
  // The engine is an ES module that loads its WebAssembly with a top-level await.
  worker: { format: "es" },
  test: { include: ["src/**/*.test.ts"] },
});
