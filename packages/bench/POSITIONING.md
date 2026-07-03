# NetScript positioning thesis & beta/stable acceptance criteria

> **Status: DRAFT for user ratification.** This document is the _synthesis half_ of the S1
> positioning deliverable (umbrella #301 / bench sub-epic #302). The **thesis** below is falsifiable
> and grounded in the shipped `@netscript/bench` instrument. The **acceptance criteria** are a
> _proposed_ lock — they become binding only when the user ratifies them. The **empirical verdict**
> (an actual measured score on the thesis) is gated on three escalated decisions — **D2**
> (competitor framework set), **D5** (agent model + build cadence), **OQ2** (live API keys + cost
> budget) — and is intentionally _not_ asserted here.

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

## 4. Proposed beta/stable acceptance criteria (DRAFT — pending user lock)

These convert the thesis into gates. They are proposed; **bold** items are the falsifiable core.

### 0.0.1-beta acceptance (build-efficiency credible)

1. **Instrument honesty.** Conformance gate green in CI (reference 10/10, real restart); no `fake`
   summary is ever presented as a result. _(Met today.)_
2. **Soundness floor.** The plugin-service contract seam is type-sound end-to-end — handler bodies
   are genuinely output-checked (172a-2-SOUND closed, #332). _(In progress: slices 1+3 merged;
   finisher slice 4 in flight.)_
3. **One measured paired run.** At least **one** frozen-manifest paired run (NetScript vs ≥1 D2
   alternative, same D5 model/caps) exists and is committed, with NetScript **not worse on
   `test_pass_rate`** and **strictly better on at least one efficiency axis** (`turns_to_green`,
   `cost`, or `wall_seconds`). _(Blocked on D2/D5/OQ2.)_
4. **Scaffold trust.** `scaffold.runtime` e2e green — a scaffolded project type-checks, wires DB,
   and serves plugin endpoints in one pass.

### 0.0.1-stable acceptance (build-efficiency defensible)

1. **Multi-task, multi-run.** The build-efficiency lead holds across **≥2 tasks** and **N≥3 repeats
   per lane** (variance reported), not a single lucky run.
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
not carry a sound `.handler()` without a cast. **172a-2-SOUND removes that erasure.** Once the
finisher (slice 4) lands, the optional **bench Slice 5** can rebind the reference onto the now-sound
`baseContract`, retiring the last reason the instrument reached under the public surface — closing
the loop between the S2 soundness lane and the S1 positioning lane.

---

_Owner: Fable 5 program supervisor (S1 / #302). This is a synthesis artifact; the empirical verdict
and the binding lock of §4 await user decisions D2 / D5 / OQ2._
