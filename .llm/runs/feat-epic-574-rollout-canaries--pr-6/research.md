# Research: rollout canaries + outcome report (#582)

## Re-baseline

Research was performed on 2026-07-10 at `f007e26b`, stacked directly on integration baseline
`b438f16d`. `git merge-base --is-ancestor b438f16d HEAD` exited 0. The explicit origin fetch showed
the integration ref at `b438f16d` and the feature ref at `f007e26b`. The ordinary configured fetch
ref is stale (`feat/fresh-ui-pixel-polish` no longer exists), so required refs were fetched
explicitly without changing repository configuration.

The carried issue brief was treated as a scope contract, not implementation truth. Existing source,
tests, task registrations, and the committed #576–#581 harness evidence were inspected again on this
branch.

## Findings

| ID | Current fact | Reproducible evidence |
| --- | --- | --- |
| R1 | The canonical runtime CLI already exposes `doctor`, `status`, and `repair codex-remote`; #582 must orchestrate it rather than duplicate probes or repair logic. | `deno.json` tasks and `.llm/tools/agentic/agentic-runtime.ts`; `--help`/JSON commands during implementation. |
| R2 | Provider compatibility already has a read-only canary entry point and a finite classifier that distinguishes credential absence from compatibility failure. | `agentic:provider-canary`; `runtime/provider-canary.ts`; `runtime/adapters/provider-canary-adapter.ts`; #577 run artifacts. |
| R3 | Antigravity has a bounded evidence CLI with redacted classifications and optional persisted citation aggregation. The empirical live result on this machine is auth-blocked; raw output was discarded. | `agentic:antigravity-evidence`; #578 `research.md`, `worklog.md`, `antigravity-capability-evidence.json`. |
| R4 | Quota fallback, persisted routing state, reset probing, and restoration are owned by a pure state machine plus a read-only status CLI. | `runtime/routing-state-machine.ts`, tests, `agentic:routing-state`; #579 artifacts. |
| R5 | Codex sender ownership and safe rescue are already implemented behind `repair codex-remote`; dry-run/inspection is the safe rollout input. A live restart is conditional on an idle/unmanaged daemon and is not necessary to prove orchestration. | `runtime/codex-remote-repair.ts`, tests, `agentic:runtime repair codex-remote`; #580 artifacts. |
| R6 | Canonical route identities and opposite-family rules are machine-readable and already tested. | `runtime/routing-policy.ts`, `workflow/lane-policy.md`; #581 artifacts. |
| R7 | The final runner needs nine stable canary rows, not nine new implementations. Each row must carry command, expected outcome, actual evidence summary, evidence mode, classification, and sensitivity policy. | Issue #582 acceptance and locked boundaries. |
| R8 | Three canaries contain claims no process can honestly establish here: Claude reconnect, isolated Claude sessions, and mobile visibility. Their evidence mode must be `owner_accepted`, never synthesized raw proof. Antigravity success is also owner-accepted while the empirical auth block remains recorded. | Owner directive in the implementation brief. |
| R9 | Provider credentials may be absent. `credential_absent` is a structured diagnostic and residual risk, not a fabricated pass and not necessarily a product failure. | #577 canary contract and owner directive. |
| R10 | Epic execution provenance is the evidence for opposite-family planning/implementation review: merged PRs #585–#590 plus this run's coordinator review. The runner should cite identifiers, not query or reinterpret GitHub review semantics. | Integration history ending at merge commit `b438f16d`; run supervisor contract. |
| R11 | Rollback is documentation/provenance: native Windows Claude plus native-provider defaults, citing #584 break-glass. #582 must not execute rollback or promotion. | Locked boundary and owner directive. |
| R12 | The worktree started with only one untracked coordinator-created file, `codex-thread-ids.md`; it records the daemon-attached thread and must be preserved as harness identity evidence. | Ground-truth `git status --short --branch`. |

## Surface and architecture assessment

- Selected profile: Archetype 6 — CLI/Tooling, plus `SCOPE-docs` for the outcome report.
- Owned surface: a thin `.llm/tools/agentic/` rollout command, its pure contract/orchestrator/tests,
  a checked-in machine-readable matrix, `ROLLOUT.md`, and this run directory.
- No `packages/` or `plugins/` public export changes; JSR audit and publish gates are N/A.
- Relevant doctrine risks are AP-1 (monolithic orchestration), AP-11/AP-25 (side effects outside an
  adapter/edge), AP-18 (snapshot-only tests), and AP-19 (undocumented command requirements).
- Current doctrine verdict is inherited tooling debt, but this additive orchestration does not
  deepen package/plugin debt when it keeps subprocess execution at the command edge and reuses the
  existing CLIs.

## Open questions resolved by the plan

1. Matrix source of truth: checked-in JSON is the reviewable outcome artifact; runtime output uses
   the same typed row shape and may refresh actual evidence deterministically.
2. Overall verdict semantics: required rows may be `pass`, `conditional_pass`, or `fail`; accepted
   interactive evidence and classified credential/auth blocks produce conditional pass with
   residual risks, never an unconditional pass.
3. Promotion semantics: report may recommend `promote`, `promote_with_conditions`, or
   `do_not_promote`; it cannot perform promotion.
4. Evidence retention: only allowlisted summaries, exit codes, timestamps, hashes/identifiers, and
   repository-relative citations are persisted. Raw stdout/stderr, environment values, tokens,
   usernames, host IDs, and session payloads are excluded.

## Research conclusion

The smallest correct change is a finite orchestration/reporting feature. It should call existing
commands through an injected runner, normalize their already-structured results, merge explicit
owner/provenance evidence, redact before persistence, validate all nine required rows, and render a
human report from that validated matrix. No behavior from #576–#581 needs modification.
