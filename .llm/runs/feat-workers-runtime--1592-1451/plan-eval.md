# PLAN-EVAL — feat-workers-runtime--1592-1451

- Plan evaluator session: separate Claude/Fable 5 session, 2026-08-31 (native opposite-family
  against the Codex-authored plan, per `lane-policy.md`)
- Run: `feat-workers-runtime--1592-1451`
- Surface / archetype: Archetype 3 (`packages/plugin-workers-core`), Archetype 5 connector
  (`plugins/workers`), Archetype 6 edge (`plugins/workers/src/cli`, consumed via the CLI installed
  generator host)
- Scope overlays: none beyond archetype authority; plan-only adjudication

Adjudicated against plan head `8f67dddbdbdd477298f6f45d00c789eeba8b09b5` (single docs commit on
baseline `9fbc23172`). `main` has advanced by exactly one commit (`60ae56af0`, #1835 Aspire/Vite key
normalization), which touches none of `packages/plugin-workers-core`, `plugins/workers`,
`packages/config`, or the CLI generate feature — verified with `git diff --stat`; the research is
current. Implementation branches must still rebase onto `main` before landing.

Every load-bearing research claim was re-verified independently against the tree, not carried in:

| Claim | Verification result |
| --- | --- |
| `WorkerOutboundMessage`/`JobProgressMessage` have no consumer | CONFIRMED — repo-wide grep finds only declarations in `packages/plugin-workers-core/src/runtime/messages.ts:38,68-72` and re-exports in `runtime/mod.ts`. Core `job-dispatcher.ts` `dispatch()` resolves the handler and calls it directly; `InProcessJobRunner.dispatch()` delegates to it. No producer anywhere. |
| Pool invents a UUID; options ignored | CONFIRMED — `plugins/workers/worker/job-runner-pool.ts:30-35` constructs exactly one `InProcessJobRunner` and never reads `poolSize`/`workerUrl`; `:53` mints `crypto.randomUUID()` for progress; `:61-63` wires it into `ctx.reportProgress`. |
| Only the outer dispatcher owns the durable id | CONFIRMED — `plugins/workers/worker/job-dispatcher.ts:74-88` creates the execution, `:131` starts, `:142` runs `executeWorkerJob` (which today receives no execution id), `:165` completes. `executeWorkerJob` → `executeDenoJob` → `workerPool.executeJob` is the only ctx-construction path (`job-execution.ts:51-57`). |
| Execution-state port lacks `progress`; visible behavior cannot persist | CONFIRMED — `worker-options.ts:73-83` exposes `create/start/complete` only; `worker.ts:163-169` installs the logging-only callback and discards the id (`_executionId`); `worker.ts` start log falsely claims "Web Worker pool". |
| No worker-thread transport exists | CONFIRMED — no `postMessage`/`MessagePort`/message listeners anywhere; the `new Worker(` sites in `plugins/workers/bin/runtime.ts:95,140` construct the NetScript `Worker` service class, not a Web Worker. |
| Slice 1 path suffices; six-record no-touch holds | CONFIRMED — `KvExecutionState.progress()` (`state/execution-state.ts:202-211`) goes through `#transition → #save`, and `#save` emits the mutation hook with the full record; the `progressPercent` sites match the six counted declarations (plus `testing/job-fixtures.ts` support data and the `runs.ts` consumer, neither a record declaration). |
| Runtime context narrows the callback; public/domain do not | CONFIRMED — `runtime/runtime-types.ts:30` returns `void`; `domain/job-context.ts:11` and `public/root.ts:137` return `void \| Promise<void>`. D3's async-alignment requirement is real and widening is assignability-compatible. |
| `JobConfig` lags by exactly four fields; D8 defaults are canonical | CONFIRMED — `config/job-config.ts:43-74` omits all four; `domain/job-definition.ts:41,87-89` declares priority `int 0..100` default `50`, retryDelay `int nonnegative` default `1000`, maxConcurrency `int nonnegative` default `1`, persist `boolean` default `true`; the generated literal at `runtime-registry-generator.ts` emits exactly these values. No invented defaults. |
| Generator receives no project policy | CONFIRMED — `GenerateRuntimeRegistriesOptions` is `{manifestPath, profile, projectRoot}`; `appendJobDefinitions` emits hardcoded generic policy; local ids come from `basename(file, '.ts')`; plugin ids come from imported handler exports — matching D6's premise. |
| Root schema preserves plugin sections | CONFIRMED — `packages/config/src/domain/schemas/netscript-config-schema.ts:159` `.passthrough()`; core `WorkersConfigSchema` exists with flat `jobs[]` + `groups[].jobs[]` and the group-topic transform (`workers-config.ts:112-124`), and no flattening rule exists today — D7 fills a real hole. |
| Config seam survives the child process | CONFIRMED BY EXPERIMENT — the installed host runs `deno run --config <projectRoot>/deno.json --allow-read --allow-write <generator>` (`packages/cli/.../installed-runtime-registry-generator.ts:642-656`), which lacks `--allow-env` and `--allow-import`. I reproduced the child conditions under `.llm/tmp/plan-eval-1592/`: a `loadConfig({ cwd })`-style dynamic `import()` of a project `netscript.config.ts` that statically imports `jsr:@std/path` succeeds under read/write-only flags with exit 0. `loadConfig`'s `Deno.env.get` fallback is short-circuited by the explicit `cwd`, so no env permission is required. Published-mode remote static imports follow the same path the current generator entry already uses successfully. This resolves evaluator-checklist item 6 and de-risks stop condition 3. |

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | `research.md`; re-baseline recorded in `worklog.md`/`supervisor.md`; post-baseline drift on `main` checked and irrelevant (above). Spot-checks of all load-bearing findings independently confirmed. |
| Decisions locked | PASS | D1–D8 with evidence-forcing-it plus rejected alternatives (D1), transport-honesty rule (D2), drain semantics (D3), coalescing/replay posture (D4), loading seam (D5), matching keys (D6), precedence (D7), exact schema delta (D8). |
| Open-decision sweep | PASS (manual evidence; Phase A) | The sweep is distributed across `supervisor.md` stop conditions and `plan.md`'s evaluator checklist rather than a dedicated section. I ran the sweep myself (below) and found no open decision that would force rework and was not flagged. |
| Commit slices | PASS | Three slices, ordered (`P ∥ C → G`), ceilings 10/2/7 files each with enumerated expected touch sets, per-slice required tests, and named proving gates. Well under 30. |
| Risk register | PASS (manual evidence) | Risks + mitigations exist as the six stop conditions (`supervisor.md`), the deferred-scope safety rationale, zero-new-diagnostic gates against the recorded doc-lint baselines, and unchanged-lock gates. Material risks (seventh record, matcher ambiguity, second manifest, child resolution, ceiling breach) are all covered. |
| Gate set selected | PASS | Archetype matrix mapping: static gates (scoped check/test/lint/fmt via wrappers), F-5/F-6/F-7 (doc `deno doc`, publish dry-runs, doc-lint zero-new), F-3/F-13 class (`deno task arch:check` + runtime/background-hook tests), runtime validation (plugin workers tests + `scaffold.runtime` E2E once at merge readiness — correct cost policy per AGENTS.md), and consumer-import validation is discharged by the local-source E2E. Supervisor Tier-A slice reviews must additionally run `deno task quality:scan` per harness invariant; note recorded below. |
| Deferred scope explicit | PASS | Thread adapter, `registry-compiler.ts` parity, progress-history/monotonicity/throttling, root-schema ownership, timeout/retry default harmonization — each with safety rationale, and the thread deferral is contract-compatible so no progress rework is triggered later. |
| jsr-audit surface scan | PASS | `deno doc` filters for `JobConfig`/`WorkerOutboundMessage`/`RegisterJobInput`, both doc-lint baselines, and zero-new-diagnostic constraints on touched subpaths. Planned public delta is small and audited: one widened optional callback type, four defaulted schema fields, one narrowed port method, one new generator option. |

