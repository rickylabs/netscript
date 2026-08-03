use harness

# Slice (p0 queue-jump, canary.2 train): saga publish never delivers — #1190

You are the implementation supervisor for the PR closing #1190 (p0). Read the issue body first.
On 0.0.4, `POST /api/v1/sagas/publish` hangs indefinitely on BOTH KV backends — the control run
pinned Deno KV (file) and publish still never returned (no HTTP status after 15s,
`saga_instances` empty, runner logs only "Process started"). This is outside the Redis path
#1064 fixed. The single-point primitives also do not compose: `startSagas` + `runtime.publish`
throws "SagaEngine must be started"; `createDurableSagaRuntime` throws "schedule cascades
require SagaScheduler". It cost a real run 75 minutes.

## SKILL

- `.agents/skills/netscript-harness`
- `.agents/skills/netscript-pr`
- `.agents/skills/netscript-doctrine` (sagas engine/runtime framework surface)
- `.agents/skills/netscript-cli` (scaffold semantics)
- `.agents/skills/aspire` (OTEL evidence)

## Milestone-run evaluator rule (read before planning)

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: do
not spawn or wait on a local formal PLAN-EVAL — evaluation composes draft→ready augment +
OpenHands + the orchestrator pre-merge gate. Mark your PLAN-EVAL gate row "composed per
milestone-run.md (orchestrator waiver)", lock your plan, and implement in the same run.

## Coordination — read before scoping

**#1184 (generated glue registers no KV adapter) is in flight on branch
`fix/sagas-kv-glue-registration` (PR #1193), same train.** The owner's directive: #1184 and
#1190 land in the same canary train and are verified together end to end — a runner that starts
but never delivers is not a working surface. Your scope is the **engine/runtime delivery path**
(publish → runner → `saga_instances`), not the generated glue (that is #1193's). If #1193's
protocol run has already captured the publish hang, reuse that as RED evidence (check
`.llm/runs/release-0.0.5--orchestration/slices/sagas-kv-glue/` and PR #1193); otherwise capture
your own RED on a fresh scaffold before fixing.

## Deliverable = the five issue boxes, owner verification bar (non-negotiable)

1. Publish returns and the saga registers on **BOTH** backends — Redis/Garnet AND Deno KV —
   proven separately on each (this issue exists because the previous fix covered only one).
2. A published saga reaches the runner, appears in `GET /sagas`, persists to `saga_instances`.
3. The documented single-point entry points compose without undocumented wiring, or are
   removed/marked accordingly — no third state.
4. A hang is impossible to mistake for success: publish fails fast and loudly rather than
   blocking forever.
5. A test that fails without the fix exercises publish **through the HTTP boundary**, not the
   engine in isolation.

Protocol per the owner bar: real local scaffold; E2E through the HTTP boundary; proven with
`aspire otel traces` and `aspire otel spans` (the publish→runner→persist path visible in
spans, correlation held); RED captured first on the unfixed build; artefact verified, never
exit code. Quote evidence per step in your slice worklog and on the PR.

## Anticipated files

Sagas engine/runtime packages (`packages/plugin-sagas-core` / `plugins/sagas` runtime path —
locate the publish pipeline and the runner delivery seam), HTTP-boundary test, composition
fixes or deprecation markers for the single-point entry points. Framework-wave law:
`quality:gate`, scoped wrappers, no new lint-ignores, no `deno.lock` churn. Expensive gates:
serialize AppHost/scaffold runs — #1193's slice may also be running one; check before starting
(one AppHost at a time on this machine).

## Environmental hazards

One AppHost at a time; verified process-tree stop; never kill `aspire mcp start`; never kill by
pattern; `deno task agentic:leak-check` before finishing; `--owned-root` for out-of-worktree
scaffold dirs. Watch for stray `aspire/db-operation/` ephemeral hosts (#1196 class) — report,
do not adopt.

## PR contract

Branch `fix/saga-publish-delivery` (worktree provided), target `main`. Labels: `type:fix`,
`area:sagas`, `priority:p0`, exactly one `status:`; milestone `0.0.5`. Body: `Closes #1190`
only with all five boxes truthfully ticked on protocol evidence; authoritative
`## Definition of Done`; no keyword-adjacent issue references in prose ("hand-closes #N"
parses as a closing keyword). Slice `worklog.md`/`drift.md` in this dir. Push via explicit
refspec only.
