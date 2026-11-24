# Worklog: Streams subscriber capacity bench and push-vs-poll decision table (#2650)

## Run Metadata

| Field          | Value |
| -------------- | ----- |
| Run ID         | `docs-streams-subscriber-capacity-2650--impl` |
| Branch         | `docs/streams-subscriber-capacity-2650` |
| Issue          | #2650 — implementation PR; body carries `Closes #2650` |
| Classification | implementation |
| Archetype      | Archetype 5 Streams documentation and unpublished repository tooling |
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

- **Entry point.** `deno run -A --frozen tools/streams-subscriber-capacity/main.ts` from the
  repository root on Linux. The root is unpublished, `tools/` is outside workspace member
  roots, and neither the Streams plugin nor core publish allowlist reaches it.
- **Vocabulary.** A phase records stream and reader counts, append schedule, reader commits,
  reconnects, delivery gaps, sampled companion resources, and cleanup. A commit is a numbered
  change followed by its SSE control, with the opaque offset retained for reconnection.
- **Ports.** Reuse the public Streams service factory, producer, and SSE v1 parser/reducer.
  Use the HTTP client response version and Linux procfs for observations. A bench-process-only
  startup wrapper captures the pinned upstream server instance once for response and waiter
  snapshots. No service or plugin hook changes.
- **Constants.** Reader counts 1, 8, 32; at most eight streams; one aggregate round-robin
  append each second for 60 seconds; single stream, spread, and spread with one delayed reader.
  Each phase has a four-minute deadline and the run has a 35-minute deadline, plus a bounded
  cleanup window. The slow reader delays processing each SSE frame by 250 ms.
- **S1.** Add the harness, README, and focused reader tests in
  `tools/streams-subscriber-capacity/`. Prove compilation, lint, formatting, reader commit
  behavior and an isolated short smoke.
- **S2.** Run all nine phases and commit `results.json` in the run directory. Update
  `docs/site/durable-workflows/streams.md` and the live-dashboard cache-first guide. Prove
  the published figures against the report and run the docs and release preflight gates.
- **Deferred scope.** Other transport, topology, traffic and authorization configurations,
  SDK transport fixes and any Streams deployment or API changes.
- **Contributor path.** The benchmark README gives the command and metric definitions.
  Adjust workload constants in the entry point and inspect the independent reader and
  companion modules when changing measurement behavior.

PLAN-EVAL: N/A. The issue specifies the workload and evidence, and the bench consumes existing
APIs without changing contracts or deployment. Independent IMPL-EVAL stays with the coordinator.

## Progress Log

| Time | Slice | Step | Notes |
| ---- | ----- | ---- | ----- |
| 2026-11-24 | S0 | bootstrap | Verified HEAD `b9dca84d0327d45d04e32e8b7420baef9f59ba71` and its recorded main parent. Read issue #2650 with no comments. |
| 2026-11-24 | S1 | design | Inspected Streams service, SSE contract, SDK surfaces and package publication boundaries. Invoked checkout MCP `find_guidance` plus `search_docs`; verified suggested APIs against source and `deno doc`. |
| 2026-11-24 | S1 | verification | Scoped check, lint and format processed all five TypeScript files. Three reader regression tests passed. Both 32-reader smoke layouts completed with all deliveries and verified cleanup. See commands below. |
| 2026-11-24 | S1 | reconcile | #2650 has three exact boxes under `Acceptance`. No issue mutation is required. The draft close mapping will use the full workload and the two documentation sections. |

| 2026-11-24 | S2 | measure | The fixed nine-phase command completed in 11 min 54 s. It recorded 3,180 committed deliveries, zero gaps, zero reconnects, and verified teardown. Copied stdout byte-for-byte to `results.json`. Independently checked the expected reader set and committing control per revision, percentiles, resource summaries, timing and teardown counters. |
| 2026-11-24 | S2 | document | Added measured workloads and source/standards-based browser and resource limits to Streams. Added a screen wakeup and authorization decision table to the SDK cache-first guide. Recorded the exact cleanup sequence in the benchmark README. |
| 2026-11-24 | S2 | reconcile | Kept the implementation in draft for independent review at the final head. The scoped results back all three exact #2650 acceptance boxes. |

## Commands and exit codes

