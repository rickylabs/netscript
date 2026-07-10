# Plan: rollout canaries + outcome report (#582)

## Scope and profile

- Issue/PR: #582 / draft PR #591.
- Baseline: integration branch `rickylabs-epic-574-wsl-agentic-runtime` at `b438f16d`.
- Archetype: 6 — CLI/Tooling; docs overlay for the checked-in outcome report.
- Public package/plugin surface: none. JSR audit/publishability: N/A because all executable code is
  repo-internal under `.llm/tools/agentic/`.
- Owned deliverables: rollout canary runner, typed machine-readable matrix, checked-in JSON outcome,
  human `ROLLOUT.md`, focused tests, and harness evidence.
- Explicit non-goals: changing #576–#581 behavior, collecting secrets/raw session output, performing
  interactive claims, universal rollout, integration-to-main promotion, merge, or self-certification.

## Locked architecture decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Define exactly nine stable canary IDs in a pure contract before orchestration. | Makes omissions and duplicate rows mechanically invalid. |
| D2 | Every row carries `command`, `expected`, `actual`, `evidenceMode`, `classification`, `status`, `evidence`, and `residualRisks`. | Directly satisfies acceptance while keeping human and machine outputs aligned. |
| D3 | Evidence modes are closed: `live`, `owner_accepted`, `synthetic`, and `provenance`. | Prevents owner-interactive claims from being confused with captured live proof. |
| D4 | Reuse existing CLI entry points through an injected subprocess seam; do not import/reimplement their internal decision logic. | Preserves #576–#581 boundaries and permits semantic tests without credentials. |
| D5 | Persist allowlisted summaries only. Never persist raw stdout/stderr or environment/session payloads. | Enforces the no-secrets/no-PII boundary by construction. |
| D6 | `credential_absent`, `auth_blocked`, and `owner_accepted_working` remain explicit classifications. | Avoids fabricated passes while allowing an honest conditional rollout recommendation. |
| D7 | The checked-in JSON matrix is validated against the same contract the runner emits; `ROLLOUT.md` is rendered from/traceable to it. | Prevents report/matrix drift. |
| D8 | Recommendation is a closed value (`promote`, `promote_with_conditions`, `do_not_promote`) plus rationale. The runner has no promotion operation. | Makes owner approval an external hard boundary. |
| D9 | Live repair coverage is bounded to inspect/dry-run unless preflight proves a live repair is safe and necessary; no daemon restart is required merely to create evidence. | Avoids interrupting the active implementation thread. |
| D10 | Tests assert row semantics, command construction, redaction, failure aggregation, and report content; no giant string snapshots. | Satisfies AP-18 and makes failure behavior reviewable. |

## Canary matrix design

| ID | Evidence mode | Reproducible orchestration | Expected/classification policy |
| --- | --- | --- | --- |
| `native_wsl_health` | live | versions + `deno task agentic:runtime doctor --json` | Healthy or explicit degraded component; unexpected command/schema failure blocks. |
| `claude_mobile_reconnect` | owner_accepted | documented owner procedure; no automated claim | `owner_accepted_working`; absence of acceptance blocks. |
| `claude_isolated_sessions` | owner_accepted | documented two-worktree procedure | `owner_accepted_working`; absence of acceptance blocks. |
| `codex_remote_lifecycle` | live + owner_accepted | runtime status + repair dry-run/inspect; owner confirms mobile visibility | Repair diagnostics remain explicit; unsafe/live interruption is not attempted. |
| `antigravity_grounded_search` | live + owner_accepted | shipped evidence CLI with bounded prompt/persisted citation path | Empirical `auth_blocked` retained; owner acceptance yields conditional pass only. |
| `provider_compatibility` | live | shipped provider canaries for Claude/Codex native/OpenRouter routes | Credential absence is diagnostic/conditional; incompatible behavior fails. |
| `quota_fallback_restoration` | synthetic + live | state-machine focused tests + read-only routing-state CLI | Exhaust/fallback/persist/reset/restore transitions proven; corrupt state fails. |
| `opposite_family_epic_run` | provenance | cite merges #585–#590 and coordinator Tier-A evidence | Missing required provenance fails; this session does not self-certify. |
| `windows_native_rollback` | provenance | documented #584 break-glass/default-restoration procedure | Rollback documented/proven; no rollback is executed. |

## Outcome-report shape

`ROLLOUT.md` will contain: executive outcome; per-canary table with command/expected/actual/status/
classification/evidence; live-environment observations; failures and conditional diagnostics;
residual risks; rollback readiness; privacy/redaction statement; and an explicit promotion
recommendation stating that owner approval and coordinator action are still required.

## Open-decision sweep

