#!/usr/bin/env bash
set -euo pipefail

echo "Bootstrapping NetScript for OpenHands"

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
toolchain_file="${NETSCRIPT_TOOLCHAIN_FILE:-}"
if [ -z "$toolchain_file" ]; then
  if [ -f "$script_dir/toolchain.env" ]; then
    toolchain_file="$script_dir/toolchain.env"
  elif [ -f ".github/toolchain.env" ]; then
    toolchain_file=".github/toolchain.env"
  fi
fi

if [ -z "$toolchain_file" ] || [ ! -f "$toolchain_file" ]; then
  echo "Missing NetScript toolchain file."
  exit 1
fi

# shellcheck source=/dev/null
source "$toolchain_file"

: "${NETSCRIPT_DENO_VERSION:?}"
: "${NETSCRIPT_DOTNET_CHANNEL:?}"
: "${NETSCRIPT_ASPIRE_CLI_VERSION:?}"

export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
export PATH="$DENO_INSTALL/bin:$HOME/.aspire/bin:$HOME/.dotnet:$PATH"

if ! command -v deno >/dev/null 2>&1; then
  curl -fsSL https://deno.land/install.sh | sh -s -- -y "$NETSCRIPT_DENO_VERSION"
fi

target_deno="${NETSCRIPT_DENO_VERSION#v}"
actual_deno="$(deno --version | awk 'NR==1 {print $2}')"
if [ "$actual_deno" != "$target_deno" ]; then
  deno upgrade --version "$target_deno"
fi

target_dotnet_major="${NETSCRIPT_DOTNET_CHANNEL%%.*}"
if ! command -v dotnet >/dev/null 2>&1 ||
  ! dotnet --list-sdks 2>/dev/null | grep -Eq "^${target_dotnet_major}\."; then
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel "$NETSCRIPT_DOTNET_CHANNEL" --install-dir "$HOME/.dotnet"
fi

aspire_installer="$(mktemp)"
trap 'rm -f "$aspire_installer"' EXIT
curl -fsSL https://aspire.dev/install.sh -o "$aspire_installer"
bash "$aspire_installer" \
  --version "$NETSCRIPT_ASPIRE_CLI_VERSION" \
  --install-path "$HOME/.aspire/bin" \
  --skip-path

echo "$DENO_INSTALL/bin" >> "$GITHUB_PATH" 2>/dev/null || true
echo "$HOME/.aspire/bin" >> "$GITHUB_PATH" 2>/dev/null || true
echo "$HOME/.dotnet" >> "$GITHUB_PATH" 2>/dev/null || true

deno --version
dotnet --version
dotnet --list-sdks | grep -E "^${target_dotnet_major}\."
actual_aspire="$(aspire --version)"
echo "$actual_aspire"
case "$actual_aspire" in
  "$NETSCRIPT_ASPIRE_CLI_VERSION"*) ;;
  *)
    echo "Aspire CLI version mismatch: expected $NETSCRIPT_ASPIRE_CLI_VERSION, got $actual_aspire"
    exit 1
    ;;
esac
docker --version
docker compose version

deno install || echo "deno install non-fatal during OpenHands setup"
dotnet nuget locals all --list || true
dotnet workload list || true
