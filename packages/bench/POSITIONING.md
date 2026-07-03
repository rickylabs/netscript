# NetScript positioning thesis & beta/stable acceptance criteria

> **Status: §4 framed for the incremental-beta cadence.** This document is the _synthesis half_ of
> the S1 positioning deliverable (umbrella #301 / bench sub-epic #302). The **thesis** below is
> falsifiable and grounded in the shipped `@netscript/bench` instrument. Per the user's strategy for
> the 0.0.1 line — an **incremental beta cadence** (beta.1 → beta.2 → … → stable, mirroring the
> alpha line) — **beta.1 is a minimal cuttable bar** (the current green state), and the
> **falsifiable positioning verdict is a stable-line goal pursued incrementally across the betas**,
> _not_ a beta.1 gate. The **empirical verdict** (an actual measured score on the thesis) remains
> gated on **D2** (competitor framework set), **D5** (agent model + build cadence), and **OQ2**
> (live API keys + cost budget) — but those are **positioning-line inputs, not beta-cut blockers**,
> and no number is asserted here. Milestone/issue structure (beta.1..N descriptions, re-tagging) is
> owned by the release/GitHub lane; this file owns the §4 prose only.

## 1. The thesis (falsifiable)

**NetScript competes on AI-agent build-efficiency, not runtime throughput.**

The claim, stated so it can be proven wrong:

> Given the same task, the same coding agent, and the same pinned corpus, an agent building a
> working, contract-correct backend service **on NetScript** reaches a fully-green black-box suite
> in **fewer turns, less wall-clock, and lower token cost** than on a representative mainstream
> alternative — and does so **without trading away** runtime correctness on the frozen suite.

This is deliberately **not** a requests-per-second claim. NetScript's runtime is Deno + Web Platform
APIs; it does not out-throughput a hand-tuned Go or Rust service and does not try to. The wager is
that the _cost that actually dominates a 2026 backend_ is **how efficiently an agent can build and
change it correctly**, and that NetScript's design (contract-first oRPC surface, shared error
vocabulary, thin plugins over centralized primitives, one-command scaffold) compresses that cost.

### Why this axis is the honest one

- Throughput is a solved, commoditized axis where NetScript cannot and should not claim a lead.
- Build-efficiency is where the framework's opinionated seams (typed contracts, `@netscript/kv`,
  scaffold codegen, doctrine-governed plugin thinness) are supposed to pay off — so it is the axis
  on which the framework should be willing to be **measured and falsified**.

## 2. The measurement instrument

The thesis is operationalized by `@netscript/bench` — a clean-architecture harness that drives a
coding agent through a task in an isolated sandbox, runs a **frozen black-box HTTP suite** after
every turn, and scores the attempt. The instrument is real and CI-guarded today:

- **Golden reference + conformance gate (shipped, key-free).** A cast-free NetScript reference for
  `t1-storefront-api` passes the frozen suite **10/10** over HTTP, with a real process restart
  proving `@netscript/kv` persistence. The `conformance` gate boots it and replays the suite every
  CI run, proving a compliant NetScript service _can_ go green without spending an agent run.
- **Four scored build-efficiency axes** (default preset weights):

  | Metric           | Direction | Anchor (worst → best) | Weight |
  | ---------------- | --------- | --------------------- | ------ |
  | `test_pass_rate` | higher    | 0 → 1                 | 0.45   |
  | `turns_to_green` | lower     | 80 → 5                | 0.15   |
  | `cost` (USD)     | lower     | $2.00 → $0.05         | 0.10   |
  | `wall_seconds`   | lower     | 900 → 60              | 0.10   |
  | `lines_of_code`  | —         | report-only           | 0.00   |

  The `default` preset holds a **0.20 rubric reserve** (provisional composite sums to 0.80 until the
  Slice-5 rubric axis lands); `encore-parity` drops the reserve and tilts toward efficiency.

- **No fabricated inputs.** Cost is priced from a pinned per-model table grounded in the
  `claude-api` reference; a summary flagged `fake` is a pipeline proof, never a benchmark result.

### The comparability discipline (why a number is not a verdict)

A score is a reading of **one pinned corpus state** — model id, Claude Code version, NetScript /
Deno / lockfile versions, seed, and weight preset must all match via the `RunManifest`. The
framework is pre-1.0 and moving fast. **Never compare across differing manifests.** A credible
positioning verdict therefore requires _paired_ runs (NetScript vs each alternative) under a single
frozen manifest — which is exactly what the escalated decisions below unblock.

## 3. What a credible empirical verdict requires (blocked — escalated)

