use harness

You are the W3-A implementation supervisor for the NetScript 0.0.5 stable release. You own one PR
cluster: **#1326 — `DurableStreamProducer` permanently drops writes after an initial connection
failure; reconnect is never attempted.** Priority p0.

## SKILL

- `netscript-harness` — operating model, slice discipline, evaluator separation
- `netscript-doctrine` — you are changing `packages/plugin-streams-core/**`. Contract first, then
  implementation, then tests. The package carries **accepted AP-13 console-warning debt** and
  **streams connector convergence debt** — cite them, do not deepen or generalise from them
- `aspire` — isolated AppHost, resource health, correlated OTEL, owned cleanup
- `netscript-tools`, `netscript-deno-toolchain`, `netscript-pr`
- `jsr-audit` — this is a published package

Read the inlined shared contract below in full. It is part of this brief.

## Identity

| Field     | Value                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| Lane      | `normal_implementation` — Codex · OpenAI · GPT-5.6 Sol · medium (justified: runtime semantics plus telemetry proof) |
| Worktree  | `/home/codex/repos/ns005-w3a`                                                                                       |
| Branch    | `fix/streams-durable-producer-reconnect`                                                                            |
| Base      | `origin/main@aa8e151e6` — the head `0.0.5-canary.17` was cut from                                                   |
| Slice dir | `.llm/runs/release-0.0.5--orchestration/slices/w3-a-1326/`                                                          |
| PLAN-EVAL | Claude · Fable 5, separate session, launched by the orchestrator — **mandatory before implementation**              |
| IMPL-EVAL | Claude · Fable 5, separate session, launched by the orchestrator                                                    |

## Your dependency is satisfied — build on it, do not redesign it

#1329 merged as `aa8e151e6` and shipped the **versioned SSE and OTEL envelope** you must build on.
Read it before planning; it is the contract, not a suggestion:

- `bindStreamEventSourceV1` with named `data` / `control` events
- an **opaque committed offset token** used for reconnect — the contract states offsets are opaque
  ordered tokens and are **never parsed**. Do not do arithmetic on them
- a derived heartbeat requirement, and a malformed control proven non-retryable without replay
  advancement
- a replay snapshot, and correlation/trace identity stable across replay
- `streamClosed` as the terminal signal

If you find the envelope genuinely insufficient for bounded reconnect, that is a finding to raise
before implementing — not a second contract to invent.

## The defect

Read #1326 in full (`gh issue view 1326 --repo rickylabs/netscript`) and re-verify every claim
against the worktree. Quote its acceptance rows into your plan from the live body.

The producer drops writes permanently after an initial connection failure and never attempts
reconnect. Your PLAN-EVAL for #1329 already established the shape of what a reconnecting consumer
needs; you own the **producer** side of that story.

## Mission

1. **Contract first.** Define the producer's reconnect, readiness, buffering and shutdown semantics
   as an explicit contract before writing implementation: what is retried, what is bounded, what is
   dropped and when a caller learns about it. Silent data loss is the defect — a fix that merely
   moves where writes vanish is not a fix.
2. Cover the failure modes #1326 names: initial outage, mid-session outage, ordering under
   reconnect, buffer overflow, cancel/stop during retry, and recovery.
3. **RED-first, and show the RED.** A test that passes both before and after your change proves
   nothing. For each behaviour, record the pre-fix failure with its raw exit code.
4. Correlated OTEL across the reconnect boundary — a trace that survives the outage is the evidence
   that the recovery is real rather than a fresh unrelated session.
5. Gates: focused tests, `doc:lint` over the full export map if exports move, `publish:dry-run`,
   scoped check/lint/fmt, `quality:gate`, `arch:check`, then the serialised one-pass
   `scaffold.runtime` — **request the token; do not start it.**

## Boundary

`behavior.otel.stream-consumer` and `behavior.otel.traces` are currently **deferred** out of the
critical `scaffold.runtime` selection, owned by **#1398** (job executions are never published to the
durable stream — root cause is missing `setMutationHook` wiring in the `bin/runtime.ts`
entrypoints). That deferral is not yours to fix and not yours to widen. If your work makes those
gates passable, say so — do not re-enable them unilaterally.

Open the draft PR with `Closes #1326` only when every acceptance row is truthfully tickable.
