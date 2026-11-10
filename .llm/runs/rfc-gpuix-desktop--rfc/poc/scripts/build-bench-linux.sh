#!/usr/bin/env bash
# Linux bench binaries (inside bench/ctr.sh): GPUIX `deno compile` and the Deno Desktop webview
# baseline, both able to supervise the real stack (NETSCRIPT_STACK=real + NETSCRIPT_STACK_DIR).
#
# Bundle first, then compile the bundle from a folder whose node_modules holds only what must stay
# external (the GPUIX Node-API addon). `deno compile` embeds the whole npm resolution of the
# project it runs in; compiling the project directly embeds every package the NetScript plugin
# contracts declare (Prisma, PGlite, ...) — 915 MB instead of 172 MB.
set -euo pipefail
cd "$(dirname "$0")/.."
source scripts/lean-compile.sh
deno install --quiet --node-modules-dir=auto >/dev/null
deno bundle --quiet --platform browser --minify --output dist/renderer.js app/web/renderer.tsx
mkdir -p build/linux-x64
lean_gpuix build/compile-gpuix
(cd build/compile-gpuix && deno compile -A --quiet --no-check --node-modules-dir=manual --include assets/fonts \
  "${LEAN_EXCLUDES[@]}" --output "$OLDPWD/build/linux-x64/netscript-gpuix" dist/app.js)
lean_webview build/compile-webview
rm -rf build/netscript-webview
(cd build/compile-webview && deno desktop -A --quiet --no-check --backend webview --include dist/renderer.js \
  --include assets/fonts -o "$OLDPWD/build/netscript-webview" dist/app.js)
ls -la build/linux-x64/netscript-gpuix build/netscript-webview/
