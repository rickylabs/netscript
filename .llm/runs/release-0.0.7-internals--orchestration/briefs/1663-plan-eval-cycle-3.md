# Brief — #1663 `package-gate-honesty` PLAN-EVAL cycle 3 (third and FINAL, owner-authorized)

You are a **fresh, separate-session formal plan evaluator**. You are not the plan's author and not
the topic supervisor. Read this brief completely before acting.

## Authorization and cycle status

The harness plan gate (`.llm/harness/gates/plan-gate.md:40`) allows two `FAIL_PLAN` cycles, then
escalation to the owner. Both were spent:

| Cycle | Artifact                | Evaluator commit | Evaluator session                      | Verdict     |
| ----- | ----------------------- | ---------------- | -------------------------------------- | ----------- |
| 1     | `plan-eval-cycle-1.md`  | `be2b18728`      | `9078ecb6-e8b3-4d4f-b85c-cb28a1cb34be` | `FAIL_PLAN` |
| 2     | `plan-eval.md`          | `c415daad2`      | `517ac0e7-9951-40ec-ab48-d0175a6d7ebb` | `FAIL_PLAN` |

The **owner has explicitly authorized exactly one third and final PLAN-EVAL**. You are it. There is
no fourth. A third `FAIL_PLAN` does not return the plan to the author — it returns the leaf to the
owner. Do not soften a verdict to avoid that outcome, and do not manufacture a `PASS`; an honest
`FAIL_PLAN` is a correct and expected result of this cycle.

## Target — immutable

| Field                | Value                                                                          |
| -------------------- | ------------------------------------------------------------------------------ |
| Leaf                 | #1663 `package-gate-honesty` (`Closes #1604`, `#1618`, `#1622`)                |
| Worktree             | `/home/codex/repos/netscript-007-package-gate`                                 |
| Branch               | `fix/package-gate-honesty`                                                     |
| **Evaluated head**   | **`194e22a3d0aaefe68922ed7a378aafb651a72dff`**                                 |
| Immutable base       | `05fc3132b6800a85eb6152691a961b658962571b`                                     |
| PR                   | #1663, draft, base `main`, milestone `0.0.7`, `status:plan-eval`               |
| Run dir              | `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/` |

Verify before you evaluate that local `HEAD`, `git ls-remote origin refs/heads/fix/package-gate-honesty`,
and PR `headRefOid` are all `194e22a3d…`. If any differs, stop and report instead of evaluating.

## Route and identity — record before any mutation

Requested route is `formal_plan_evaluation` per `.llm/harness/workflow/lane-policy.md:45`: native
Anthropic **Claude Fable 5, effort medium, `--remote-control`**. Record in your verdict:
session id, `bridgeSessionId` (must be non-empty), `~/.claude/jobs/<short>/state.json` backend and
`respawnFlags`, `providerEnv` (must be `{}` — native, not a gateway), cwd, and CLI version. State
explicitly whether requested route equals observed route.

**Independence:** you must not be, and must share no conversation state with, the Codex author
thread `01a004ec-86a6-7c21-8886-81c09de099f5`, the topic supervisor
`f7691917-0be2-4bcd-8839-43d3fc809c34`, or either prior evaluator session above. Do not resume the
dead registered agent `9078ecb6`.

## What you may and may not do

**May:**

- Read anything; execute reproductions on `git archive HEAD` copies or scratch projects under
  `$CLAUDE_JOB_DIR/tmp`.
- Edit **run artifacts only**, inside
  `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/`.
- **Commit** your verdict and **explicitly push** `fix/package-gate-honesty` (named refspec, not a
  bare `git push`).
- **Rewrite and post truthful PR evidence** on #1663 — update the PR body's Validation/Harness
  sections and post a phase comment per `.agents/skills/netscript-pr`. This is a deliberate
  widening over cycle 2, which was artifact-only. Everything you write there must be something you
  executed or read at `194e22a3d…`.

**Must not:**

- Mutate **any** product or config path. No product mutation exists before a `PASS`, and even on a
  `PASS` implementation is not yours — the author resumes it. The authorized diff of your commit
  versus `194e22a3d` must contain **only** files under this slice's run dir. Verify at exit that
  `git status --short` is empty and that no marker, fixture, `deno.json`, wrapper, or generated
  asset changed.
- Merge, flip draft→ready, relabel status, close or check issues, touch central cluster state under
  `/home/codex/repos/netscript-547-lffix/.llm/runs/release-0.0.7--orchestration/`, or acquire any
  lease.
- Run `scaffold.runtime`, Aspire, Docker, `e2e:cli`, or any runtime smoke. The gate is
  coordinator-waived `n/a` for this surface; requesting the mutex is itself out of scope.
- Delete or rewrite `plan-eval-cycle-1.md`. Preserve the cycle-2 verdict **bit-identical** by
  copying the current `plan-eval.md` to `plan-eval-cycle-2.md` before writing your new canonical
  `plan-eval.md` — the same pattern cycle 2 used for cycle 1.

