# Worklog: chore/prod-readiness

| Field | Value |
|-------|-------|
| Run ID | `chore-prod-readiness--cleanup` |
| Branch | `chore/prod-readiness` (off `release/jsr-readiness`) |
| Status | `active` (group branch launched; Plan-Gate pending) |

## Progress Log

| Time | Phase | Step | Notes |
|------|-------|------|-------|
| 2026-06-18 | bootstrap | skeleton scaffolded | Supervisor created run dir + draft `plan.md`/`research.md`. No branch/worktree/generator yet (present-for-review gate). |
| 2026-06-18 | plan-gate | group branch launched | Branched off umbrella @ `1f4cafa3` for the Plan-Gate. Plan/research/Design ready (inherited from umbrella). Draft sub-PR → `release/jsr-readiness` + PLAN-EVAL dispatch (OpenHands/minimax M3, separate session) follow. Worktree deferred to implementation launch (WSL Codex, ext4). |
| 2026-06-18 | plan-gate | PLAN-EVAL cycle 1 = **FAIL_PLAN** | OpenHands minimax M3 (run 27754236653, separate session) → `plan-eval.md`. 7 mechanical fixes; off-limits/catalog guardrail PASS; "close to PASS". |
| 2026-06-18 | plan-gate | cycle-1 remediation applied (supervisor) | All 7 fixes transcribed into `plan.md`/`research.md`: **PR-7** deprecate-before-remove (S4′ `mysqlJsonExtension` deprecate+defer; S5 `trustedConnection` refactor not delete); **F3** confirmed functional (read by `database-connectivity.ts:48,71,94`) + arch-debt `database-connectivity-legacy-connstring-alias` added; **G1-3 split** → G1-3a/b/c; **S6 scaffolder consumer** `job-scaffolders.ts:64–65`+fixture added to G1-5; `scaffold.runtime` smoke on every public slice; **G1-6 bounded**; per-slice file list + LOC budget. Re-dispatching PLAN-EVAL cycle 2. |

## Design

> Plan & Design checkpoint (supervisor-authored; the implementation lane is WSL Codex). `plan.md`
> holds the locked decisions, slice list, and gates; this section fixes the *method* + per-slice
> design so PLAN-EVAL can judge correctness-preservation, not just intent.

### Design principle

A **subtractive** run: every change is a deletion or relocation, never a new abstraction or shim.
Correctness is preserved by *proving each target is unreferenced before removal*, not by re-testing
behavior afterward. No public API is added; the only public-surface *removals* (S6 recurring-job
API; S3–S5 database) are gated behind a full-consumer scan + the `e2e:cli` runtime smoke.

### Removal method (applied per shim/dead symbol)

1. **Consumer scan** — `deno info` import-graph + `.llm/tools/find-import-patterns.ts` + codemogger +
   a workspace grep across `packages/ packages/cli/src/kernel/templates/ plugins/ ops/ .llm/tools/
   docs/`. Removal is authorized only on **zero live consumers** (deprecation re-exports pointing at
   the canonical symbol do not count).
2. **Remove** the shim/alias/dead symbol + now-orphaned imports.
3. **Prove** — scoped `deno check` on touched package(s) + that package's tests; public-surface
   slices additionally hold `publish:dry-run` (27 units, 0 slow types) green.

### Slice → target → proving gate (design-fixed; mirrors plan.md)

| Slice | Targets | Design note | Proof |
|-------|---------|-------------|-------|
| G1-0 | `AGENTS-handoff.md` → `openhands-handoff` skill body; delete root file | Content is load-bearing (trigger syntax/token rules) → moves into the skill that already references it; cross-refs updated; not deleted | `validate-claude-surface.ts` |
| G1-1 | tracked temp/build/garbage + stray root files | Delete only tracked cruft, never source | tree clean; `deno check` |
| G1-2 | internal shims S1/S2/S7 | Internal-only re-exports; zero external consumers expected | scoped check + pkg tests |
| G1-3a | database public S3 (postgres connstring fn alias, `mod.ts:254`) | Already `@deprecated` → removable | check + db tests + publish:dry-run + `scaffold.runtime` smoke |
| G1-3b | database public S4 (remove `@deprecated` `mssqlJsonExtension`) **+ S4′ deprecate-only `mysqlJsonExtension`** | PR-7: un-`@deprecated` alias is deprecated this run, removal deferred (no silent break) | check + db tests + publish:dry-run + `scaffold.runtime` smoke |
| G1-3c | database public S5 (`trustedConnection`) | PR-7: **refactor**, not delete — migrate writer `mssql.adapter.ts:415–416` → `authentication.type='ntlm'`; adapter behavioural test | check + db tests + publish:dry-run + `scaffold.runtime` smoke |
| G1-4 | fresh options S8 | Deprecated option aliases; canonical option exists | check + fresh tests + `scaffold.runtime` smoke |
| G1-5 | plugin-workers-core recurring-job API S6 (PUBLIC, highest risk) **+ generated-output consumer `job-scaffolders.ts:64–65` + fixture** | Scaffolder emits `.schedule(...)` → migrate scaffolder+fixture in the same slice or scaffold.runtime typecheck breaks | check + tests + full `e2e:cli run scaffold.runtime --cleanup` |
| G1-6 | **bounded** dead-code sweep (G1-0..G1-5 surfaces + `.llm/tools/`) | Only symbols proven unreachable by import-graph + tool + grep; new dead surfaces beyond scope are recorded + deferred | check + tests + publish:dry-run |

### Off-limits (design guardrail)

Functional workarounds **F1** (Aspire compat), **F2** (esbuild CJS), **F3** (servy legacy alias —
**verified functional**: `ConnectionStrings__{provider}db` is read by
`service/src/diagnostics/database-connectivity.ts:48,71,94`; filed as arch-debt
`database-connectivity-legacy-connstring-alias`) are NOT back-compat shims → out of scope.
`packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, and catalog/`catalog:`
are untouched. Slices run low→high blast radius.

## Gate Results

(none yet — see `plan.md` Validation Plan)

## Handoff Notes

- PLAN-EVAL cycle 1 returned `FAIL_PLAN` (7 mechanical fixes; `plan-eval.md`). Cycle-1 remediation is
  applied to `plan.md`/`research.md`/`arch-debt.md` (see progress log). **Re-dispatching PLAN-EVAL
  cycle 2** (OpenHands minimax M3, separate session). No implementation slice before PLAN-EVAL
  `PASS`. Two FAIL_PLAN cycles then escalate — this is cycle 2 of 2.
