# PLAN-EVAL — quality-scan-allowance-rail (formal cycle 2)

This is the canonical formal Plan-Gate verdict for this leaf. The historical OpenRouter run is
preserved verbatim as `plan-eval-cycle-1-advisory.md` and is advisory only; it is not a formal
verdict and did not authorize implementation.

## Evaluator identity and route

| Field           | Value                                                           |
| --------------- | --------------------------------------------------------------- |
| Session ID      | `b6c48f02-cb56-4dae-abfd-e46bdec05bd5`                          |
| Bridge ID       | `cse_01Et9Y4vPf8i9ZMTwiqykvXr`                                  |
| Daemon short    | `b6c48f02`                                                      |
| PID             | `2467808`                                                       |
| cwd             | `/home/codex/repos/netscript-007-quality-rail`                  |
| Requested route | native Claude Opus 5 · effort `medium` · Remote Control enabled |
| Observed route  | `--model claude-opus-5 --effort medium --remote-control`        |
| Route evidence  | `~/.claude/jobs/b6c48f02/state.json` → `respawnFlags`           |
| CLI version     | `2.1.233`                                                       |

Requested and observed routes match. No substitute model was used; Fable 5 was not invoked.

## Evaluated subject (independently re-resolved)

| Fact                           | Value                                        | Method                                 |
| ------------------------------ | -------------------------------------------- | -------------------------------------- |
| Immutable base / `origin/main` | `01e0960494c95ce56eb35892c211a095eb13e6ed`   | `git ls-remote origin refs/heads/main` |
| Remote branch head             | `09dfb092dccf7f843b9270295047d674a8187362`   | `git ls-remote origin refs/heads/...`  |
| Local worktree head            | `09dfb092dccf7f843b9270295047d674a8187362`   | `git rev-parse HEAD`                   |
| Worktree cleanliness           | clean before evaluator edits                 | `git status --porcelain`               |
| PR #1653 head                  | `09dfb092dccf7f843b9270295047d674a8187362`   | `gh pr view 1653 --json headRefOid`    |
| PR #1653 state                 | OPEN, draft, base `main`, `status:plan-eval` | `gh pr view 1653`                      |

All four resolutions agree. The repaired head `09dfb092d` was evaluated, not the advisory head
`c573beda9`. No mismatch; no refusal condition triggered.

Generator route recorded in `supervisor.md`: Codex GPT-5.6 Sol · high. This evaluator is native
Claude Opus 5 — opposite family, separate session, no implementation performed.

CI checks on #1653 report `SKIPPED` because `.github/workflows/ci.yml` and
`.github/workflows/code-quality.yml` guard their jobs on `github.event.pull_request.draft == false`.
That is neither green nor red and was not used as evidence. Structured receipts under this run
directory were used instead.

## Plan-Gate checklist (independently judged)

