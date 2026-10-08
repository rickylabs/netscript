# Delta Evaluation: package-gate-honesty (#1663) — S5 IMPL-EVAL

Narrow separate-session evaluation of the delta `cf31de902..cfa055bb8` only. The full IMPL-EVAL
`PASS` at `cf31de902` (`evaluate.md`) stands and is not re-litigated here. Everything below was
re-derived on a `git archive cfa055bb8` copy under `/home/codex/.claude/jobs/117c4b77/tmp/head`.

## Identity, independence, route (recorded before any mutation)

| Field                 | Observed                                                                                                                                |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| sessionId             | `117c4b77-6f60-46db-bc60-753f376347b6`                                                                                                  |
| bridgeSessionId       | `cse_019zkLsR33E3btXxgePrSxQH` (non-empty)                                                                                              |
| backend               | `daemon`                                                                                                                                |
| respawnFlags          | `--effort medium --remote-control --permission-mode bypassPermissions --name "NetScript 0.0.7 #1663 DELTA-EVAL" --model claude-fable-5` |
| providerEnv           | `{}`                                                                                                                                    |
| cwd                   | `/home/codex/repos/netscript-007-package-gate`                                                                                          |
| CLI version           | `2.1.241 (Claude Code)`                                                                                                                 |
| Requested route       | native Anthropic Fable 5 / medium / remote-control                                                                                      |
| Observed route        | native Anthropic (`providerEnv {}`), `claude-fable-5`, `medium`, `--remote-control`                                                     |
| Requested == observed | **yes**                                                                                                                                 |

Independent of Codex author `01a004ec-…`, topic supervisor `f7691917-…`, plan evaluators
`9078ecb6-…`/`517ac0e7-…`/`0f7c4fdf-…`, and prior IMPL-EVAL `99fea668-…`.

## Target verification

Local HEAD, `git ls-remote origin refs/heads/fix/package-gate-honesty`, and PR #1663 `headRefOid`
all equal `cfa055bb8285406e92bd7b9a8f1e12637149d67e` (PR open, draft). `git status --short` empty.

## Delta confirmed

`git diff cf31de902 cfa055bb8` = `evaluate.md` (the prior verdict, `e52c2f0e6`) plus exactly one
product line in `packages/mcp/tests/guidance-retrieval_test.ts`:
`rankedSection('pages/00-outside', 'just-outside', 9.75)` → `9.9375`. Commit `cfa055bb8` touches
that single file. Nothing else.

## 1. Is F1 closed? — yes

`closeScoreGap` mutated at `guidance-index.ts:44` on the archive copy; each mutation verified by
grep, then the file restored from `git show cfa055bb8:…` and hashed
(`16449b0f613eb62a…`, equal to the worktree file) after every run.

| `closeScoreGap` | `guidance-retrieval_test.ts` |
| --------------- | ---------------------------- |
| 0.4             | FAILED 6/1 (narrowing)       |
| 0.49            | FAILED 6/1 (narrowing)       |
| **0.5**         | ok 7/0 (unmutated)           |
| 0.51            | ok 7/0 — residual band       |
| 0.55            | ok 7/0 — residual band       |
| **0.5625**      | FAILED 6/1 (widening)        |
| 0.6             | FAILED 6/1 — was green pre-S5 |
| 0.75            | FAILED 6/1                   |
| 5               | FAILED 6/1                   |

Widening is detected from `0.5625` upward, including `0.6`; narrowing still fails; the real value
is green. F1 as stated is closed.

## 2. Is the residual band honestly stated? — yes, and it is a sound stop

The open band is `(0.5, 0.5625)`, width `0.0625`, confirmed by `0.51`/`0.55` passing. The supervisor
disclosed exactly that on the PR (S5 `[PHASE: IMPL]` comment), with the `< ~0.0749` comparison.

Judgement on the threat #1622 names ("widening it to absorb a new flip"): a regeneration moves
scores by ≈0.0749, so absorbing even one regeneration's movement needs a widening of at least
≈0.075, which lands at or above `0.5625` — inside the detected region (a flip pushed by a
regeneration needs a gap ≥ 0.5 + 0.0749 ≈ 0.575 > 0.5625). A widening confined to the blind band
cannot absorb one regeneration step. Shrinking further is possible (e.g. `0.5 + 1/32` → score
`9.96875`) but chases a band that already has no attacking use; stopping here is sound. The
guard cannot be perfectly tight on the widening side without asserting the exact constant, which
would be a tautology rather than a control.

## 3. Did S5 break anything the prior PASS established? — no

| Check                                             | Evidence                                                                                         | Result |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| MCP package tests                                 | `deno test --allow-all packages/mcp/tests/` on archive → `ok \| 136 passed \| 0 failed`          | PASS   |
| `quality:scan`                                    | `ok:true`, `findings:[]`, `allowCount:7`                                                         | PASS   |
| Deleted assertion / new ignore / `any` / casts    | the only `+/-` product lines are the two `rankedSection` lines; grep for those patterns → 0 hits | PASS   |
| `9.9375` exactly representable (L5 float safety)  | `deno eval`: `9.9375 === 9 + 15/16` true; `10.5 - 9.9375 === 0.5625` true; `0.5625 <= 0.5` false | PASS   |
| Run-dir diff in this session                      | only this file                                                                                   | PASS   |

Not re-run, by brief and by delta scope: #1604 CLI cwd tests, #1618 fmt wrapper, the CLI barrel,
publish dry-runs, JSR surface, `arch:check`, `gates:test`. All were evaluated at `cf31de902` and
the delta touches none of their inputs. The `deno doc --lint` red on `packages/mcp` `./cli.ts` /
`./mod.ts` is the pre-existing baseline recorded in `evaluate.md`; the delta cannot change it and
it is not scored.

## Deviation: S5 commit without `worklog.md`/`context-pack.md`

`cfa055bb8` carries no run-artifact update; the sweep table and the residual-band disclosure live
only in the PR comment. Under the harness contract the draft-PR commit list plus per-slice PR
comments *are* the commit trail, and the PR comment is complete (sweep, hash restoration, gates,
band width). The omission therefore does not materially weaken the evidence trail for this leaf —
but `context-pack.md` now says the last slice is S4, which will mislead a resumer. Advisory:
the supervisor should append an S5 row to `worklog.md` and bump `context-pack.md` in the
sign-off/close commit rather than leave the run dir one slice behind the branch.

## Findings

- None blocking.
- **A1 (advisory)** — backfill `worklog.md`/`context-pack.md` with S5 (one row each) before close.

## Verdict

`PASS`
