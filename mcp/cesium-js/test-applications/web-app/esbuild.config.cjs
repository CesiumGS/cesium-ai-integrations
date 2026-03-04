"use strict";

// eslint-disable-next-line n/no-unpublished-require
const esbuild = require("esbuild");
const path = require("path");
// eslint-disable-next-line n/no-unpublished-require
require("dotenv").config();

// Inject environment variables as constants in the browser bundle
const define = {
  "process.env.CESIUM_ACCESS_TOKEN": JSON.stringify(
    process.env.CESIUM_ACCESS_TOKEN || "your_access_token_here",
  ),
  "process.env.MCP_PROTOCOL": JSON.stringify(
    process.env.MCP_PROTOCOL || "websocket",
  ),
  "process.env.MCP_CAMERA_PORT": JSON.stringify(
    process.env.MCP_CAMERA_PORT || "3002",
  ),
  "process.env.MCP_ENTITY_PORT": JSON.stringify(
    process.env.MCP_ENTITY_PORT || "3003",
  ),
  "process.env.MCP_ANIMATION_PORT": JSON.stringify(
    process.env.MCP_ANIMATION_PORT || "3004",
  ),
};

esbuild
  .build({
    entryPoints: ["src/app.ts"],
    bundle: true,
    platform: "browser",
    outfile: "dist/app.js",
    alias: {
      "@cesium-mcp/client-core": path.resolve(
        __dirname,
        "../packages/client-core/build/index.js",
      ),
    },
    define,
    format: "esm",
  })
  .catch(() => process.exit(1));
