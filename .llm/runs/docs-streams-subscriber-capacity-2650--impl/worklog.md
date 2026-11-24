# Worklog: Streams subscriber capacity bench and push-vs-poll decision table (#2650)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `docs-streams-subscriber-capacity-2650--impl` |
| Branch         | `docs/streams-subscriber-capacity-2650` |
| Issue          | #2650 — implementation PR; body carries `Closes #2650` |
| Classification | implementation |
| Archetype      | Streams plugin documentation + repo benchmark harness (builder confirms against `.llm/harness/archetypes/`) |
| Scope overlays | `SCOPE-docs.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> Owner explicitly authorized T3 dispatch, with rationale for Neon: it first found or co-found these gaps. Exact public builder model settings: providerInstanceId codex, model gpt-6.2-sol, options {reasoningEffort:'xhigh'} for N1 #2650 and N4 #2652; […]
>
> […] You, Opus, can review the Sol builds as a different-family agent; […]

Quoted verbatim from the owner's batch directive. `[…]` marks elided text that concerns lanes or parties outside this run's public record; nothing that governs this lane is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | OpenAI |
| IMPL-EVAL | Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI) | separate session | Anthropic |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — the issue fixes the workload and acceptance; no public API or contract changes. Escalate to the coordinator if the bench needs a plugin source hook.
- IMPL-EVAL loop: feature row — at most 5 rounds, owner notified after round 3. Every new head after changes is re-gated.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- A runnable, bounded benchmark for one isolated **file-backed** Streams companion: one synthetic stream; 1, 8, then 32 readers, each awaited on its opening control; one small numbered revision per second for one minute; delivery verified through the committing control; repeat at the same counts across up to eight streams and with one slow reader; close every reader.
- Explicit timeouts and cleanup. Report runtime, resources, storage, transport, workload, completed trials, delivery gaps, reconnects, and append-to-last-reader latency, plus a cleanup verification.
- Publish **measured results only**, labelled as the tested workload, never as a product-wide maximum. Mark every claim measured or source-inspected.
- Docs: Durable Workflows → Streams → Known limitations, and the SDK cache-first query guide decision table (immediate push to idle screens / bounded polling / callable stale-while-revalidate). Explain what wakes an already-open screen. Keep authorization fresh in every example.

### Boundaries and shared seams

- SDK source is out of scope: #2611 owns the SDK GET transport/dedup repair. Docs-only references to existing SDK APIs.
- #2146 is drafting an authorizing stream proxy design concurrently. Do not document a proxy API that does not exist on `main`.
- #2654 (producer-scoped connection configuration) is issue-only. Do not implement it.
- Ask the coordinator before touching another lane's files or any `plugins/streams` source.
- Public docs carry no process language (no owner/evaluator/run references).

### Gates

- Scoped `run-deno-check`/`run-deno-lint`/`run-deno-fmt` (`--ext ts,tsx`) over every changed TypeScript root; `run-deno-test` for any bench helper tests.
- The bench itself, run bounded, with its raw result file committed under this run dir (repo-relative paths only).
- Docs gates: `deno task docs:links`, `deno task docs:accuracy`, `deno task release:preflight`; `deno task docs:jsdoc-examples` if a JSDoc example changes.
- `deno task quality:scan` and `deno task arch:check` if `packages/**` or `plugins/**` change.
- Scaffold runtime gate: N/A unless scaffold output changes (record the reason).

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
