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
      "PoC/CesiumJs/web-app/index.html",
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
    files: ["servers/**/*.ts"],
  })),
  {
    files: ["servers/**/*.{ts,js}"],
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
  // TypeScript configuration for PoC client-core (browser environment)
  ...[...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["PoC/CesiumJs/packages/client-core/**/*.ts"],
  })),
  {
    files: ["PoC/CesiumJs/packages/client-core/**/*.{ts,js}"],
    ...configCesium.configs.browser,
    languageOptions: {
      ...configCesium.configs.browser.languageOptions,
      sourceType: "module",
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
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
  // TypeScript configuration for PoC web-app (browser environment)
  ...[...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["PoC/CesiumJs/web-app/**/*.ts"],
  })),
  {
    files: ["PoC/CesiumJs/web-app/**/*.{ts,js}"],
    ignores: ["PoC/CesiumJs/web-app/**/*.config.cjs"],
    ...configCesium.configs.browser,
    languageOptions: {
      ...configCesium.configs.browser.languageOptions,
      sourceType: "module",
      ecmaVersion: 2022,
      globals: {
        ...globals.browser,
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
  // Config files in PoC (Node.js environment)
  {
    files: ["PoC/CesiumJs/web-app/**/*.config.cjs"],
    ...configCesium.configs.node,
    languageOptions: {
      ...configCesium.configs.node.languageOptions,
      sourceType: "commonjs",
    },
  },
];
