#!/usr/bin/env bash
# Reproduce rickylabs/netscript#1443 against published NetScript 0.0.5.
set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
WORK="$HERE/work"
CLI=(deno run --minimum-dependency-age=0 --node-modules-dir=auto -A jsr:@netscript/cli@0.0.5)
rm -rf "$WORK"
mkdir -p "$WORK"
cd "$WORK" || exit 1

step() {
  echo ""
  echo "===== STEP: $* ====="
}

step "init fresh"
"${CLI[@]}" init fresh --path . --db sqlite --cache=false --service --service-name users --ci --yes --no-git --force 2>&1 | tail -40
echo "EXIT(init)=${PIPESTATUS[0]}"

step "plugin install ai"
"${CLI[@]}" plugin install ai --name ai --project-root fresh --ci --force 2>&1 | tail -60
echo "EXIT(install)=${PIPESTATUS[0]}"

step "evidence: plugins/ai tree"
find fresh/plugins/ai -type f 2>&1 | sort
step "evidence: ai/ tree"
find fresh/ai -type f 2>&1 | sort
step "evidence: netscript.config.ts"
cat fresh/netscript.config.ts 2>&1
step "evidence: appsettings NetScript.Plugins"
deno eval 'const c=JSON.parse(await Deno.readTextFile("fresh/appsettings.json")); console.log(JSON.stringify({Plugins:c.NetScript?.Plugins,BackgroundProcessors:c.NetScript?.BackgroundProcessors},null,2));' 2>&1

step "generate runtime-schemas"
"${CLI[@]}" generate runtime-schemas --project-root fresh --verbose 2>&1 | tail -40
echo "EXIT(runtime-schemas)=${PIPESTATUS[0]}"

step "plugin doctor"
"${CLI[@]}" plugin doctor --project-root fresh 2>&1 | tail -60
echo "EXIT(doctor)=${PIPESTATUS[0]}"

step "targeted deno check of generated ai namespace"
cd fresh && deno check --unstable-kv ai/**/*.ts ai/**/*.tsx 2>&1 | tail -40
echo "EXIT(check-ai)=${PIPESTATUS[0]}"

echo ""
echo "===== REPRO COMPLETE ====="
