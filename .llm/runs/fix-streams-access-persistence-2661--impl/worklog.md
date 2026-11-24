# Worklog: Keep per-reader access persistence off the Streams append path (#2661)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `fix-streams-access-persistence-2661--impl` |
| Branch         | `fix/streams-access-persistence-2661` |
| Issue          | #2661 — implementation PR; body carries `Closes #2661` |
| Classification | implementation |
| Archetype      | Streams companion service (`plugins/streams/services`); builder confirms against `.llm/harness/archetypes/` |
| Scope overlays | `SCOPE-service.md` |
| Milestone      | `0.0.10` |

## Coordinator bootstrap (2026-11-24)

Baseline `main` = `87965d800b7d61312e8612c82bdb0cb98bdf5b29`; `v0.0.10-canary.4` = `7c51c7efb64cbf65c567232245c13fea69f45fe4`.

### Owner model authorization

> The owner explicitly authorizes a new IMPLEMENTATION draft PR for NetScript bug #2661 now, separate from benchmark/docs PR #2660. Launch one issue-bound gpt-6.2-sol xhigh builder via delegate_task in a fresh NetScript-project worktree off current origin/main. […]
>
> […] Independent IMPL-EVAL at the final pushed SHA by a different agent/family from Sol, including a fresh regression run and expiry checks; revise through the normal process if necessary. […]

Quoted verbatim from the owner's directive for this lane. `[…]` marks elided operational text (sandbox, hygiene and reporting instructions) that does not change the route; nothing that governs the model, effort or review independence is elided.

### Route record

| Role | Requested identity | Transport | Family |
| ---- | ------------------ | --------- | ------ |
| Builder | providerInstanceId `codex`, model `gpt-6.2-sol`, options `{reasoningEffort: 'xhigh'}` | T3 `delegate_task`, isolation `worktree` | OpenAI |
| IMPL-EVAL | Claude Opus 5.5 (`claude-opus-5-5`, effort `xhigh`), the batch coordinator acting as a different-family reviewer (Anthropic vs OpenAI) | separate session | Anthropic |

- Workload tier: `feature`. The privileged `complex`/`architecture` rows are not authorized for
  this lane and are not selected.
- PLAN-EVAL: N/A — the defect, its measured cause and the seam (the existing `FileBackedStreamStore` subclass) are fixed by #2661; record the expiry/renewal semantics and the persistence bound as locked decisions in `## Design` before code. Escalate any unavoidable public-contract decision to the coordinator.
- IMPL-EVAL loop: feature row — at most 5 rounds, owner notified after round 3. Every new head after changes is re-gated.
- No implementation lane self-certifies. Automated green gates are evidence, not review.
- Fallback: none without an owner report first. If the builder or reviewer provider is unavailable
  or out of quota, the coordinator reports before any fallback; no silent model or provider switch.

### Scope

- On streams without sliding expiry (no TTL, or fixed absolute expiry only), skip per-reader access-time persistence entirely.
- With sliding expiry, keep recent access visible to expiry decisions and move renewal persistence off the producer acknowledgement's critical path: coalesced, asynchronous, with a documented staleness bound. The append acknowledgement never awaits per-reader metadata.
- Preserve documented retention semantics exactly: reads and appends renew sliding TTL; HEAD and re-opening the same stream with PUT do not; absolute expiry stays fixed (`docs/site/durable-workflows/how-to/bound-stream-retention.md`). Preserve boundary behavior and restart durability; account for pending renewals during reads/expiry, deletion/recreation (never overwrite a newer generation), concurrent metadata updates, clean shutdown and write errors. Establish the current restart contract and document the actual bound; do not silently change the lifetime of a valid stream. No speculative public API.
- Runnable one-topic regression: real isolated file-backed companion, 32 verified live SSE readers, 60 numbered updates at one per second, p95 enqueue→last reader's committing control strictly under 1,000 ms, zero gaps, bounded cleanup, explicit PASS/FAIL; default no-sliding case plus the sliding path; baseline red, fixed head green.

### Boundaries and shared seams

- #2660 owns `tools/streams-subscriber-capacity/**` and the Streams guide edits; do not edit those files or carry its docs/harness history. Use an issue-owned regression seam, or run #2660's benchmark from its pinned revision and explain the CI integration.
- Keep the #2660 guide untouched; record a post-merge docs follow-up referencing #2660 (no shipment claim).
- No dependency or lock changes, no patching of the upstream package, no `.github/`, release, runtime/infra, ops or protected-owner edits.
- Ask the coordinator before touching any other lane's files.

### Gates

