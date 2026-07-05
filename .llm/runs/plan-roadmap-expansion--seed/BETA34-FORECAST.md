# BETA34-FORECAST — re-forecast of the release-train FRONT (beta.3 + beta.4)

> **PLANNING PROPOSAL — zero GitHub mutation performed.** All `gh` reads in this session were
> read-only (auth `rickylabs` verified). Milestone moves below are a table for **owner
> ratification**; nothing has been applied.
>
> Run: `plan-roadmap-expansion--seed` · Author: Fable 5 planning supervisor · 2026-07-05
> Governing law: **incremental-beta-cadence** — each beta = the SMALLEST shippable increment, cut
> ASAP; a near cut must never be blocked waiting on a large or externally-timed item.

---

## (a) Baseline restatement (re-verified live 2026-07-05)

| Milestone | State | Open | Closed | Note |
| --------- | ----- | ---- | ------ | ---- |
| 0.0.1-beta.1 | closed | 0 | 19 | shipped 2026-07-03 |
| 0.0.1-beta.2 | closed | 0 | 10 | **latest published** (tag `v0.0.1-beta.2`, 2026-07-04) |
| **0.0.1-beta.3** | **open** | **5** | **13** | the REAL next cut; never published; reopened after the milestone-train correction |
| **0.0.1-beta.4** | **open** | **0** | **0** | next increment; currently EMPTY |
| 0.0.1-beta.5 | open | 14 | 0 | telemetry T1→T2 anchor + F-ai parity + S2/S4/S5/S6 + deploy S9–S12 + #327/#389 |
| 0.0.1-beta.6 | open | 33 | 0 | Spine-1 co-land (telemetry T3–T7 + dashboard DDX) |
| 0.0.1-beta.7 | open | 27 | 0 | docs-cut + F-ai beta.7 + T8 |
| 0.0.1-beta.8 | open | 6 | 0 | desktop #E1–#E6 |
| 0.0.1-stable | open | 13 | 5 | tail |

beta.3 open set (live): **#393, #394** (p1 deploy), **#387** (p2 process), **#376** (p2 bug),
**#219** (p1 AI-stack anchor). The roadmap-expansion plan (#397) slotted all new work at
beta.5→beta.8 and never specified beta.3/beta.4 — this document fills that gap.

---

## (b) beta.3 — proposed set (cut on the 4 tractable items)

**beta.3 = "the deploy lane works and is proven, plus hardening fixes":**

| # | Title (short) | Why it stays |
| - | ------------- | ------------ |
| #393 | Aspire compose target not registered in `DEFAULT_DEPLOY_TARGETS` | p1 bug, docker/compose lane is dead today; small, tractable, `epic:deployment` foundation |
| #394 | No deploy target has any e2e coverage (deploy e2e gate) | p1; the proving gate for #393; also the declared foundation dep for desktop #E7 (stable) — landing it early de-risks the whole deployment epic |
| #387 | Gate issue closure on verified acceptance | p2 process guardrail; directly motivated by the very false-closed drift that broke this train; cheap, harness-lane |
| #376 | `workers-plugin-health-check` entrypoint not resolvable | p2 bug in a first-party plugin surface; tractable, self-contained |

Coherence: a real, shippable increment — deploy lane fixed **and** e2e-proven, plus two hardening
items. All four are `status:plan`, `wave:v1`, and have no external/blocked dependency.

### The explicit #219 ruling: **move OUT of beta.3 → beta.4. #219 does NOT gate beta.3.**

Rationale (from the live issue, not the stale "blocked" framing):

1. **There is no framework code left to ship for #219.** The owner's 2026-07-04 closing-criteria
   comment on the issue states the durable-chat primitives are **already on main**: FA1 (#250,
   `createNetScriptChatConnection`), FA2 (#251, `createChatStreamProxyHandler`), the #239
   gzip-strip fix (the proven root cause of the Electric "Decoding failed" symptom), and the
   SR1/SR2 stream-race fixes.
2. **What remains is proof, not build:** migrating eis-chat's chat/stream layer onto the beta.1
   `@netscript/fresh/ai` primitives and confirming the three `Accept-Encoding: identity`
   workaround sites drop. That is an **out-of-repo dogfooding migration** whose timing is owned by
   the owner's eis-chat schedule — exactly the kind of externally-timed item the
   incremental-beta-cadence law forbids as a cut gate.
3. **Asymmetry of risk:** holding beta.3 for #219 delays four green-path fixes indefinitely;
   moving #219 out costs nothing (the primitives already shipped in beta.1/beta.2 — the cut
   content of beta.3 is unaffected either way).

Destination **beta.4** (not beta.5): the proof work is near-term (the owner's own comment calls it
"the morning dogfooding goal"), needs no F-ai beta.5 slice (FAI-0…3 parity is not a dependency of
the eis-chat migration), and anchors a coherent beta.4 theme (below). **Slide rule:** if the
eis-chat migration is not green at beta.4 cut-readiness, #219 slides to beta.5 rather than blocking
that cut — same law, applied again.

---

## (c) beta.4 — proposed set: "AI flagship hardening" (anchor proof + parity + doctrine law)

| # | Title (short) | From | Why it earns beta.4 |
| - | ------------- | ---- | ------------------- |
| #219 | AI-stack anchor — durable-CHAT proof (eis-chat migration green) | beta.3 | The ruling above; closes on proof, primitives already shipped |
| #388 | plugins/ai flagship parity (FAI-0…3: `/v1/ai` impl + verify/golden/doctor + e2e + publishable) | beta.5 | LD-F2 calls this "the load-bearing near-term spine"; it has **zero dependency on telemetry T1/T2**, so it can land a cut earlier without touching the ratified DAG; the flagship-quality mandate says the AI plugin parity gap is a differentiator-level defect |
| #459 | FAI-4 doctrine backstop (flagship-quality-parity law → doctrine-11 + README framing) | beta.5 | Pairs with #388 by design (LD-F3: "if #388 closes it has no durable home"); docs-lane (Opus workflow), independent of all framework slices |

