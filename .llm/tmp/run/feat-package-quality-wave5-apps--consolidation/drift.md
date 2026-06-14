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

## 2026-06-14 — user requested base classes; doctrine realizes seams as ports (architectural)
User asked for "abstract class for public facing seams, base class with implements and adapters and
ports." Doctrine 03 (A4/A5) forbids base classes without ≥ 2 concrete subtypes and routes
cross-package extension through ports+registration. Resolution recorded as plan D1.1: ports +
adapters + canonical `src/` layering; base classes withheld until a real subtype axis lands.
