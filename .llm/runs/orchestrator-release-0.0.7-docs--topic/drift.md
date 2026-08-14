# Drift — topic-docs-0.0.7

Append-only.

## 2026-08-15 — Sonnet-canary journal superseded by the Opus 5/high supervisor (resolved)

The topic-local record committed at `f6ee57afa` was written by the reconciliation-only Sonnet 5/low
replacement canary. It recorded this lane's supervisor route as "native Claude Sonnet 5, low effort"
and dispatch order 6's evaluator route as "Claude Sonnet 5, `claude-sonnet-5`, effort low".

Both values are superseded. The owner override recorded at `2026-08-14T22:41:15Z` in
`briefs/reset-gates/dispatch.json` (`ownerOverride.supersedes`) restores native Claude Opus 5/high
for every topic orchestrator and sets order 6's evaluator to native Claude Opus 5 at **low** effort.
The coordinator's `supervisor.md` and `context-pack.md` classify the Sonnet canaries as historical
evidence that dispatched no leaf or evaluator, not as active controllers.

Disposition: rewrote `supervisor.md` and `context-pack.md` in this turn to the current central
values and added the missing attachment proof. No live repository, PR, issue, label, or
cluster-state fact was changed. This is a stale local-artifact correction, not a divergence between
reality and the central dispatch set.

## 2026-08-15 — no reality-vs-dispatch drift found

Every fact checked against the coordinator's central record matched exactly: `main`
`01e0960494c95ce56eb35892c211a095eb13e6ed`; topic worktree clean on
`orchestrator/release-0.0.7-docs`; leaf worktree clean at `d35cbca30`; PR #1652 open/draft/mergeable
at head `d35cbca30872d1f55118d63437638e93270c2ac3` with milestone `0.0.7` and exactly one `status:`
label (`status:plan-eval`); `agentic:pr-checks` reports PASS with zero current failures; no Docker
containers, no resource lease, no live evaluator, and no rival controller at either worktree.

## 2026-08-15 — leaf `context-pack.md` records a stale label (noted, not corrected)

The leaf's own `context-pack.md` states PR #1652 carries "exactly one `status:plan`". The live label
is `status:plan-eval` — the coordinator restored it when it interrupted the advisory-PASS S1 resume
(coordinator `supervisor.md`, drift entries `2026-08-13T23:55` and `2026-08-14T00:02`). The live
label is correct and the lifecycle invariant of exactly one `status:` holds.

Disposition: left unmodified. The leaf run dir belongs to the leaf generator, and `d35cbca30` is the
immutable head the pending PLAN-EVAL evaluates; a supervisor edit there would move the evaluation
surface. Fold the correction into the leaf's next authorized commit after the gate.
