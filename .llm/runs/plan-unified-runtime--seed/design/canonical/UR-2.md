<!-- seed:plan-unified-runtime slot:UR-2 -->

# UR-2 — Nitro owns listener/lifecycle; single-shot `close` disposal via the lifecycle contract

- **Slot:** UR-2
- **Owning pack:** D1 composition-host (draft D1-2)
- **Labels:** `type:feat`, `area:deploy`, `area:fresh`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** UR-0 (hostable-service lifecycle contract), UR-1 (composition root)
- **Blocks:** UR-3, UR-10

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-2 -->
>
> Bind the composition root into Nitro v3 as a synchronous plugin. **Nitro owns process startup, the
> single listener, top-level `error` observation, and shutdown.** Async adapter construction (DB
> pools, queue connections) happens before plugin registration; resolved handles are closed over so
> registration stays synchronous. Every adapter/worker registers a disposer; the Nitro `close` hook
> drains through the **UR-0 hostable-service lifecycle contract** (which reuses the shipped
> `ServiceShutdownCoordinator` policy — idempotency, bounded drain budget, LIFO order, structured
> report), **not** a bespoke second registry. The lifecycle bridge is explicit — do not assume
> Fresh/Hono middleware order matches Nitro's pipeline, and account for Nitro running static files
> before middleware/routes. See proposal.md §2 (evidence: `research/nitro-v3.md` Lifecycle row).

## Acceptance / gates

- [ ] gate: no nested listen — Nitro is the sole listener owner
- [ ] gate: `close` hook drains the UR-0 lifecycle contract exactly once (idempotent under double-close), LIFO order, bounded drain budget
- [ ] gate: plugin registration is synchronous; async construction resolved beforehand
- [ ] gate: only host/composition failures (not RPC-domain errors) reach Nitro's `error` hook

## Fork deltas

None.