| Decision | Disposition |
| --- | --- |
| Exact file name/task name within the locked `.llm/tools/agentic/` surface | Safe to defer to S1 only if existing naming conventions are followed; no contract rework. |
| Whether a safe live daemon restart is needed | Safe to defer; inspect/dry-run evidence is sufficient and active work must not be interrupted. |
| Concrete provider profiles available on this machine | Safe to discover live; missing credentials become structured rows, not schema changes. |
| Owner approval for universal promotion | Must remain external and unresolved; code can only recommend. |

No unresolved decision would require architecture rework after Plan-Gate.

## LOC and scope budgets

| Surface | Budget |
| --- | ---: |
| Pure canary contract/classifier | <= 260 LOC |
| Runner/orchestrator and subprocess adapter | <= 360 LOC total; split if either role exceeds 220 LOC |
| CLI/render/persistence edge | <= 220 LOC |
| Focused tests | <= 700 LOC total |
| Checked-in JSON + `ROLLOUT.md` | concise nine-row evidence only; no raw command output |
| Existing #576–#581 source behavior | 0 semantic changes |
| Dependencies / `deno.lock` | 0 changes |

## Slice table

| Slice | What it proves | Files | Gates |
| --- | --- | --- | --- |
| S1 — contract + pure aggregation | All nine canaries are mandatory; evidence/status/classification and recommendation semantics fail closed; redaction allowlist is testable. | New rollout contract/aggregation modules and focused tests; run artifacts. | Focused `deno test --no-lock`; scoped check/lint/fmt; `git diff --check`; secret scan; lock unchanged. |
| S2 — thin runner + live matrix | Existing CLIs are invoked reproducibly through an injected edge; real bounded results populate a validated, secret-safe JSON matrix without changing upstream behavior. | Runner/CLI/adaptor, task registration if needed, focused tests, checked-in matrix; run artifacts. | Focused tests; run automatable canaries live; agentic/runtime suite; scoped wrappers; diff/secret/lock gates. |
| S3 — human outcome + DoD | Human report is traceable to the matrix and records pass/fail, residual risk, rollback, and recommendation-only promotion semantics. | `ROLLOUT.md`, README/help docs if required, report tests, final run artifacts. | Report/matrix consistency test; full agentic/runtime suite; scoped wrappers; `arch:check` for owned tooling root/manual F-CLI evidence; diff/secret/lock gates. |

Each implementation slice is committed, explicitly pushed, commented on PR 591, and then reviewed
by the Claude Tier-A coordinator before any sign-off. This worker does not self-certify.

## Gate set

- Focused semantic tests for each new module and CLI parser/renderer.
- Complete `.llm/tools/agentic/runtime/**/*_test.ts` plus relevant top-level agentic tests.
- Scoped wrapper evidence for owned `.ts` files: check (`--unstable-kv` where applicable), lint,
  and format check.
- `deno task arch:check`/manual Archetype-6 review for relevant tooling rules; F-CLI scripts are
  `PENDING_SCRIPT` where the harness defines no dedicated implementation.
- `git diff --check` and an explicit secret/PII pattern scan over owned artifacts.
- `deno.lock` byte/hash unchanged from baseline; no dependency commands or reload.
- Full CLI scaffold E2E is N/A: no scaffold output, plugin wiring, DB, Aspire generation, or public
  CLI package behavior changes.

## Risk register

| Risk | Mitigation |
| --- | --- |
| Raw provider/doctor output leaks identifiers or credentials. | Parse structured output in memory; persist allowlisted summaries; test forbidden keys/patterns and scan artifacts. |
| Conditional diagnostics are mislabeled as unconditional success. | Closed classifications and recommendation reducer; report residual risks beside every conditional row. |
| Runner duplicates upstream policy. | Invoke shipped CLIs and consume their classifications; no copied provider/repair/routing logic. |
| Live repair interrupts this daemon-attached thread. | Inspect/dry-run by default; only coordinator-authorized safe live repair after idle preflight. |
| Interactive evidence is fabricated. | Only explicit `owner_accepted` records can satisfy those rows; no synthesized raw evidence. |
| Report and JSON diverge. | Generate/validate both from one typed matrix and assert required sections/row IDs. |
| Scope expands into promotion/rollback execution. | No apply/promote command in the contract; recommendation and documented rollback only. |

## Debt and deferred scope

No new architecture debt is planned. Existing absence of dedicated F-CLI scripts remains
`PENDING_SCRIPT` with manual evidence and is not deepened here.

Deferred/out of scope: universal rollout, main promotion, merge, provider credential provisioning,
changing routing policy, modifying repair behavior, automating Claude mobile UI, executing Windows
rollback, raw evidence retention, and dependency/toolchain upgrades.