Coherence: beta.4 = **the AI flagship becomes trustworthy** — the anchor defect is proven fixed
against the real reference app, the plugin reaches reference-plugin parity, and the quality law
gets its doctrine home. Three items, one theme, one epic (`epic:ai-stack`), independent lanes
(WSL Codex for #388, Opus docs-workflow for #459, owner dogfooding for #219). Not a dumping ground.

Rejected alternatives:

- **Pull deployment children #345–#348 forward:** rejected. All four carry `wave:defer` and p2;
  #345 is explicitly stable-tier hardening; #346/#347 (K8s/Azure providers, CI/CD templates) are
  heavyweight. Pulling them contradicts smallest-shippable and would starve beta.5's own scope.
  beta.3's #393/#394 already give deployment its near-term increment.
- **Leave beta.4 = #219 alone:** legal under the cadence law but weak; #388/#459 are already
  telemetry-independent and mandated near-term, so the pull-forward costs nothing and buys the
  beta.6 F-ai lane (FAI-5…9 dep on FAI-0…3) a full cut of slack.

---

## (d) Milestone-move table — FOR OWNER RATIFICATION (not applied)

| Issue | From | To | Reason |
| ----- | ---- | -- | ------ |
| #219 | 0.0.1-beta.3 | 0.0.1-beta.4 | Proof-only remainder, externally timed (eis-chat migration); must not gate beta.3 |
| #388 | 0.0.1-beta.5 | 0.0.1-beta.4 | Telemetry-independent load-bearing spine; pull-forward buys beta.6 FAI-5…9 slack |
| #459 | 0.0.1-beta.5 | 0.0.1-beta.4 | LD-F3 pairs it with #388; docs-lane, dependency-free |

No other moves. **beta.3 keeps #393/#394/#387/#376 unchanged.** beta.5→beta.8 and stable stay
exactly as the ratified plan (#397) and FILING-LOG have them. Do NOT re-close beta.3/beta.4; do NOT
re-drain beta.3 into beta.5 (the reverted mistake).

Resulting train: beta.3 = 4 open (deploy lane + hardening) → beta.4 = 3 open (AI flagship
hardening) → beta.5 = 11 open (telemetry T1→T2 anchor + S2/S4/S5/S6 + deploy S9–S12 + #327/#389).

---

## (e) Second-order effects on the beta.5 T1→T2 crit path

- **Strictly positive or neutral.** The beta.5 telemetry anchor (T1 #402 → T2 #403) is untouched;
  removing #388/#459 shrinks beta.5 from 14 to 11 open, reducing cut contention around the
  T1→T2 foundation that feeds the beta.6 Spine-1 co-land (T2→T3/T4/T5/T6/T7→DDX-8).
- FAI-0…3 landing at beta.4 gives the beta.6 F-ai slices (FAI-5…9, which depend on FAI-0…3) a full
  extra cut of slack — the beta.6 co-land gets safer, not tighter.
- **Reversibility:** if #388 slips in beta.4, the fallback is a one-line slide back to beta.5,
  restoring the ratified plan exactly. No DAG edge changes in either direction.
- Watch item: #388 carries `gate:e2e`; per the standing rule, run `scaffold.runtime` at
  merge-readiness only, not per loop — beta.4 does not add an expensive-gate burden to beta.3.

---

## (f) Open questions for the owner

1. **Ratify the #219 slide rule:** if the eis-chat migration proof is not green at beta.4
   cut-readiness, #219 slides to beta.5 (cadence law) rather than holding the cut. Confirm.
2. **Label/milestone mismatch on #345–#348:** all four sit at beta.5 but carry `wave:defer` (which
   maps to stable per the taxonomy). Reconcile one way (relabel `wave:v1` if beta.5 is real, or
   re-milestone to stable) — flagged only; no move proposed here.
3. **FAI-7 / FAI-9 tracking issues** were deliberately NOT filed in Phase-2 (FILING-LOG deviation).
   If wanted as discrete issues under `epic:ai-stack`, file them before beta.6 planning; not a
   beta.3/beta.4 concern.
4. **PR #462** (`.github/labels.yml` sync) is still unmerged — independent of this forecast but
   pending coordinator review.

---

## (g) APPLIED STATE — reconciled 2026-07-05 (post-ratification)

The owner ratified this re-forecast; the following is **applied live** and supersedes the
"proposal / not applied" framing at the top of this document:

- **beta.3 (the next cut)** = #393 / #394 / #387 / #376 — unchanged from §(b).
- **#388, #459 → beta.4** (§d) — **applied.** The AI flagship parity + doctrine backstop land a cut
  ahead of the ratified plan, buying the beta.6 F-ai slices their slack.
- **#219 → beta.5** — the **slide rule** in §(b)/§(f).1 was **exercised**: the eis-chat migration
  proof was not green at beta.4 cut-readiness, so #219 slid one further increment to **beta.5** (its
  live milestone), *not* beta.4. The §(d) "#219 → beta.4" row is therefore superseded by this
  applied slide; the cadence law held (a near cut was never blocked on the externally-timed proof).
- **FAI-7 filed = #463**, **FAI-9 filed = #464** (both `0.0.1-beta.6`, `epic:ai-stack`) — resolves
  OQ §(f).3.
- **PR #462** (`.github/labels.yml` sync) — **merged.** Resolves OQ §(f).4.

GitHub milestones are the single source of truth; this document is retained as the historical
rationale for the front-train shape.
