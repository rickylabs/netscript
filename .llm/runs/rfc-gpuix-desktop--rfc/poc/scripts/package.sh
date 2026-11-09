#!/usr/bin/env bash
# Build installables for every GPUIX-supported desktop target from Linux.
# Runs inside the bench image (deno, makensis, png2icns, zip). Usage:
#   bench/ctr.sh "$PWD" scripts/package.sh <out-dir> [targets...]
# targets: linux-x64 windows-x64 macos-arm64 (default: all)
#
# The GPUIX native addon is prebuilt per platform on npm; Deno cross-compiles
# the runtime. The platform binary is staged next to @gpuix/native's loader
# (which tries `./gpuix-native.<triple>.node` first) only while compiling.
set -euo pipefail
OUT="${1:?out dir}"; shift || true
TARGETS=("${@:-linux-x64 windows-x64 macos-arm64}")
[[ ${#TARGETS[@]} -eq 1 ]] && read -r -a TARGETS <<<"${TARGETS[0]}"
ROOT="$(pwd)"
VERSION="0.1.0"
NATIVE_PKG="node_modules/.deno/@gpuix+native@0.11.0/node_modules/@gpuix/native"
NATIVES="$ROOT/../../../tmp/gpuix-natives"
BUILD="$ROOT/build/package"
mkdir -p "$OUT" "$BUILD"

# ---- icon -----------------------------------------------------------------
ICON_DIR="$BUILD/icon"; mkdir -p "$ICON_DIR"
convert -size 1024x1024 xc:'#17171a' -fill '#d52b1e' -draw 'rectangle 300,300 724,724' -alpha on "PNG32:$ICON_DIR/icon-1024.png"
for size in 16 32 48 128 256 512; do convert "$ICON_DIR/icon-1024.png" -resize ${size}x${size} -alpha on "PNG32:$ICON_DIR/icon-$size.png"; done
# ICO = header + raw RGBA PNG entries (ImageMagick re-encodes entries without alpha).
python3 - "$ICON_DIR" <<'PY'
import struct, sys
d = sys.argv[1]; sizes = [256, 128, 48, 32, 16]
pngs = [open(f"{d}/icon-{s}.png", "rb").read() for s in sizes]
entries, data, offset = b"", b"", 6 + 16 * len(sizes)
for size, png in zip(sizes, pngs):
    entries += struct.pack("<BBBBHHII", size % 256, size % 256, 0, 0, 1, 32, len(png), offset + len(data)); data += png
open(f"{d}/icon.ico", "wb").write(struct.pack("<HHH", 0, 1, len(sizes)) + entries + data)
PY
png2icns "$ICON_DIR/icon.icns" "$ICON_DIR/icon-512.png" "$ICON_DIR/icon-256.png" "$ICON_DIR/icon-128.png" >/dev/null

COMMON_EXCLUDES=(--exclude "$NATIVE_PKG/wasm" --exclude "$NATIVE_PKG/browser.mjs")

compile() { # <deno-target> <native-triple> <output> [extra deno flags...]
  local target="$1" triple="$2" output="$3"; shift 3
  local staged=""
  if [[ "$triple" != "linux-x64-gnu" ]]; then
    staged="$NATIVE_PKG/gpuix-native.$triple.node"
    cp "$NATIVES/$triple/package/gpuix-native.$triple.node" "$staged"
  fi
  local excludes=("${COMMON_EXCLUDES[@]}")
  [[ "$triple" != "linux-x64-gnu" ]] && excludes+=(--exclude "node_modules/.deno/@gpuix+native-linux-x64-gnu@0.11.0")
  deno compile -A --quiet --target "$target" --include assets/fonts "${excludes[@]}" "$@" --output "$output" app/main.tsx
  [[ -n "$staged" ]] && rm -f "$staged"
  return 0
}

webview() { # <deno-target> <output>: same app as HTML in the OS webview (benchmark baseline)
  # The webview host never loads GPUIX: keep its addon out so sizes compare fairly.
  deno desktop -A --quiet --backend webview --target "$1" --include dist/renderer.js --include assets/fonts \
    --exclude "$NATIVE_PKG" --exclude "node_modules/.deno/@gpuix+native-linux-x64-gnu@0.11.0" -o "$2" app/main.webview.ts
}

readme() { # <os>
  cat <<EOF
NetScript desktop PoC (GPUIX + Preact) — $1
===========================================

A NetScript workspace app rendered natively by GPUI (Zed's GPU UI framework)
through GPUIX, with Preact as the component framework and Deno as the runtime.
The window, service, typed SDK client, durable stream and KV all run in ONE
process; there is no webview.

Sign in with any email and the password: netscript

What to try
  - Overview: stats, weekly chart, status breakdown, live activity + jobs
    (durable stream, simulated workers).
  - Records: search, status filters, paging; open a record and change its
    status (typed oRPC mutation, persisted in Deno KV, broadcast on the stream).
  - Settings: dark mode (persisted), notifications, export folder picker.
  - System health: service probe, stream state, process memory, GPUI frame stats.

Webview baseline
  The same app rendered as HTML in the OS webview through Deno Desktop (what
  NetScript desktop apps use today) is included next to the native app, so you
  can compare both by eye and by numbers.

Benchmark on this machine (real GPU)
  Run the "bench" script next to the app. It launches both hosts repeatedly
  (about 5 minutes; don't use the machine meanwhile) and writes
  netscript-bench-*.json and .md to your home folder.

Data: app data folder "NetScript GPUIX PoC" (Deno KV files). Delete it to reset.
EOF
}

for target in "${TARGETS[@]}"; do
  echo "== $target"
  case "$target" in
    linux-x64)
      STAGE="$BUILD/linux-x64/NetScript"; rm -rf "$STAGE"; mkdir -p "$STAGE"
      compile x86_64-unknown-linux-gnu linux-x64-gnu "$STAGE/netscript"
      rm -rf "$BUILD/linux-x64/netscript-webview"; webview x86_64-unknown-linux-gnu "$BUILD/linux-x64/netscript-webview"
      mkdir -p "$STAGE/webview" && cp -a "$BUILD/linux-x64/netscript-webview/." "$STAGE/webview/"
      cp "$ICON_DIR/icon-256.png" "$STAGE/netscript.png"
      cat > "$STAGE/netscript.desktop" <<EOF
[Desktop Entry]
Type=Application
Name=NetScript (GPUIX)
Exec=sh -c '"\$(dirname "%k")/netscript"'
Icon=netscript
Categories=Development;
EOF
      printf '#!/bin/sh\ncd "$(dirname "$0")" && ./netscript --bench "$@"\n' > "$STAGE/bench.sh"; chmod +x "$STAGE/bench.sh"
      readme "Linux x64 (Wayland/X11, Vulkan)" > "$STAGE/README.txt"
      tar -C "$BUILD/linux-x64" -czf "$OUT/NetScript-GPUIX-PoC-$VERSION-linux-x64.tar.gz" NetScript
      ;;
    windows-x64)
      STAGE="$BUILD/windows-x64/NetScript"; rm -rf "$STAGE"; mkdir -p "$STAGE"
      compile x86_64-pc-windows-msvc win32-x64-msvc "$STAGE/NetScript.exe" --no-terminal --icon "$ICON_DIR/icon.ico"
      rm -rf "$BUILD/windows-x64/NetScript-Webview"; webview x86_64-pc-windows-msvc "$BUILD/windows-x64/NetScript-Webview"
      mkdir -p "$STAGE/webview" && cp -a "$BUILD/windows-x64/NetScript-Webview/." "$STAGE/webview/"
      readme "Windows x64 (DirectX 11)" | sed 's/$/\r/' > "$STAGE/README.txt"
      printf '@echo off\r\necho Running NetScript desktop benchmark (several minutes)...\r\n"%%~dp0NetScript.exe" --bench %%* > "%%TEMP%%\\netscript-bench.txt" 2>&1\r\ntype "%%TEMP%%\\netscript-bench.txt"\r\npause\r\n' > "$STAGE/bench.cmd"
      (cd "$BUILD/windows-x64" && rm -f "$OUT/NetScript-GPUIX-PoC-$VERSION-windows-x64-portable.zip" && zip -qr "$OUT/NetScript-GPUIX-PoC-$VERSION-windows-x64-portable.zip" NetScript)
      makensis -V2 -DOUTFILE="$OUT/NetScript-GPUIX-PoC-$VERSION-windows-x64-setup.exe" -DPAYLOAD="$STAGE" -DICON="$ICON_DIR/icon.ico" -DVERSION="$VERSION" scripts/installer.nsi
      ;;
    macos-arm64)
      APP="$BUILD/macos-arm64/NetScript.app"; rm -rf "$BUILD/macos-arm64"; mkdir -p "$APP/Contents/MacOS" "$APP/Contents/Resources"
      compile aarch64-apple-darwin darwin-arm64 "$APP/Contents/MacOS/NetScript"
      webview aarch64-apple-darwin "$BUILD/macos-arm64/NetScript Webview"   # deno desktop appends .app
      cp "$ICON_DIR/icon.icns" "$APP/Contents/Resources/NetScript.icns"
      cat > "$APP/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>CFBundleName</key><string>NetScript</string>
  <key>CFBundleDisplayName</key><string>NetScript</string>
  <key>CFBundleIdentifier</key><string>dev.netscript.gpuix-poc</string>
  <key>CFBundleVersion</key><string>$VERSION</string>
  <key>CFBundleShortVersionString</key><string>$VERSION</string>
  <key>CFBundleExecutable</key><string>NetScript</string>
  <key>CFBundleIconFile</key><string>NetScript</string>
  <key>CFBundlePackageType</key><string>APPL</string>
  <key>LSMinimumSystemVersion</key><string>12.0</string>
  <key>NSHighResolutionCapable</key><true/>
</dict></plist>
EOF
      readme "macOS Apple Silicon (Metal)" > "$BUILD/macos-arm64/README.txt"
      cat >> "$BUILD/macos-arm64/README.txt" <<'EOF'

macOS: this build is ad-hoc signed, not notarized. After unzipping, run once:
  xattr -dr com.apple.quarantine NetScript.app "NetScript Webview.app"
then open it (or right-click > Open). Benchmark:
  NetScript.app/Contents/MacOS/NetScript --bench
EOF
      printf '#!/bin/sh\ncd "$(dirname "$0")" && ./NetScript.app/Contents/MacOS/NetScript --bench --compare="$PWD/NetScript Webview.app/Contents/MacOS/laufey_webview" "$@"\n' > "$BUILD/macos-arm64/bench.command"; chmod +x "$BUILD/macos-arm64/bench.command"
      (cd "$BUILD/macos-arm64" && rm -f "$OUT/NetScript-GPUIX-PoC-$VERSION-macos-arm64.zip" && zip -qry "$OUT/NetScript-GPUIX-PoC-$VERSION-macos-arm64.zip" NetScript.app "NetScript Webview.app" README.txt bench.command)
      ;;
    *) echo "unknown target $target" >&2; exit 2 ;;
  esac
done
ls -la "$OUT"
