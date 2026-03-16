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
  // TypeScript configuration for server source files (Node.js environment)
  ...[...tseslint.configs.recommended].map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  {
    files: ["src/**/*.{ts,js}"],
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
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
];
