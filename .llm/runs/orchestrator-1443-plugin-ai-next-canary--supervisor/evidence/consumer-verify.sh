#!/usr/bin/env bash
# Assert the #1443 consumer contract against a published or local CLI entrypoint.
set -u

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <jsr:@netscript/cli@version|local-cli-path>" >&2
  exit 2
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../../../.." && pwd)"
CLI_ENTRYPOINT="$1"
if [[ "$CLI_ENTRYPOINT" != jsr:* ]]; then
  CLI_ENTRYPOINT="$(cd "$(dirname "$CLI_ENTRYPOINT")" && pwd)/$(basename "$CLI_ENTRYPOINT")"
fi

WORK_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/netscript-consumer-verify.XXXXXX")"
PROJECT_ROOT="$WORK_ROOT/fresh"
FAILURES=0

cleanup() {
  rm -rf -- "$WORK_ROOT"
}
trap cleanup EXIT

run_cli() {
  deno run --minimum-dependency-age=0 --node-modules-dir=auto -A "$CLI_ENTRYPOINT" "$@"
}

fail() {
  echo "FAIL: $*" >&2
  FAILURES=$((FAILURES + 1))
}

pass() {
  echo "PASS: $*"
}

cd "$WORK_ROOT" || exit 2
if ! run_cli init fresh --path . --db sqlite --cache=false --service \
  --service-name users --ci --yes --no-git --force; then
  fail "project initialization"
  exit 1
fi

INSTALL_ARGS=(plugin install ai --name ai --project-root "$PROJECT_ROOT" --ci --force)
if [[ "$1" != jsr:* ]]; then
  INSTALL_ARGS+=(--local-path "$REPO_ROOT/plugins/ai")
fi
if ! run_cli "${INSTALL_ARGS[@]}"; then
  fail "plugin install ai"
else
  pass "plugin install ai"
fi

if grep -Fq '/services' "$PROJECT_ROOT/appsettings.json"; then
  fail "appsettings contains a synthesized /services specifier"
else
  pass "no synthesized /services specifier"
fi

if ! PROJECT_ROOT="$PROJECT_ROOT" deno eval '
  const root = Deno.env.get("PROJECT_ROOT");
  if (!root) Deno.exit(2);
  const document = JSON.parse(await Deno.readTextFile(`${root}/appsettings.json`));
  if (document.NetScript?.Plugins?.ai !== undefined) Deno.exit(1);
'; then
  fail "appsettings contains NetScript.Plugins.ai"
else
  pass "no NetScript.Plugins.ai entry"
fi

if [[ -f "$PROJECT_ROOT/ai/mod.ts" ]]; then
  pass "configured ai/mod.ts exists"
else
  fail "configured ai/mod.ts is missing"
fi

if run_cli generate runtime-schemas --project-root "$PROJECT_ROOT"; then
  pass "generate runtime-schemas"
else
  fail "generate runtime-schemas"
fi

if [[ "$1" == jsr:* ]]; then
  CLI_VERSION="${1##*@}"
  AI_GENERATOR="https://jsr.io/@netscript/plugin-ai/$CLI_VERSION/src/cli/generate-runtime-registries.ts"
  AI_RUNTIME_MANIFEST="$WORK_ROOT/scaffold.runtime.json"
  AI_RUNTIME_MANIFEST_URL="https://jsr.io/@netscript/plugin-ai/$CLI_VERSION/scaffold.runtime.json"
  if ! deno eval '
    const [url, path] = Deno.args;
    const response = await fetch(url);
    if (!response.ok) Deno.exit(1);
    await Deno.writeTextFile(path, await response.text());
  ' "$AI_RUNTIME_MANIFEST_URL" "$AI_RUNTIME_MANIFEST"; then
    fail "fetch published AI runtime manifest"
  fi
else
  AI_GENERATOR="$REPO_ROOT/plugins/ai/src/cli/generate-runtime-registries.ts"
  AI_RUNTIME_MANIFEST="$REPO_ROOT/plugins/ai/scaffold.runtime.json"
fi
if deno run --config "$PROJECT_ROOT/deno.json" --minimum-dependency-age=0 \
  --allow-read --allow-write "$AI_GENERATOR" --project-root "$PROJECT_ROOT" \
  --manifest "$AI_RUNTIME_MANIFEST"; then
  pass "generate AI runtime registries"
else
  fail "generate AI runtime registries"
fi

mapfile -t AI_SOURCES < <(find "$PROJECT_ROOT/ai" -type f \( -name '*.ts' -o -name '*.tsx' \) | sort)
if [[ ${#AI_SOURCES[@]} -eq 0 ]]; then
  fail "generated ai namespace has no TypeScript sources"
elif (cd "$PROJECT_ROOT" && deno check --unstable-kv "${AI_SOURCES[@]}"); then
  pass "deno check generated ai namespace"
else
  fail "deno check generated ai namespace"
fi

if run_cli plugin doctor --project-root "$PROJECT_ROOT"; then
  pass "plugin doctor valid install"
else
  fail "plugin doctor valid install"
fi

if [[ $FAILURES -gt 0 ]]; then
  echo "consumer verification failed with $FAILURES surviving defect(s)" >&2
  exit 1
fi

echo "consumer verification passed"
