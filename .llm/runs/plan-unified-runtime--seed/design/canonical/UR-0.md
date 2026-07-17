<!-- seed:plan-unified-runtime slot:UR-0 -->

# UR-0 — Hostable-service lifecycle contract (exported build/start/stop preserving startup/shutdown)

- **Slot:** UR-0 (prerequisite — precedes UR-2)
- **Owning pack:** D1 composition-host (new prerequisite, Stage-F F5)
- **Labels:** `type:feat`, `area:service`, `epic:unified-runtime`, `epic:deployment`, `priority:p1`, `wave:v1`, `status:plan`
- **Milestone:** `0.0.1-beta.13`
- **Depends on:** — (foundation; UR-2 depends on UR-0)
- **Blocks:** UR-2 (Nitro host integration), UR-5/UR-6 saga drain wiring

## Body

> Part of #823
>
> <!-- seed:plan-unified-runtime slot:UR-0 -->
>
> **Prerequisite for the Nitro host bridge (UR-2).** Today `ServiceBuilderImpl.build()` returns
> only the `ServiceApp` and neither runs nor exposes the builder's lifecycle hooks
> (`packages/service/src/builder/service-builder-impl.ts:423-432`). Startup and shutdown hooks are
> private and are honored **only** by `serve()`, the listener-owning path the unified runtime
> forbids (`packages/service/src/builder/service-builder-impl.ts:501-521`). A service that registers
> `.onStartup()` / `.onShutdown()` would therefore **silently lose lifecycle behavior** the moment it
> is hosted under Nitro instead of `serve()`.
>
> This card defines and exports a **hostable-service lifecycle contract** — a build/start/stop
> surface (or equivalent `[Symbol.asyncDispose]`-bearing handle) that a host (Nitro, desktop, tests)
> can drive **without** owning a listener:
>
> - `build()` continues to return the `ServiceApp`; a new exported surface exposes **start**
>   (run startup hooks, with startup-failure rollback) and **stop** (graceful drain) decoupled from
>   `serve()`'s Deno listener.
> - **Reuse the shipped `ServiceShutdownCoordinator` policy** — do not invent a second, weaker
>   lifecycle. The coordinator already owns idempotency, an `AbortController`, a bounded drain-timeout
>   budget, LIFO teardown-hook ordering, and structured `ShutdownReport`s
>   (`packages/service/src/builder/service-shutdown.ts:1-135`,
>   `DEFAULT_DRAIN_TIMEOUT_MS = 30_000`). The host contract wraps this coordinator; it must not
>   re-implement "exactly once" with different semantics.
> - Preserve **startup-hook ordering and startup-failure rollback**: `serve()` runs startup hooks
>   before binding the listener (`service-builder-impl.ts:501-521`); the hostable surface must run
>   them at host start and roll back partial construction on failure.
> - The Nitro `close` hook (UR-2) drives this contract's **stop**; the disposal registry UR-2
>   maintains delegates drain/teardown to the coordinator rather than to a bespoke "exactly once"
>   registry.
>
> Specify the **package/export/JSR gates** for the new surface (which package owns it, what is public
> vs internal, `deno doc --lint` clean) as part of UR-11 architecture contracts — this card provides
> the lifecycle behavior; UR-11 provides the export ownership.
>
> Evidence: `research/adapter-mapping.md` (a bridge must order start, close, drain, and failure
> reporting); design pack `design/D1-composition-host/proposal.md` §2.3–§2.4.

## Acceptance / gates

- [ ] gate: an exported hostable surface runs registered `onStartup` hooks at host start, in
      registration order, with rollback on startup failure (no listener bound)
- [ ] gate: host stop drains via the shipped `ServiceShutdownCoordinator` policy — idempotent under
      double-stop, LIFO hook order, bounded drain budget, structured `ShutdownReport` returned
- [ ] gate: a service using `.onStartup()` / `.onShutdown()` retains identical lifecycle behavior
      when hosted (not `serve()`-launched) as it had under `serve()`
- [ ] gate: no second/incompatible lifecycle registry is introduced; the Nitro `close` path (UR-2)
      delegates to this contract
- [ ] gate: package/export ownership and JSR surface for the new API recorded against UR-11

## Fork deltas

None. (Dependency-direction of the exported surface vis-à-vis the SDK is decided by **F-7**, resolved
in UR-4/UR-11, not here.)
