## S-conform-workers

Scope:
- Workers connector manifest and router conformance.
- Deleted local manifest/inspection mirror types and the `as unknown as WorkersPluginManifest` cast.
- Repointed README/tests to core `inspectPlugin(workersPlugin)`.
- Replaced connector-local `AnyRouter` router assembly with `assemblePluginContractRouter(...)` from `@netscript/plugin/service`.

Commit:
- `f7fb8493` — `feat(workers): conform plugin manifest and router assembly`

Gate evidence:
- No-dangling grep: `WorkersPluginManifest`, `inspectWorkers`, `as unknown as WorkersPluginManifest`, and `AnyRouter` all 0 hits under `plugins/workers`.
- Scoped check: PASS, 85 files, 0 diagnostics.
- Scoped lint: PASS, 85 files, 0 diagnostics.
- Scoped fmt: PASS, 85 files, 0 findings.
- Package tests: PASS, 16 passed, 0 failed.
- `publish:dry-run`: PASS, dry run complete; existing dynamic-import warnings remain.
- `deno task arch:check`: PASS exit 0, `FAIL=0`; existing WARN/INFO baseline remains.
