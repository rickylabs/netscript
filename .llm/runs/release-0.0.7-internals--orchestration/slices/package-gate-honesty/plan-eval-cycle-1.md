# PLAN-EVAL — release-0.0.7-internals--orchestration/slices/package-gate-honesty

- Plan evaluator session: Claude Code `9078ecb6-e8b3-4d4f-b85c-cb28a1cb34be` / 2026-08-15
- Run: `release-0.0.7-internals--orchestration/slices/package-gate-honesty`
- Surface / archetype: `packages/cli` E2E harness + `packages/mcp` + root `deno.json` / Archetype 6
  (CLI / Tooling), supporting MCP member A2
- Scope overlays: `docs`
- **Evaluated head:** `72d5aca66e46ca21d3d8becbc3d11a93bb9749ff` (plan head)
- **Immutable base:** `05fc3132b6800a85eb6152691a961b658962571b`

## Identity, independence, route

| Field                           | Value                                                                                                                                  |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Model                           | Anthropic Claude Fable 5 (`claude-fable-5`)                                                                                            |
| Session ID                      | `9078ecb6-e8b3-4d4f-b85c-cb28a1cb34be`                                                                                                 |
| `bridgeSessionId`               | `cse_0176qkbF4eKUt7TxJiEPdTrk` (Remote Control, non-empty)                                                                             |
| Daemon short / job              | `9078ecb6` (`~/.claude/jobs/9078ecb6/state.json`, backend `daemon`)                                                                    |
| PID                             | shell parent `711275` (`claude bg-spare`), evaluator shell `728133`                                                                    |
| cwd                             | `/home/codex/repos/netscript-007-package-gate`                                                                                         |
| Requested route                 | `formal_plan_evaluation`: Anthropic / Fable 5 / medium / `--remote-control`                                                            |
| Observed route (`respawnFlags`) | `--model claude-fable-5 --effort medium --remote-control --permission-mode bypassPermissions --name "NetScript 0.0.7 #1663 PLAN-EVAL"` |
| Route verdict                   | matched (native opposite-family binding in `lane-policy.md:45`)                                                                        |

Independence: this session is a fresh Claude session and is not the Codex GPT-5.6 Sol author thread
`01a004ec-86a6-7c21-8886-81c09de099f5` nor the topic supervisor
`f7691917-0be2-4bcd-8839-43d3fc809c34`. It shares no conversation state with either; it read only
the committed run artifacts, the PR, the issues, and the tree.

## Target verification

| Check                                                      | Observed                                                                                                                                         |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Local `HEAD`                                               | `72d5aca66e46ca21d3d8becbc3d11a93bb9749ff`                                                                                                       |
| `git ls-remote origin refs/heads/fix/package-gate-honesty` | `72d5aca66e46ca21d3d8becbc3d11a93bb9749ff`                                                                                                       |
| PR #1663 `headRefOid`                                      | `72d5aca66e46ca21d3d8becbc3d11a93bb9749ff`                                                                                                       |
| `git diff --stat 05fc3132b HEAD`                           | 7 files, all under `.llm/runs/release-0.0.7-internals--orchestration/slices/package-gate-honesty/` (+579/-0); **no product source changed**      |
| PR state                                                   | draft; base `main`; milestone `0.0.7`; labels `type:fix`, `area:tooling`, `status:research`; body `Closes #1604`, `Closes #1618`, `Closes #1622` |
| Worktree                                                   | clean before and after evaluation (all evaluator experiments ran in `$CLAUDE_JOB_DIR/tmp` copies, never in the checkout)                         |

## Checklist results

