# PLAN-EVAL verdict — #181 Triggers Feature-Backing

**Verdict: `PASS`** (with specific findings to reconcile before implementation; see Findings section)

Per `.llm/harness/evaluator/plan-protocol.md` and `.llm/harness/gates/plan-gate.md`, this is a **planning-only** review. I am a separate session and do not self-certify. The verdict below is keyed to slice IDs (S1–S6) and locked-decision IDs (L1–L12) from `plan.md`.

---

## Summary

The plan is a **well-scoped, layering-correct, debt-disciplined** proposal that converts a 6-route deferral pile-up into a 6-slice net-new `-core` runtime program with a thin ARCHETYPE-5 connector un-defer. Base-state correction is accurate; the 11-route contract table is authoritative; route→slice coverage is total; soundness lock holds; debt accounting is right; the highest-risk slice (S5) correctly identifies the real `@netscript/cron` capability gap and chooses a triggers-core-owned engine with the right mitigation posture. Doctrine (A4/A5, 2-cast limit, no new `any`, folder vocabulary) is respected.

Six **actionable findings** are listed below. None are blockers; all are resolvable with minor wording tightening or test-plan elaboration in `plan.md` before the IMPL train starts.

---

## Grading per the seven axes

### 1. Base-state accuracy — ✅ all three corrections verified, no stale premise remaining

- **L1 (connector already converged)** — confirmed. `plugins/triggers/services/src/main.ts:196` calls `createPluginService(router, {...}).serve()` with `serveRpc: true`; the raw HMAC webhook is mounted via `rawRoutes` at `main.ts:207-211` and handled by `acceptWebhook` (`main.ts:298`) which feeds `c.req.raw` into the ingress (`main.ts:321-324`).
- **L2 (KV already `@netscript/kv`)** — confirmed. `packages/plugin-triggers-core/src/stores/kv-trigger-runtime-stores.ts:1` imports `getKv` from `@netscript/kv` and `openTriggerRuntimeKv()` (line 27) calls `getKv({ path: ... })`. `deno.json:23` declares the dep. The only `Deno.Kv` reference is a test double (`src/testing/deno-kv-trigger-event-store-double.ts:6`). Migration slice correctly dropped; only optional test-double cleanup may ride S1.
- **Deferral = plain throw → 500** — confirmed. `v1.ts:164-193` shows six `throw new Error(PENDING_BACKING_MESSAGE)` sites; `subscribeEvents` is a never-yielding async generator (`v1.ts:188-193`).

No remaining stale premise detected.

### 2. Route→slice coverage — ✅ total; soundness lock holds