## What the repaired plan must be judged against

Evaluate `plan.md` at `194e22a3d` against every box in `.llm/harness/gates/plan-gate.md`. The plan
now binds **thirteen** exact product/config paths. Two additions came from coordinator grants
recorded in `drift.md`: the formatting-only twelfth path
(`packages/mcp/tests/fixtures/doctor/healthy/netscript.config.ts`) and the thirteenth
(`packages/cli/src/kernel/assets/agent-tools.generated.ts`, canonical regeneration only) that
answers cycle-2 F1. Judge whether those grants are correctly and completely absorbed, and whether a
fourteenth path is now forced by anything the plan asserts.

Cycle 2's advisories are claimed absorbed as follows; verify each independently rather than
accepting the claim:

| Advisory | Plan's claimed absorption                                                                 |
| -------- | ----------------------------------------------------------------------------------------- |
| A1       | `deno.json` row + open-decision sweep: remove the `fmt:check` task's doctor-family `--exclude` |
| A2       | L10 / R14 reworded to root-style-valid vs fixture-local-default-style-invalid              |
| A3       | PR status label — **discharged by the topic supervisor**, now `status:plan-eval`           |
| A4       | New L11: memoize `nearestConfig` per directory in both wrappers                            |

## Tier-A findings handed to you (verify; do not adopt as conclusions)

These are the topic supervisor's, produced at `194e22a3d` on Deno 2.9.5 in scratch projects under
the supervisor's job tmp. The checkout was never touched.

- **T-1 (verified fact, load-bearing, unstated in the plan).** Deno config `exclude` applies even to
  **explicitly passed file argv**: in a project whose root config excludes `sub/`, both
  `deno lint sub/bad.ts` and `deno fmt --check sub/bad.ts` return `error: No target files found`,
  exit 1. **But** when `sub/` carries its own `deno.json`, that nested config becomes effective and
  the root config's excludes do not apply — lint then reported the real `no-explicit-any` and fmt
  the real diff, both exit 1 on genuine findings. Because
  `packages/mcp/tests/fixtures/doctor/healthy/deno.json` exists, the four healthy TS files escape
  root-level exclusion under explicit argv. This nearest-config precedence is exactly what lets the
  plan simultaneously claim (a) a new top-level root `exclude` entry for the doctor family and
  (b) a green 114-file, two-batch, `failedBatches: 0` wrapper acceptance. The plan states both
  conclusions but never states the precedence rule they depend on. Decide whether that omission is
  an unchecked "decisions locked" box or acceptable at plan altitude.
- **T-2 (asymmetry the plan does not address).** Root `deno.json` `lint.exclude` (lines 182-187)
  contains `packages/mcp/tests/fixtures/doctor/` alongside `.llm/` and `packages/cli/`. The plan
  states the fate of the **fmt** task-level doctor exclusion (A1) but is silent on the symmetric
  **lint** config-level one, while L3 asserts "lint becomes green". T-1 suggests the healthy files
  escape it via nearest-config precedence, so this is likely not rework-forcing — confirm or refute
  by execution, and judge whether the plan owes an explicit statement. The `.llm/` entry in that
  same list is the separately-tracked L-2 item, deliberately deferred until this leaf is terminal;
  it is **not** yours to fold in.

## Supervisor's independent verification at this head (context, not evidence you may reuse)

Reproduce anything you intend to rely on. For orientation only: 12 of the 13 paths exist and the
marker is correctly the sole new file; `run-deno-lint` text is embedded in
`agent-tools.generated.ts` and `check:assets-barrel` (`deno.json:115`) diffs that exact file, so
cycle-2 F1's basis is real; `fmt:check` (`deno.json:139`) does carry the doctor-family `--exclude`;
`broken/deno.json` is `{ "workspace": "packages/*" }` with SHA-256
`6815999dbd68bd1ab5bb137b59808cb1f1a38fb3393c9133721f439c0ad37361`; `healthy/deno.json` is
`{ "workspace": ["packages/*", "plugins/*"] }` with no `fmt` options, so Deno defaults govern it;
`healthy/` holds exactly four TS files, none matching the `.generated/` exclusions;
`closeScoreGap: 0.5` at `guidance-index.ts:42`; and the diff `05fc3132b..194e22a3d` is nine files,
all run artifacts, zero product mutation.

## Output

Write `plan-eval.md` in the slice run dir with: identity/route/independence table, target
verification table, per-checklist-item results with executed evidence, findings with file:line and
reproduction, the T-1/T-2 dispositions, an evaluator-run open-decision sweep, and **one verdict
line** — `PASS` or `FAIL_PLAN`. On `FAIL_PLAN`, list the specific required fixes. State the cycle
count and that no cycle 4 exists.

Commit as `docs(harness): PLAN-EVAL cycle 3 <verdict> for package-gate-honesty`, push the branch by
explicit refspec, then update the PR body and post the phase comment. Report your session id, the
verdict, and your commit SHA back to the topic supervisor.
