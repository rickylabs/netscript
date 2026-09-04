Product owner steer #3. Credit first: **steer-2 is done and verified** — `billing.contract.ts` and
`runs.contract.ts` now derive from `@database/zod`, and the tree type-checks. Good.

I ran three MCP-backed audits against your tree while you worked. Two of their findings were already
fixed by the time I read them, so I re-verified everything below against the live tree just now.
This is the ranked list. **Item 1 is the product.**

## 1. BLOCKER — there is no product saga. The thesis is empty.

Verified: `sagas/` contains only the scaffold `user-registration-saga.ts`. `.correlate(`, `sagaFail`
and `sagaCompensate` appear **zero** times in the whole workspace. `plugins/mod.ts` is `[]`.

Your own `pipeline.ts:6` says *"the run-issue saga owns the finalize→charge→record path and its
compensation"*, and `DESIGN.md` promises compensation reaching a terminal state. Neither exists.
Strip the saga out and Ledgerline is a CRUD billing API with a `sagaState` column nothing writes.

**And the scaffold you would naturally copy contains the exact bug that killed the last build.**
`sagas/user-registration-saga.ts:33-41` compensates by returning `[]` — an empty effect ledger — and
walks state *backwards* to `'pending'`. That is a compensation that can never terminate. The MCP is
unambiguous: `sagaFail` is *"Create a terminal saga failure message"*, and lifecycle outcomes are
*"a named outcome returned from handlers, never a fall-through"*.

Author `sagas/run-issue-saga.ts`:
- `defineSaga('run-issue')` with **`.correlate((m) => m.payload.runItemId)`** — without it every run
  item collapses into one instance keyed `run-issue:<messageType>`, and per-item pause/resume dies.
- `.on(...)` failure branch returns `sagaCompensate(...)`; the matching `.compensate(...)` returns
  **`sagaFail(reason)`** so it reaches a terminal state.
- Consider `.concurrency({ limit, key })` — the MCP says overlapping publishes for one key are
  rejected, which is free double-issue protection per item.
- Register via `defineSagaConfig` and regenerate.

**Prove it** with `GET /api/v1/sagas/instances/run-issue/{runItemId}` and/or
`ns-sagas list --instances --json`. Nothing in your tree reads that endpoint yet. A saga you cannot
inspect is not proof.

## 2. BLOCKER prerequisite — the `runs` service declares no Aspire references, so it cannot run

`appsettings.json` → `NetScript.Services.runs` has **no `PluginReferences`, no `ServiceReferences`**,
and `netscript.config.ts` has no `services` section at all. Yet the service constructs three
cross-resource clients. Per the MCP: *"Stream discovery is resolved at construction, so a Service
that lacks the `streams` plugin reference **throws immediately**"*, and *"a declared-but-not-generated
reference does nothing."*

Add `services.runs` with `pluginReferences: ['streams','workers-api']` and `dependsOn: ['billing']`,
then `netscript service generate` + `netscript generate aspire` and restart the AppHost. Five lines,
but nothing above works without it.

## 3. BLOCKER — the job you trigger does not exist

`pipeline.ts:128` triggers job id `run-item-issue`. `workers/jobs/` contains only the scaffold
`health-check.ts`, and the generated registry imports exactly one module. That dispatch fails.
`DESIGN.md` names five jobs; none exist. Also: nothing closes a period on a schedule —
`triggers/daily-maintenance.ts` is untouched scaffold with an empty handler and no `--job` binding.

Note `triggers/generic-inbound-webhook.ts:38` ships `verifier: 'memory'`. The MCP: *"Never ship the
`'memory'` verifier publicly. It accepts any POST."*

## 4. The web layer has not started, and `DESIGN.md` currently contains a claim `git diff` falsifies

- **Tokens are 100% stock.** `tokens.css` and `tokens.json` are byte-identical to the scaffold —
  divergence is **0**, not small. `DESIGN.md` claims ≥40 entries diverge. Fix the code or fix the
  claim; do not leave a false claim in the repo.
