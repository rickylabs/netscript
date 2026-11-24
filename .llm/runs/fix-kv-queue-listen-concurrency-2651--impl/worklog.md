# Worklog: Local Deno KV queue listener concurrency and transient persistence recovery (#2651)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-kv-queue-listen-concurrency-2651--impl` |
| Branch         | `fix/kv-queue-listen-concurrency-2651` |
| Issue          | #2651 — implementation PR; body carries `Closes #2651` |
| Classification | implementation |
| Archetype      | `packages/queue` (builder confirms archetype against `.llm/harness/archetypes/`) |
| Scope overlays | `SCOPE-service.md` only if worker settlement in `plugins/workers` changes |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: […] providerInstanceId antigravity, model gemini-4-neon, options {thought_level:'xhigh'} for N2 #2651, […] N5 #2653, #2146 and #451. […] If Antigravity is out of quota or unavailable, report before falling back. No silent switches.
>
> […] For Neon builds Codex Sol independent review is authorized, […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `antigravity`, model `gemini-4-neon`, options `{thought_level: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | Google |
| IMPL-EVAL | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}`, a separate session (OpenAI vs Google) | separate session | OpenAI |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — the issue's expected behavior fixes the contract (whole-delivery bound, bounded retry only for known-uncommitted writes, CAS refusal stays a conflict, no blind replay). Record the retry policy as a locked decision in `## Design` before code.
- IMPL-EVAL loop: feature row — at most 5 rounds, owner notified after round 3. Every new head after changes is re-gated.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- The file-backed Deno KV listener honors `listen(handler, { concurrency })` for **whole deliveries**, including cancellation and drain.
- A recoverable, known-uncommitted file write (transient SQLite busy) settles within a bounded retry policy. A refused CAS remains a conflict. An unknown commit outcome never triggers a blind replay.
- No false dead letter and no repeated successful external effect. Preserve the pause, acknowledgement and redelivery semantics merged in #2645.
- Synthetic regressions from the issue: peak active handlers = 1 for `concurrency: 1` with two messages; transient busy on one settlement write; CAS refusal; ambiguous write outcome; a provider effect counter.

### Boundaries and shared seams

- No Redis adapter edits: `packages/kv/adapters/redis/**` and related Redis queue code are owned by active #2649.
- No dependency or lock edits.
- Ask the coordinator before touching another lane's files or `plugins/workers` beyond settlement wiring.

### Gates

- Scoped check (`--unstable-kv`)/lint/fmt/test over `packages/queue` and any touched root; the new regressions must fail on `main` and pass on the branch.
- `deno task quality:scan`, `deno task arch:check`, `deno task release:preflight`; `deno task publish:dry-run` if a public export changes.
- Scaffold runtime gate (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, Docker only via `mise exec -- docker`) if the change reaches the scaffolded workers runtime path; otherwise record N/A with the reason.

## Design

Builder records this section before creating implementation files (`workflow/run-loop.md` § 3b).

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |

## Drift

See `drift.md`.