| Plan-Gate item                          | Result | Independent evidence                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS   | `research.md` re-baselines at `01e09604`, names the prior-landed #1549 behaviours, records the `deno doc --json` 567-warning experiment that disqualifies it as a pass/fail oracle, and cites the central coordinator artifacts. `receipts/baseline/{quality-scan,quality-scan-repo}.json` carry `actualGitHead` = `01e09604`, `exitCode` 0, `allowCount: 7`. |
| Decisions locked                        | PASS   | `plan.md` §"Locked design" pins the source-native export graph (explicitly not a `deno doc` oracle), the allowance record grammar, the injected fail-closed `AllowanceIssueResolver`, both budgets at 7, preservation of #1549, and unchanged CLI/Fresh topology with the workers cast held as registered debt.                                               |
| Open-decision sweep                     | PASS   | Cycle-1's three must-resolve items are discharged in fact, not by assertion — see §"Cycle-1 blocker discharge" below. `plan.md` §"Open-decision sweep" states no design or authority decision remains open, and the only listed hold (the pre-reset PLAN-EVAL launch bar) is satisfied by this cycle.                                                         |
| Commit slices (< 30, gate + files each) | PASS   | 4 ordered slices; each names its proof-gate set and its exact files. Registration (slice 1) precedes public-`any` enforcement (slice 2), which is the ordering that keeps the rail from going day-one red.                                                                                                                                                    |
| Risk register                           | PASS   | `drift.md` D-1 … D-5 with evidence/disposition/state, plus the append-only coordinator disposition D-6 … D-9. One residual risk is not registered — recorded as R-1 below for IMPL-EVAL, non-blocking.                                                                                                                                                        |
| Gate set selected                       | PASS   | Every gate in the binding contract's `provingGates` (`check`, `test`, `publish-dry-run`, `quality-job`, `arch-check`, `fresh-browser`, `docs-source-format`, `docs-accuracy`) appears in `plan.md` §"Gate map", plus scanner, allowance-budget, generated-asset freshness, full-export `doc:lint`, and git/lock truth.                                        |
| Deferred scope explicit                 | PASS   | §"Safe deferrals" names the #1276 T3 cast removal, the 20 Workers repairs owned by #1655, #1278 Inventory B, #1276 T1–T2/T4–T5, #1245, #1249, #1379, #1380, and the bounded public-reachability scope with fail-closed unresolvable edges.                                                                                                                    |
| jsr-audit surface scan                  | PASS   | §"JSR audit plan" is per-member: CLI 3 export targets green, Workers 13 export targets at an exact-20 `private-type-ref` no-increase baseline with an explicit prohibition on claiming green, Fresh/docs only if the final diff touches them, and a no-publish / no-cache-reload / no-lock-churn rule. `jsrAudit.applicable` is `true` in the contract.       |

## Cycle-1 blocker discharge (verified against live state)

Each was checked against live GitHub and the central contract, not against the plan's own claims.

**D-1 / D-2 — durable allowance ownership and the measured population.** Discharged.

- I re-measured the population myself at this head: `allowCount: 7`, `findings: 0`, `ok: true` —
  `packages/cli/src/public/public-api.ts` ×5 (135, 136, 158, 275, 276),
  `packages/cli/src/public/features/root/public-command-dependencies.ts:363`, and
  `plugins/workers/streams/producer.ts:52`. These are exactly the seven sites tabulated in the live
  #1545 body. The three extra raw `quality-allow:` matches in
  `packages/sdk/tests/type-fixtures/*_type.ts` are outside `isScannable` and correctly uncounted.
- #1276 is `OPEN` with milestone `Backlog / Triage`; its body carries "**T3 — the 7 ratified
  `quality:scan` allowances**", so the durable owner exists, is open, is milestoned, and names this
  exact population.
- Live #1545 is reconciled: it states the re-measured **7**, asks for `--max-allow` **7** on both
  tasks, and explicitly instructs "Do not use this closing registration issue as the durable issue
  id in source; use #1276." The day-one-closed-owner failure mode that produced the cycle-1 blocker
  therefore cannot occur when the PR carries `Closes #1545`.

**D-3 — contract surface for RED-first proof and shipped assets.** Discharged.

- Central `leaf-contracts.json` (`quality-scan-allowance-rail.fileSurfaces`) now contains all four
  contested surfaces: `.llm/tools/quality/scan-code-quality_test.ts`,
  `.llm/tools/consumer-tools.json`, `packages/cli/src/kernel/assets/agent-tools.generated.ts`, and
  `.llm/harness/debt/arch-debt.md`.
- I checked the containment direction that actually matters: **every** file the plan names across
  slices 1–3 is inside `fileSurfaces`. No silent widening. The plan is in fact narrower than the
  contract — it declines `packages/fresh/src` and general `docs/site/**` edits absent a RED-first
  regression, which is the correct posture.
- RED-first is real rather than aspirational: `.llm/tools/quality/scan-code-quality_test.ts` and
  `check-allowance-budget-diff_test.ts` already exist and are green at base (19/19 passing in
  `receipts/baseline/quality-tests.json`), so the new RED cases land in an established suite.

**D-4 — Workers JSR baseline.** Discharged.

