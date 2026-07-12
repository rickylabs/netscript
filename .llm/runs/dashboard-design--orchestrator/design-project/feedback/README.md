# Adversarial review — NetScript Dev Dashboard prototype

Reviewer pass over `NetScript Dev Dashboard.dc.html` (Claude Design project
`4c19e768-…`), reviewed at snapshot etag `1783365508903228` (161.9 KB / 2400 lines), all
13 screens rendering (the earlier `<!-- @S12 -->` / `<!-- @S13 -->` placeholder gap closed).
**Note:** the prototype has since advanced past this snapshot — before acting on a finding,
confirm it still applies to the current render; findings tied to specific line numbers may
have shifted. `POC-ground-truth.md` is the real data model extracted from the netscript-start
playground and is snapshot-independent.

Each `feedback-screen-N.md` is **self-contained** — paste one into the design agent to
steer that screen. Findings are prioritized `P1` (fix before demo) / `P2` (should) /
`P3` (nice). Tags: `[DX]` `[UX]` `[DATA]` (realism) `[E2E]` (story value) `[GATE]`
(doctrine gate). Grounded against the two ratified gates and the seed research
(`.llm/runs/plan-roadmap-expansion--seed/research/A-dashboard/`, files 03 & 04).

## Overall verdict

The prototype is a genuine step up: a reactive SPA with ⌘K, a live tick sim,
confirm-gated mutations that print their exact CLI-equivalent, and — critically — both
doctrine gates **hold**: no owned trace-waterfall/log-tail/metrics-chart (duplication
gate), and S13 is a **causal seam chain, not a span gantt** (flow≠waterfall gate). The
weaknesses are not structural; they are **coherence** weaknesses.

## The two highest-leverage steers (cross-cutting — read first)

1. **One canonical journey, told four ways `[E2E]`.** S6 (run timeline), S8 (saga state
   machine), S10 (stream fan-out) and S13 (causal chain) each appear to mock their own
   ids. They should render **the same request** with **identical ids everywhere**. The
   real join key — proven by the netscript-start POC — is a **correlation ID**, not the
   synthetic `ord_7f3k` I first suggested: `workersQueryUtils.listExecutionsByCorrelationId`
   is called from *both* the saga-instance and trigger-event loaders, so one correlation
   ID already ties trigger event ↔ saga instance ↔ worker executions, bidirectionally.
   Use a **real mapped journey** (Stripe webhook → `PaymentWebhookSaga` → reserve job,
   correlated on the Stripe charge id) as the spine so every "Open run / Open saga / Open
   trigger event" out-link resolves to the same entity. This single fixture change converts
   four disconnected demos into the product's spine. Highest ROI in the whole review. **See
   `POC-ground-truth.md` §1 for the real API + the mapping table.**

2. **beta.6 is read-only — the UI must not imply otherwise `[UX][DATA]`.** Per #551/#556
   and the D6 correction, S3 write-back and the S5/S7/S9 toggles ship **read-only in
   beta.6** (write-back = beta.7). Every mutating control that renders operable is a
   promise the build can't keep. Decide one convention and apply it everywhere: either
   render gated controls **visibly disabled** with a "lands in beta.7 (#556)" tooltip, or
   keep them operable **against the mock** but badge the surface "preview". Do not let a
   confirm dialog fire a write the milestone can't perform.

Secondary cross-cutting: (a) **severity voice** — the same fact (`nightly-reconcile`
disabled-vs-drift; streams telemetry immaturity) is narrated on multiple screens; make it
one voice. (b) **confirm-dialog reuse** — S3/S5/S7/S9/S11/S12 must all use the *same*
confirm component (title · from→to · CLI-equivalent), the "one generator, two callers"
law; audit that none rolled its own.

## Files
- `POC-ground-truth.md` — **real data model** from the netscript-start playground (read first)
- `feedback-screen-1.md` — Home / shell
- `feedback-screen-2.md` — Config Resolution (Encore-Flow analog)
- `feedback-screen-3.md` — Runtime Config ⚑ flagship
- `feedback-screen-4.md` — Service & Contract Catalog
- `feedback-screen-5.md` — Plugin Control (dogfood centerpiece)
- `feedback-screen-6.md` — Run Inspector
- `feedback-screen-7.md` — Workers Console
- `feedback-screen-8.md` — Sagas Console
- `feedback-screen-9.md` — Triggers Console
- `feedback-screen-10.md` — Streams Console
- `feedback-screen-11.md` — DB Migrations & Drift
- `feedback-screen-12.md` — Dead-Letter Queues (gated preview)
- `feedback-screen-13.md` — Live Flow ⚑ flagship #2
