# Worklog: canonical agentic task separator

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-hybrid-launcher-task-separator--1750` |
| Branch | `fix/hybrid-launcher-task-separator` |
| Archetype | N/A — internal tooling |
| Scope overlays | none |

## Design

### Public Surface

- `normalizeTaskArguments(args)` — internal pure boundary used by every finite `agentic:*` parser.
- Existing 26 strict `agentic:*` command surfaces — vocabularies and exit conventions unchanged.

### Domain Vocabulary

- leading task separator — the first argv token when Deno forwards `deno task <name> -- <args>`.
- later separator — a second or non-leading `--`; always an unknown argument.
- strict task entry — an exposed task whose parser accepts a finite token vocabulary and rejects
  unrecognized input.

### Ports

- Existing injected `HybridLauncherDependencies` remains the lifecycle seam; no new port is needed.

### Constants

- `TASK_SEPARATOR` — the sole separator token, `--`.
- `STRICT_AGENTIC_TASKS` in tests — the 26 surveyed task-to-entry mappings.

### Commit Slices

| # | Slice | Gate | Files |
| --- | --- | --- | --- |
| 1 | RED proves documented task forwarding fails while direct launch works, later tokens stay fail-closed, and parser failure spawns no child | clean throwaway-worktree targeted test wrapper exits non-zero | run artifacts; hybrid/remote parser tests; `task-separator_test.ts` |
| 2 | GREEN centralizes exact-leading normalization across all strict entries and proves lifecycle/dry-run/static gates | targeted tests + structured check/lint/fmt + dry-run capture | shared helper/tests; 26 strict entries; run evidence |

### Deferred Scope

- Live Remote Control supervisor launch — globally serialized and supervisor-owned.
- IMPL-EVAL and ready-for-review transition — separate supervisor session by explicit directive.

### Contributor Path

When adding a finite `agentic:*` task, map it in the separator contract test and call
`normalizeTaskArguments` before command/help parsing; add its finite flags afterward as usual.

## Progress Log

| Time | Slice | Step | Notes |
| --- | --- | --- | --- |
| 2026-08-31 | bootstrap | survey | 32 tasks, 26 strict parsers; 21 reject leading `--`, five over-accept it. |
| 2026-08-31 | plan | PLAN-EVAL | N/A: exact mechanical contract and gates are owner-supplied; IMPL-EVAL remains mandatory and supervisor-owned. |
| 2026-08-31 | RED | commit | `94178f9ef` records tests and run artifacts without implementation. |
| 2026-08-31 | RED | clean verification | Detached throwaway worktree was clean before the structured gate; exit 1 with 14 pass / four intended separator failures. |
| 2026-08-31 | RED | reconcile | Owner required RED then GREEN before publication; no PR existed to reconcile, and issue #1750 remained the full resolving scope. |
| 2026-08-31 | GREEN | implementation | Added one pure normalizer and wired all 26 strict entries; five over-permissive parsers were tightened. |
| 2026-08-31 | GREEN | gates | Focused 20/20 and full agentic 498/498 tests pass; check/lint/fmt cover 167/167 files. |
| 2026-08-31 | GREEN | reconcile | Scope still fully resolves #1750; README remains canonical, no debt or rescope, draft PR publication is next. |

## Decisions

| Decision | Reason | Source |
| --- | --- | --- |
| One leading separator only | Matches docs without weakening strict parsing | issue #1750 / plan D1-D2 |
| Shared normalizer | One auditable invariant for all strict parsers | survey / plan D3 |
| README unchanged | Existing example is canonical | `.llm/tools/agentic/README.md:352` |

## Drift

| Drift | Severity | Logged in drift.md |
| --- | --- | --- |
| Local `main` advanced after owner locked the slice base | minor | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| --- | --- | --- | --- |
| RED | structured test wrapper in clean detached worktree at `94178f9ef` | expected FAIL, exit 1 | 14 passed; four intended failures: hybrid parser/task lifecycle, codex task help, gateway later separator. Direct hybrid lifecycle passed. |
| Targeted tests | structured test wrapper over separator + hybrid + gateway tests | PASS, exit 0 | 20 passed, 0 failed. |
| Full agentic tests | structured test wrapper over `.llm/tools/agentic` | PASS, exit 0 | 498 passed, 0 failed. |
| Check | structured check wrapper, root `.llm/tools/agentic`, `ts` | PASS, exit 0 | 167 selected, two batches, zero findings. |
| Lint diagnostic | structured lint wrapper with root config | expected refusal, exit 2 | Deno excluded the hidden `.llm` root; zero files processed, so this is not a verdict. |
| Lint | structured lint wrapper with temporary ignored config explicitly including `../tools/agentic/` | PASS, exit 0 | 167 selected and processed; zero dropped/refused/findings. Temporary config removed. |
| Format | structured fmt wrapper, root `.llm/tools/agentic`, `ts` | PASS, exit 0 | 167 selected and processed; zero findings. |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Exact-leading contract | PASS | `task-separator_test.ts` and parser tests | One leading `--` accepted; second/non-leading rejected. |
| Survey denominator | PASS | task-map test | All 32 tasks accounted for; all 26 finite entries call the normalizer. |
| Unknown fail-closed | PASS | command capture exit 2 | `--unexpected` remains `Unknown argument: --unexpected`. |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Hybrid lifecycle | PASS | focused/full tests | Direct and task forms each spawn exactly one fake child and emit PID/cwd/session/bridge proof. |
| Parser-failure cleanup | PASS | focused/full tests | Unknown, second, and non-leading separator forms record zero fake child PIDs. |
| Direct dry-run | PASS, exit 0 | `codex-resume` with matching local `--user node` | Emits validated command plan; sends nothing. |
| Task dry-run | PASS, exit 0 | `deno task agentic:codex-resume -- ... --dry-run` | Same command plan as direct form; sends nothing. |
| Negative task commands | PASS | unknown/later/second separator each exit 2 | No send path reached. |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| --- | --- | --- | --- |
| Canonical README command | PASS | task-form lifecycle test | README unchanged because its existing contract now works. |
| Package/plugin consumers | N/A | boundary | No package/plugin surface changed. |

## Handoff Notes

- IMPL-EVAL should inspect the 26-task survey denominator, exact-one-leading helper, hybrid child
  count/evidence assertions, and byte-identical `deno.lock` proof first.
- The initial `--user agent` dry-run attempts exited 1 because the Deno process identity is `node`;
  corrected `--user node` runs passed in both forms. This was environment diagnosis, not a parser
  failure.
