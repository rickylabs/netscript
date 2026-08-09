# PLAN-EVAL — release-0.0.5--orchestration/slices/w3-a-1326

- Plan evaluator session: Claude · Fable 5 · medium, separate session, 2026-08-09
- Run: `release-0.0.5--orchestration/slices/w3-a-1326`
- Generator: Codex · GPT-5.6 Sol · medium; plan head `0fd038181` on
  `fix/streams-durable-producer-reconnect`, base `origin/main@aa8e151e6`
- Surface / archetype: `packages/plugin-streams-core` / `3 — Runtime/Behavior`
- Scope overlays: none (Aspire runtime validation in-plan)

## Verdict

`FAIL_PLAN`

Two required fixes, both cheap plan repairs. Every research claim spot-checked against the tree is
true except one non-load-bearing half-claim (correction note 3). The contract (D1–D16) respects the
merged envelope, closes silent loss with settled receipts rather than relocating it, covers all six
#1326 failure modes, and the OTEL assertion is a single trace id across a real outage boundary. The
plan fails on evidence mechanics, not on design.

## Findings (by severity)

### F1 — MAJOR: S1's RED gate cannot produce the per-behavior evidence it promises, and REDs are unclassified

**Claim under test:** S1's decisive gate is "Individual focused tests each raw exit **1**" for eight
behaviors, all in one file, `tests/application/durable-stream-producer-reconnect_test.ts`
(`plan.md` slice table S1; validation row 1:
`deno test --no-lock --allow-all --filter '<exact behavior>' …` — no `--no-check`).

**Evidence:**

- Pre-fix producer surface (verified at `origin/main:packages/plugin-streams-core/src/application/create-durable-stream.ts`):
  `upsert`/`delete` return `void` (lines 167–171, 206–210); there is no `state`, `isReady`,
  `waitUntilReady`, `stop`, or receipt anywhere in the class. S1's file list does **not** include
  `create-durable-stream.ts`, so at S1 the runtime is unchanged.
- At least four of the eight named REDs (count overflow, byte overflow, stop-during-backoff,
  readiness/receipt assertions in recovery) can only be expressed through API that does not exist
  pre-fix. `deno test` type-checks by default and the planned command does not pass `--no-check`,
  so one TS compile failure in the single file makes **every** `--filter` invocation exit 1 with
  identical diagnostics. "Eight individual raw exit 1s" would be one compile-time RED counted eight
  times — not per-behavior evidence for acceptance row 5.
- The plan performs no behavioral vs compile-time classification of any RED. The binding evaluator
  contract for this milestone requires each RED to name the concrete pre-fix state that exits
  non-zero and label compile-time REDs as weaker evidence. `plan.md` risk register row 3 and
  `research.md` "Initial-outage RED" promise individual exit 1s but never address the type-check
  problem.
- Worse, S1's file list includes `src/ports/stream-producer-port.ts`. If that port gains the new
  receipt/state surface at S1, the unchanged `DurableStreamProducer implements StreamProducerPort`
  (line 42–43) no longer compiles, and S1's own scoped-check gate (validation row 4) fails on the
  S1 commit. If the port is not widened, the typed RED tests cannot compile. The plan does not say
  which; this is an open decision that forces rework if deferred — an automatic unchecked box under
  `gates/plan-gate.md`.

**Required change:** Specify the S1 compile story and classify every RED. Concretely: (a) put
behaviorally-expressible REDs (initial outage, mid-session outage, recovery, FIFO ordering,
flush/close failure surfacing — all drivable through the existing void API plus flush/read-back)
in a file that type-checks against the pre-fix surface and record each raw exit 1 as
**behavioral**; (b) put API-dependent REDs (overflow ×2, stop/backoff, readiness/receipt) in a
separate file or defer their RED capture to the S1→S2 boundary, and label each as
**compile-time/API-absence** RED (weaker evidence) in `plan.md` and `worklog.md`; (c) state whether
`stream-producer-port.ts` is widened at S1 or S2 such that every committed slice type-checks.

### F2 — MAJOR: the "Framework law" gate row is vacuous for the changed package

**Claim under test:** Validation row 10 — `deno task quality:gate`; `deno task arch:check`; "exact
AP-13 row closed only if F-14 passes" (also S3's decisive gate "quality:gate; F-14 scan").

**Evidence:**