- 6 deferred routes → exactly one slice each:
  - `fireTrigger` (route #6) → **S3** (manual-dispatcher)
  - `testWebhook` (route #7) → **S4** (webhook-test-delivery)
  - `previewSchedule` (route #8) → **S5** (cron next-fire engine)
  - `enableTrigger` (route #9) → **S2** (enabled-state port/store)
  - `disableTrigger` (route #10) → **S2**
  - `subscribeEvents` (route #11) → **S6** (subscription port + adapter)
- 2 backed-route gaps → mapped:
  - `listTriggers` synthesizes `enabled:true` (v1.ts:240) → **S2** (un-synthesize, source from store) + `filterDefinitions` gains the `enabled` branch.
  - `getTrigger` omits `name` (v1.ts:218-228) → **S1** (domain `name?: string`).
- Soundness lock: `tests/contracts/triggers-contract-soundness_test.ts:52` asserts `enabled` is **required** on `TriggerDefinitionResponse`. L3 keeps the response `enabled` required; the new domain field is `enabled?: boolean` (authoring default) and the store is the runtime source of truth. **Test stays green under L3.** ✓
- No route left unbacked; every net-new file traces to a contract route (plan §"Design checkpoint"). ✓

### 3. Layering & axioms — ✅ correct layer landing for every net-new file

- **S1** (domain): `trigger-definition.ts` (+`enabled?: boolean; name?: string`) — domain layer, correct. Builders thread optional fields — correct.
- **S2** (ports+stores): `ports/trigger-enabled-state-port.ts` + `stores/kv-trigger-enabled-state-store.ts` — mirrors `packages/plugin-workers-core/src/stores/kv-worker-idempotency-store.ts` (verified at lines 1-35: structural `KvStore`, `KvKey`/`KvSetOptions` from `@netscript/kv`, `prefix: KvKey`, optional `now` clock). Layer landing correct; structural-port pattern followed.
- **S3** (runtime): `runtime/create-manual-dispatcher.ts` — runtime entrypoint, correct. L5's "lift the `manual` reserved-kind guard **only for the explicit-fire path**" is the right surgical move; R3 mitigation sound (does not relax `queue`/`stream` reserved-kind rejection).
- **S4** (runtime): `runtime/create-webhook-test-delivery.ts` — runtime entrypoint, correct.
- **S5** (runtime): `runtime/compute-next-fire-times.ts` — runtime, correct layer landing. Owned in triggers-core per L6; isolation from `@netscript/cron` is intentional, not a layering violation.
- **S6** (ports+runtime): `ports/trigger-event-subscription-port.ts` + `runtime/create-event-subscription.ts` — port+adapter, correct. Ingress/processor publish `createEvent`/status transitions — extends existing ports cleanly without rewriting them.
- **A5 composition** preserved (factories taking `Readonly<{ ... }>` options bags).
- **Casts** (L10): no new brand constructor required; string-equality + `definition.id` carries the existing discipline. The 2-cast limit is not threatened.
- **No new `any`.** **No `utils/` or `helpers/` folders.** Doctrine-clean.

### 4. S5 cron engine (L6) — ✅ right call, capability gap real

- Capability gap is real and confirmed: `packages/cron/ports/types.ts:273` `parseCronExpression` is a 5-field split with no validation or iteration; `packages/cron/adapters/deno.adapter.ts:257-260` `calculateNextRun` is private, explicitly self-described as a heuristic placeholder, single-occurrence. `ScheduledTriggerHandle.nextFireAt` carries at most one approximate value. **No primitive computes N ISO datetimes across DST** — research §6 is authoritative.
- Triggers-core ownership is the right call to avoid blocking on a cross-package upgrade. `CRON-NEXT-FIRE-ENGINE` recorded as future debt — correct.
- Plan correctly says **not** to reuse cron's heuristic.
- Timezone/DST test strategy is **adequate but thin** — see Finding F3 below.

### 5. L9 testWebhook semantics — ✅ sound, with one tightening item

- Genuinely HMAC-signs a synthetic canonical body and routes through `TriggerIngressPort.accept` → `DefaultTriggerIngress.accept` → `verifier.verify({ body, headers, secret })` (create-trigger-ingress.ts:80-95, with `body = new Uint8Array(await request.request.arrayBuffer())` at line 83).
- This exercises the same verifier code path the real webhook uses. Synthetic body + real secret → real signature → ingress `verify` round-trips. **HMAC guarantee is preserved** (the helper is not a bypass; it is a faithful re-creation of what a real sender would produce).
- Tightening: the plan should make explicit that the helper (a) constructs a `Request` with the configured verifier's expected signature header (e.g., `x-hub-signature-256` for the prod HMAC verifier), (b) resolves the secret through the same `resolveSecret` path ingress uses (i.e., `Deno.env.get(definition.secretEnv)`), and (c) returns a `TriggerIngressResponse` shape compatible with `triggerFireResponseSchema`. See Finding F2.

### 6. #184 coordination (L12) — ✅ sequencing acceptable; hard rule mitigates

- Hot-file overlap is real: `trigger-definition.ts` (S1), `ports/mod.ts` (S2, S6), `contracts/v1/triggers.contract.ts` (touched only by soundness-test lock — no edit needed), `v1.ts` (S2–S6 handler-body swaps). All four are identified in the plan.
- Locked rule: **no concurrent open PRs touching the four hot files**. Slice ordering is S1 → S2 → S3 → S4 → S5 → S6, which is dependency-respecting and allows S6 (most seam-sensitive) to land last.
- **Sequencing hazard flagged:** S1 mutates `trigger-definition.ts` early. If #184 is mid-flight on a base-seam change when S1 opens, collision. The hard rule covers this — but the plan should be explicit that **S1's `trigger-definition.ts` edit is also gated on "no concurrent #184 PR against that file"**, not just the four hot files listed. (The four-file list is correct, but a reader might miss that S1 is the first mover and therefore the first race-window.)
- L12 fallback ("single-lane the triggers structural-conform only ahead of the #181 train") is a sound contingency; "never interleave" is a strong, enforceable rule.

### 7. Debt — ✅ correctly scoped and justified

- `CRON-NEXT-FIRE-ENGINE` (new): correctly records the triggers-core ownership as upstream-able to `@netscript/cron` later. Scope is right.
- `TRIGGERS-SSE-MULTI-REPLICA` (new): correctly records the in-process SSE limitation. Scope is right.
- `TRIGGERS-CONNECTOR-DEFERRED-ROUTES` (close): **justified at program end** — all 6 deferred routes are backed in this program (S2, S3, S4, S5, S6), and the 2 backed-route gaps are closed (S1 `name`, S2 `enabled` synthesis). The debt item becomes false.
- Other debt items explicitly **not** addressed (correct): `triggers-connector-sound-deferred` (resolved by base), `PLUGIN-RUNTIME-ADAPTER-RELOCATION` (`#172c`, satisfied for triggers-core by base), `PLUGIN-LIST-MANIFEST-REGISTRATION-BLOCKER` (unrelated, gate-flagged so it does not mask regressions).

---

## Findings (actionable; non-blocking)

These should be reconciled in `plan.md` (or addressed in IMPL) before the implementation train starts. They are organized by severity.

### F1 — L1 vs Slice descriptions contradict on `main.ts` (must reconcile)

**Decision: L1 (and slice bodies).**

- **L1 says:** "Connector convergence and the service-assembly (`main.ts`) are NOT re-touched (already converged). Connector edits limited to `v1.ts` handler bodies (un-defer, un-synthesize, include `name`) and `v1-types.ts` context (new ports the routes read)."
- **Slice 2 says:** "Connector: `v1-types.ts` (+`enabledState` in `TriggerServiceContext`); `main.ts` `createTriggersServiceContext` constructs default KV-backed store"
- **Slice 3 / S4 / S6** also say "main.ts ... wire dispatcher / helper / port".

**The current `TriggerServiceContext`** (main.ts:140-146 + `createTriggersServiceContext` at main.ts:146) is the *only* seam where the default ports are constructed. Every new port (enabledState, dispatcher, test-delivery, subscription) must be wired there or `TriggerServiceContext` must be re-shaped to take them as inputs (which `createTriggersServiceContext` already does for `eventStore`/`processor` — the pattern is established).

**Resolution:** Either (a) relax L1 to "main.ts default-port construction only, no service-assembly restructure", or (b) move default construction to a sub-factory that `createTriggersServiceContext` delegates to (keeps the assembly method "untouched" in spirit). Option (a) is the minimum change and is the most honest reading of the slice bodies. **Recommended: tighten L1 to option (a).**

### F2 — L9 `testWebhook` helper: tighten the synthetic-request contract

L9 says "genuinely HMAC-signs a synthetic canonical body using the configured verifier/secret and routes through the existing ingress". The plan should explicitly enumerate:

1. The helper **resolves the verifier** for the trigger the same way `DefaultTriggerIngress.#selectVerifier` does (so the `memory` vs `hmac-sha256` choice is honored).
2. The helper **resolves the secret** through the same `resolveSecret` path ingress uses (`Deno.env.get(definition.secretEnv)`), or, if absent, falls back to `MemoryWebhookVerifier` semantics.
3. The helper **constructs a `Request`** with the verifier-expected signature header (e.g., `x-hub-signature-256` for HMAC) populated with the computed `sha256=...` value over the exact body bytes the helper also writes.
4. The helper **awaits `TriggerIngressPort.accept`** and maps the returned `TriggerIngressResponse` into the `triggerFireResponseSchema` shape (`{accepted:true, eventId, triggerId, status}`) — and explicitly does **not** call `verifier.verify` directly, so the real ingress path (which is what L9 is asserting) is exercised end-to-end.

This is a documentation tightening, not a design change. The current L9 is correct in spirit.

### F3 — S5 timezone/DST test strategy: elaborate

R1 and the S5 gate call for "table-driven tests" but do not enumerate the cases. The plan should specify, at minimum:

- A **spring-forward** case (e.g., `America/New_York` 2024-03-10 02:00) where the 02:00 occurrence **does not exist** — the engine should skip to 03:00.
- A **fall-back** case (`America/New_York` 2024-11-03 01:00) where 01:00 occurs **twice** — the engine should return both (or document the disambiguation rule, e.g., first occurrence).
- A **UTC offset** case (e.g., `Asia/Tokyo`, no DST) — sanity.
- A **`from?` default** case (omit `from` → use `new Date()`).
- A **`spec.persistent` honoring** case (the S5 description says "honoring `spec.persistent`" but does not specify what honoring means — e.g., does `persistent=false` mean non-recurring once, or the contract's "non-persistent" semantics? The contract's `triggerPreviewResponseSchema.persistent` field shape should be re-read and the test plan tied to it).
- A **leap-day** case (Feb 29) and a **Feb 30** invalid cron case.

The "right" test count is 6-10 cases; the plan should commit to a number.

### F4 — JSR public-surface budget: explicit over-budget acknowledgment

`jsr-audit` requires the new public surface to be JSR-publishable (no slow types, explicit return types, `@module`/symbol docs). The plan adds 7+ new public roots (`TriggerEnabledStatePort`, `KvTriggerEnabledStateStore`, `createManualDispatcher`, `createWebhookTestDelivery`, `computeNextFireTimes`, `TriggerEventSubscriptionPort`, `createEventSubscription`, plus the `TriggerEnabledStateStore` testing memory adapter). The `public/mod.ts` already exports ~25 roots (a v2-plan budget). Adding 7-8 more exceeds the budget.

**Resolution:** Either (a) explicitly state "public-surface budget is over by N; carve-out accepted; v2 plan to be revised", or (b) commit to only exporting the **minimum** runtime-stable surface (e.g., factories only, not the port interfaces themselves, which stay as internal types) and keeping port interfaces as type-only re-exports. Option (b) is the lower-friction choice and matches the "start empty in slice F1, add only stable root exports" posture already in `public/mod.ts`'s docblock. **Recommended: option (b).**

### F5 — `TriggerEnabledStatePort.list()`: stale-id policy

S2's port surface is `isEnabled(id)`, `setEnabled(id, bool)`, `list()`. The connector consumes `list()` to compute `enabled` for the `listTriggers` response and to honor the `?enabled=false` filter. The plan should specify:

- `list()` returns **stored overrides only** (the "everything not in `list()` is enabled by default" rule), or
- `list()` returns the **resolved state** for every id the connector knows about (caller pre-supplies the id set).

The first option is simpler and matches L4's "store records overrides; default = enabled". The plan should also state: a stale override (id present in store, absent from current `definitions`) is **filtered out by the connector** at response time, not by the store, so the store stays engine-agnostic and does not need a definition lookup.

### F6 — Soundness test lock: confirm (informational)

`tests/contracts/triggers-contract-soundness_test.ts:52` asserts `enabled` is required on `TriggerDefinitionResponse` (verified at line 47-52 of the test file). L3 keeps `enabled` required on the response. **Lock holds.** No edit needed; the regression-lock gate is correctly stated in §"Gates".

---

## Items checked and passed without findings

- **DLQ backing (L8)** — correctly identified as already present (`KvTriggerDlqStore.enqueue/list/replay`); no net-new DLQ slice; S6 surfaces existing enqueue as the `trigger:dlq` SSE type. Clean.
- **HMAC vs oRPC-Zod raw-bytes constraint** (research §5) — the plan correctly identifies that `testWebhook` is oRPC (Zod-parsed body) and therefore cannot reuse the raw HMAC ingress; the L9 synthetic-sign approach is the right resolution.
- **`trigger-processor.ts:59` `RESERVED_KINDS` guard lift** — R3 mitigation (lift only for explicit-fire path) is correctly scoped; the `queue`/`stream` reserved-kind rejection is preserved.
- **No new dependencies introduced** (verifier/port/ingress/processor are all in-package). Toolchain (`.agents/skills/netscript-deno-toolchain`) is not exercised.
- **Scaffold.runtime e2e** — `PLUGIN-LIST-MANIFEST-REGISTRATION-BLOCKER` is correctly flagged as not-to-mask (gates §"scaffold.runtime").

---

## Verdict

**`PASS`** — plan is **PLAN-GATE-ready**. The 6 findings are documentation/test-plan tightenings; none invalidate the architecture or the slice decomposition. Implementation can begin after F1 (L1 vs slice-body reconciliation on `main.ts`) is resolved in `plan.md`, and F2–F5 are addressed in the slice descriptions or as IMPL kickoff notes. F6 is informational (test lock is correct as stated).

---

## Lock-hygiene compliance

- **No source edits made.** Verified by inspection of `git status` and confirmed by `find` over the working tree.
- **No `deno.lock` mutation.** Not run.
- **No commit performed.** Operational contract: "Do not commit source. Preserve lock hygiene."
- **Deliverable path:** `/home/runner/work/_temp/openhands/28471834087-1/summary.md` (run-scoped, per `OPENHANDS_SUMMARY_PATH`).
- **No `replies.json` written** (output mode is `pr-comment`, not `thread-replies`).