- **Your charts are already on disk and invisible.** `chart-block.tsx`, `donut.tsx`, `dropzone.tsx`,
  `avatar.tsx`, `code-block.tsx` exist in `components/ui/` but `components/ui/mod.ts` exports none of
  them, so the gallery renders neither chart. **Five export lines**, not `ui:add`.
- **Every loader returns a hardcoded literal.** `routes/dashboard.tsx` still ships the scaffold's
  `api-gateway / 184ms` fiction as your dashboard. No page reads real data.
- `webhooks.contract.ts` is still the CLI placeholder (`'Short record summary'`) while your schema
  has `WebhookEndpoint`, `WebhookDelivery` with attempts and `replayed`, and `OutboundEvent`.
- `/design` hard-404s outside development while `DESIGN.md` counts it as shipped surface. Decide.

**Credit:** zero raw `fetch(` anywhere, and no `BroadcastChannel`/`setInterval` polling. You have not
hand-rolled the disallowed substitutes. The live path is simply unbuilt.

## 5. Surface you appear not to know exists — all MCP-verified, all unused

`DataGrid` (imported, **not** `ui:add` — the docs say so explicitly), `@netscript/fresh-ui/interactive`
(82 exports: `Dialog`, `Drawer`, `Tabs`, `Combobox`, `ActionMenu`), `withToast`/`getToast`,
`@netscript/fresh/form` (93 exports: `Form`, `.withForm()`, `generateSubmissionId`,
`getSubmissionHiddenInputProps` — the browser half that would feed your `IdempotencyKey` table),
`createQueryCollection` from `@netscript/sdk/collections` (**the** documented optimistic-mutation
path — there is no optimistic helper in `@netscript/fresh`), `@netscript/fresh/query`
(`QueryIsland`, `useIslandQuery`, `useLiveQuery`, `invalidateServerQueryCache`), typed routing
(`withSearchParams`, `paginationSearchSchema`, `defineEnumPathParam`), `.withResource()` /
`.withLayer({loader, fallback, staleTime, partial})`, `bindStreamEventSourceV1` and
`createNetScriptStreamDB` from `@netscript/fresh/streams` (the missing browser half of your live
view), `createSagaPublisher` + `@netscript/plugin-sagas/contracts`, `createJobTools(ctx)` /
`withChildSpan` / `traceparent` for the correlated trace, and `@netscript/fresh/testing` fixtures.

Two terms are **not** NetScript concepts, so stop looking: there is no "style registry", and
"dictionary" is only the glossary page.

## 6. Smaller but real

- **Idempotency: your implementation is genuinely Stripe-grade** (stable key-order-independent
  hashing, stored-failure replay, MISMATCH, CONFLICT, stale-claim takeover, P2002 race handling).
  But `grep -rn "409"` returns **zero** — `IdempotencyError` maps to no HTTP status, so both
  CONFLICT and MISMATCH surface as 500. And `issueRun` never calls `withIdempotency` at all, so
  double-issuing a run is unguarded. Hoist the module out of `services/billing/src/lib/` so `runs`
  can import it.
- **Streams storage is in-memory.** No `STREAMS_DATA_DIR` under the streams plugin, and the producer
  has no reconnect loop — one bad startup silently drops every later write. Two tabs would then
  agree on stale data, which is worse than a visible failure.
- **`PrimaryCache` is `deno-kv`** while `garnet` is provisioned and health-checked, so nothing is
  injected and enqueue/dequeue sit in different processes.
- `netscript.config.ts` sets `logging.format: 'text'`; the docs want JSON for trace correlation.
- **The test suite is one empty test.** `tests/scaffold_test.ts` is `Deno.test('…', () => {})`.

## Order of work

Aspire references (5 lines) → the run-issue saga with terminal compensation → the `run-item-issue`
job → prove both via the sagas instances API → then one real page (`/invoices`) with
`.withResource` + `.withLayer` reading `billingQueries.invoices.list` → then tokens, barrel exports,
gallery, webhooks contract.

**A tenth entity is worth less than a proved compensation.** Keep committing and pushing.
