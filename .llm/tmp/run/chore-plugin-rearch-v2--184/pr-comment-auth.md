S-conform-auth — auth connector reference conformance

Commit: `31e63c74` (`feat(auth): conform manifest and health routing`)

Scope:

- Deleted local `AuthPluginManifest`/contribution/dependency/inspection mirror types.
- Deleted `inspectAuth`; README and manifest test now use shared `inspectPlugin(authPlugin)`.
- Replaced connector-local `AnyRouter` service assembly with shared `assemblePluginContractRouter(...)`.
- Deleted the bespoke auth health router and repointed adapter doctor metadata from `/auth/health` to `/health`.
- Preserved `./adapter-cli`.
- Recorded Q4 deferred backend-env centralization as `AUTH-BACKEND-ENV-CENTRALIZATION` debt.

Gate evidence:

- `rg "AuthPluginManifest|inspectAuth|AnyRouter|/auth/health" plugins/auth -n` — PASS, 0 hits.
- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root plugins/auth --ext ts,tsx` — PASS, 35 files, 0 diagnostics.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root plugins/auth --ext ts,tsx` — PASS, 35 files, 0 diagnostics.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root plugins/auth --ext ts,tsx` — PASS, 35 files, 0 findings.
- `cd plugins/auth && rtk proxy deno task test` — PASS, 23 passed, 0 failed.
- `cd plugins/auth && rtk proxy deno task publish:dry-run` — PASS, dry run complete; existing bootstrap dynamic-import warning remains.
- `rtk proxy deno task arch:check` — PASS exit 0, `FAIL=0`; existing WARN/INFO doctrine findings remain.
