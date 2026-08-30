# S8 Tier-A slice review — #1720 + #863 / PR #1754 (stacked on S6 `564d465c` → S5 `aa822069`)

- Reviewer: Fable 5 medium supervisor (session `session_01Jusn3woxeK5xhCdj6ccooR`); generator: Codex
  · GPT-5.6 Sol · medium thread `01a051e6-90d4-7e50-a91e-ac4bd23b880c`; worktree
  `/home/agent/projects/netscript/worktrees/007-aspire-s8`; base = S6 `564d465c`.

## Provisional review at `c0d47238` (slices 1–5; slice 6 in progress) — 2026-08-30

### Commit stack

`42c4ef51` RED seam tests (no `PROCESS_COMMANDS_FLAG`, `excludeFromMcp` only on `<db>-cli`) →
`1fa1cb75` generator emits typed db resource commands
(`withCommand(name, displayName, cb, {
commandOptions: { arguments: [...] } })`,
`ctx.arguments().value(...)`, `.excludeFromMcp()` gated by
`RESOURCE_DEFAULTS.DbCliModeExcludeFromMcp`) → `ab0908b8` snapshot/barrel regen → `1efd1a17` CLI
adapters: `findRunningAppHost` (exact `appHostPath` match from `aspire ps --format Json`), lifecycle
lease, resident-AppHost vs scoped standalone routing, bounded wait honouring `aspire wait` exit
codes 17/18, default timeout 15 → 5 min, resource name `netscript-db-<key>` → `<key>-cli`,
`run-tool` template refactored to an exported runtime-edge `runTool` with SIGTERM timeout →
`c0d47238` D-19 consumer compile fix (three real 13.5.3 typing defects: `getConnectionString` via
`builder.getConfiguration()`, visibility enum not bitwise-combined; no casts). 25 files, +1460/−335
over S6.

### Substantive findings

- Doctrine A7/A11: IO stays at the emitted runtime edge (`runTool`, generated `<db>-cli` callbacks);
  generator files add no IO. `withHidden(` never emitted (D-6); `excludeFromMcp()` emitted only
  inside the db-cli block (`generate-db-cli-mode-1.ts.template:173`).
- #863 mechanism present: bounded `aspire wait` with timeout exit codes surfaced instead of an
  indefinite block; standalone path retained for no-resident-AppHost. Runtime proof of the
  Unhealthy-but-Running case is Phase B (environment-blocked, D-43) — not claimed here.
- D-19: receipt `05-consumer-typecheck-13.5.3.txt` on the S8 branch — module SHA-256s identical to
  S2/S5/S6 (`7cd4cf83…`, `e2ce97fa…`, `2fd6593b…`); first compile exposed 3 defects, fixed in slice
  5, **final `tsc --noEmit` exit 0** (not even the zod TS2307 baseline). Note: the receipt's HEAD
  line names the pre-fix `1efd1a17`; the final compile corresponds to the slice-5 tree (`c0d47238`).
  The evaluator should re-render at the final head.
- Minor: `generate-db-cli-mode_test.ts` unformatted — pre-existing at base `564d465c`, not S8.

### Gates executed at `c0d47238` (fork agent, read-only, no runtime)

scoped `deno check` templates/aspire + adapters/database + assets + cli/e2e → **0 diagnostics** (238
files); raw `deno lint --no-config` on 8 changed TS files → clean; raw fmt → 1 pre-existing
unformatted test file; `quality:scan` 0 findings; `arch:check` exit 0; `check:assets-barrel`,
`check:publish-assets`, `check:aspire-host-ports`, `check:emitted-samples` (47 samples) → exit 0;
tests **292/0 · 25/0 · 175/0**; lint escapes added: `deno-lint-ignore` 0, `: any` 0, `as unknown as`
0 in code (1 inside the regenerated barrel string literal, pre-existing class);
`PROCESS_COMMANDS_FLAG` remaining: 0.

**Status: provisional PASS for slices 1–5; sign-off is issued only at the exact final head after
slice 6 (E2E + gates) lands, with the gate set re-run there.**

## Tier-A sign-off at exact head `9dd06647` (phase A) — 2026-08-30

- Stack: slices 1–5 as reviewed above + **slice 6 `5b6f8a0a`** (`verify-typed-db-phase-b.ts` Phase-B
  receipt gate: asserts exactly one resident AppHost, `<db>-cli --help`, bounded
  `migrate --timeout`, Unhealthy-but-Running `listener unreachable` description; registered as
  `GATE.RUNTIME_TYPED_DB_PHASE_B` with phase RUNTIME and unit-tested, **deliberately unwired from
  every suite** until the lease-backed Phase B; `ASPIRE_RESTART_SCRIPT` demoted to the fallback
  inside `ASPIRE_TYPED_DB_COMMAND_OR_RESTART_SCRIPT`; timeout budget unified through
  `resolveDbCliTimeoutSeconds()` — validated positive integer from the existing env input) +
  `9dd06647` (docs: clean-head gate evidence; **no product file** vs `5b6f8a0a`).
- Gates re-executed at `5b6f8a0a` (product-identical to `9dd06647`): scoped `deno check` → **0
  diagnostics** (239 files); raw lint on the 14 changed TS files → clean; raw fmt → 1 pre-existing
  unformatted test file (`generate-db-cli-mode_test.ts`, unformatted at base); `quality:scan` `[]`;
  `arch:check` FAIL 0; `check:assets-barrel`, `check:publish-assets`, `check:aspire-host-ports`,
  `check:emitted-samples` → exit 0; tests **292/0 · 27/0 · 177/0**; lint escapes added in code:
  0/0/0. S8 run dir carries the D-39 host facts; no stale inotify/ zombie waiver.
- Contract re-verified at head: `excludeFromMcp()` only on `<db>-cli` (single emission site); typed
  `withCommand(... commandOptions.arguments ...)`; `withHidden(` never emitted;
  `PROCESS_COMMANDS_FLAG` 0; D-19 consumer compile exit 0 with matching 13.5.3 module hashes
  (evaluator re-renders at this head).
- Not claimed: any Phase-B runtime receipt (#863 Unhealthy-but-Running, db-cli `--help`,
  `migrate --timeout`) — environment-blocked on this NAS (D-42/D-43). `PROCESS_COMMANDS_FLAG`
  removal is a behaviour change to the emitted runtime that only the Phase-B/`scaffold.runtime` run
  can prove live.
- **Verdict: sign-off to independent IMPL-EVAL (phase A) at `9dd06647`.** No lane self-certifies;
  this is not a merge recommendation — S8 is stacked on S6 → S5, and the D-41 rule (runtime verdict
  at the exact head before any merge surfacing) applies to the whole stack.
