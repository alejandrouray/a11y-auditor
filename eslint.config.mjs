import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import stylistic from "@stylistic/eslint-plugin";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Typed linting: lets rules read TypeScript types, so deprecated APIs fail CI
  // instead of only being struck through in the editor.
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-deprecated": "error",
    },
  },
  // Code that breathes: a blank line between logical steps. `eslint --fix` adds them.
  {
    files: ["**/*.{js,mjs,ts,tsx,mts,cts}"],
    plugins: { "@stylistic": stylistic },
    rules: {
      "@stylistic/padding-line-between-statements": [
        "error",
        // Variable declarations form one group, separated from the steps around them.
        { blankLine: "always", prev: "*", next: ["const", "let"] },
        { blankLine: "always", prev: ["const", "let"], next: "*" },
        { blankLine: "any", prev: ["const", "let"], next: ["const", "let"] },
        // Blocks and exits stand apart. The first line of a block needs no blank line.
        { blankLine: "always", prev: "*", next: ["if", "try", "for", "while", "switch"] },
        { blankLine: "always", prev: ["if", "try", "for", "while", "switch"], next: "*" },
        { blankLine: "always", prev: "*", next: ["return", "throw"] },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
