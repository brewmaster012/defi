const esbuild = require("esbuild");

esbuild
  .build({
    entryPoints: ["src/aave.ts"],
    bundle: true,
    minify: true,
    sourcemap: true,
    outdir: "dist",
    platform: "node",
    target: "es2020",
    loader: { ".tsx": "tsx" },
  })
  .catch(() => process.exit(1));