- `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root tools/streams-subscriber-capacity --ext ts,tsx --pretty` — 0, five files, wrapper passes `--unstable-kv`.
- `deno run --allow-read --allow-run .llm/tools/run-deno-lint.ts --root tools/streams-subscriber-capacity --ext ts,tsx --config <scratch>/lint.json --pretty` — 0, five files. Config copies `lint.rules` from root `deno.json` without its `tools/` exclusion. The first invocation using root exclusions exited 2 without processing any files.
- `deno run --allow-read --allow-run .llm/tools/run-deno-fmt.ts --root tools/streams-subscriber-capacity --ext ts,tsx --pretty` — 0, five files.
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all tools/streams-subscriber-capacity/reader_test.ts` — 0, three passed.
- `deno run -A --frozen tools/streams-subscriber-capacity/main.ts --smoke` — 0, two short 32-reader trials with zero gaps and reconnects. Smoke telemetry is exploratory.
- `deno run -A --frozen tools/streams-subscriber-capacity/main.ts > .llm/tmp/streams-subscriber-capacity/full.json` — 0. Nine trials at 60 offered writes each. The 32-reader single-stream trial acknowledged its last write 216.1 s after the start of the 60 s offer window. Other results, per-delivery timings, and resource samples are in `results.json`.
- `cmp .llm/tmp/streams-subscriber-capacity/full.json .llm/runs/docs-streams-subscriber-capacity-2650--impl/results.json` — 0. The JSON path and address scrub check and independent per-phase calculations passed.
- `deno task docs:links` — 0, 105 documents, zero broken links or anchors.
- `deno task docs:accuracy` — 0.
- `deno task release:preflight` — 0, all four text-import, attribute, file URL, and self-import checks passed.
- `deno run --allow-read --allow-write --allow-run .llm/tools/run-deno-test.ts -- --allow-all plugins/streams/tests/docs/native-event-source-example_test.ts` — 0, the edited guide example compiled.
- `git diff --check` — 0.
- Scaffold runtime, quality/architecture, and JSDoc example gates are N/A. This slice is site documentation and a standalone, unpublished repository benchmark, outside scaffold generation, framework source and published JSDoc.

## Cleanup measurement boundary

Source-inspected in `tools/streams-subscriber-capacity/main.ts`: abort and join the readers,
explicitly close each durable stream to wake remaining waits, snapshot until the upstream
response and waiter counts reach zero, then delete those streams. The measured counts apply
after reader cancellation and explicit stream close. Last-subscriber reclamation on a
still-open idle topic is outside the measured workload.

## Decisions

| Decision | Reason | Source |
| -------- | ------ | ------ |

| Source and standards evidence for browser pooling and protocol negotiation | Chromium socket pool and Firefox connection preference are browser-side evidence. RFC 9113 and RFC 9114 specify negotiation. Each benchmark reader owns an independent client as implemented in `tools/streams-subscriber-capacity/reader.ts`. | Streams Known limitations, Browser connection limits |

## Drift

See `drift.md`.

## Phase A investigation

Owner-authorized root-cause investigation of the single-topic fan-out symptom; same builder route.

Use an ignored local probe with the published harness's subscriber and producer paths. Measure
client request dispatch and response, companion ingress and upstream append stages, and reader
committing controls. Compare independent producer and reader processes and reader Agent options
at matched loads. This is investigation evidence for the coordinator's independent review.

Phase A completed locally with repeated one-topic trials, process and connection-pool controls,
and a separate detailed companion trace. The private probes and raw measurements are retained
locally for independent review. This entry records the investigation handoff.

## Phase B causality investigation

The owner authorized matched private controls and one evidenced server-side filing. The light
probe measured per-append SSE touch and synchronous metadata write counts and elapsed time.
The paired original and counterfactual ran at every reader count in both process topologies.
Both 32-reader topologies also restored the original method. The checked-in benchmark
classes ran the inline reproducer against an unmodified companion.

The 18 causal trials completed with 60 revisions each, 18,240 verified reader commits, zero
gaps, zero reconnects, and verified shutdown and temporary store cleanup. Independent
process placement preserved the original behavior. Skipping only the synchronous write
for streams without a sliding TTL removed the backlog, and restoration brought it back.
The per-append stage, retry, and source evidence is in phase-b.md. Native LMDB transaction,
flush, filesystem I/O and scheduler waits remain unseparated.

- `deno task deps:latest --filter '@durable-streams/server'` — exit 0. Stable 0.3.9 matches the pin.
- `deno run --check -A --frozen --ext=ts -` with the inline reproducer from #2661 — exit 0.
- GitHub issue and source searches found no existing report for the same condition. Filed
  #2661 under 0.0.10, with a reference from #2650 and the draft docs PR.
- Scope is the known-limitations note and sanitized run evidence. Scoped TypeScript gates
  are N/A for this tracked Markdown-only change.

### Phase B validation

- Private smoke, matched-suite and report-verification commands — each exited 0.
- `deno task docs:links` — exit 0.
- `deno task docs:accuracy` — exit 0.
- `deno task release:preflight` — exit 0.
- `git diff --check` and `git diff --cached --check` — exit 0.
- [Related issue reference on #2650](https://github.com/rickylabs/netscript/issues/2650#issuecomment-7123584626).
