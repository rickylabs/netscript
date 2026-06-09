#!/usr/bin/env bash
set -euo pipefail

echo "Bootstrapping NetScript for OpenHands"

export DENO_INSTALL="${DENO_INSTALL:-$HOME/.deno}"
export PATH="$DENO_INSTALL/bin:$HOME/.aspire/bin:$HOME/.dotnet:$PATH"

if ! command -v deno >/dev/null 2>&1; then
  curl -fsSL https://deno.land/install.sh | sh -s -- -y
fi

if ! command -v dotnet >/dev/null 2>&1; then
  curl -fsSL https://dot.net/v1/dotnet-install.sh -o /tmp/dotnet-install.sh
  bash /tmp/dotnet-install.sh --channel 10.0 --install-dir "$HOME/.dotnet"
fi

if ! command -v aspire >/dev/null 2>&1; then
  curl -fsSL https://aspire.dev/install.sh | bash
fi

echo "$DENO_INSTALL/bin" >> "$GITHUB_PATH" 2>/dev/null || true
echo "$HOME/.aspire/bin" >> "$GITHUB_PATH" 2>/dev/null || true
echo "$HOME/.dotnet" >> "$GITHUB_PATH" 2>/dev/null || true

deno --version
dotnet --version
aspire --version || true
docker --version || true
docker compose version || true

deno install || echo "deno install non-fatal during OpenHands setup"
dotnet nuget locals all --list || true
dotnet workload list || true
