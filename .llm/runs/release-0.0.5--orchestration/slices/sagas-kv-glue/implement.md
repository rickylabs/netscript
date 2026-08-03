use harness

# Slice W2-F: sagas generated glue registers no KV adapter — #1184 (p1)

You are the implementation supervisor for the PR closing #1184. Read the issue body first — it
was **amended by the owner** and the verification bar is deliberately higher than engine-level
coverage. Context you must internalize: #1064/#1065/#1066 all closed with passing tests and the
saga surface was still broken on a real scaffold. Engine tests never scaffolded a project, never
started an AppHost, never watched a saga run — that gap is what shipped this defect. A slice that
closes #1184 the same way reproduces the same gap.

The defect: `sagas/runtime.ts` is emitted importing only `runSagaRunner`, no KV adapter
registered; the AppHost provisions Redis/Garnet by default; `openSagaRuntimeKv` → `getKv`
auto-detects the cache and throws `KvConnectionError`; the saga background processor dies at
startup while the saga API stays up returning an empty set — invisible from outside.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (plugins/sagas framework surface)
- `.agents/skills/netscript-cli` (scaffold semantics)
- `.agents/skills/aspire` (OTEL evidence: traces/spans/logs)

## Milestone-run evaluator rule (read before planning)

This slice runs inside milestone run `release-0.0.5--orchestration`. Per
`.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator drift ruling D6:
**do not spawn or wait on a local formal PLAN-EVAL** — per-PR evaluation composes the
draft→ready augment review, the OpenHands label surface, and the orchestrator's pre-merge gate.
Mark your PLAN-EVAL gate row "composed per milestone-run.md (orchestrator waiver)". Lock your
plan, record it, and proceed to implementation in the same run.

## The fix

In the **stub, not user-editable output**: `plugins/sagas/src/adapter/resources/glue/
runtime.stub.ts` (glue is regenerated; a hand-added import gets overwritten). Emitted glue
registers the Redis adapter (or otherwise resolves the provider) so a default scaffold starts
cleanly. `CACHE_PROVIDER=denokv` stays working for frontend/SSR projects. RED-first generated-
glue test (fails without the fix, covers the emitted-glue path, not only the engine).

## Verification protocol — owner-set standard (2026-08-03), verbatim bar

This is the closure standard for #1184 **and for all saga work in this milestone**. Every step
produces quoted evidence in your slice worklog and on the PR:

1. **Scaffold a fresh project locally** with the sagas plugin and the **default** cache backend.
   Not a fixture, not a test harness — what a user actually gets.
2. **Start the AppHost and prove the sagas resource genuinely healthy.** `state: Running` +
   `healthStatus: Healthy` with an **empty `healthReports` array means nothing was ever
   checked** — that is not proof. Show populated health reports.
3. **Drive a saga through its full lifecycle end to end**: start, step through, reach a terminal
   state, **and include a compensating path** — `sagaCompensate` is precisely what engine tests
   passed on and reality did not.
4. **Prove it with traces and spans**: `aspire otel traces`, `aspire otel spans`,
   `aspire otel logs` against the resource (see `.agents/skills/aspire`). Spans must show the
   saga steps actually executing, and **correlation must hold across them** — `correlate`
   collapsed every workflow onto one instance in #1066 and engine tests did not catch it.
5. **Show the RED first.** Capture the `KvConnectionError` on the unfixed scaffold, then the
   same scenario passing after the fix. A green run alone does not demonstrate the defect was
   the thing fixed.
6. **Restart the process and confirm saga state is still correct.** Restart durability is part
   of the lifecycle — surviving a restart is the entire reason the durable store exists.
7. **Verify the artefact, never the exit code.** A piped command reports the last stage's
   status; read the actual outputs.

## Gates

- The protocol above (evidence quoted per step).
- Framework-wave law: `deno task quality:gate`, scoped check/lint/fmt wrappers on
  `plugins/sagas` (+ any touched core), no new lint-ignores, no `deno.lock` churn.
- `scaffold.runtime` one-pass at merge-readiness
  (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`) — you hold wave 2's
  expensive-gate slot; serialize (confirm no other scaffold.runtime/AppHost run is live first).

## Anticipated files

`plugins/sagas/src/adapter/resources/glue/runtime.stub.ts`; glue-emission test file(s) under
`plugins/sagas`; possibly the sagas scaffold contribution selecting the adapter by cache backend.
Doctrine: plugin adapter/glue layer; no new public exports expected (if the surface moves, record
in slice `drift.md` + scoped doc-lint/publish dry-run evidence). Adjacent debt (#1093
builder/AST-extractor) — untouched; wire the sagas glue only.

## Published-artifact note (why this is in the canary.2 train)

Your protocol proves the fix on a local scaffold; the **published-package** confirmation happens
at canary point 2 (canary publish + pinned prod E2E against published versions), quoted on the
issue by the orchestrator. `Closes #1184` is allowed once every box is truthfully ticked on the
protocol's local evidence.

## Environmental hazards

One AppHost at a time; stop via verified process-tree death (`aspire stop --all` exits 0 while
trees live); never kill `aspire mcp start`; never kill by pattern; `deno task agentic:leak-check`
before finishing; `--owned-root` for any out-of-worktree scaffold dir. The machine is shared.

## PR contract

Branch `fix/sagas-kv-glue-registration` (worktree provided at dispatch), target `main`. Labels:
`type:fix`, `area:sagas`, `area:kv`, `priority:p1`, exactly one `status:`; milestone `0.0.5`.
Body: `Closes #1184` with the protocol evidence quoted per step. Slice `worklog.md`/`drift.md`
in this dir as you go.
