# Worklog: package-gate-honesty

## Run Metadata

| Field          | Value                                                                |
| -------------- | -------------------------------------------------------------------- |
| Run ID         | `release-0.0.7-internals--orchestration/slices/package-gate-honesty` |
| Branch         | `fix/package-gate-honesty`                                           |
| Archetype      | `6 — CLI / Tooling` (supporting MCP member remains A2)               |
| Scope overlays | `docs`                                                               |

## Design

### Public surface

- No package export, subpath, symbol, binary, or command name changes.
- `@netscript/cli` changes remain under publish-excluded `e2e/`.
- `@netscript/mcp` keeps `GUIDANCE_RANKING_POLICY` internal to its source graph; only the rationale
  comment and test change.
- Root Deno configuration gains one narrow exclusion for a deliberately invalid test fixture.

### Domain vocabulary

- **Gate honesty** — a gate fires on its intended subject, distinguishes a finding from a crash, and
  fails when its protected condition regresses.
- **Repository-owned path** — a path anchored to the owning module/repository, never ambient cwd.
- **Invalid-config fixture** — checked-in malformed config explicitly read by a test, never consumed
  through automatic configuration discovery.
- **Close-score group** — same-route candidates no more than `closeScoreGap` below one group leader.
- **Inside control / outside control** — candidates whose ordering observably changes if the
  threshold narrows/widens.

### Ports

- None. All changed behavior uses Deno/Web Platform primitives at existing test/tooling edges.

### Constants

- `GUIDANCE_RANKING_POLICY.closeScoreGap = 0.5` remains unchanged.
- Empirical values documented beside it: observed gap ≈ `0.3019801981861221`; headroom
  `0.1980198018138779`; observed regeneration movement `0.0748587451731435`.
- Test-only outside epsilon is strictly greater than zero and chosen to remain observable.

### Commit slices

| #  | Slice                                                                                             | Gate                                                                                     | Exact files                                       |
| -- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------- |
| S1 | Exclude deliberately invalid config from Deno discovery while retaining doctor failure semantics. | Exact MCP fmt clean + real-formatting negative control + doctor test.                    | `deno.json`                                       |
| S2 | Make all three CLI tests package-cwd independent without weakening assertions.                    | Structured targeted 6/6 + exact package task + docs gates; final runtime consumer in S4. | Three exact CLI files in `plan.md`                |
| S3 | Pin close-score policy on both sides and record rationale.                                        | Targeted test + widen/narrow RED controls + scoped MCP/quality gates.                    | `guidance-index.ts`; `guidance-retrieval_test.ts` |
| S4 | Integrated evidence and serialized consumer gate.                                                 | Frozen full gate set + coordinator-granted `scaffold.runtime`.                           | Run artifacts/evidence only                       |

### Deferred scope

- Any seventh product/config path, wrapper/CI change, docs edit, fixture repair, public API change,
  dependency update, or algorithm change.
- `scaffold.runtime` execution until coordinator mutex grant.
- All implementation until separate-session PLAN-EVAL `PASS`.

### Contributor path

To extend these guards, keep repository-owned paths module-relative; declare deliberately invalid
fixtures in the root exclusion and pair them with explicit tests; for tuned ordering boundaries add
one candidate on each side whose identity order conflicts with score order. Then prove both green
behavior and a controlled red mutation through structured gates.

## Progress log

| Time       | Slice     | Step                   | Notes                                                                                                                              |
| ---------- | --------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-15 | bootstrap | activated              | Exact worktree/branch/base verified; coordinator thread record preserved; commit `25c29575c`; draft PR #1663 opened.               |
| 2026-08-15 | research  | live issue/source read | All three issues fetched live; exact three-test reproduction returned 3 pass / 3 fail from package cwd.                            |
| 2026-08-15 | research  | fmt controls           | Baseline exact command: 115 selected, config crash; wrapper exclude: 110 selected/green; explicit root config: 115 selected/green. |
| 2026-08-15 | plan      | Design checkpoint      | Six-file authoritative surface locked; formal PLAN-EVAL selected; implementation remains prohibited.                               |

## Decisions

| Decision                                           | Reason                                                                       | Source                       |
| -------------------------------------------------- | ---------------------------------------------------------------------------- | ---------------------------- |
| Root exclusion, not fixture repair or wrapper edit | Exact acceptance command must work and frozen surface excludes `.llm/tools`. | plan L3/L4; Deno config docs |
| Module-derived paths                               | Package cwd is the defect; module location is stable.                        | plan L1/L2                   |
| Bidirectional score controls                       | Current identity ordering masks both threshold directions.                   | research R10-R12; plan L5/L6 |
| Formal PLAN-EVAL                                   | Multi-member/config/docs/JSR/runtime interactions are decision-heavy.        | run-loop §4; plan judgement  |

## Drift

| Drift                                                                                                 | Severity                     | Logged in drift.md |
| ----------------------------------------------------------------------------------------------------- | ---------------------------- | ------------------ |
| Launcher preseeded exact thread record before clean check.                                            | minor                        | yes                |
| Root task already had a wrapper-level fixture exclude, but standalone acceptance command remains red. | minor research clarification | yes                |

## Gate results

### Research diagnostics (not merge evidence)

| Check                                        | Result           | Notes                                                                        |
| -------------------------------------------- | ---------------- | ---------------------------------------------------------------------------- |
| Targeted three-file package-cwd test         | FAIL as expected | Structured report: 3 pass / 3 fail; exact three `NotFound` paths reproduced. |
| Exact scoped MCP fmt                         | FAIL as expected | 115 selected; one config-parse crash; zero findings.                         |
| Scoped MCP fmt with wrapper `--exclude`      | PASS diagnostic  | 110 selected; no failures/findings. Not the acceptance command.              |
| Scoped MCP fmt with explicit root `--config` | PASS diagnostic  | 115 selected; no failures/findings. Informs config-discovery cause.          |

### Static gates

| Gate                 | Command or check                                      | Result | Notes                                                        |
| -------------------- | ----------------------------------------------------- | ------ | ------------------------------------------------------------ |
| Plan artifact format | Structured wrapper over five exact run-artifact files | PASS   | 5 selected; zero findings/crashes; `git diff --check` clean. |

### Fitness gates

| Gate             | Result                | Evidence                              | Notes                                                            |
| ---------------- | --------------------- | ------------------------------------- | ---------------------------------------------------------------- |
| Plan-Gate        | NOT_RUN               | No evaluator artifact/comment exists. | Required; topic supervisor launches separate evaluator.          |
| JSR surface scan | PASS (planning input) | `research.md` JSR section             | No public delta; both members still receive full planned audits. |

### Runtime gates

| Gate               | Result  | Evidence                     | Notes                                      |
| ------------------ | ------- | ---------------------------- | ------------------------------------------ |
| `scaffold.runtime` | NOT_RUN | Mutex not requested/granted. | Correct state; this thread may not run it. |

### Consumer gates

| Consumer             | Result        | Evidence                                   | Notes                                          |
| -------------------- | ------------- | ------------------------------------------ | ---------------------------------------------- |
| CLI package-cwd task | baseline FAIL | Research structured targeted reproduction. | Future S2 must make the full exact task green. |

## Handoff notes

- PLAN-EVAL should inspect L3 root-exclusion semantics, the exact six-file bound, the two-direction
  score controls, and the honest treatment of existing CLI JSR debt.
- No implementation authority exists. The topic supervisor owns evaluator launch and the future
  `scaffold.runtime` mutex.
