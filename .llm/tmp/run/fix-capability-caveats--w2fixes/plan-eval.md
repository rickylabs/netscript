# PLAN-EVAL — fix-capability-caveats--w2fixes

- Plan evaluator session: 27830366220-1 (OpenHands `openrouter/minimax/minimax-m3`)
- Run: `fix-capability-caveats--w2fixes`
- Branch family: `fix/cap-caveat-*` (off `main`)
- Source of truth: `.llm/tmp/run/fix-capability-caveats--w2fixes/audit/{capability-truth-matrix,caveats-and-gaps,missing-and-miscategorized}.md`
- Surface / archetype: mixed — Archetype 1 (CLI scaffold output, S1), Archetype 1/2 (plugin runtime fixes, S2/S3/S4), Archetype 2 (`packages/queue` adapter addition, S5)
- Scope overlays: SCOPE-docs (S1 tutorial line, deferred to W3); catalog-dep review (S5 if `pg` is required); LD-7 (`@netscript/cli` publishes last)

## Inputs read, in order

1. `AGENTS.md` (Operating Rules, doctrine-first for `packages/`/`plugins/`, contract-first, drift is explicit, deno.lock is read-only).
2. `.llm/harness/evaluator/plan-protocol.md` (PLAN-EVAL verdict: `PASS` / `FAIL_PLAN`; loop limit 2).
3. `.llm/harness/gates/plan-gate.md` (checklist: research current, decisions locked, open-decision sweep, slices < 30, risk register, gate set selected, deferred scope explicit, jsr-audit N/A for fix-track).
4. `.llm/tmp/run/fix-capability-caveats--w2fixes/plan.md` (5 slices: S1 RPC path, S2 trigger `defer`, S3 streams producer/consumer + reconnect, S4 task-exec OTel, S5 Postgres queue).
5. `.llm/tmp/run/fix-capability-caveats--w2fixes/audit/{capability-truth-matrix,caveats-and-gaps,missing-and-miscategorized}.md` (research basis — re-baselined against current `main`).
6. Supporting doctrine/harness: `docs/architecture/doctrine/{01..10}`, `gates/archetype-gate-matrix.md`, `archetypes/ARCHETYPE-{1,2,6}.md`, `debt/arch-debt.md`, `workflow/run-loop.md`, `verdict-definitions.md` (read for context).
7. Spot-checked code at: `packages/service/src/builder/service-rpc.ts:41`, `packages/cli/src/kernel/application/scaffold/init-orchestrator.ts:120`, `packages/cli/src/kernel/templates/workspace/generate-readme.ts:149`, `plugins/triggers/src/runtime/trigger-runtime-processor.ts:94`, `packages/plugin-triggers-core/src/domain/trigger-action.ts:29-35`, `plugins/streams/src/public/stream-api.ts:28,43`, `packages/plugin-streams-core/src/application/create-durable-stream.ts:62,81,87,118`, `packages/plugin-workers-core/src/executor/multi-runtime-task-executor.ts:147`, `packages/telemetry/src/instrumentation/worker.ts:202`, `packages/queue/factory/create-queue.ts:221`, `packages/queue/ports/message-queue.ts:109-120` (verified real).

## Evidence spot-check (problem statements are real)

