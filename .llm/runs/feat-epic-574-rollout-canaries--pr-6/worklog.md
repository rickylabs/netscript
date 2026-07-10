# Worklog: rollout canaries + outcome report (#582)

## Design

### Public surface

- One repo-internal rollout CLI/task that runs or records the nine required canaries and writes a
  validated JSON matrix plus human report.
- No `packages/`/`plugins/` exports, no new provider command, no repair/routing behavior changes.

### Domain vocabulary

- `RolloutCanaryId`: closed union of the nine issue-owned canaries.
- `EvidenceMode`: `live | owner_accepted | synthetic | provenance`.
- `CanaryStatus`: `pass | conditional_pass | fail`.
- `FailureClassification`: finite values including `none`, `owner_accepted_working`,
  `credential_absent`, `auth_blocked`, `capability_incompatible`, `runtime_degraded`,
  `unsafe_to_repair`, `evidence_missing`, and `command_failed`.
- `CanaryEvidence`: redacted command, exit/status summary, citations/commit or PR identifiers, and
  bounded observations; never raw output.
- `CanaryResult`: command, expected, actual, evidence mode, classification, status, evidence, and
  residual risks.
- `RolloutOutcome`: schema version, generated timestamp, baseline, nine results, aggregate outcome,
  rollback status, residual risks, and promotion recommendation.

### Ports

- Injected command runner for invoking shipped CLI entry points and returning bounded exit/output
  data for immediate parsing.
- Artifact writer at the CLI edge for JSON/report persistence.
- Clock injection for deterministic tests.
- No new provider, repair, routing-state, credential, network, or GitHub port.

### Constants

- Ordered nine-ID canary catalog.
- Closed evidence modes, statuses, classifications, and recommendation values.
- Schema version and artifact paths.
- Allowlisted evidence keys and forbidden sensitive-key/pattern catalog.
- Existing command argv templates for runtime doctor/status/repair, provider canary, Antigravity
  evidence, routing state, and focused state-machine tests.

### Command and composition contract

The rollout entry point is presentation/composition only: parse args, construct existing-command
requests, invoke the orchestrator, validate/redact, write JSON, render Markdown, and select an exit
code. It contains no provider capability, repair safety, routing transition, or promotion policy
implementation beyond aggregate canary outcome semantics.

### Commit slices

1. S1 contract + pure aggregation: new contract/classifier/redaction modules and semantic tests;
   proven by focused tests and scoped static gates.
2. S2 thin runner + live matrix: injected subprocess edge, CLI/task, real bounded canary execution,
   checked-in validated JSON; proven by live commands, focused tests, agentic/runtime suite, and
   secret/lock gates.
3. S3 human outcome + DoD: traceable `ROLLOUT.md`, residual risk/rollback/recommendation and final
   run evidence; proven by consistency tests, full owned suite, scoped wrappers, and manual
   Archetype-6 review.

### Deferred scope

Promotion, merge, owner UI interaction, provider authentication, Windows rollback execution,
upstream CLI behavior changes, dependencies, and generalized canary frameworks are excluded.

### Contributor path

A contributor starts at the ordered canary catalog, follows one row into its orchestration mapping,
and reads the row-level semantic test. New rollout requirements require deliberately extending the
closed ID/classification catalogs and both renderers; they are not discovered dynamically. Existing
agentic behavior is extended in its owning #576–#581 module, not inside this rollout layer.

## Pre-flight evidence

| Check | Result |
| --- | --- |
| Branch | `feat/epic-574-rollout-canaries` |
| HEAD | `f007e26bf8ef8afd1db04ac34298907fb65aeaf3` before plan slice |
| Baseline ancestry | `git merge-base --is-ancestor b438f16d HEAD` exit 0 |
| Fetch | Plain configured fetch failed on stale remote ref; explicit integration + feature ref fetch succeeded. |
| Initial status | Branch clean except coordinator-created untracked `codex-thread-ids.md`; preserved. |
| Native worktree | `/home/codex/repos/netscript-epic-574-pr6-rollout` (WSL ext4) |

## Phase status

Coordinator Plan-Gate APPROVED in the 2026-07-10 resume directive. No evaluator artifact was added
to the branch by the coordinator; this worker did not create one or impersonate the evaluator.

## S1 — contract + pure aggregation

- Added the closed nine-ID contract, four evidence modes, finite statuses/classifications, safe
  evidence validator, complete-matrix aggregation, and recommendation-only outcome reducer.
- Explicitly rejects unconditional pass for `auth_blocked`, `credential_absent`,
  `owner_accepted_working`, runtime degradation, and unsafe repair.
- Promotion surface is data only; no promote/apply operation exists.

### S1 gate evidence

| Gate | Result |
| --- | --- |
| Focused semantic tests | 5 passed, 0 failed |
| Scoped check | 2 files, 0 findings |
| Scoped lint | 2 files, 0 findings |
| Scoped format check | 2 files, 0 findings |
| `git diff --check` | exit 0 |
| Sensitive-data scan | No values in artifacts; source-only matches are the defensive regex and its deliberately fake rejection fixture. |
| `deno.lock` | unchanged |

