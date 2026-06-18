# Worklog: chore/prod-readiness

| Field | Value |
|-------|-------|
| Run ID | `chore-prod-readiness--cleanup` |
| Branch | `chore/prod-readiness` (off `release/jsr-readiness`) |
| Status | `planned` (skeleton; not launched) |

## Progress Log

| Time | Phase | Step | Notes |
|------|-------|------|-------|
| 2026-06-18 | bootstrap | skeleton scaffolded | Supervisor created run dir + draft `plan.md`/`research.md`. No branch/worktree/generator yet (present-for-review gate). |

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
| G1-3 | database public API S3/S4/S5 | Public → full-consumer scan incl. scaffold templates; rewrite callers to canonical symbol | check + db tests + publish:dry-run |
| G1-4 | fresh options S8 | Deprecated option aliases; canonical option exists | check + fresh tests |
| G1-5 | plugin-workers-core recurring-job API S6 (PUBLIC, highest risk) | Scaffolded into generated projects → scan templates + full runtime smoke | check + tests + `e2e:cli run scaffold.runtime --cleanup` |
| G1-6 | dead-code sweep | Only symbols proven unreachable by import-graph + tool + grep; no heuristic deletion | check + tests + publish:dry-run |

### Off-limits (design guardrail)

Functional workarounds **F1** (Aspire compat), **F2** (esbuild CJS), **F3** (servy legacy alias) are
NOT back-compat shims → out of scope. `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`,
version pins, and catalog/`catalog:` are untouched. Slices run low→high blast radius.

## Gate Results

(none yet — see `plan.md` Validation Plan)

## Handoff Notes

- Next: PLAN-EVAL (separate OpenHands session) on `plan.md` after research deepens the dead-code/shim
  inventory. No implementation slice before PLAN-EVAL `PASS`.
