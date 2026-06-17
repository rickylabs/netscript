# Phase E — IMPL-EVAL Results (Wave 5 Apps Consolidation)

Three independent IMPL-EVAL sessions ran on PR #17 (branch
`feat/package-quality-wave5-apps`) via OpenHands cloud, model
`openrouter/minimax/minimax-m3`, `iterations=600`, write-artifact-first prompts.
Each is an independent evaluator session (no edits to `packages/`).

All three returned `VERDICT: APPROVED` with `summary_source: agent` and
`agent_outcome: success` in metadata (i.e. genuine completion, not
synthesized-after-iteration-limit).

| Package            | Archetype | Run ID       | Verdict     | Artifact                |
| ------------------ | --------- | ------------ | ----------- | ----------------------- |
| `@netscript/fresh` | A4 (DSL)  | 27507518739  | APPROVED ✅ | `impl-eval.md`          |
| `@netscript/service` | A4 (DSL) | 27508042691 | APPROVED ✅ | `impl-eval-service.md`  |
| `@netscript/sdk`   | A4 (DSL)  | 27511443802  | APPROVED ✅ | `impl-eval-sdk.md`      |

Trace dirs: `.llm/tmp/run/openhands/pr-17/run-<runid>-1/`.

## fresh (Phase D + D2) — APPROVED

8/8 items PASS. No backward-compat surface (0 grep matches); root `mod.ts`
cache-helpers only; 12 `exports` keys all resolve; CLI import-map parity
(both `PACKAGE_TO_LOCAL_PATH` maps + `generators-config_test`); Doctrine-05
clean (max file 497 LOC < 500). Gates: check 0, lint 0 (141 files), doc-lint 0
(12 files), publish dry-run Success, fmt 0 (144 files), test 141/141,
**E2E `scaffold.runtime` 41/41** re-run in the eval session. Docs describe the
no-shell / no-backward-compat reality.

## service (Phase A) — APPROVED

7/7 items PASS. `service-builder.ts` (604 LOC) split into
`builder/{service-builder,service-builder-impl,service-rpc,service-listener}.ts`,
max 408 LOC. Public surface exposes `ServiceContext`/`ServiceHandler`/
`RunningService` with no Hono/oRPC leak (`grep` 0 in `src/types.ts`);
`RunningService.stop()` + AbortSignal verified by test. Gates: check 0, lint 0
(17 files), doc-lint 0, publish dry-run Success, test 17/17, README-example
drift 2/2. `builder/`+`primitives/` vocab nuance is tracking-only under the
existing role-clarification debt entry (F-3, F-11) — not a new blocker.
`assets/scalar.min.js` 3.3 MB is DEBT_ACCEPTED (D-9).

## sdk (Phase B) — APPROVED

7/7 items PASS. 8 root barrel folders + `streams.ts` collapsed into `src/` as
single source root; 10 published subpath keys byte-stable (workspace consumers
fresh/queue/cli all resolve). Gates: check 10/10 entrypoints, lint 0 (57
files), doc full-export 0 (10 files), fmt 0 (60 files), test 14/14, publish
dry-run Success (38 source files, all under `src/` + root `mod.ts`). RFC-14
`src/ports/transport.ts` (`ServiceTransport`, `'http' | 'in-process'`) public
and protected-don't-implemented. B1/B2 adapter/domain re-slice DEFERRED with
KISS justification in `drift.md` — accepted deferral, not a blocker.

### Evaluator-noted follow-ups (non-blocking)

- **sdk:** if a future gate runs `deno doc --lint` per-entrypoint (not
  full-export), 9 `private-type-ref` warnings will surface as false positives
  (sibling-subpath types public on `./ports`); full-export is the authoritative
  gate. Recorded for the lead.
- **fresh:** debt entries AP-1 (builders split) and F-7 (doc-lint residue) were
  flagged as satisfied at HEAD; both marked RESOLVED in
  `.llm/harness/debt/arch-debt.md` this pass.

## Debt reconciliation

- `packages/fresh — AP-1` → RESOLVED (this pass).
- `packages/fresh — F-7` → RESOLVED (this pass).
- `packages/service — doctrine verdict Refactor` (presets/assets role) → remains
  open, DEBT_ACCEPTED.
- `packages/service — assets/scalar.min.js` (D-9) → remains open, DEBT_ACCEPTED.
- sdk B1/B2 re-slice → drift-recorded deferral; no debt entry required (revisit
  trigger: a second concrete adapter per port).

## Outcome

All three Wave 5 app-package consolidations (fresh, service, sdk) pass their
Archetype 4 gates and the independent IMPL-EVAL bar. Phase E (merge close-out)
is clear to proceed on PR #17.
