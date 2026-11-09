#!/usr/bin/env bash
# Assemble the offline "stack" folder a packaged desktop app supervises:
#
#   build/stack-<target>/deno[.exe]   shared Deno runtime (2.9.7) for every node
#   build/stack-<target>/deno-dir/    DENO_DIR: every JSR/npm dependency, target natives included
#   build/stack-<target>/garnet/      self-contained Garnet 2.2.1 (no .NET install needed)
#   build/stack-<target>/workspace/   the scaffolded NetScript 0.0.9 workspace (web app removed)
#   build/stack-<target>/seed.db      seeded SQLite database
#
# Usage: scripts/stack-bundle.sh linux-x64|win-x64
# Prereqs: build/garnet-sc/<target> (dotnet publish --self-contained), build/deno-dl/{linux,win},
#          realstack/workspace (scaffold), realstack/seed/workspace.db (realstack/seed.ts).
set -euo pipefail
cd "$(dirname "$0")/.."
TARGET="$1"
B="build/stack-$TARGET"
LINUX_DENO="$PWD/build/deno-dl/linux/deno"
rm -rf "$B" && mkdir -p "$B"

# 1. Workspace: runtime sources only. The Fresh web app is not part of a desktop graph.
WS="$(realpath realstack/workspace)"
mkdir -p "$B/workspace"
tar -C "$WS" --exclude=node_modules --exclude=./.data --exclude=./apps --exclude=./aspire --exclude=./tests \
  --exclude='./database/sqlite/workspace.db*' --exclude='./.netscript/aspire*' -cf - . | tar -C "$B/workspace" -xf -
python3 - "$B/workspace/deno.json" <<'EOF'
import json, sys
path = sys.argv[1]; config = json.load(open(path))
config['workspace'] = [m for m in config.get('workspace', []) if not m.startswith('./apps/')]
json.dump(config, open(path, 'w'), indent=2)
EOF
# The scaffold's file-watch trigger watches ./shared/incoming (relative to the workspace).
mkdir -p "$B/workspace/shared/incoming"
cp realstack/seed/workspace.db "$B/seed.db"

# 2. Garnet, self-contained; XML docs are not needed at runtime.
mkdir -p "$B/garnet" && cp -a "build/garnet-sc/$TARGET/." "$B/garnet/" && find "$B/garnet" -name '*.xml' -delete

# 3. Deno runtime for the target.
case "$TARGET" in
  linux-x64) cp build/deno-dl/linux/deno "$B/deno" ;;
  win-x64) cp build/deno-dl/win/deno.exe "$B/deno.exe" ;;
esac

# 4. Warm DENO_DIR by running the real graph once (online) with the Linux runtime and Linux
#    Garnet, exercising every node (CRUD, job runs, stream reads) so lazily imported modules
#    are cached too. The JSR/npm cache is portable; only native npm packages are per-target.
BUNDLE_DENO_DIR="$PWD/$B/deno-dir"
WARM="$(mktemp -d)"
"$LINUX_DENO" run -A realstack/probe.ts --deno-dir "$BUNDLE_DENO_DIR" --workspace "$PWD/$B/workspace" --data "$WARM/data" \
  --seed "$PWD/$B/seed.db" --deno "$LINUX_DENO" --garnet "$PWD/build/garnet-sc/linux-x64/GarnetServer" \
  --json "$WARM/probe.json" >/dev/null
python3 - "$WARM/probe.json" <<'EOF'
import json, sys
r = json.load(open(sys.argv[1]))
bad = [k for k, v in r.items() if isinstance(v, dict) and v.get('ok') is False]
print(f"warm-up: graph ready {r['readyMs']} ms, failed calls: {bad or 'none'}")
sys.exit(1 if bad else 0)
EOF

# 5. Target natives: install the workspace's npm graph for the target OS into the same cache.
if [[ "$TARGET" == win-x64 ]]; then
  (cd "$B/workspace" && DENO_DIR="$BUNDLE_DENO_DIR" "$LINUX_DENO" install --os win32 --arch x64 --node-modules-dir=none --quiet)
  # `--os win32` also fetches other platforms' optional natives; keep win32-x64 only.
  (cd "$BUNDLE_DENO_DIR/npm/registry.npmjs.org" && ls -d * @*/* 2>/dev/null \
    | grep -E -i '(linux|darwin|android|freebsd|openbsd|netbsd|sunos|aix|win32-(arm64|ia32)|wasm32)' \
    | while read -r pkg; do rm -rf -- "$pkg"; done)
fi
# Keep gen/v8 caches: remote modules are keyed by URL and reused by the same Deno version.

du -sh --apparent-size "$B"/* "$B"
