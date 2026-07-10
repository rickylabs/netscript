# Plan: epic #574 WSL-first agentic runtime

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `rickylabs-epic-574-wsl-agentic-runtime--supervisor` |
| Branch | `rickylabs-epic-574-wsl-agentic-runtime` |
| Phase | `plan` |
| Target | Agentic tooling, runtime environment, routing policy, and rollout |
| Archetype | Group-specific; supervisor is coordination-only |
| Scope overlays | none |

## Archetype

The supervisor run does not implement a product surface. Each child group selects its own profile.
PR 0A (#575) is expected to use Archetype 6 (CLI/tooling) with the runtime lifecycle gates that
cover mobile control, reconnect, cancellation, failure, and rollback.

## Current Doctrine Verdict

N/A at the supervisor level. Child runs must read and record the current doctrine verdict when they
touch package or plugin surfaces.

## Goal

Deliver #575-#582 as dependency-ordered, independently reviewable draft PR layers while preserving
mobile supervision, secret safety, evaluator separation, native WSL execution, and rollback.

## Scope

- Establish the canonical WSL environment in PR 0A.
- Build the desired-state controller, provider profiles, Gemini evidence lane, fallback state
  machine, Codex recovery, canonical policy migration, and rollout canaries in subsequent groups.
- Keep issue, PR, and tracked harness artifacts synchronized after every slice.

## Non-Scope

- Paid/on-demand Fable 5 usage without a new explicit owner authorization.
- Gemini API-key or Vertex authentication.
- New `/mnt/c` execution paths.
- Historical `.llm/runs/**` rewrites.
- Collapsing child issues into one monolithic PR.

## Locked Decisions

| ID | Decision | Rationale |
| --- | -------- | --------- |
| D1 | Follow issue order #575 → #576 → #577 → #578 → #579 → #580 → #581 → #582. | This is the epic's approved dependency and delivery order. |
| D2 | Each child is one branch, native WSL worktree, nested run, and draft PR. | Preserves evaluator and merge boundaries. |
| D3 | PR 0A uses exactly one daemon-attached Codex thread and resumes that thread for steering. | Prevents rival senders and proves mobile visibility. |
| D4 | PLAN-EVAL and IMPL-EVAL use separate OpenHands sessions with required model bindings. | Harness invariant. |
| D5 | Native Windows Claude remains break-glass rollback until rollout approval. | Owner requirement and reversible migration. |
| D6 | Secrets stay in provider-native or machine-local stores and never enter argv, logs, GitHub comments, commits, or artifacts. | Security boundary. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Exact #575 Node installation method | safe to defer to child plan | Must be locked before #575 PLAN-EVAL. |
| Exact Linux-local configuration schema | safe to defer to #576 | #575 only establishes directories and baseline state. |
| OpenRouter profile details | safe to defer to #577 | Blocked by controller contract. |
| Quota classifier and restoration timing | safe to defer to #579 | Blocked by routing profiles. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Duplicate Codex sends create rival workers. | Launcher/status preflight, exactly one launch, same-thread resume only. |
| Unmanaged or skewed app-server interrupts active work. | Passive status first; repair only after active-work checks and anchored PID matching. |
| WSL tool upgrades break Deno/Codex. | Version-aware idempotent doctor plus before/after canaries and rollback evidence. |
| Credentials leak through installation or auth commands. | Interactive provider sign-in only; no tokens in argv or tracked output. |
| Policy docs diverge from executable routing. | #581 updates one canonical table plus launcher enforcement and generated mirrors. |
| Evaluator or workflow mutates unrelated files. | Explicit file-set and lock-hygiene review before accepting evaluator commits. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Harness | PLAN-EVAL for every child | Committed `PASS` before implementation |
| 2 | Static | Scoped check/lint/fmt wrappers | Exit 0 on owned TypeScript surfaces |
| 3 | Agentic | Agentic unit tests and Claude-surface validation when touched | Exit 0 |
| 4 | Runtime | Child-specific native WSL mobile, reconnect, provider, and rollback canaries | Captured commands, exit codes, and classifications |
| 5 | Final | #582 complete rollout matrix | Owner-ready promotion report |

## Dependencies

- Owner-approved issue contracts #574-#582.
- WSL user `codex`, native ext4 worktrees, managed Codex app-server daemon.
- GitHub authentication resolved without exposing the token.
- OpenHands Actions/VPS evaluator path.

## Drift Watch

- Model availability or subscription status changes.
- Codex daemon/app-server version or managed state changes.
- Any child issue scope that crosses its approved PR boundary.
- Any need for a second sender in the same WSL worktree.