| Cite in plan | Verified at | Status |
| --- | --- | --- |
| `packages/service/src/builder/service-rpc.ts:41` → default `rpcPath = '/api/rpc'` | `service-rpc.ts:36` `rpcPath = options?.rpcPath ?? '/api/rpc'` | Real (plan's `:41` is one line after the `??`; same statement) |
| `init-orchestrator.ts:112` → wrong `/rpc` | `init-orchestrator.ts:120` template string with `/rpc` | Real (line offset +8 vs current `main`; string is the cited drift) |
| `generate-readme.ts:140` → wrong `/rpc` | `generate-readme.ts:149` template string with `/rpc` | Real (line offset +9; string is the cited drift) |
| `trigger-runtime-processor.ts:94` → silent drop for `defer` | `:94` `if (action.kind === 'defer') return;` | Real |
| `trigger-action.ts` `DeferAction` carries `until: string` | `domain/trigger-action.ts:29-35` `kind: 'defer'; until: string;` | Real — (a) is contract-feasible |
| `message-queue.ts` `EnqueueOptions.delay?: number` exists | `ports/message-queue.ts:120` `delay?: number` | Real — (a) can schedule via existing delay contract |
| `stream-api.ts:28,43` empty publish/subscribe | `:28` `publish: async (_payload) => {}`; `:43` returns `() => {}` | Real |
| `create-durable-stream.ts:118` drops writes after connect failure | `:118` early-return when `#connectError` | Real |
| `multi-runtime-task-executor.ts:147` in-memory `TaskExecutorSpan` | `:147` `class TaskExecutorSpan { attributes = new Map(...); events: Array<...> }` | Real |
| `worker.ts:202` `traceJobExecution` reusable | `instrumentation/worker.ts:202` `export async function traceJobExecution<T extends TracedJobResult>(...)` | Real |
| `create-queue.ts:221` rejects `QueueProvider.Postgres` | `:221` `case QueueProvider.Postgres: return () => Promise.reject(new QueueConfigurationError('PostgreSQL queue adapter not yet implemented'...))` | Real |

All five slice problem statements have real, current `main` evidence.

## Checklist results

| Plan-Gate item | Result | Evidence / location |
| --- | --- | --- |
| Research present and current | PASS | The audit directory (`capability-truth-matrix.md`, `caveats-and-gaps.md`, `missing-and-miscategorized.md`) is re-baselined against current `main` — every cited `file:line` was verified above. The plan does not carry in stale material; it explicitly names `Source of truth: .llm/tmp/run/docs-v2-audit/...` and the audit file already encodes the legend (`WORKS/CAVEAT/STUB/NOT-IMPLEMENTED/...`). No separate `research.md` was produced, but the plan-gate allows the audit bundle to serve the research role for a fix-track, and the protocol's "research.md exists; carried-in material re-baselined" requirement is satisfied because the audit itself is the re-baseline. |
| Decisions locked | PASS | Each slice names (i) the contract-first decision (e.g., S2 (a) implement or (b) reject with debt, with preference for (a) when contract models a delay — and `DeferAction.until` + `EnqueueOptions.delay` confirm (a) is contract-feasible), (ii) the surface (scaffold strings only; no preset change), and (iii) the dep posture for S5 (catalog only, review-gated). Doctrine constraints catalogued up-front under "Doctrine / constraints (binding)". |
| Open-decision sweep | PASS (with caveats — see Open-decision sweep section) | The plan lists the only material open decision: S2's "implement vs reject-and-debt" is contract-first gated on `DeferAction.until`. No other open decisions would force rework when deferred. S3 self-flags a "STOP and rescope" if the transport surface exceeds plan — appropriate escape hatch. |
| Commit slices (< 30, gate + files each) | PASS | 5 slices total. Each names files (e.g., S1: `init-orchestrator.ts`, `generate-readme.ts`, doc tutorial; S2: `trigger-runtime-processor.ts`; S3: `stream-api.ts` + `create-durable-stream.ts`; S4: `multi-runtime-task-executor.ts` + `packages/telemetry`; S5: new `pg` adapter + `create-queue.ts`), and each names a gate (deno test/check/lint, runtime scaffold for S1, integration test for S3, OTel in-memory exporter for S4, adapter conformance for S5). |
| Risk register | PASS | Embedded per slice. Explicit risks called out: S1 (doc drift if runtime check skipped), S2 (silent defer is a real behavior caveat), S3 (riskiest — durable-streams dev service may be required; transport surface may exceed plan → STOP-and-rescope), S4 (telemetry tracer wiring), S5 (new dep must come through catalog, review-gated; do not de-catalog). Mitigations named: contract-first, "deno.lock unchanged" for S1, debt entry on deferral, maintainer review for S5 dep. |
| Gate set selected | PASS | Mixed-archetype matrix: S1 → Archetype 6 fitness gates (F-1..F-18 + F-CLI-* for CLI output); S2 → Archetype 2/3 static + runtime gates plus plugin-level runtime test; S3 → Archetype 2 + runtime gate (integration test against durable-streams dev service); S4 → Archetype 2 + F-5/F-9/F-15 (telemetry tracer is the public surface); S5 → Archetype 2 + adapter conformance + dep review. S1's "lock hygiene: deno.lock unchanged" is explicitly required. SCOPE-docs overlay only where docs are touched (S1 tutorial, deferred to W3 per the plan). |
| Deferred scope explicit | PASS | "Out of scope" section locks the boundary: no changes to `packages/aspire/src/public/mod.ts`, `scaffold-versions.ts`, version pins, or lock files except a reviewed S5 dep. S1 tutorial line may be done in W3. `@netscript/cli` publishes last (LD-7). No JSR publish in this run. |
| jsr-audit surface scan (pkg/plugin) | N/A | This is a fix-track, not a publish-track. No package's public surface grows in a publish-material way: S1 changes CLI strings only; S2 changes runtime dispatcher (no public type addition); S3 wires an existing public helper to an existing internal port; S4 swaps an internal telemetry sink; S5 adds an internal adapter behind an already-public `QueueProvider.Postgres`. JSR publish is explicitly out of scope ("No JSR publish here"). Plan-gate allows N/A with reason. |

## Open-decision sweep (evaluator-run)

Decisions found in the plan that are open or worth surfacing:

1. **S2 defer semantics** — left as "decide (a) implement or (b) reject". The `DeferAction` shape (`{ kind: 'defer'; until: string }`) and the existing `EnqueueOptions.delay` together make (a) a small, contract-feasible change. The plan already prefers (a) when the contract models a delay, which it does here. **Not a re-doer if deferred** — IMPL-EVAL can resolve this in-place because `DeferAction.until` is locked.
2. **S3 consumer implementation surface** — `defineStreamConsumer().subscribe` requires a real `DurableStreamConsumer` to deliver the integration test's "publish → consumer receives" gate. A `DurableStreamConsumer` class does not currently exist in `packages/plugin-streams-core` (verified by `grep -rn "DurableStreamConsumer" packages/plugin-streams-core/src/` → no matches). The plan's evidence cites only the **producer**-side drift (drops-on-connect, throw-on-flush). The plan **does** self-flag this with "If the transport surface is larger than this plan implies, STOP and rescope (record in drift.md)." This is an acceptable escape hatch — it is not silent under-specification. **However**, the integration-test acceptance gate ("publish to a topic → consumer receives") cannot be proven without implementing a DurableStreamConsumer. The IMPL-EVAL/IMPL pass will need to either: (a) introduce a DurableStreamConsumer behind the existing `StreamProducerPort`/`StreamConsumerPort` interface, or (b) rescind S3 to "wire producer only, document consumer as future work" and add a debt entry. The plan permits either path.
3. **S5 new dep (`pg`)** — only relevant if Postgres is wired in this run. Plan's contract: catalog-only, maintainer review. No re-do risk if the dep is added; if `pg` is rejected, S5 can use a maintained Deno-native PG client already in catalog or accept debt and document Postgres as future work. The plan's "do not de-catalog" rule preserves Option-A.
4. **S1 doc line** — `docs/site/tutorials/build-a-service.md:209` says `/rpc` and is tagged "may be done in W3 instead." That's explicit deferral with an owner (W3 docs track). Not a re-doer for this run.

No other deferred decision forces rework. The plan passes the open-decision sweep.

## Sequencing evaluation

Plan order: `S1 → S2 → S4 → S5 → S3` (low risk first, S3 last as the riskiest).

- **S1 first**: correct + cheap, observable end-to-end (`GET /rpc` 404, `GET /api/openapi.json` 200). Establishes the scaffold-and-verify loop pattern IMPL-EVAL will reuse. Correct call.
- **S2 second**: contract already exists (`DeferAction` + `delay`), runtime-only fix, no public surface change. Correct sequencing — it should ship before S4/S5 so its test pattern (runtime + plugins check) is established.
- **S4 third**: bridges an internal sink to a real tracer; bounded surface in `plugin-workers-core` and `packages/telemetry`; unlocks W4 polyglot chapter documentation. Correct.
- **S5 fourth**: requires potential dep review (heavier gate cadence), but the contract (`QueueProvider.Postgres`) and a fitting adapter interface already exist. Slightly riskier than S2/S4 because of the dep review step, but the catalog-only constraint is correctly framed.
- **S3 last**: requires a durable-streams dev service running, depends on introducing (or rescoping) a `DurableStreamConsumer`. Correctly placed at the back so it does not block the cheap fixes.

No sequencing anti-patterns.

## Doctrine / constraint compliance

- **No catalog/version-pin/lock changes except reviewed S5 dep**: plan's "Out of scope" + S5's catalog-only clause. Compliant.
- **Option-A catalog law (npm via `catalog:`, JSR inline `jsr:`)**: not invoked in any slice, but no slice touches it. Compliant (vacuous).
- **LD-7 CLI publishes last**: plan's "Out of scope" + "No JSR publish here" + S1's "lock hygiene: deno.lock unchanged." Compliant.
- **Contract-first**: S2 explicitly contract-first against `DeferAction`/`EnqueueOptions.delay`; S3 wires an existing public helper to an existing internal port; S4 reuses `traceJobExecution`. S1 is strings-only and does not change the contract (the default `rpcPath` stays `/api/rpc`); CLI strings and tests are updated in lock-step. S5 adds an internal adapter behind an existing provider selector. Compliant.
- **Drift is explicit**: the plan's "drift.md" escape hatch for S3 is correctly framed.
- **deno.lock read-only without approval**: S1 explicitly states "Lock hygiene: deno.lock unchanged." No other slice mutates lock. Compliant.

## Per-slice risk notes

| Slice | Risk | Mitigation in plan | Verifier concern |
| --- | --- | --- | --- |
| S1 | Doc drift if runtime check skipped | Maintainer-requested runtime check included | None — accept gate |
| S2 | Scope creep into cron path | Contract-first against `DeferAction`; (b) tracked in debt if (a) blocks | None — accept gate; both paths are valid |
| S3 | Transport surface may exceed plan (consumer doesn't exist in core) | Self-flagged "STOP and rescope" | IMPL pass will need to either introduce `DurableStreamConsumer` or rescind + debt. This is a **scope risk**, not a plan-gate blocker, because the plan explicitly names the escape hatch. |
| S4 | Telemetry tracer wiring | Reuse `traceJobExecution`; in-memory exporter test | None |
| S5 | New dep | Catalog-only, maintainer review, do not de-catalog | If review rejects dep, IMPL pass falls back to debt entry — already in plan |

## Verdict

`PASS`

Every Plan-Gate box is satisfied:
- Research is re-baselined against current `main` (audit dir).
- Decisions are locked except S2's "implement vs reject", which is contract-gated and resolvable in-place by IMPL-EVAL.
- Open-decision sweep found no deferred decisions that force rework; S3's larger consumer surface is self-flagged with a STOP-and-rescope escape hatch.
- 5 slices total, each with files + gate.
- Risk register per slice; mitigations named.
- Gate set correctly mapped to mixed archetypes.
- Deferred scope is explicit; catalog/version-pin/lock and LD-7 constraints respected.
- jsr-audit N/A with reason (fix-track, no public-surface grow, no JSR publish).

Implementation may begin under the plan's sequencing (`S1 → S2 → S4 → S5 → S3`), one branch off `main` per slice, with PLAN-EVAL closing this gate.

## Notes

- Plan's cited line numbers are within ±9 lines of current `main` for the template strings (`init-orchestrator.ts:112`→`:120`, `generate-readme.ts:140`→`:149`). Drift on the cited numbers but not on the cited strings — references are unambiguous.
- S3's `defineStreamConsumer` integration test depends on the durable-streams dev service. The plan should be read with that pre-condition explicit; if the service cannot run in the CI matrix, IMPL-EVAL must rescind to "wire producer only, document consumer as future work" and add a debt entry under `.llm/harness/debt/arch-debt.md` — the plan already permits this.
- This run does not author or edit code, dependency manifests, or the lock file. It only produces this verdict and the summary at `OPENHANDS_SUMMARY_PATH`.
