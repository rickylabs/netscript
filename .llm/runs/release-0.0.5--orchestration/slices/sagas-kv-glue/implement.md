use harness

# Slice W2-F: sagas generated glue registers no KV adapter — #1184 (p1)

You are the implementation supervisor for the PR closing #1184. Read the issue body first. A
default scaffold with the sagas plugin crashes its saga background processor at startup:
`sagas/runtime.ts` is emitted importing only `runSagaRunner`, no KV adapter is registered, the
AppHost provisions Redis/Garnet by default, and `openSagaRuntimeKv` → `getKv` auto-detects the
cache and throws `KvConnectionError`. The saga API stays up returning an empty set, so from
outside it reads as "no sagas yet".

## Milestone-run evaluator rule (read before planning)

This slice runs inside milestone run `release-0.0.5--orchestration`. Per
`.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator drift ruling D6:
**do not spawn or wait on a local formal PLAN-EVAL** — per-PR evaluation composes the
draft→ready augment review, the OpenHands label surface, and the orchestrator's pre-merge gate.
Mark your PLAN-EVAL gate row "composed per milestone-run.md (orchestrator waiver)". Lock your
plan, record it, and proceed to implementation in the same run.

## SKILL

`.agents/skills/netscript-harness`, `.agents/skills/netscript-pr`,
`.agents/skills/netscript-doctrine` (this touches `plugins/sagas` — framework surface),
`.agents/skills/netscript-cli` (scaffold output semantics).

## Deliverable = the gates

1. **The fix lives in the stub, not user-editable output**: `plugins/sagas/src/adapter/
   resources/glue/runtime.stub.ts` (glue is regenerated; a hand-added import gets overwritten —
   per the issue). Emitted glue registers the Redis adapter or otherwise resolves the provider
   so a default scaffold starts cleanly against the Aspire cache resource.
2. **RED-first generated-glue test**: a test that fails without the fix and covers the
   generated-glue path, not only the engine.
3. **`CACHE_PROVIDER=denokv` regression**: the denokv path for frontend/SSR projects stays
   working, with test evidence.
4. **Framework-wave law**: `deno task quality:gate`, scoped check/lint/fmt wrappers on
   `plugins/sagas` (and any touched core), no new lint-ignores, no `deno.lock` churn.
5. **`scaffold.runtime` at merge-readiness** — you hold wave 2's expensive-gate slot:
   `deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, one pass, not split into
   individual gates. This proves box 2 (scaffolded project starts its `sagas` resource without
   `KvConnectionError`). Serialize it: check no other scaffold.runtime run is live first.

## Anticipated files

`plugins/sagas/src/adapter/resources/glue/runtime.stub.ts`; the glue-emission test file(s) under
`plugins/sagas`; possibly the sagas scaffold contribution that selects the adapter by cache
backend. Doctrine: plugin archetype — adapter/glue layer; no new public exports expected (if the
export surface moves, record in slice `drift.md` and run scoped doc-lint/publish dry-run
evidence). Known debt: plugin builder/AST-extractor debt (#1093 territory) is adjacent —
**untouched**; do not generalize discovery here, wire the sagas glue only.

## Published-artifact note (why this is in the canary.2 train)

Local gates cannot prove the published-package path. Box-level closure is yours; the
**published-artifact confirmation** happens at canary point 2 (canary publish + pinned prod E2E
against published canary versions), quoted on the issue by the orchestrator. Your PR body may
carry `Closes #1184` once boxes 1–4 are truthfully ticked on local evidence.

## Environmental hazards

Aspire/scaffold runs: one AppHost at a time; verified process-tree stop (exit codes lie); never
kill `aspire mcp start`; `deno task agentic:leak-check` before finishing; `--owned-root` for any
out-of-worktree scaffold dir. The machine is shared.

## PR contract

Branch `fix/sagas-kv-glue-registration` (worktree provided at dispatch), target `main`. Labels:
`type:fix`, `area:sagas`, `area:kv`, `priority:p1`, exactly one `status:`; milestone `0.0.5`.
Body: `Closes #1184` (all boxes local-provable), quoted gate output. Slice `worklog.md`/
`drift.md` in this dir as you go.
