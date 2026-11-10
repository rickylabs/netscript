# Lean compile helpers (sourced). `deno compile` embeds the npm resolution of the project it runs in,
# so the app is bundled first (`deno bundle` keeps only reachable code, npm included) and compiled
# from a folder whose node_modules holds only the GPUIX Node-API addon, which cannot be bundled.
NATIVE_REL="node_modules/.deno/@gpuix+native@0.11.0/node_modules/@gpuix/native"

lean_gpuix() { # <dir>: bundle app/main.tsx + a GPUIX-only node_modules; sets LEAN_EXCLUDES
  local dir="$1"
  rm -rf "$dir" && mkdir -p "$dir/dist" "$dir/assets"
  cp -a assets/fonts "$dir/assets/"
  deno bundle --quiet --platform deno --external '@gpuix/native' --external '@gpuix/native/*' \
    -o "$dir/dist/app.js" app/main.tsx
  cat > "$dir/deno.json" <<'JSON'
{
  "nodeModulesDir": "auto",
  "unstable": ["kv"],
  "imports": {
    "@gpuix/native": "npm:@gpuix/native@0.11.0",
    "@gpuix/native/": "npm:/@gpuix/native@0.11.0/"
  }
}
JSON
  (cd "$dir" && deno install --quiet --node-modules-dir=auto >/dev/null)
  LEAN_EXCLUDES=(--exclude "$(realpath "$dir")/$NATIVE_REL/wasm" --exclude "$(realpath "$dir")/$NATIVE_REL/browser.mjs")
}

lean_webview() { # <dir>: bundle app/main.webview.ts (no npm left at all)
  local dir="$1"
  rm -rf "$dir" && mkdir -p "$dir/dist" "$dir/assets"
  cp -a assets/fonts "$dir/assets/" && cp dist/renderer.js "$dir/dist/"
  deno bundle --quiet --platform deno -o "$dir/dist/app.js" app/main.webview.ts
  printf '{\n  "nodeModulesDir": "none",\n  "unstable": ["kv"]\n}\n' > "$dir/deno.json"
}