The instrument is ready; the _experiment design inputs_ are product decisions the user must make:

- **D2 — competitor set.** Which mainstream alternative(s) form the comparison baseline (e.g. a
  Node/Express or Hono service, an Encore.ts service, a Nest service). The thesis needs at least one
  credible non-NetScript lane implementing the _same_ `t1` contract.
- **D5 — agent model + build cadence.** Which agent model drives all lanes, and the turn/wall caps —
  fixed identically across lanes so the only variable is the framework.
- **OQ2 — live keys + cost budget.** `bench self` (non-`--fake`) is API-key gated; a paid-run budget
  and key provisioning must be authorized before any measured number exists.

Until these are set, the positioning verdict remains **thesis-only**. This is a feature, not a
stall: the instrument refuses to fabricate a comparison.

## 4. Acceptance criteria across the incremental-beta cadence

These convert the thesis into gates positioned along the 0.0.1 line. **Bold** items are the
falsifiable core. The 0.0.1 line is an **incremental beta cadence** (beta.1 → beta.2 → … → stable):
beta.1 is a **minimal cuttable bar**, and the positioning verdict is layered in across later betas.

### 0.0.1-beta.1 acceptance (minimal cuttable bar)

beta.1 ships the **current green state** — it requires **no bench measurement**:

1. **Instrument honesty.** Conformance gate green in CI (reference 10/10, real restart); no `fake`
   summary is ever presented as a result. _(Met.)_
2. **Soundness floor.** The plugin-service contract seam is type-sound end-to-end — handler bodies
   are genuinely output-checked. _(Met: 172a-2-SOUND complete, #332 closed; slices 1/3/4 merged.)_
3. **Scaffold trust.** `scaffold.runtime` e2e green — a scaffolded project type-checks, wires DB,
   and serves plugin endpoints in one pass. _(Met.)_
4. **CI + release machinery.** The `check` / `lint` / `fmt:check` trio is green and the release cut
   is a working one-command path. _(Met.)_

> beta.1 does **not** require self-bench, a competitor-paired run, task breadth, or the full rubric.
> Those are the positioning verdict, layered in below across later betas.

### The positioning verdict — a stable-line goal, reached incrementally

The falsifiable verdict is pursued **across the beta cadence** and completed for stable. Each step
is a later-beta bet; **none gates beta.1**:

- **P1 — self-bench green (an early-beta goal).** Self-bench t1+t2 reach **`test_pass_rate` ≥ 0.90**
  median across N≥3 runs, with the regression detector wired to fire on drops. NetScript-only — no
  competitor lane — so it needs **D5/OQ2** but **not D2**.
- **P2 — competitor-paired (a mid-beta goal).** At least **one** frozen-manifest paired run
  (NetScript vs ≥1 D2 alternative, same D5 model/caps): NetScript **not worse on `test_pass_rate`**
  and **strictly better on ≥1 efficiency axis** (`turns_to_green`, `cost`, or `wall_seconds`). Needs
  **D2/D5/OQ2**.
- **P3 — breadth + full rubric (toward stable).** The lead holds across **≥2 tasks** and **N≥3
  repeats per lane** (variance reported), and the 0.20 rubric reserve is retired (bench Slice 5).

### 0.0.1-stable acceptance (build-efficiency defensible)

1. **Positioning verdict complete.** P1–P3 above are all met and their scored summaries committed.
2. **Reproducible verdict.** Every published score carries its full `RunManifest`; a third party can
   re-run and land within reported variance.
3. **Positioning copy matches evidence.** Public positioning claims are traceable to a committed
   scored summary — no claim exceeds what a pinned run demonstrates (aligns with the docs-site
   positioning lane, #232, without owning it).
4. **Falsification honored.** If paired runs show NetScript is _not_ more build-efficient, the
   positioning is revised — the criteria commit us to reporting the result either way.

## 5. Cross-lane note (soundness ↔ instrument)

The bench reference README documents that it builds procedures on `os.errors(...)` rather than the
public `baseContract`, precisely because that export was type-erased (`{ '~orpc': any }`) and could
not carry a sound `.handler()` without a cast. **172a-2-SOUND has removed that erasure (#332 closed,
slices 1/3/4 merged).** The optional **bench Slice 5** can now rebind the reference onto the sound
`baseContract`, retiring the last reason the instrument reached under the public surface — closing
the loop between the S2 soundness lane and the S1 positioning lane.

---

_Owner: Fable 5 program supervisor (S1 / #302). §4 is LOCKED per the user's S1/S2 decisions; the
empirical verdict still awaits user decisions D2 / D5 / OQ2._
