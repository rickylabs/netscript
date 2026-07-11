# Worklog: issue #603 Codex slice runner

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `feat-603-slice-runner--codex` |
| Branch | `feat/603-codex-slice-runner` |
| Archetype | N/A — internal agentic infrastructure tool |
| Scope overlays | none |

## Design

### Public Surface

- `run-codex-slice.ts` — launch/attach and supervise a Codex thread until terminal contract/budget.
- `parseDoneContract`, `computeBackoff`, `remainingBudgetDelay` — pure tested runner decisions.

### Domain Vocabulary

- `SliceState` — `running | done | blocked | budget_exhausted | failed`.
- `DoneContract` — terminal reply classification.
- `QuotaEvent` — classified retry event and scheduled delay.
- `SliceStatus` — structured JSON output and heartbeat schema.

### Ports

- Existing launcher process — validates RouteIdentity and acquires sender ownership.
- Existing sender registry — validates attach identity.
- `Deno.Command` — bounded launch/resume execution.
- Filesystem — append-only Markdown turn ledger and atomic JSON heartbeat.

### Constants

- `DEFAULT_BUDGETS` — max turns, wall clock, and backoff bounds.
- done contract markers — `DONE`, `BLOCKED: <reason>`.

### Commit Slices

| # | Slice | Gate | Files |
| - | --- | --- | --- |
| 1 | Complete runner contract and CLI | scoped wrappers + targeted/full tests | agentic codex files, README, run artifacts |

### Deferred Scope

- Provider fallback and daemon repair remain owned by runtime routing/controller work.

### Contributor Path

Start in `run-codex-slice-lib.ts` for pure policy; extend CLI orchestration in
`run-codex-slice.ts`; add adjacent tests; keep volatile provider strings in `config/`.

## Progress Log

- 2026-07-11: activated harness, researched existing plumbing, recorded owner waiver D1 and plan.
- 2026-07-11: implemented launch/attach runner, terminal contract, bounded backoff, heartbeat/status,
  append-only thread ledger, pure tests, and README contract.
- 2026-07-11: post-slice reconcile — issue scope remains #603 only; no PR actions authorized;
  no plan readjustment or additional architecture debt discovered.

## Gate Results

| Gate | Command | Result | Notes |
| --- | --- | --- | --- |
| Targeted unit | `deno test --no-lock -A .../run-codex-slice-lib_test.ts` | PASS | 4 passed |
| Scoped check | `run-deno-check.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 95 files, 0 findings |
| Scoped lint | `run-deno-lint.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 95 files, 0 findings |
| Scoped format | `run-deno-fmt.ts --root .llm/tools/agentic --ext ts,tsx` | PASS | 95 files, 0 findings |
| Full agentic tests | `deno test --no-lock -A .llm/tools/agentic/` | PASS | 220 passed, 0 failed |
| Volatile guard | included in full suite | PASS | no model/version/endpoint literals outside config |

## Dry-run self-demo

Command:

```bash
deno run --allow-read --allow-run .llm/tools/agentic/codex/run-codex-slice.ts \
  --worktree /home/codex/repos/ns-wt-603 \
  --slice-dir .llm/runs/feat-603-slice-runner--codex \
  --thread-id 00000000-0000-4000-8000-000000000603 --dry-run
```

Transcript:

```json
{"ok":true,"mode":"dry-run","threadId":"00000000-0000-4000-8000-000000000603","turns":2,"lastState":"done","quotaEvents":[{"turn":1,"kind":"model_capacity","delayMs":0}],"writes":false}
```

## Handoff Notes

- Supervisor/IMPL-EVAL should inspect attach ownership validation, final-line parsing, retry budget
  clamping, and append/atomic status writes first.
- PLAN-EVAL was explicitly owner-waived (D1); this implementation session does not self-certify.
