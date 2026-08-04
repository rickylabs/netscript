# Locked Plan — database Zod barrel contract (#1290)

Status: **LOCKED before source implementation**.

## Profile and doctrine

- Archetype 6 — CLI/tooling, with consumer compile and service runtime gates.
- Current doctrine verdict: `@netscript/cli` is Restructure; this bounded change does not deepen
  that debt. `@netscript/database` is Refactor; script behavior stays in the existing scripts edge.
- Primary axioms: A1, A2, A6, A7, A8, A14.

## Locked decisions

### D1 — One NetScript-owned aggregate barrel

Point `@database/zod` at `.generated/zod/crud.ts`. Generate that file from every discovered model,
exporting `<Model>Schema`, `<Model>CreateInput`, and `<Model>UpdateInput`. Do not mutate the
upstream generator's models barrel and do not change the generated contract's import path.

### D2 — Missing variants fail generation

For each discovered model schema, require the corresponding input and update schema files. A partial
barrel is worse than a failed generation because it defers the defect to consumer compile/runtime.

### D3 — Regression proof compiles the generated contract

Replace the alias-string-only confidence with a test that renders a fresh scaffold contract,
generates a representative multi-model aggregate, and invokes `deno check` against the scaffold's
real import map. The same fixture must be RED against baseline behavior before the repair.

### D4 — Acceptance remains issue-bounded

Do not fix or suppress #1287. Prove the Zod contract directly and boot the example service. Tick the
full-workspace-check box only if the live integration branch includes #1287 and the complete command
passes; otherwise leave it unearned and report the dependency.

### D5 — Lock hygiene

The pre-existing `deno.lock` modification is foreign. Stage only explicit owned files and verify
that no lock file appears in `origin/main...HEAD`.

### D6 — Composed milestone evaluation

Per the owner directive and `milestone-run.md`, record the PLAN-EVAL row as composed and keep this
plan locked. Draft-to-ready and the milestone pre-merge gate provide independent evaluation; no
duplicate local formal evaluator is spawned.

## Open-decision sweep

- Resolved: the compile oracle lives beside the service scaffolder test, where it consumes the real
  rendered contract plus the real root alias generator in the ordinary test lane.
- Safe to defer: removal of the legacy public `runWriteCrudZodBarrel` name; broader generated-Zod
  API cleanup; #1287; #1274 documentation expansion.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Test still checks strings | Spawn `deno check` and assert diagnostics/result. |
| Only default model works | Use at least two generated models and assert all three symbols each. |
| Upstream output changes | Discover schema files and fail with exact missing variant paths. |
| Runtime import differs from type-check | Boot the generated example service and retain startup artifact evidence. |
| Full check falsely claimed | Keep #1287 separate and tick only evidence actually earned. |
| Lock churn | Explicit staging and base-diff lock audit. |

## Gate set

1. RED-first generated-contract compile fixture on baseline.
2. Focused database script and CLI scaffold tests.
3. Scoped check/lint/fmt wrappers for touched source/tests.
4. `quality:gate` and `arch:check` doctrine fitness.
5. Database and CLI doc-lint/publish dry-run where public script surface is touched.
6. Clean local-source `init --db postgres --service --yes`, `db init`, `db generate`, generated
   contract compile, and example-service boot with retained artifacts.
7. Canonical one-pass `scaffold.runtime` merge-readiness gate.
8. Acceptance mirror dry-run, review-thread gate, and cloud CI.

## Deferred scope

- #1287 QueryClient boundary and its docs cast.
- #1274 broader Quickstart work.
- General Zod generator/version changes.
- Deep-path imports from the generated contract (explicitly forbidden).

## Debt

No new architecture debt is planned. Existing CLI/database verdicts are not deepened.
