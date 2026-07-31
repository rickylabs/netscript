# Worklog

## Design

- Public surface: unchanged; behavior corrections remain behind existing probe, doctor-family, and command-catalog ports.
- Domain vocabulary: HTTP success means `Response.ok`; generated AppHost markers include `.mts`.
- Ports: reuse `TelemetryProbePort`, `AspireDoctorDependencies`, and `CommandCatalogPort`.
- Constants: extend the existing Aspire marker list only.
- Commit slice: one mechanical truthfulness fix with focused contract tests.
- Deferred scope: plugin-owned CLI metadata remains owned by plugin CLI packages.
- Contributor path: doctor adapters live in `packages/mcp/src/infrastructure`; CLI composition lives under `packages/cli/src/public/features/agent/mcp`.

## Implementation

- `FetchTelemetryProbe` now uses HTTP success semantics instead of transport-only reachability.
- Aspire detection includes the generated `aspire/apphost.mts` and root `apphost.mts` markers.
- CLI composition contract confirms `list_commands` uses the public CLI registry and exposes its plugin dispatch verbs, never the standalone fallback.

## Fails-before evidence

| Guard | Fix deliberately removed | Result |
| --- | --- | --- |
| HTTP response semantics | Replaced `response.ok` with `true` | FAIL: expected 404 reachability `false`, observed `true` |
| Generated AppHost marker | Removed `aspire/apphost.mts` | FAIL: expected `pass`, observed `warn` |

Both fixes were restored and the focused suite then passed 12/12.

## Gates

| Gate | Result |
| --- | --- |
| Focused MCP + CLI contract tests | PASS — 12 passed, 0 failed |
| Scoped check `packages/mcp` | PASS — 63 files |
| Scoped check `packages/cli` | PASS — 737 files |
| Scoped lint `packages/cli` | PASS — 737 files |
| Scoped format `packages/cli` | PASS — 737 files |
| MCP wrapper lint / format | NOT RUN to verdict — package-root invocation misparsed the root workspace array; direct changed-file lint/format below covers owned files |
| Direct changed MCP file lint | PASS — 4 files |
| Direct changed MCP file format | PASS — 4 files |
| `deno task quality:scan` | PASS — no findings |
| `deno task arch:check` | PASS — exit 0; pre-existing warnings only |
