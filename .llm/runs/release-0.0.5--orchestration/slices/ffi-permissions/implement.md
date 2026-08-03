use harness

# Slice W2: generated SQLite/libsql service omits --allow-ffi — #1191 (p1)

You are the implementation supervisor for the PR closing #1191. Read the issue body first —
it carries the observed evidence paths from the wave-0 proof run and five acceptance boxes.

## Milestone-run evaluator rule (read before planning)

Per `.llm/harness/workflow/milestone-run.md` § Evaluator protocol and orchestrator ruling D6: do
not spawn or wait on a local formal PLAN-EVAL — evaluation composes draft→ready augment +
OpenHands + the orchestrator pre-merge gate. Mark your PLAN-EVAL gate row "composed per
milestone-run.md (orchestrator waiver)", lock your plan, and implement in the same run.

## Deliverable = the five issue boxes

1. Generator emits `--allow-ffi` for SQLite/libsql-backed service commands (template/command-
   builder fix — find the emission site in `packages/cli` scaffold output; never a user edit).
2. RED first on a real scaffold (exit-1 unhealthy service, captured), GREEN after (Running +
   Healthy with **populated** healthReports).
3. Generated-output test on the emitted permission set, failing without the fix.
4. Permission audit across the other DB templates (Postgres/MySQL/…) — unaffected-or-fixed,
   audit recorded on the PR.
5. **P2 DB-branch re-measurement**: run
   `.llm/runs/test-openapi-mcp-wave0-proofs--wave0/proofs/experiments/p2-measure-live-spec.ts`
   against a fixed DB scaffold, append `P2-db.json` to that run's evidence dir, and record any
   contract impact for OMB S4/S6 as a comment on epic #1126 (impact assessment, not code
   changes — the orchestrator owns the re-scope decision).

Owner verification standard applies (seven-point protocol where a live claim is made): real
scaffold, genuine health, artefact not exit code.

## Anticipated files

`packages/cli` scaffold service-command emission (+ its template/asset source), generated-output
test, the appended proof evidence. Framework-wave law: `quality:gate`, scoped wrappers, no new
lint-ignores, no `deno.lock` churn. Expensive gate: your scaffold verification uses live
scaffold+AppHost runs — **serialize with #1184's slice** (it holds this wave's
`scaffold.runtime` slot; coordinate by checking for a live AppHost/scaffold run before starting
yours; queue, never overlap).

## Environmental hazards

One AppHost at a time; verified process-tree stop; never kill `aspire mcp start`; never kill by
pattern; `deno task agentic:leak-check` before finishing; `--owned-root` for out-of-worktree
scaffold dirs.

## PR contract

Branch `fix/scaffold-sqlite-allow-ffi` (worktree provided), target `main`. Labels: `type:fix`,
`area:cli`, `area:database`, `priority:p1`, exactly one `status:`; milestone `0.0.5`. Body:
`Closes #1191` only with all five boxes truthfully ticked; authoritative `## Definition of
Done`; no keyword-adjacent issue references in prose. Slice `worklog.md`/`drift.md` in this
dir. Push via explicit refspec only.
