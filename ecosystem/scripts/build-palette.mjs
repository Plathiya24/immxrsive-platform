import { copyFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { build } from "esbuild";

await build({
  entryPoints: { bootstrap: "legacy/bootstrap.ts" },
  bundle: true,
  format: "esm",
  splitting: true,
  minify: true,
  outdir: "generated",
  jsx: "automatic",
});
await copyFile("styles/palette.css", "generated/palette.css");

const require = createRequire(import.meta.url);
const requireRive = createRequire(require.resolve("@rive-app/react-canvas"));
await Promise.all([
  copyFile(requireRive.resolve("@rive-app/canvas/rive.wasm"), "generated/rive-runtime.wasm"),
  copyFile(requireRive.resolve("@rive-app/canvas/rive_fallback.wasm"), "generated/rive-runtime-fallback.wasm"),
]);