- Scoped check (`--unstable-kv`)/lint/fmt/test over `plugins/streams/services` and any touched root; new unit tests for renewal semantics, absolute expiry, restart, deletion/recreation and shutdown.
- The one-topic regression: baseline red at `origin/main`, green at the exact final head, with variance and operating conditions recorded.
- `deno task quality:scan`, `deno task arch:check`, `deno task release:preflight`; `deno task publish:dry-run` if a published surface changes.
- Scaffold runtime gate (`deno task e2e:cli run scaffold.runtime --cleanup --format pretty`, Docker via the project mise config) because the Streams companion ships in scaffolds; record the result.

## Design

Archetype 5 (Plugin Package), with the Service overlay. The doctrine verdict is Keep. The companion
owns native storage composition, and the existing core producer, retention policy, and SSE replay
contracts supply the workload and its assertions. The public service entry points and protocol
headers retain their current shapes. No sibling declarations or permissions are needed.

- Native reads and appends renew sliding TTL at the current upstream call sites. HEAD and same-stream
  PUT never renew. The native expiry check keeps its inclusive boundary, absolute expiry and fork
  behavior. The file adapter skips access writes for other policies.
- One pending access per path and native segment generation participates immediately in live
  expiry. After a 25 ms batching interval, one asynchronous LMDB worker submits the latest
  access per topic. A blocked writer holds one batch and one current access per topic.
- Before this change, native `touchAccess` commits access inline and same-boot restart recovers
  the committed metadata. The documented storage claim covers orderly restart. The coordinator
  rejected allowing a completed read to lose its renewal on abrupt exit. The front proxy now
  releases a successful GET (including 204 and 304) or an SSE chunk only after that read's
  renewal or a later access has committed. The coalescing staleness of a completed read on
  process restart is zero. The gate applies to the native SSE wakes that renew TTL today.
- The native append transaction writes its access with its offset and producer state. An
  acknowledged duplicate, which has no new append transaction, gets its own access write.
  Neither path awaits the read queue. Native LMDB still owns storage-level contention.
- Transaction callbacks check the native segment generation. Native metadata updates inherit
  the current persisted access so an earlier append snapshot cannot erase a newer read.
  A failed batch fails waiting reads, retains the live access, logs and retries it. Shutdown
  attempts a final flush and reports failure through the native shutdown path.
- S1 adds an issue-owned regression fixture and a test in `plugins/streams/services/src/tests/`.
  S2 adds the renewal compatibility adapter at `bounded-file-store.ts`, focused storage and
  protocol tests, and the storage contract in the plugin README. S3 records the full evidence
  in this run. Each slice keeps this log and the context pack current.
- Start at the bounded store adapter when adjusting compatibility with the upstream pin. Extend
  the retention tests and the companion regression before upgrading the pin. Upstream issue #420
  tracks the supported storage extension seam. The guide follow-up belongs after the PR lands.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Coordinator bootstrap commit: `supervisor.md`, `worklog.md`, `drift.md`. |
| 2026-11-24 | S0 | rechecked | Verified the bootstrap SHA and its parent matched `origin/main`. Inspected the file lists of all 24 open PRs, including paginated files for #2538. No PR touches `plugins/streams/` or `packages/plugin-streams-core/`. #2660 edits its own benchmark and guide. |
| 2026-11-24 | S0 | researched | `deno task deps:latest --filter '@durable-streams/server'` exited 0 with 0 behind / 1 total. Upstream main `461b40267aabd644558f9b19dbb9507dd5f691cf` still calls `putSync` in `file-store.ts:661–670`. |
| 2026-11-24 | S1 | fixture | Added the one-topic production companion workload and ordinary Deno test discovery. Scoped wrapper check, lint and format exited 0 on the three workload files. Baseline trials started from a Git archive with just the test utilities copied in. |
| 2026-11-24 | S1 | reconcile | Issue remains open without checkbox acceptance or comments. The draft body links the issue and tracks pending gates and independent evaluation. |
| 2026-11-24 | S2 | revised design | Coordinator rejected the lost-renewal crash window for completed reads. The implementation now gates read delivery at the existing front proxy and writes confirmed append access in the native append transaction. |
| 2026-11-24 | S2 | tested | Scoped test wrapper passed 16 expiry tests, including SIGKILL after a successful sparse read or append, SIGKILL with an unfinished read, graceful shutdown, and a delayed read batch with 99 newer touches and an independent append acknowledgement. |
| 2026-11-24 | S2 | benchmark | The driver closes its owned topic only after measurement, then drains the companion and deletes the temporary store. The startup reference used for teardown is restored before the workload starts. The existing CI discovery selected the fan-out module for test-5 and expiry module for test-6. |
| 2026-11-24 | S2 | reconcile | Draft #2662 carries `Closes #2661`. Final-head measurements, scaffold results, and CI state are recorded in its Validation section. |

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |

## Drift

See `drift.md`.