- #1655 is `OPEN`, milestone `0.0.8`, titled "chore(workers): eliminate 20 private-type-ref
  diagnostics from the published export surface" — the owner, the count, and the target release all
  match the plan's claim.
- The plan records only a strict no-increase `DEBT_ACCEPTED` entry bound to #1655, requires proof of
  exactly 20 `private-type-ref` diagnostics with no new diagnostic class across all 13 export
  targets, and states twice that this leaf must not report Workers full-export lint as green and
  must not absorb the repair. That is an honest gate map, not a green claim.

**Budget honesty.** `deno.json:50-51` currently wires `--max-allow 7` for `quality:scan` and
`--max-allow 8` for `quality:scan:repo`. The plan converges both to the measured 7 — a strict
decrease, never an increase — and retains the existing allowance-budget diff checker as the
same-change numeric guard.

**Generated-asset freshness.** The plan regenerates only through the checked-in `gen:assets-barrel`
task and requires a clean second generation. The checked-in `check:assets-barrel` task already diffs
`packages/cli/src/kernel/assets/agent-tools.generated.ts`, so the freshness claim is provable by an
existing gate rather than by inspection.

## Residual observations for IMPL-EVAL (non-blocking)

These do not leave a Plan-Gate box unchecked and do not affect this verdict. They are the places
where an honest plan can still produce a dishonest implementation, and IMPL-EVAL should demand
evidence for both.

- **R-1 — resolver runtime permissions and offline/rate-limit behaviour are unstated.**
  `quality:scan` runs today as `deno run --allow-read`. A live `api.github.com` lookup needs
  `--allow-net` (and `--allow-env` for a token). This is _inside_ the authorized surface — CI
  reaches the scanner via `run-gate.ts --gate quality-scan`, which `.llm/tools/gates/catalog.ts:36`
  resolves to `deno task quality:scan`, so `deno.json` alone governs the permission set and no
  workflow edit is required. But the plan never states the permission change, nor what a fail-closed
  resolver does for an offline developer, an unauthenticated 60-req/hr rate limit, or a fork PR
  without a token. Fail-closed is a locked decision and #1378 itself ratifies the
  open-and-milestoned rule, so this is not an open decision — it is an implementation consequence
  that must be proven, including for the consumer copy shipped in `agent-tools.generated.ts`, which
  would resolve `rickylabs/netscript` issues on a consumer's machine.
- **R-2 — the durable owner's milestone is `Backlog / Triage`, not a numbered release.** That
  satisfies "milestoned" under the repo's own taxonomy and is deliberately durable. But if the
  implementation's milestone check requires a numbered release milestone, all seven records fail on
  day one — precisely the failure this leaf exists to prevent. IMPL-EVAL should require a test that
  pins a `Backlog / Triage`-milestoned owner as passing.

## Verdict

`PASS`

Every Plan-Gate box is checked. The four cycle-1 findings were verified as discharged in live state
rather than accepted on assertion: the seven-record ownership decision binds to open, milestoned
#1276 T3 with #1545 explicitly disclaimed as a source owner; the four contested surfaces are
authorized in the central contract and the plan stays inside them; #1655 owns the Workers
20-diagnostic repair in 0.0.8 under a strict no-increase baseline this leaf may not claim green; and
the budget converges downward to the population I independently measured at 7. Research is
re-baselined with receipts bound to the immutable base, the slice order puts registration before
enforcement, the gate map covers every contract proving gate and is honest about what a receipt
proves, and the JSR plan is per-export-target.

Implementation may begin. The scheduling hold is satisfied and no further plan repair is required.

## Authority boundaries observed by this evaluator

- No product, package, plugin, generated, workflow, or central-cluster file was edited or staged.
- Only two run-artifact changes were made: the history-preserving rename to
  `plan-eval-cycle-1-advisory.md` and this canonical `plan-eval.md`.
- PR #1653 remains draft at `status:plan-eval`. No merge, publish, relabel, draft flip, or
  implementation was performed.
- IMPL-EVAL must run in a separate opposite-family session after implementation.
