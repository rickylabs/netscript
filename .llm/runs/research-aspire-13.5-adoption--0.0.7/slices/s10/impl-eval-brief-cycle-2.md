use harness

## SKILL

Read `.agents/skills/netscript-harness/SKILL.md`, `.llm/harness/evaluator/protocol.md`, and
`.llm/harness/evaluator/verdict-definitions.md`. You are the **independent IMPL-EVAL evaluator,
cycle 2** (Claude · Fable 5 · medium): a separate session from the generator thread, the supervisor,
and the cycle-1 evaluator; you inherit no verdict.

## Context

- Slice **S10** (#1722, PR #1760 draft, base `feat/aspire-13-5-s8-typed-resource-commands`). Cycle 1
  (`slices/s10/evaluate.md`, head `14daa764`) = `FAIL_FIX`: F-1 post-stop probe ownership by path
  equality (must be containment under projectRoot per S7); F-2 `runtime.resource-command` missing
  `--allow-env=ASPIRE_CLI_START_TIMEOUT` and no receipt on that failure branch; F-3 missing
  malformed-NDJSON / pending-state tests; F-4 convergence bar accepted Running+Unhealthy; F-7 dead
  file; notes F-5/F-6/F-8.
- Evaluate **exactly** head `c61b1626`; scoped range `14daa764..c61b1626` for the fixes, and re-run
  the gate set to confirm nothing regressed. Worktree:
  `/home/agent/projects/netscript/worktrees/007-aspire-s10-eval` (detached at `c61b1626`, read-only
  for product files). Supervisor run dir:
  `/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/`
  (read `slices/s10/evaluate.md`, `slices/s10/review-tier-a.md`,
  `slices/s10/impl-eval-fix-brief.md`, `drift.md` D-42/D-43/D-50/D-51).
- Environment (D-39): Deno 2.9.5; Aspire 13.5.3 / dotnet 10.0.400 / node 24.20.0 via
  `/home/agent/.local/bin/mise exec --`; Docker 28.5.2 on `tcp://netscript-dind:2375`. **Static
  only: no `aspire start`, no containers, no `e2e:cli` runtime**; `aspire ps` `[]` before/after.

## What to verify (execute yourself)

1. F-1 closed: `evaluatePostStopProbe` classifies by containment under projectRoot (+
   `ASPIRE_DCP_APPHOST_PATH` / `--apphost` evidence); fixture `src=<projectRoot>/.data/postgres` →
   OWNED; foreign root → FOREIGN; a leaked owned container makes the zero-survivor assertion FAIL;
   PR/README claims corrected.
2. F-2 closed: the resource-command gate command grants `--allow-env=ASPIRE_CLI_START_TIMEOUT`
   (catalog entry or inline), a `failed` receipt is always written on the post-command branch, and a
   command-shape test asserts the env grant; reproduce your cycle-1 `NotCapable` repro and show it
   no longer applies.
3. F-3 closed: malformed-NDJSON-line and pending-state non-convergence tests exist and pass.
4. F-4 closed: non-empty `healthReports` with any non-`Healthy` report → not converged; test
   present.
5. F-7 closed: dead file removed; F-5/F-6/F-8 documented (README / run dir) as notes.
6. Regression gates at head: scoped `deno check` packages/cli/e2e; raw lint/fmt on changed files;
   `quality:scan`, `arch:check`, `check:assets-barrel`, `check:publish-assets`,
   `check:emitted-samples`, `check:aspire-host-ports`; `packages/cli/e2e/tests` green; no new
   `any`/casts/lint-ignores; scope still `packages/cli/e2e` + README + catalog + run dir.
7. PR hygiene unchanged (draft, base, `Closes #1722`, `Part of #1712`, `Refs #1372`, labels,
   milestone, per-slice comment for the fix commit).

## Output

Write `evaluate-cycle-2.md` (declare the exact head) to
`/home/agent/projects/netscript/worktrees/007-aspire/.llm/runs/research-aspire-13.5-adoption--0.0.7/slices/s10/evaluate-cycle-2.md`
and post the verdict as a PR #1760 comment starting with `**[PHASE: IMPL-EVAL]**` and the head SHA.
Verdict ∈ `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT`; `PASS` = **phase A only**. Do not
commit to the S10 branch, do not mark ready, do not merge, do not relabel, no runtime.