## Locked-decision adjudications (the seven)

1. **D1 pool-owned channel — SOUND.** The pool is the only component that both constructs the
   handler `ctx` and sits between the dispatcher (id owner) and the runner (result producer), so it
   is the right per-execution consumer. The plan states the concrete wiring (dispatcher passes
   executionId + async sink through `executeWorkerJob`/`executeWorkerPool` into `executeJob`; pool
   injects the `reportProgress` closure into the ctx it already builds) — and the current code
   confirms exactly one ctx construction point. `RuntimeWorkerPort.dispatch(job, context)` stays
   unchanged: the sink rides in `context`, and the void→async widening is assignability-compatible.
   Log routing through the existing reporter and complete/error settling the existing `JobResult`
   keep the union used without a parallel abstraction.
2. **D2/D3/D4 — SOUND and precise.** `WorkerOutboundMessage` payloads are all structured-cloneable,
   so the host consumer survives a real thread boundary (one advisory for the future adapter:
   `ExecuteJobMessage.jobDefinition` may carry a non-cloneable `handler`, so the inbound side must
   emit definitions with `handler` stripped — record this when the thread slice is planned).
   "Terminally drained" is implementable as written: per-execution promise tail, callback returns
   the tail, pool drains before accepting/forwarding terminal messages, sink failures surface as
   dispatch failures with a named test each. "Not coalesced" is a justified decision (Slice 1
   publishes every transition; the stream is an ordered entity-upsert log; dedupe would invent a
   second model), and #1592's documentation demand is discharged by Slice P's reference-doc file
   plus the explicit replay semantics in D4 (upsert replay to the latest snapshot, intermediate
   percentages observable but not a history API).
