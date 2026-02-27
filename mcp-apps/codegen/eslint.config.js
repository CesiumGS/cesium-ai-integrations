import globals from "globals";
import configCesium from "@cesium/eslint-config";
import tseslint from "typescript-eslint";

export default [
  tseslint.configs.base,
  {
    ignores: [
      "**/build/",
      "**/dist/",
      "**/node_modules/",
      "**/*.d.ts",
      "**/pnpm-lock.yaml",
    ],
  },
  {
    ...configCesium.configs.recommended,
    linterOptions: {
      reportUnusedDisableDirectives: "error",
    },
    languageOptions: {
      sourceType: "module",
      ecmaVersion: 2022,
    },
  },
  // Node.js configuration for all .cjs files
  {
    files: ["**/*.cjs"],
    ...configCesium.configs.node,
  },
  // TypeScript configuration for MCP servers (Node.js environment)
  ...[...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["**/*.ts"],
  })),
  {
    files: ["**/*.{ts,js}"],
    ...configCesium.configs.node,
    languageOptions: {
      ...configCesium.configs.node.languageOptions,
      sourceType: "module",
      ecmaVersion: 2022,
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-unused-vars": [
        "error",
        { vars: "all", args: "none", caughtErrors: "none" },
      ],
      "no-use-before-define": [
        "error",
        { variables: false, functions: false, classes: false },
      ],
    },
  },
];
