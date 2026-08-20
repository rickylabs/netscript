# Supervisor — polyglot-protocol-rfc (run 5, RFC-5)

| Field | Value |
| --- | --- |
| Run id | `claude-harness-profile-rfc-benchmark-shzhgv--polyglot-protocol-rfc` |
| Branch | `claude/harness-profile-rfc-benchmark-shzhgv` (restarted from `origin/main` @ 9634735, post-#1686) |
| Supervisor model | Fable 5 (cloud container session, same session as runs 1–4) |
| Host | Claude Code Remote cloud container (Ubuntu 24.04, 4-core; run-1 environment manifest lineage) |
| Archetype | ARCHETYPE-3-runtime-behavior + SCOPE-docs overlay (RFC + research + focused spikes in run dir); any framework-source slice re-gates under the touched package archetype |
| Deliverable | `rfcs/0000-polyglot-task-protocol.md` (working title) + reverse-engineering research corpus + measured transport/lifecycle spikes |

## Mission (owner brief, 2026-08-20)

Runs 1–4 measured *execution*; they inherited the polyglot contract as a fixed seam and never
challenged it. RFC-5 challenges it: evolve polyglot tasks from "foreign language runner" (black
box) to ecosystem citizens. Owner-named pillars: **interoperability with the NetScript ecosystem,
observability, communication layer, error & lifecycle management** — at an empirical, global,
cross-language, generic-API level. The RFC also treats existing engine caveats (the task engine
was consolidated but never RFC-challenged since first design): D-4 trace-env drop, stdout-hijack
result channel, untyped `TaskResult`, unvalidated fallback parsing (Zod it), attempt/idempotency
opacity, one-shot-only protocol.

Agreed framing (owner-ratified in chat): **protocol-first, not SDK-first** — one versioned wire
protocol with tiered conformance (Tier 0 = today's env+last-line contract stays valid; Tier 1 =
structured envelope: trace in, framed result/error/log events out; Tier 2 = long-lived worker
mode: handshake, capability negotiation, heartbeat, cancellation, progress, ecosystem callbacks).
Per-language SDKs are thin shims; a language-agnostic **conformance test suite is the contract**.
Architecture follows the repo's port/adapter pattern (auth-plugin precedent: core package holds
ports + protocol, per-language/per-transport adapters live in separate packages — no language
specifics in core).

## Lane assignments (owner overrides recorded)

| Lane | Assignment |
| --- | --- |
| Research/synthesis | Fable 5 supervisor + parallel research sub-agents (extracts to `.llm/tmp/docs/`, cited in research.md) |
| Spikes/benchmarks | Fable 5, in-run-dir harness (reuse run-1 series harness lineage); no `packages/`/`plugins/` mutation in spike slices |
| RFC authoring | Fable 5 |
| Implementation (if any framework slice lands in this run) | **Fable 5 (owner override, 2026-08-20)** — deviates from the WSL-Codex-implements default in CLAUDE.md; recorded here per lane-policy override rule |
| PLAN-EVAL | **Required** (decision-heavy protocol design — not N/A this time). Cloud automation route: owner applies `status:plan-eval` dispatch on the draft PR; separate session |
| IMPL-EVAL | Cloud draft→ready OpenHands automation (as runs 1–4); separate session |
| Additional adversarial pass | Owner-conducted Codex GPT 5.6 Sol Max review of the RFC + complementary docs/tests (on top of, not instead of, the formal evals) |

## Follow-up scope (owner, 2026-08-20)

- Once RFC-5 is ready, **revisit RFCs 1–4** (scriptc, rust-workers, dotnet, golang) with
  per-language citizenship deep-dives against the protocol (the "citizenship addendum" pattern) —
  a follow-up slice/run after RFC-5 stabilizes, not part of the initial RFC-5 draft.
- Research lane: owner authorized **Claude dynamic workflows** with the split ruled 2026-08-20:
  **Opus 5 medium agents aggregate sources only**; **Fable agents analyze / reverse-engineer /
  deep-dive**. Workflow is generator-side research tooling only; evaluator separation unchanged.
- Research corpus destination (owner, 2026-08-20): the aggregate output (raw extracts + per-group
  analyses) lives **in this run dir** under `research-sources/` — agents write to the
  `.llm/tmp/docs/` scratch first, and the synthesis slice relocates everything here so the corpus
  is committed with the run and citable by path from `research.md`.

## Process corrections carried into this run

- **Completeness probe** (lesson from the runs-1–4 miss): plan.md must pre-register, alongside the
  verdict criteria, an explicit out-of-scope register; every eval prompt we control asks "what did
  this artifact treat as out of scope that the requester would consider the point?"
- Bugs are bugs: defects found in the engine (D-4 lineage, stdout hijack) get issues filed and are
  not held hostage by the RFC timeline.
- Deferred-push protocol not needed at start (no open series PR); draft PR opens with the first
  bootstrap commit per run-loop.

## Push policy

Commit by slice, push immediately, per-slice PR comments on the draft PR (the commit trail).
