import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  globalIgnores([
    ".astro/**",
    "dist/**",
    "out/**",
    "build/**",
  ]),
]);

export default eslintConfig;
