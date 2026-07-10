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

Plan & Design ready for separate Claude coordinator Plan-Gate. No implementation has begun.