| Plan-Gate item                          | Result                     | Evidence / location                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Research present and current            | PASS                       | `research.md` re-baselined against `main` @ `05fc3132b` on 2026-08-15. Spot-checked R3 (`service-env-gates.ts:26-27,44-66`, `_test.ts:31-34,96-102`), R5 (`run-documented-stream-example.ts:1-15`), R10/R11 (`guidance-index.ts:33-44,181-211`; `guidance-retrieval_test.ts:76-95`) — all match the tree. R7's numbers (115 selected / 1 crash; 110 / green with wrapper `--exclude`) reproduced by execution. R8's _conclusion_ is falsified by execution — see finding F1. |
| Decisions locked                        | FAIL                       | L1, L2, L4, L5, L6, L7, L8, L9 are stated with rationale and hold. **L3 (`plan.md:90`) is locked on a mechanism that does not achieve the slice's own passing condition** (F1).                                                                                                                                                                                                                                                                                              |
| Open-decision sweep                     | FAIL                       | The plan's sweep (`plan.md:100-108`) marks "root exclusion versus wrapper change" resolved by L3. Evaluator-run sweep finds it _unresolved_: no in-plan mechanism makes the #1618 acceptance command exit 0 (F1). Deferring it forces S1 rework → automatic unchecked box.                                                                                                                                                                                                   |
| Commit slices (< 30, gate + files each) | PASS (with reconcile note) | Four slices (`plan.md:115-120`), ordered, each names proof, files, gates. Numbering conflicts with the PR body checklist (F2).                                                                                                                                                                                                                                                                                                                                               |
| Risk register                           | PASS                       | `plan.md:160-172`. Row 2 ("`fmt.exclude` may select differently") anticipated the class of F1 but the mitigation ("use the top-level boundary") is the thing that fails.                                                                                                                                                                                                                                                                                                     |
| Gate set selected                       | PASS (with rationale note) | Frozen contract gates all mapped (`plan.md:150-158`); A6/F-* + docs overlay covered. `scaffold.runtime` rationale is overstated (F3, advisory).                                                                                                                                                                                                                                                                                                                              |
| Deferred scope explicit                 | PASS                       | `plan.md:181-189`.                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| jsr-audit surface scan (pkg/plugin)     | PASS                       | `research.md` § jsr-audit surface scan + `plan.md:122-131`; both publishable members scoped correctly (see item 4).                                                                                                                                                                                                                                                                                                                                                          |

## The six specific proofs

### 1. Root `deno.json` exclusion — **FAILS by execution** (F1)

The plan's L3/S1 claim (`plan.md:51,90,117`; `research.md` R8) is that adding the fixture directory
to root `exclude` makes the exact #1618 acceptance command
(`deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root packages/mcp --ext ts,tsx`)
exit 0 with `failedBatches: 0`, without touching the wrapper.

Executed on Deno 2.9.5 against a `git archive HEAD` copy of `deno.json`, `deno.lock`, `packages/`,
`plugins/`, `.llm/tools/run-deno-fmt.ts` in `$CLAUDE_JOB_DIR/tmp/repo-copy`, with
`"exclude": [".llm/tmp/", "packages/mcp/tests/fixtures/doctor/"]` written into the copied root
`deno.json`:

```text
{"command":"deno fmt --check","mode":"check","summary":{"filesSelected":115,"batches":1,"failedBatches":1,"findings":0,"ignoredFindings":0},"findings":[]}
1 deno fmt batch(es) failed without producing formatting findings.
error: Failed to parse "workspace" configuration.
Caused by:
    invalid type: string "packages/*", expected struct WorkspaceConfig
EXIT=1
```

Control in the same copy, wrapper `--exclude '^packages/mcp/tests/fixtures/doctor/'`:
`filesSelected:110, failedBatches:0`, EXIT=0.

Why: `.llm/tools/run-deno-fmt.ts` does its own file selection (`collectRoot`, lines 263-286;
`SKIP_DIRS` + regex filters only — it never reads `deno.json` `exclude`) and passes every selected
file **explicitly** to `deno fmt --check` (`runBatch`, lines 312-331). The 5 fixture `.ts` files
under `packages/mcp/tests/fixtures/doctor/**` are therefore always in argv, and Deno resolves the
nearest config for an explicitly named file regardless of root `exclude`. Minimal-repro matrix
(scratch project, explicit `src/a.ts` + `tests/fixtures/doctor/broken/netscript.config.ts`):

| Config variant                            | Explicit-file `deno fmt --check` | Directory-arg `deno fmt --check packages/mcp`               |
| ----------------------------------------- | -------------------------------- | ----------------------------------------------------------- |
| no exclusion                              | crash                            | ok (fixture `deno.json` treated as a JSON file, not config) |
| root `exclude: [fixture dir]`             | **crash**                        | ok, fixture skipped                                         |
| root `fmt.exclude: [fixture dir]`         | crash                            | —                                                           |
| member `packages/mcp/deno.json` `exclude` | crash                            | —                                                           |
| CLI `--ignore=<fixture dir>`              | crash                            | —                                                           |
| root exclude + `--config deno.json`       | ok (only via wrapper flag)       | —                                                           |

