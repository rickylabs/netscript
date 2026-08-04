# Drift — W5-V3 plugin remove

## D1 — formal evaluator composition

- **Severity:** procedural / authorized.
- **Source:** owner brief; `.llm/harness/workflow/milestone-run.md`; orchestrator ruling D6.
- **Decision:** no duplicate local formal PLAN-EVAL. `plan-eval.md` marks every row COMPOSED and
  implementation proceeds in the same locked run. Independent evaluation composes at
  draft→ready and the milestone pre-merge gate.

## D2 — pre-existing lock modification

- **Severity:** worktree hygiene.
- **Observed:** `deno.lock` was modified before run bootstrap.
- **Decision:** treat as user-owned, exclude from commits, and do not restore or rewrite it.

## D3 — full-suite lease contention

- **Severity:** infrastructure / transient.
- **Observed:** the first `scaffold.runtime` invocation refused to start because PID 154300 in
  `/home/codex/repos/ns-1158` owned the global suite lease.
- **Decision:** preserve the foreign run and retry the same one-pass command after its lease clears;
  do not substitute narrower gates for the required merge-readiness verdict.

## D4 — runtime readiness retry

- **Severity:** gate / transient under investigation.
- **Observed:** the first real full-suite run passed 33 gates, including install, registry generation,
  and generated workspace type-checking, then timed out waiting for `workers-api` health. Aspire
  startup and cleanup passed; leak-check found no run-owned survivor.
- **Decision:** take one identical full-suite retry. The first retry invocation did not start because
  `/home/codex/repos/ns005-genjobs` acquired the global lease, so it is not a product retry verdict.
- **Resolution:** after that lease cleared, the identical clean retry passed all 71 gates, including
  `runtime.wait.workers-api` in 10 seconds and run-owned cleanup. The first timeout is recorded as
  transient infrastructure behavior, not waived product evidence.
