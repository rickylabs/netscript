## S-conform-sagas

Scope:
- Sagas connector manifest and router conformance.
- Deleted local manifest/contribution/dependency/inspection mirror types and the `as unknown as SagasPluginManifest` cast.
- Repointed README/tests to core `inspectPlugin(sagasPlugin)`.
- Replaced connector-local `AnyRouter` router assembly with `assemblePluginContractRouter(...)` from `@netscript/plugin/service`.
- Reconciled workers/streams dependencies against the live `PluginManifest` base type.

Commit:
- `36271e86` — `feat(sagas): conform plugin manifest and router assembly`

Gate evidence:
- No-dangling grep: `SagasPluginManifest`, `as unknown as SagasPluginManifest`, and `AnyRouter` all 0 hits under `plugins/sagas`.
- Scoped check: PASS, 65 files, 0 diagnostics.
- Scoped lint: PASS, 65 files, 0 diagnostics.
- Scoped fmt: PASS, 65 files, 0 findings.
- Package tests: PASS, 24 passed, 0 failed.
- `publish:dry-run`: PASS, dry run complete; existing dynamic-import warnings remain.
- `deno task arch:check`: PASS exit 0, `FAIL=0`; existing WARN/INFO baseline remains.