3. **In-process honesty — CONFIRMED true of the tree**, including the false "Web Worker pool" start
   log and the ignored `workerUrl`/`poolSize`; D2's correction requirement is real and scoped.
4. **D5 seam — REAL.** Verified against the host command line and empirically reproduced under the
   child's exact permission flags. Validation ownership is correct: `@netscript/config` passthrough,
   core-owned `WorkersConfigSchema` validates once, generic CLI host stays plugin-agnostic, and the
   pure generator receives normalized data. One advisory: if adding the `@netscript/config` member
   dependency turns out to perturb `deno.lock`, allow a reviewed lock delta with rationale rather
   than treating the unchanged-lock gate as a stop condition.
5. **D6 matching — unambiguous for every discoverable file.** Canonical project-relative paths are
   unique per physical module, so path-keyed binding cannot collide; the five enumerated failure
   cases cover basename reuse, rename drift, plugin identity divergence, source mismatch, and
   post-resolution duplicates. Windows separators are normalized on both sides (the host discovery
   already emits `/`-normalized project paths), and a Slice G test pins it. Unconfigured files keep
   today's generic defaults — compatible, not silently reinterpreted.
6. **D7 precedence — TOTAL.** Every mixed population resolves: grouped+flat same identity → grouped
   wins wholesale with a diagnostic; flat-only → kept; same-identity duplicates within either
   collection survive resolution and hit D6's "duplicate configured policies" generation error;
   partial collisions fail. Group topic remains authoritative, matching the shipped schema
   transform. No ordering dependence remains.
7. **D8 — matches emitted reality exactly** (verified against the domain schema and the generator
   literal, value by value); zero `maxConcurrency` stays valid; `timeout`/`maxRetries` preserved;
   `JobConfigInput` authoring shape unaffected.

## Gate question

- **P ∥ C independence is real, not concealed coupling.** P and C touch disjoint file sets
  (`runtime-types.ts` + plugin `worker/` + one doc vs `config/job-config.ts` + one test), share no
  type or runtime dependency, and neither consumes the other's surface. The one true hard edge — G
  must follow C — is correctly identified: without the four schema fields, zod strips author-supplied
  policy at validation and G's premise (validated config carries full policy) silently fails. P's
  placement on either side is genuinely free. The single-pass `scaffold.runtime` assembly at merge
  readiness is the right cost posture.
- **Clustering is right.** Both issues are "declared contract with no runtime plumbing across the
  same Archetype 3/5 boundary," so one plan avoids duplicating the record-invariant analysis, doc
  baselines, and gate selection; keeping three independently reviewable slices preserves separable
  delivery. Splitting into two plans would have produced two near-identical boundary analyses.
- **Legacy `registry-compiler.ts`: follow-up, not inclusion.** It is a different backend, is not the
  generator #1451 names, and its acceptance criteria are not exercised by the installed-registry
  path; expanding this plan to it would violate the discovery-authority boundary the plan protects.
  Required action: file a follow-up issue at Slice G close (referencing the drift posture #1451
  records) so parity remains visible on the board.

## Open-decision sweep (evaluator-run)

None that force rework and are unflagged. Edges examined and dispositioned: sink-returns-null
(execution deleted mid-flight) is an in-slice implementation choice with no contract impact;
`ExecuteJobMessage` remaining producer-less this slice is consistent with D2's one-transport
honesty; config `jobsDir` diverging from the manifest's discovery dir fail-louds through D6's
"configured entrypoint with no discovered file" error, which is the correct posture; child-process
resolution is now empirically settled (above). Process observation for the supervisor: `supervisor.md`
still says "PLAN-EVAL ... not dispatched" — update the phase state with this verdict; the
owner-waived `context-pack.md`/`drift.md` omission is adequately recorded.

## Verdict

`PASS`

### If FAIL_PLAN — required fixes

Not applicable.

## Notes

1. Advisory (Slice P implementation): when the thread slice is eventually planned, the inbound side
   must strip the non-cloneable `handler` from `ExecuteJobMessage.jobDefinition`; the outbound side
   is already clone-safe.
2. Advisory (Slice G): if `@netscript/config` addition perturbs `deno.lock`, a reviewed lock delta
   with recorded rationale is acceptable; the unchanged-lock expectation is a hypothesis, not a law.
3. Required (Tier-A slice reviews): each slice review additionally runs `deno task quality:scan`
   alongside `arch:check` per the harness slice-review invariant — the plan's gate lists cover the
   matrix but do not name `quality:scan`.
4. Required (follow-up): file the `registry-compiler.ts` parity issue at Slice G close; the plan
   defers it correctly but the board must show it.
5. Required (process): rebase implementation branches onto `60ae56af0`+ and refresh the doc-lint
   diagnostic baselines (9 core / 20 plugin) at first slice start, since baselines were recorded at
   `9fbc23172`.
