import { defineConfig } from "vitest/config";
import { viteSingleFile } from "vite-plugin-singlefile";

export default defineConfig({
  plugins: [viteSingleFile()],
  build: { target: "es2022" },
  test: { environment: "node", coverage: { reporter: ["text", "html"] } }
});
