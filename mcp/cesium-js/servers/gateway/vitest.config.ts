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
      "@cesium-mcp/camera-server/tools": path.resolve(
        __dirname,
        "../camera-server/src/tools/index.ts",
      ),
      "@cesium-mcp/entity-server/tools": path.resolve(
        __dirname,
        "../entity-server/src/tools/index.ts",
      ),
      "@cesium-mcp/animation-server/tools": path.resolve(
        __dirname,
        "../animation-server/src/tools/index.ts",
      ),
      "@cesium-mcp/imagery-server/tools": path.resolve(
        __dirname,
        "../imagery-server/src/tools/index.ts",
      ),
      "@cesium-mcp/tiles-server/tools": path.resolve(
        __dirname,
        "../tiles-server/src/tools/index.ts",
      ),
      "@cesium-mcp/terrain-server/tools": path.resolve(
        __dirname,
        "../terrain-server/src/tools/index.ts",
      ),
    },
  },
});
