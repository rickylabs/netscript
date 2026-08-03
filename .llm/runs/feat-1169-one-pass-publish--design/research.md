# Research — epic #1169 (one-pass publish)

Baseline: `origin/main` @ `442f1f7b8`, 2026-08-03. Sources: issue #1169 (evidence-carrying),
`.llm/runs/release-0.0.4--orchestration/cut-trace.md`, code sweep of the seven failure surfaces.

## Findings per failure

### F1 — `runtime.aspire-restore` 900s timeout, no retry (issue #1168, exists)

- Gate: `packages/cli/e2e/src/application/gates/scaffold/runtime-gates.ts:70-86` — plain
  `commandGate(...)` running `aspire restore`; one-shot.
- Timeout: `commandTimeoutMs: 900_000` in `create-default-runner.ts:66` and
  `suite-builder-options.ts:36`; consumed in `gates/command-gate.ts:17`.
- `CommandGate.execute` (`command-gate.ts:14-50`) runs exactly once; verdict `failed`/`timedOut`.
  **No generic command retry helper exists** — only `HttpGate`'s poll loop and
  `fetchGitHubJsonWithRetry` in check-close-gate.
- Report artifact: `--report` JSON via `reporting-builder.ts` / `domain/report.ts`; CI wiring at
  `.github/workflows/e2e-cli.yml:268-282`.
- Both observed failures hit exactly the ceiling → instrument attempt durations before choosing
  retry-vs-raise-ceiling (issue #1168 already encodes this).

### F2 — cancelled/superseded runs report as current

- **No tool in the repo lists PR check runs at all** (grep for `statusCheckRollup`/`gh pr checks`
  across `.llm/tools`, `.github` — prose only, at `milestone-run.md:95`). Supervisors read the raw
  GitHub rollup, which includes superseded runs. Gap, not a filter bug.
- Closest surface: `.llm/tools/agentic/github/gh-watch.ts:186-216` (single run id, exit 13 on any
  non-success, no per-name dedupe).

### F3 — close-gate reads pre-edit state, verdict looks live

- `.llm/tools/validation/check-close-gate.ts`; `Report` interface (lines 78-88) records
  `{gate, ok, repo, pr, overrideLabel, overrideActive, closingIssues, findings, notes}` — **no head
  SHA, no timestamp, no issue-body hash/`updated_at`**. A stale verdict is indistinguishable from a
  live one.
- Workflow job: `.github/workflows/ci.yml:50-91`, rollup 324-366.

### F4 — concurrent expensive suites collide

- Actions `concurrency` groups are keyed workflow+**ref** (`e2e-cli.yml:66-68`,
  `e2e-cli-prod.yml:18-20`), so two PRs run `scaffold.runtime` simultaneously; locally there is no
  lock/lease at all. Only lease primitive in repo:
  `.llm/tools/agentic/runtime/sender-ownership.ts` (candidate pattern).

### F5 — tooling probes disagree with reality / exit-0 refusals

- `codex-status` phantom processes: fixed in #1074 (per issue).
- `duplicate_sender_risk`: **current code exits 4, not 0** —
  `launch-codex-slice.ts:382-391` and `:401-409`; tests exist (`sender-ownership_test.ts:29`,
  `runtime/adapters_test.ts:132`). The issue's claim predates this or refers to another path.
  → verify against the observed refusal transcript; audit `.llm/tools/agentic/` for any *other*
  refusal path that exits 0; close on evidence.

### F6 — stale `agent` check red on `main` (deleted branch)

- `.github/workflows/openhands-agent.yml`: job `agent` (line 130) triggers on
  `push: branches: ['**']` (115-117). A queued run whose ref/branch input was deleted post-merge
  fails permanently. Same *family* as #1142 (classify-changes post-merge false red on merged PRs —
  root cause confirmed in #1142: unresolvable `$HEAD_SHA` after branch deletion + heredoc opener
  written before the fallible command under `bash -e`, `e2e-cli.yml:107-110`).

### F7 — release branch structurally red

- Already fixed in #1165/#1167. Needs only evidence-based closure at the next cut.

## Existing sub-issues

| Failure | Issue |
| --- | --- |
| F1 | #1168 (open, milestone 0.0.5) |
| F6-family (classify changes) | #1142 (open) |
| F2, F3, F4, F5, F6(`agent` job) | none — must be filed |

## Constraints

- `.llm/tools/release/` has **no overlap** with any surface above (verified by grep); only
  `release-canary-workflow_test.ts:91` reads `e2e-cli-prod.yml` — touching `e2e-cli-prod.yml`
  concurrency would trip that test → keep F4's CI change scoped to `e2e-cli.yml`, or propose-and-wait.
- PR #1159 / canary surface untouchable tonight.

## Open questions (resolved in plan)

- Retry vs ceiling for aspire-restore → instrument first (locked in #1168's acceptance).
- Where the "verdict provenance" shape lives → one shared idea, two local implementations (e2e
  `GateResult` + close-gate `Report`); no premature shared library across `.llm/tools` and
  `packages/cli/e2e`.
