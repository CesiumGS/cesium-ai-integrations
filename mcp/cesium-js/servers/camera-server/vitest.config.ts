import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "**/*.test.ts",
        "**/index.ts",
        "**/*.d.ts",
        "**/build/**",
        "**/test/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@cesium-mcp/shared": path.resolve(__dirname, "../shared/src"),
    },
  },
});