S1 files: `runtime/rollout-canary.ts`, `runtime/rollout-canary_test.ts`, and run artifacts.

## S2 — thin runner + live matrix

- Added injected `RolloutCommandRunner`, thin orchestration over shipped runtime/provider/
  Antigravity/routing-state CLIs, CLI parser/writer, and `agentic:rollout-canary` task.
- CLI accepts only `--worktree` and `--output`; there is no promotion or live-repair flag.
- Repair evidence invoked `repair codex-remote --dry-run` only. No daemon restart occurred.
- Initial live quota test exposed missing temp-directory permissions in runner argv (2 tests passed,
  persistence test denied). Added the test's required read/write permissions and regenerated the
  matrix; this did not change #579 behavior.

### Live canary evidence (2026-07-10)

| Canary | Actual bounded result |
| --- | --- |
| Native WSL health | version exits `0/0/0`; runtime doctor exit `0`; pass |
| Claude reconnect | `owner_accepted_working`; conditional pass |
| Claude isolated sessions | `owner_accepted_working`; conditional pass |
| Codex lifecycle | status exit `3`, repair dry-run exit `4`; no restart; mobile visibility owner-accepted; conditional pass |
| Antigravity grounded search | structured `blocked`, exit `4`; explicit `auth_blocked`; owner-accepted capability; conditional pass |
| Provider compatibility | four structured `blocked` results, exits `4/4/4/4`; explicit `credential_absent`; conditional pass |
| Quota fallback/restoration | state-machine suite exit `0`, routing-state exit `0`; pass |
| Opposite-family epic run | provenance #585–#590; pass |
| Windows rollback | break-glass provenance #584; pass |

Matrix aggregate: `conditional_pass`; recommendation: `promote_with_conditions`. This is a
recommendation only and requires owner approval plus coordinator action.

### S2 gate evidence

| Gate | Result |
| --- | --- |
| Focused rollout tests | 8 passed, 0 failed |
| Scoped check | 6 files, 0 findings |
| Scoped lint | 6 files, 0 findings |
| Scoped format check | 6 files, 0 findings |
| Live matrix validator | 9 rows; sensitive-key scan clean; aggregate `conditional_pass` |
| `git diff --check` | exit 0 |
| `deno.lock` | unchanged |

S2 files: runner/CLI and tests, `deno.json`, checked-in matrix, and run artifacts.

## S3 — human outcome + Definition of Done

- Added a pure Markdown renderer and consistency test; the rollout CLI now optionally writes
  `ROLLOUT.md` from the same validated outcome used for JSON.
- Final live rerun wrote both checked-in artifacts. Aggregate remains `conditional_pass` with
  recommendation `promote_with_conditions`; no promotion action exists or ran.
- Report includes every reproducible command, expected result, actual bounded evidence, failure
  classification, evidence mode, residual risk, rollback status, privacy boundary, and promotion
  boundary.

### Final gate evidence

| Gate | Result |
| --- | --- |
| Complete agentic tree | `deno test --no-lock --allow-read --allow-write --allow-env --allow-run .llm/tools/agentic` — 201 passed, 0 failed |
| Scoped check | 84 files, 0 findings |
| Scoped lint | 84 files, 0 findings |
| Scoped format check | 84 files, 0 findings |
| Report/matrix consistency | Included in complete suite; renderer equality test passed |
| Artifact integrity | 9 rows; report 8697 bytes; aggregate `conditional_pass`; sensitive-value scan clean |
| `git diff --check` | exit 0 |
| `deno.lock` | unchanged |
| Doctrine scanner | Non-verdict exit 1: scanner assumes a publishable package and requires `mod.ts`; also reports pre-existing agentic directory/file warnings. No new owned file exceeds 500 LOC. |
| Manual Archetype-6 review | PASS for owned files: CLI is 59 LOC and parse/write only; runner is 382 LOC and injected; pure contract 165 LOC; report renderer 72 LOC; no sub-barrels, provider logic, live repair, promotion operation, dependencies, or raw output persistence. |

### Definition-of-Done reconciliation

- [x] Exactly nine stable canary IDs appear once in machine and human outputs.
- [x] Every canary has a reproducible command, expected result, actual evidence, evidence mode, and
      failure classification.
- [x] Live native health, provider compatibility, Antigravity evidence, dry-run Codex inspection,
      quota state-machine, and routing-state commands were executed and recorded honestly.
- [x] Owner-interactive evidence is `owner_accepted_working`; no raw mobile proof is fabricated.
- [x] `auth_blocked` and `credential_absent` remain conditional, never unconditional passes.
- [x] PRs #585–#590 and rollback PR #584 are cited.
- [x] Report covers outcome, residual risks, rollback, privacy, and promotion recommendation.
- [x] No daemon restart, rollback, merge, promotion, dependency change, or #576–#581 behavior change.
- [x] Full owned tests and scoped static gates pass; lock and sensitive-data gates pass.

Implementation complete — awaiting coordinator Tier-A review. This worker does not self-certify.