- `quality:gate` = `quality:scan && arch:check` (root `deno.json:52`).
- `quality:scan` default roots are `['packages/cli/src', 'plugins']`
  (`.llm/tools/quality/scan-code-quality.ts:18,178`) — `packages/plugin-streams-core` is never
  scanned unless `--root` is passed, and the plan invokes the bare task.
- `arch:check` (root `deno.json:155`) runs `check-doctrine.ts` against 16 explicit roots; the list
  includes `plugins/streams` but **not** `packages/plugin-streams-core`. Both commands exit 0
  regardless of what this slice puts in the package. This is exactly the "gate that compares
  nothing" class this milestone has already hit four times.
- "F-14 scan" has no script: `grep -n 'F-14\|console\.' .llm/tools/fitness/check-doctrine.ts`
  matches only the tool's own logging; F-14 exists only as prose in
  `docs/architecture/doctrine/09-anti-patterns-and-fitness-functions.md:290`. Under plan-gate
  Phase A reporting, a scriptless check needs named manual evidence — the plan names none.

**Required change:** Add to the validation plan (and S3/S4 decisive gates): scoped
`deno run --allow-read .llm/tools/quality/scan-code-quality.ts --root packages/plugin-streams-core/src`
and
`deno run --allow-read .llm/tools/fitness/check-doctrine.ts --root packages/plugin-streams-core`,
plus explicit F-14 manual evidence (`grep -rn 'console\.' packages/plugin-streams-core/src/` = 0
hits outside allowed folders) recorded as `PENDING_SCRIPT` for the AP-13 closure condition. Root
`quality:gate`/`arch:check` may stay as regression checks but must not be cited as proof for this
package.

### F3 — correction note (non-blocking): research finding 7 half-claim

"The upstream **server and client** export the producer protocol header constants" — the client
does (`@durable-streams/client@0.2.6` `dist/index.d.ts` exports `PRODUCER_ID_HEADER`,
`PRODUCER_EPOCH_HEADER`, `PRODUCER_SEQ_HEADER`, `PRODUCER_EXPECTED_SEQ_HEADER`,
`PRODUCER_RECEIVED_SEQ_HEADER`); the server does **not** — `@durable-streams/server@0.3.7`
`dist/index.d.ts:1147` export list contains no `PRODUCER_*` symbol; the server only uses the
constants internally (`dist/index.js:3923`). Not load-bearing (the adapter imports from the
client), but correct the sentence when revising the plan.

## Verified-true load-bearing claims (spot-checks executed)

| # | Claim | Evidence |
| - | ----- | -------- |
| 1 | One-shot `#connect`, latched `#connectError`, `#appendEvent` drops, no reconnect | `create-durable-stream.ts:64,93,129–135` at `origin/main` |
| 2 | False "until reconnect" warning | same file, line 99 |
| 3 | Unbounded `#pendingEvents: string[]`; void `upsert`/`delete` | lines 51, 167–171, 206–210 |
| 4 | `IdempotentProducer` batch failure surfaces only `onError(error)`, no payload/seq for replay | client 0.2.6 `dist/index.js:2245–2257` (`#batchWorker` → `#onError(error)`); `IdempotentProducerOptions.onError?: (error: Error) => void` |
| 5 | Upstream options accept `epoch` but no starting sequence | `IdempotentProducerOptions` (d.ts 805–855): `epoch?`, no seq field |
| 6 | `DurableStream.append` 0.2.6 applies only `contentType`/`seq`/`signal`, ignoring declared producer fields | `#appendDirect` (index.js 2707–2726), `#appendWithBatching` (2730–2747); `AppendOptions` d.ts 438–471 declares `producerId`/`producerEpoch`/`producerSeq` |
| 7 | Server treats repeat `(id, epoch, seq)` as duplicate, stale epoch → 403 with current epoch, gap → 409 with `expectedSeq` | server 0.3.7 `dist/index.js:305–362` (`validateProducer`), `handleAppend:3837–3998` |
| 8 | Envelope files exist; offsets untouched by plan | `src/domain/sse-contract-v1.ts`, `src/application/stream-sse-v1.ts` on main; plan Non-Scope + D15 forbid offset parsing/arithmetic; producer `sequence` in D7 is the upstream idempotency tuple, not the SSE offset token |
| 9 | Publish span currently ends before delivery | `src/telemetry/instrumentation.ts:134,167` — `span.end()` inside synchronous `publish()` |
| 10 | Baseline "5 passed" focused tests | 3 `Deno.test` in `durable-stream-producer_test.ts` + 2 in `create-service-stream-producer_test.ts` |
| 11 | Flow-B gate registers OTLP/HTTP from Aspire metadata and queries dashboard traces | `consume-flow-b-stream.ts:40–42,150–152` |
| 12 | E2E probe surfaces exist | `plugins/streams/src/e2e/probes/publish.ts`, `streams-gates.ts` on main |
| 13 | Both debts exist exactly as cited | `.llm/harness/debt/arch-debt.md:450` (`streams-connector-sound-deferred`), `:709` (AP-13 console.warn, plugin-streams-core) |
| 14 | Acceptance rows quoted verbatim match live body | `gh issue view 1326` — all seven `- [ ]` rows identical to `research.md` |
| 15 | Singleton reuse ignores caller options | `create-durable-stream.ts:311–314` — hidden-scope fingerprint rejection is justified |
| 16 | D2 arithmetic | 100+200+400+800+1600+3200+5000 (capped) = 11.3 s nominal ✓ |

