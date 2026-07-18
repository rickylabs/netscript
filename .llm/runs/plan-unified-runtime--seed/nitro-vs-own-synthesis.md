# Supervisor synthesis — build-vs-own after adversarial round 3 (2026-07-18)

Inputs: `research/nitro-vs-own.md` (rev1, HYBRID), owner conditional steer, `nitro-vs-own-rev2.md`
(provider-native HYBRID), `adversarial-nitro-vs-own.md` (Sol·max: 3 BLOCKER / 3 MAJOR / 1 MINOR —
ALL ACCEPTED).

## What survives all three rounds (stable ground)

1. The owner's decision RULE is ratified as board doctrine: **per target, the provider-native
   wrapper wins over a Nitro preset iff it passes the same conformance suite, exposes every
   required native binding/event/config surface, and costs less to maintain.** Nitro never enters
   the composition contract or leaf ports; whatever emits, emits behind the NetScript-owned
   deploy/emitter port. (rev1 §5, rev2 verdict, unchallenged by the adversary.)
2. NetScript ports stay authoritative; provider primitives are capability-scoped backings at most
   (adversary F3 sharpens this: CF Queues' push model ≠ `listen()` loop; KV no-CAS ⇒ capability
   rejection; DO storage ≠ saga correlation index — each is a FEASIBILITY question, not a mapping
   exercise).
3. Docker-image long tail (Koyeb/Sevalla/Coolify/Dokploy/Fly.io/…) = thin adapters on the existing
   Aspire/Docker lane (#346 lineage) — uncontested.

## What the adversary demolished (accepted)

- The CF/AWS "flip to owned families" is UNPROVEN for v1: AWS evidence is an HTTP sidecar +
  raw-event tunnel (F1); CF's "Deno-compatible" path is provider-owned Node tooling callable from
  Deno, with Miniflare fidelity limits omitted (F2); the wrapped-native estimates are arithmetic
  assertions that exclude work their own acceptance rule requires (F4); vercel-deno is
  research-only (F7).
- `@netscript/deploy` as sketched is a god-object with a dependency cycle risk; it needs a real
  architecture card (package/import graph, adapter-registration ownership) before adoption (F5).
- Rev2's UR delta is NOT a filable branch — the canonical bodies are Nitro-specific throughout;
  adopting provider-native HYBRID for v1 means a full canonical re-branch + another
  adversarial/PLAN-EVAL cycle (F6).

## Owner fork N1 (added to the Stage-H brief)

- **N1-A (recommended): file the locked board + feasibility cards + the rule.** File UR-0…UR-12/
  DD-RESEARCH as locked (Nitro-scoped v1 cells — honest to the evidence we HAVE), plus three new
  cards: CF-PROBE (owned-adapter feasibility: Wrangler/Vite/Miniflare wrap, live-target probes,
  per-primitive capability verdicts vs the port contracts), AWS-PROBE (split: HTTP hosting probe
  via Lambda Web Adapter; SQS/event conformance design as its own card), DEPLOY-ARCH (the
  `@netscript/deploy` package/import-graph design, folded into or beside UR-11). Encode the owner
  rule in UR-6/UR-12 acceptance ("any cell's emitter is replaceable by a provider-native wrapper
  that passes the same conformance"). The probes produce exactly the evidence a later flip needs;
  no unproven architecture is filed.
- **N1-B: commission the full provider-native canonical branch now** (all bodies/DAG/briefs/
  manifest redone under the flip) + adversarial + PLAN-EVAL before Stage-H. Larger, delays filing,
  and files an architecture whose feasibility evidence doesn't exist yet (the adversary's core
  point).

N1-A keeps every door open: if CF-PROBE/AWS-PROBE come back green, the flip lands as an evidenced
amendment; if not, the board never lied. Awaiting the owner's N1 pick alongside F-1…F-17/SC-1…SC-6.
