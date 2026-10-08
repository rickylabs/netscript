#!/usr/bin/env bash
# Provision only a temporary native PostgreSQL instance owned by this gate.
set -euo pipefail
repo_root=$(pwd)
provider_bin=${COMMAND_POSTGRES_BIN:-$(pg_config --bindir)}
provider_run=$(mktemp -d)
export COMMAND_POSTGRES_SOCKET="$provider_run/socket"
export PGUSER
PGUSER=$(id -un)
mkdir -p "$COMMAND_POSTGRES_SOCKET"
cleanup() {
  "$provider_bin/pg_ctl" -D "$provider_run/data" -m immediate stop > "$provider_run/stop.log" 2>&1 || true
  rm -rf "$provider_run"
}
trap cleanup EXIT
"$provider_bin/initdb" -D "$provider_run/data" --no-locale --auth=trust > "$provider_run/init.log" 2>&1
# No network listener. The isolated Unix socket directory separates gate instances.
"$provider_bin/pg_ctl" -D "$provider_run/data" -l "$provider_run/server.log" -o "-k $COMMAND_POSTGRES_SOCKET -h ''" start > "$provider_run/start.log" 2>&1
PGPORT=$("$provider_bin/postgres" -D "$provider_run/data" -C port)
export PGPORT
"$provider_bin/psql" -h "$COMMAND_POSTGRES_SOCKET" -d postgres -v ON_ERROR_STOP=1 -f "$repo_root/packages/database/tests/fixtures/command-store/migration.sql" > "$provider_run/migrate.log" 2>&1
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all packages/database/tests/commands-postgres_test.ts

"$provider_bin/psql" -h "$COMMAND_POSTGRES_SOCKET" -d postgres -v ON_ERROR_STOP=1 -f "$repo_root/packages/plugin-sagas-core/tests/fixtures/transition-store/runtime-migration.sql" > "$provider_run/saga-migrate.log" 2>&1
"$provider_bin/psql" -h "$COMMAND_POSTGRES_SOCKET" -d postgres -v ON_ERROR_STOP=1 -f "$repo_root/packages/plugin-sagas-core/tests/fixtures/transition-store/command-replay-migration.sql" >> "$provider_run/saga-migrate.log" 2>&1
deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --unstable-kv --allow-all packages/plugin-sagas-core/tests/prisma-transition-postgres_test.ts