## Envelope / loss / coverage / OTEL / boundary answers

- **Envelope respected:** yes — no offset parse/compare/arithmetic anywhere in the plan; D15 and
  Non-Scope lock it; no parallel readiness/heartbeat/terminal notion (producer lifecycle is a new
  producer-side concept, `streamClosed` remains terminal and only via acknowledged `close()`, D11).
- **Silent loss removed, not relocated:** yes as designed — D4 reject-newest with immediate caller
  result, D5/D6 settled receipts for every accepted write, D8 exhaustion settles active as
  `delivery-unknown` and queued as `cancelled`, D13 metrics for callers that ignore receipts.
- **All six #1326 failure modes owned by this slice:** initial outage (S1/S2/S5), mid-session
  outage (S1/S2), ordering under reconnect (S1/S2/S5 FIFO), overflow (count+byte, S1/S2),
  cancel/stop during retry (S1/S2, D11), recovery (S2 fake + S5 real late-start).
- **OTEL evidence real:** D12/D16 assert one trace id spanning buffered → retry → recovered →
  delivered across a real stop/restart of the exact `streams` resource — a correlation assertion
  across the boundary, not span existence.
- **Gates/debt/boundary:** `quality:gate`, `arch:check`, full-export `doc:lint`, `publish:dry-run`
  all named; `scaffold.runtime` by recorded token grant only (S6/S7); both accepted debts cited
  exactly, AP-13 closed conditionally and narrowly, connector debt preserved; #1398 deferral
  untouched (Non-Scope, validation row 12, D16 probe independent of the missing mutation hook).

## Plan-Gate checklist

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against exact `aa8e151e6`; 14 findings, 13.5 verified true (F3 half-claim) |
| Decisions locked                        | PASS   | D1–D16 with rationale |
| Open-decision sweep                     | FAIL   | F1: S1 port-widening vs pre-fix type-check is an unlisted open decision that forces rework if deferred |
| Commit slices (< 30, gate + files each) | FAIL   | 8 slices, ordered, files named — but S1's proving gate cannot prove what it claims (F1) |
| Risk register                           | PASS   | 9 risks with mitigations; the RED-uniformity gap is the one miss (folded into F1) |
| Gate set selected                       | FAIL   | F2: named framework-law commands do not exercise the changed package; F-14 has no script and no named manual evidence |
| Deferred scope explicit                 | PASS   | Deferred Scope + Non-Scope + Drift Watch |
| jsr-audit surface scan (pkg/plugin)     | PASS   | `research.md` surface scan over `.`, `./sse`, `./telemetry`, `./testing` (matches package `exports`); named risks each owned by S1/S4; helper banner false positive correctly not treated as waiver |

## Required fixes

1. **F1** — Split and classify the RED suite; resolve the S1 port/type-check contradiction (see F1
   required change).
2. **F2** — Add scoped `scan-code-quality.ts`/`check-doctrine.ts` invocations for
   `packages/plugin-streams-core` and named manual F-14 evidence; stop citing bare
   `quality:gate`/`arch:check` as package proof (see F2 required change).
3. **F3** — Correct the server-exports half-claim in research finding 7 (editorial).

One `FAIL_PLAN` cycle consumed; one remains before escalation.
