# PLAN-EVAL Run Summary — NetScript PR #172 / task #172b/c/d

## Summary

Evaluated the lock-step plan `@netscript/plugin-{sagas,triggers,workers}-core` adapter
relocation + migration of hardwired `Deno.Kv` adapters onto the `@netscript/kv` primitive
on branch `feat/scaffold-surface-167` (PR #172). The relocation target placement, layering,
cycle-safety, and `@netscript/kv` port-feasibility are all correct. **However the plan's
D2 ("zero-compat surface break") pre-flight claim is empirically false** for one
rendered docs capability-page code fence and the S-c slice silently introduces a
name-collision in the destination `-core` package. Both block the Plan-Gate's
Open-decision sweep + Risk register checks.

**Verdict: `FAIL_PLAN`** — Implementation MUST NOT begin. Four specific, actionable fixes
listed below turn this into `PASS` on the next evaluation cycle without touching any source
or `deno.lock`.

## Verdict artifact

`.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/plan-eval.md` — full PLAN-EVAL
verdict per `.llm/harness/gates/plan-gate.md` and `.llm/harness/evaluator/plan-protocol.md`.
Records evaluator model (`openrouter/minimax/minimax-m3`), run id, `FAIL_PLAN` verdict, and
each Plan-Gate scrutiny point with file/line-anchored evidence.

## Changes

Wrote two artifacts (read-only evaluator role — no source / plan / lock edits):

- `.llm/tmp/run/feat-scaffold-surface-167--adapter-relocation/plan-eval.md` — full verdict
  (verdict template + open-decision sweep + risk register + per-decision verdicts +
  per-slice verdicts + required-fixes list).
- `/home/runner/work/_temp/openhands/28412780609-1/summary.md` — this summary (the workflow
  reads from `OPENHANDS_SUMMARY_PATH`).

No source, no plan, no branch, no `deno.lock`, no `packages/`/`plugins/` mutations.

## Validation

Cross-referenced every plan claim against the live branch tree:

| Plan claim                                                                                  | File:line grounded                                                                                                             |
| ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Sagas KV store hardwired `Deno.Kv` / `Deno.openKv` / fluent atomic                          | `plugins/sagas/src/runtime/saga-store-backend.ts:15-18,28-30`; `plugins/sagas/src/runtime/kv-saga-store.ts`                    |
| Triggers KV store hardwired `Deno.Kv`                                                       | `plugins/triggers/src/runtime/kv-trigger-runtime-stores.ts:1-50` (openKv + fluent `.atomic().check(...).set().commit()`)        |
| Workers `KvWorkerIdempotencyStore` already on `@netscript/kv` (reference)                  | `plugins/workers/src/runtime/worker/worker-idempotency-store.ts:1-17,75-87` (atomic types + structural port)                    |
| `@netscript/kv` exposes `KvStore` + atomic types + list-prefix                              | `packages/kv` + `runKvStoreContract` test exercises set/get/list/delete; `AtomicCheck/AtomicMutation/AtomicResult` exported     |
| `-core → @netscript/*` deps create no cycle (no `-core` reverse import)                     | `@netscript/{kv,cron,watchers}` import `grep -r plugin-.*-core` clean                                                          |
| **D2 pre-flight grep claim (scaffold emitter, e2e, docs fences)**                           | **FALSE for `docs/site/capabilities/durable-sagas.md:331`** — fenced `resolveSagaStoreBackend` import from connector subpath   |
| S-c `KvTriggerEventStore` collision                                                         | Existing `class KvTriggerEventStore` lives at `packages/plugin-triggers-core/src/testing/kv-trigger-event-store.ts:5-28`        |
| Scope discipline (#181 deferred routes excluded)                                             | plan.md L19; no net-new triggers feature-backing routes folded in                                                                |
| Guiding principle (no `minimize -core deps` ghost)                                          | plan.md + research.md + debt entry all consistently retired D1 framing; doctrine-correct framing retained                       |

## Plan-Gate boxes (`.llm/harness/gates/plan-gate.md`)

| Box                                   | Result |
| ------------------------------------- | ------ |
| Research present and current          | PASS   |
| Decisions locked                      | PASS   |
| Open-decision sweep                   | FAIL — see Decision 1 (D2 doc-fence) + Decision 2 (S-c name collision) below |
| Commit slices (< 30, gate + files)    | PASS   |
| Risk register                         | FAIL — plan has no `## Risks` block |
| Gate set selected                     | PASS   |
| Deferred scope explicit               | PASS   |
| jsr-audit surface scan (pkg/plugin)   | PASS   |

Two of nine `FAIL_PLAN` per `verdict-definitions.md`'s two-or-more-fails rule.

## Decision verdicts

- **D-KV** (migrate sagas+triggers KV stores onto `@netscript/kv`, mirror workers pattern, engine at composition root) — **PASS**. `KvStore.list({prefix})` + atomic types cover the optimistic-concurrency contract; `MemoryKvAdapter.atomic()` implements versionstamp CAS; engine-agnostic parity test path is feasible.
- **D2** (zero-compat, no shim) — **FAIL**. Empirically-false pre-flight: `docs/site/capabilities/durable-sagas.md:331` is a rendered `{{ comp.tabbedCode }}` fence importing `resolveSagaStoreBackend` from `@netscript/plugin-sagas/runtime`.
- **D3** (relocate `saga-store-backend.ts` env-resolver into `-core/src/stores/`) — **PASS**.
- **D4** (connector composition root imports from `-core` directly; drop connector `./runtime` re-export) — **PASS** as placement; FAIL as surface-brokenness is recorded under D2.

## Slice verdicts

- **S-b** sagas — **CONDITIONAL** (fix D2 doc-fence as a S-b sub-step)
- **S-c** triggers — **CONDITIONAL** (deconflict `KvTriggerEventStore` with `packages/plugin-triggers-core/src/testing/kv-trigger-event-store.ts`)
- **S-d** workers — **PASS** (relocation only, no engine migration; no first-party subpath consumer)

## Required fixes before re-evaluation

1. **D2 doc-fence fix** — add an explicit S-b sub-step that rewires the `durable-sagas.md:331` `resolveSagaStoreBackend` import to `@netscript/plugin-sagas-core/stores`; paste the raw pre-flight grep output into `research.md` to make the claim auditable. **Keep D2 zero-compat** (no shim).
2. **S-c `KvTriggerEventStore` deconflict** — add an explicit S-c sub-step that deletes / renames / merges the existing `packages/plugin-triggers-core/src/testing/kv-trigger-event-store.ts` fixture so the package doesn't ship two classes with the same name and divergent engine contracts.
3. **Risk Register** — add a `## Risks` block to `plan.md` covering: D2 surface-break risk; name-collision risk; `arch:check` denominator gap (current task enumerates `auth-*` + `plugins/auth` only — must extend for the relocated `-core` packages); `deno.lock` churn observation discipline.
4. **`arch:check` denominator** — pick one of: extend `deno.json` `arch:check` `--root` list to include the three relocated `-core` packages + connector trees, OR invoke the existing `deno task arch:check:repo` in slice gates.

After (1)–(4) land as **plan edits only** (no source, no lock), the next PLAN-EVAL cycle flips to `PASS`.

## Responses to review comments or issue comments

None — read-only evaluator role. PR #172 has 0 review comments and 0 issue comments relevant
to the #172b/c/d slice at evaluation time (this evaluator surfaced a pre-existing rendered
capability-page fence, which is addressed as a plan-level fix rather than a review-thread
reply).

## Remaining risks

- Plan acknowledges the slice ordering; acceptable.
- If D2 fence fix is approved as the chosen mitigation, IMPL-EVAL must verify the `MemoryKvAdapter`
  versionstamp parity test path before merging S-b (the gate `deno test --unstable-kv` is named
  in the plan but its specific cases are not enumerated in plan.md).
- `arch:check` task-def gap must close (Required fix #4) or layering regressions on sagas/triggers/workers will go unflagged.
- The existing `--allow-slow-types` for `plugin-triggers-core` is preserved; net-new slow types inside that package are explicitly forbidden by the slice gate — IMPL-EVAL must enforce.

---

_This summary was created by an AI agent (OpenHands) on behalf of the user._
