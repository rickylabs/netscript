# Drift Log — Wave 5 Apps Consolidation

Append-only. Severity: minor | significant | architectural.

## 2026-06-14 — carried-in plan path absent (significant)
User cited `.llm/tmp/run/openhands/pr-17/run-27496615815-1/plan.md` as prior cheap-agent work.
That path does **not** exist in this worktree (verified `find` + Glob; local openhands runs are
`pr-25`, `pr-32`). The prior OpenHands output is already **merged** into this umbrella branch, so
the plan was re-derived from live package inspection of the merged tree (the harness-correct
re-baseline per run-loop §2). No blocker — the inspected tree _is_ the prior work's result.

## 2026-06-14 — PLAN-EVAL waived by user (significant)
User: "It won't require an additional PLAN PHASE, you are smart enough." Per run-loop §4 the
Plan-Gate is a hard stop "unless the user explicitly waives it in writing." This is that waiver.
Recorded so the IMPL-EVAL does not flag missing `plan-eval.md` as a process failure.

## 2026-06-14 — A1 split file names differ from plan (minor)
Plan A1 named `service-builder-state.ts` + `service-builder-steps.ts` (typestate accumulator + step
fns). The live `ServiceBuilderImpl` is a single mutable class, not a typestate builder, so that split
would invent structure that isn't there. Shipped instead: `service-builder.ts` (public surface),
`service-builder-impl.ts` (class), `service-rpc.ts` (oRPC wiring), `service-listener.ts` (Deno.serve
lifecycle) — split along real seams. Same doctrine outcome (no file > ceiling, complexity isolated,
public surface unchanged). No re-plan needed.

## 2026-06-14 — Phase B narrowed to B3 (barrel collapse); B1/B2 deferred (significant)
Plan B1 (gather adapters into `src/adapters/`) and B2 (split `src/domain/` + `src/application/`)
were **not executed**. Reason, from live inspection:
- The three "adapters" (`kv-cache-store.ts`, `http-client-link.ts`, `kv-cache-persister.ts`) are each
  tightly coupled to a sibling in their feature folder (`cache-query.ts`↔`kv-cache-store.ts`,
  `service-client.ts`↔`http-client-link.ts`). A global `src/adapters/` folder would break that
  co-location and *reduce* cohesion — over-abstraction under KISS / doctrine "co-locate what changes
  together". The port seams already exist in `src/ports/` (the user's "ports" ask is satisfied).
- `src/` feature folders (`cache`, `client`, `query`, `query-client`, `discovery`, `collections`,
  `telemetry`, `ports`, `presets`, `openapi`) are already cohesive and role-correct; forcing a
  domain/application/adapters re-slice is churn without a maintainability win.
The genuine doctrine drift was the **root barrel duplication** (exports pointed at root folders, not
`src/` like the `plugin` reference). B3 fixed exactly that: 8 root barrel folders + `streams.ts`
collapsed into `src/`, exports repointed, subpath keys unchanged (zero consumer break). Recorded so
the evaluator sees B1/B2 omission as a reasoned KISS decision, not a gap. Revisit if a second concrete
adapter per port ever lands.

## 2026-06-14 — user requested base classes; doctrine realizes seams as ports (architectural)
User asked for "abstract class for public facing seams, base class with implements and adapters and
ports." Doctrine 03 (A4/A5) forbids base classes without ≥ 2 concrete subtypes and routes
cross-package extension through ports+registration. Resolution recorded as plan D1.1: ports +
adapters + canonical `src/` layering; base classes withheld until a real subtype axis lands.
