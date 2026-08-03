# Worklog: close-gate verdict honesty

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-close-gate-verdict-provenance--verdict-honesty` |
| Branch | `fix/close-gate-verdict-provenance` |
| Archetype | `N/A` — repository tooling |
| Scope overlays | `none` |

## Design

### Public Surface

- Close-gate CLI report JSON and `--pretty` job log.
- Exported pure helpers used by `check-close-gate_test.ts` for issue snapshot construction,
  current-vs-evaluated staleness detection, issue acceptance scanning, and PR DoD scanning.
- `.github/pull_request_template.md` and `.agents/skills/netscript-pr/SKILL.md` as the contributor
  convention surface.

### Domain Vocabulary

- `IssueSnapshot` — `{number, updatedAt, bodySha256}` identity for an evaluated issue body.
- `Report` — existing close-gate verdict plus head/evaluation/snapshot provenance and PR findings.
- `PrFinding` — an unchecked authoritative PR-body checkbox with line, section, and text.
- `StaleIssue` — evaluated/current identities for an issue whose timestamp or hash differs.

### Ports

- Existing `GitHubClient` remains the sole GitHub API adapter.
- Web Crypto `crypto.subtle.digest` supplies SHA-256; no new abstraction or dependency.
- Clock access is limited to report assembly; pure snapshot comparison is time-independent.

### Constants

- Existing closing-keyword, checkbox, heading, override-label, and retry constants remain.
- Add a narrow authoritative PR heading predicate for `definition of done` and `acceptance` only.

### Commit Slices

| # | Slice | Gate | Files |
| - | ----- | ---- | ----- |
| S0 | Research/plan/design and evaluator handoff | PLAN-EVAL | run directory |
| S1 | Verdict provenance + stale comparison + regression tests | targeted tests and scoped wrappers | checker, tests, run directory |
| S2 | PR DoD enforcement + template/skill alignment | targeted tests, scoped wrappers, focused inspection | checker, tests, PR template, PR skill, optional CI text, run directory |
| S3 | Live PR/readiness reconciliation | live close-gate, review-thread gate, IMPL-EVAL | run directory + PR metadata |

### Deferred Scope

- CI concurrency/rerun redesign — provenance makes stale state detectable without changing job
  orchestration.
- Arbitrary PR checklist enforcement — only Definition-of-Done/Acceptance sections are durable
  authoritative claims.
- Package/CLI runtime gates — no affected surface.

### Contributor Path

To extend close-gate behavior, add a pure parser/snapshot helper beside the existing predicates,
cover it in `check-close-gate_test.ts`, then thread only its result into `Report` and `printReport`.
To add an authoritative PR checklist, place it beneath a `Definition of Done` or `Acceptance`
heading in the shipped template.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-08-03 | S0 | bootstrap | Read both issue bodies, required skills, harness authorities, checker/tests/template/workflow. |
| 2026-08-03 | S0 | baseline | `check-close-gate_test.ts`: 3 passed, 0 failed. Worktree clean at `fb75cf6fc`. |
| 2026-08-03 | S0 | route check | Agentic runtime status blocked with `MISSING_IDENTITY`; no implementation launched. |
| 2026-08-03 | S0 | design checkpoint | Locked ENFORCE convention and three implementation/readiness slices before PLAN-EVAL. |
| 2026-08-03 | S0 | PLAN-EVAL launch | Local Qwen canary blocked with `auth_required`; no provider process launched and implementation remains stopped. |
| 2026-08-03 | S1 | orchestrator steer | Milestone decision D6 waives per-PR local formal evaluation; locked plan approved and implementation authorized. |
| 2026-08-03 | S1 | implementation | Added report provenance, issue snapshots/stale comparison, PR authoritative-section findings, and regression tests. |
| 2026-08-03 | S1 | gate loop | First run exposed a fixture line-number error; corrected expected line 5→4. Scoped fmt then exposed import ordering; formatted only the two owned TS files. |
| 2026-08-03 | S1 | reconcile | Issues #1171/#1105 remain open; PR #1181 remains draft with non-closing refs and `status:plan-eval` until code review/readiness. No unrelated changes or lock churn. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |
| Enforce only PR Definition-of-Done/Acceptance boxes | Matches owner decision and avoids false blockers from legitimate non-DoD lists | user contract, #1105, `netscript-pr` |
| Additive report fields and PR findings | Preserve established issue pass/fail behavior | #1171 |
| No implementation until separate evaluator PASS | Harness hard invariant | plan-gate |
| Compose per-PR evaluation under milestone run | Explicit orchestrator waiver D6 | milestone-run.md + owner steer |

## Drift

| Drift | Severity | Logged in drift.md |
| ----- | -------- | ------------------ |
| Local agentic runtime has no registered identity | significant (process) | yes |

## Gate Results

### Static Gates

| Gate | Command or check | Result | Notes |
| ---- | ---------------- | ------ | ----- |
| Baseline targeted tests | `deno test .llm/tools/validation/check-close-gate_test.ts` | PASS | 3 passed, 0 failed before edits |
| Targeted behavior | `deno test .llm/tools/validation/check-close-gate_test.ts` | PASS | 7 passed, 0 failed |
| Scoped type-check | `run-deno-check.ts` over 2 files | PASS | 0 occurrences; `--unstable-kv` wrapper default |
| Scoped lint | `run-deno-lint.ts` over 2 files | PASS | exit 0, 0 occurrences; no ignores added |
| Scoped format | `run-deno-fmt.ts` over 2 files | PASS | 0 findings after owned-file format |

### Fitness Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| Plan-Gate | composed per milestone-run.md (orchestrator waiver) | owner steer + drift D6 | wave-1 per-PR slice |
| Framework/JSR fitness | N/A | repo-tooling scope | no `packages/**`/`plugins/**` |

### Runtime Gates

| Gate | Result | Evidence | Notes |
| ---- | ------ | -------- | ----- |
| CLI/Aspire/scaffold runtime | N/A | scope | validator-only change |

### Consumer Gates

| Consumer | Result | Evidence | Notes |
| -------- | ------ | -------- | ----- |
| PR authors/CI | NOT_RUN | tests + live PR planned | template/convention and report output are consumer surfaces |

## Handoff Notes

- Code review should inspect D1 (narrow authoritative headings), D5 (timestamp OR hash staleness),
  D6 (additive semantics), and the explicit issue-only `headSha` behavior.
- S2 must still align the shipped PR template and `netscript-pr` convention before readiness.