So root `exclude` is a supported, narrowly scoped, non-masking boundary for directory walks (it
provably does not hide `packages/mcp/src/**` — 110 real files still format, and the negative control
via the wrapper path is unaffected), **but it is not the mechanism that satisfies #1618's acceptance
row 1** as written, because the wrapper's explicit-argv invocation bypasses it. The plan's S1
passing condition ("Exact scoped fmt wrapper returns exit 0, `failedBatches: 0`", `plan.md:117`) is
unreachable inside the six-file surface as planned.

### 2. `import.meta`-derived roots (#1604) — PASS by close reading

- `service-env-gates_test.ts:34` already derives `REPO_ROOT` via
  `import.meta.resolve('../../../../../../../../')` — eight segments from
  `packages/cli/e2e/src/application/gates/scaffold/service-env/` land on the repo root (counted).
  Resolving the `.ts` argument against it for `Deno.stat` (`:96-102`) is correct from both cwds; the
  gate command itself keeps the relative `GATE_DIR/...` argument and `commandGate` runs with
  `cwd = context.project.repoRoot` (`gate-factory.ts:53,67`), so production semantics are unchanged
  (L2 verified).
- `quickstart-command-drift_test.ts:5` reads `'docs/site/quickstart.vto'` — module is four segments
  below root; the assertion (`:15`) is untouched.
- `run-documented-stream-example.ts:3,10-14` — `DOC_PATH` and the `.llm/tmp` scratch dir are both
  cwd-relative; the module is seven segments below root. The only production consumer is
  `consume-flow-b-stream.ts:127`, spawned by `otel-gates.ts:53-64` with cwd = repoRoot, where the
  anchored absolute path equals today's cwd-relative resolution. No behaviour shift.
- Risk row "off by one directory" (`plan.md:166`) plus L1 cover the derivation; the plan does not
  state the segment counts — the implementer should assert a known repo file exists at the derived
  root, as the mitigation says.

### 3. `closeScoreGap` observability (#1622) — PASS by close reading

`orderGuidanceSections` (`guidance-index.ts:181-211`) groups leader-relative with
`leader.score - candidate.score <= closeScoreGap` and re-sorts each group by slug. The plan's L5
adds one early-slug candidate exactly at `leader − 0.5` (inside: reorders ahead of the leader on
slug; a narrower gap leaves it behind → fails) and one early-slug candidate at `leader − (0.5+ε)`
(outside: stays behind on score; a wider gap pulls it ahead → fails). Expected orders are literal
slug lists, not derived from the constant, so the assertion is non-tautological in both directions.
Float check: `10.4 - 9.9 === 0.5` and `10.5 - 10.0 === 0.5` in V8; `10.4 - 9.8` is
`0.5999999999999996`, still `> 0.5` — the risk row (`plan.md:169`) correctly tells the implementer
to prefer exactly representable values and a visibly larger outside ε. The existing `pages/gamma`
element (`guidance-retrieval_test.ts:80`) is correctly diagnosed as decorative (R11).

### 4. Two-member JSR/publish evidence — PASS

- `@netscript/cli`: all edits under `e2e/`, which `packages/cli/deno.json:69-72` publish-excludes;
  `isolatedDeclarations: false` (`:50`) and the doc-lint completeness debt are named as **baseline**
  (`research.md` § `@netscript/cli`; `plan.md:126,170`) with "no new diagnostic" as the bar — not
  reported clean.
- `@netscript/mcp`: `src/**` is published, `tests/` excluded (`packages/mcp/deno.json:24-27`); the
  policy comment is publishable, so the full member audit + doc-lint + isolated-declaration +
  dry-run is proportionate; the test is not published. Static `import.meta`/`Deno.read*` scan on the
  changed published file is the right rejection rule.

### 5. `scaffold.runtime` load-bearing? — **not on the merits** (F3, advisory)

