import { defineConfig } from "tsup";

export default defineConfig([
  // ESM format for npm
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    dts: true,
    sourcemap: true,
    clean: true,
    minify: false,
    treeshake: true,
  },
  // IIFE format for userscripts (unminified)
  {
    entry: ["src/index.ts"],
    format: ["iife"],
    globalName: "ElementDetector",
    outExtension: () => ({ js: ".global.js" }),
    sourcemap: true,
    minify: false,
    treeshake: true,
  },
  // IIFE format for userscripts (minified)
  {
    entry: ["src/index.ts"],
    format: ["iife"],
    globalName: "ElementDetector",
    outExtension: () => ({ js: ".global.min.js" }),
    sourcemap: true,
    minify: true,
    treeshake: true,
  },
]);
