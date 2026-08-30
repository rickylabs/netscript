Supervisor steering (same thread, S10 #1722) — IMPL-EVAL cycle 1 = FAIL_FIX at 14daa764 (independent
Fable 5 session; full report:
/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s10/evaluate.md
and the [PHASE: IMPL-EVAL] comment on PR #1760). Apply the required fixes as ONE narrow slice on
your branch (static; no runtime; no rebase/history rewrite; stay inside packages/cli/e2e +
catalog.ts):

- F-1 (high): `evaluatePostStopProbe` must classify ownership by PATH CONTAINMENT under the
  generated projectRoot (S7's `pathContained` rule — see
  origin/fix/aspire-13-5-s7-teardown-leak-check:.llm/tools/agentic/teardown/ownership.ts:70-132),
  not by equality with dirname(appHost): real generated projects bind-mount
  `<projectRoot>/.data/<resource>` (D-42 evidence). Also consider `ASPIRE_DCP_APPHOST_PATH` env and
  `--apphost` argv evidence as S7 does. Fix the fixture so `src=<projectRoot>/.data/postgres` is
  OWNED and a container under another root is FOREIGN; the "zero owned survivors" assertion must
  fail on a leaked owned container. Correct the PR body / README claims accordingly.
- F-2 (high): `runtime.resource-command` must be able to pass in Phase B: grant
  `--allow-env=ASPIRE_CLI_START_TIMEOUT` to the gate command — preferably by routing it through a
  `cli-e2e-aspire-resource-command` catalog entry like the other three; wrap the post-command phase
  so a `failed` receipt is ALWAYS written (never silently absent); add a command-shape test
  asserting the env grant.
- F-3 (medium): add the two contracted fixture tests: malformed NDJSON line ("line N is not JSON")
  and pending-state non-convergence ("did not converge: postgres=Starting").
- F-4 (medium): restore the convergence bar: when `healthReports` is non-empty, require every report
  `Healthy` (or `healthStatus`/`Healthy` if the 13.5 stream carries it) so "Running but Unhealthy"
  fails as `aspire wait --status healthy` did; test it.
- F-7 (low): remove dead `wait-for-workers-runtime.ts`.
- F-5/F-6/F-8 (notes, no code unless trivial): document in README/your run dir that the single 300 s
  budget bounds the whole convergence (mssql tier: `ASPIRE_CLI_START_TIMEOUT=600` in the Phase-B
  brief), that the live probe leaves `processes: []` (process rules fixture-only; Phase-B item), and
  that `doctorFinding` is deliberately fail-closed on unknown statuses. Then scoped gates
  (check/lint/fmt on changed files, packages/cli/e2e/tests, quality:scan, arch:check, assets-barrel,
  publish-assets, emitted-samples, aspire-host-ports), keep aspire ps [] and docker ps -a empty,
  commit as 'fix(e2e): prove cleanup ownership by containment and make resource-command runnable',
  push with the explicit refspec, post '## [PHASE: IMPL] S10 IMPL-EVAL fix cycle 1' on PR #1760 with
  a finding→change table, update your run dir, and end with DONE or BLOCKED: <reason>.