The only changed production path is `run-documented-stream-example.ts`, whose full semantic
behaviour (doc read → extract → temp module → import → SSE consume) is executed end-to-end by its
unit test (`run-documented-stream-example_test.ts`) against a local `Deno.serve`. After anchoring,
running that unit test from both cwds proves the change; the `scaffold.runtime` consumer
(`consume-flow-b-stream.ts` from cwd = repoRoot) exercises the identical absolute path. The gate
matrix (`gates/archetype-gate-matrix.md:66-75`) classes `scaffold.runtime` as `n/a` for runs that do
not touch scaffold output / plugin scaffolding / DB wiring / Aspire helper generation / publish
shape — none of which this leaf touches. It is in the plan only because the frozen contract lists
it; the plan's rationale ("required because the changed helper is called by the full scaffold
consumer path", `plan.md:81-82`) overstates its evidentiary value. If the coordinator keeps it, the
plan's execution contract (exact one-pass command, `--cleanup --format pretty`, current head,
mutex-gated, NOT_RUN otherwise, `plan.md:120,158`) is sufficient. Recommendation to the coordinator:
waive it for this leaf and record the waiver, rather than serialize an aspire+docker+postgres run
for a path already proven by a unit test.

### 6. PR checklist vs plan slice order — **do not reconcile** (F2)

| #  | PR #1663 body `## Slices`                        | `plan.md:117-120`                       |
| -- | ------------------------------------------------ | --------------------------------------- |
| S1 | Make the three CLI package tests cwd-independent | `deno.json` fixture exclusion (MCP fmt) |
| S2 | Exclude malformed fixtures from MCP formatting   | The three CLI files                     |
| S3 | Pin `closeScoreGap`                              | same                                    |
| S4 | Gates + `scaffold.runtime`                       | same                                    |

S1/S2 are swapped between the two surfaces; per-slice PR comments and checkbox ticks would drift.

## Open-decision sweep (evaluator-run)

1. **#1618 mechanism** — unresolved (F1). The plan must pick a mechanism that empirically satisfies
   the acceptance command. Options I verified or can bound: (a) wrapper change in
   `.llm/tools/run-deno-fmt.ts` (skip fixture trees / pass `--config` — the issue's own option 2;
   **outside the frozen file surface**, needs coordinator rescope); (b) stop the fixture's `.ts`
   files from being selectable or present as `.ts` (issue option 3 — construct the malformed fixture
   at runtime in the doctor test, or otherwise keep no `.ts` under a directory whose nearest config
   is deliberately broken; inside `packages/mcp`, which is in-surface, and still "not repairing the
   fixture"). Root `exclude` may additionally be kept as belt-and-braces for directory-walk tools,
   but it cannot be the load-bearing decision.
2. Everything else in the plan's sweep holds.

## Verdict

`FAIL_PLAN`

### If FAIL_PLAN — required fixes

1. **L3 / S1 / R8** (`plan.md:51,90,102,117,164-165`; `research.md` R8) — observed: root `exclude`
   leaves the exact acceptance command at `filesSelected:115, failedBatches:1`, EXIT=1 (evidence
   above). Required: re-decide the #1618 mechanism with an executed pre-plan proof of the exact
   command exiting 0 with `failedBatches: 0` and non-empty selection, the doctor test still green,
   and the fixture still malformed; if the chosen mechanism needs `.llm/tools/run-deno-fmt.ts`,
   obtain the coordinator's explicit surface rescope before locking it, and update the "not touched"
   list (`plan.md:70`) accordingly. Update S1's file list, gate row 4 and risk rows 1-2 to match.
2. **Slice numbering** (PR #1663 body `## Slices` vs `plan.md:117-120`) — required: make the two
   agree (either renumber the plan or edit the PR body) before any implementation slice is
   committed, so per-slice comments and checkbox ticks reference the same S-number.
3. **`scaffold.runtime` rationale** (`plan.md:81-82`, S4) — required wording fix, not a mechanism
   change: state that the gate is contract-frozen, that the matrix classes it `n/a` for this
   surface, and that the coordinator may waive it; do not claim the helper change needs it.
   (Advisory on its own; would not block a PASS.)

## Notes

- Nothing was executed against the checkout; all reproductions ran on `git archive HEAD` copies or
  minimal scratch projects under `$CLAUDE_JOB_DIR/tmp`. No expensive gate, Aspire, Docker, or
  `e2e:cli` was run. No labels, issues, or central state were changed.
- Cycle count: this is PLAN-EVAL cycle 1 of the two allowed.
