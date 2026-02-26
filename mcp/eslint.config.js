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
      "test-applications/cesium-js/web-app/index.html",
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
  // TypeScript configuration for test application client-core (browser environment)
  ...[...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["test-applications/cesium-js/packages/client-core/**/*.ts"],
  })),
  {
    files: ["test-applications/cesium-js/packages/client-core/**/*.{ts,js}"],
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
  // TypeScript configuration for test application web-app (browser environment)
  ...[...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["test-applications/cesium-js/web-app/**/*.ts"],
  })),
  {
    files: ["test-applications/cesium-js/web-app/**/*.{ts,js}"],
    ignores: ["test-applications/cesium-js/web-app/**/*.config.cjs"],
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
  // Config files in test application (Node.js environment)
  {
    files: ["test-applications/cesium-js/web-app/**/*.config.cjs"],
    ...configCesium.configs.node,
    languageOptions: {
      ...configCesium.configs.node.languageOptions,
      sourceType: "commonjs",
    },
  },
];
