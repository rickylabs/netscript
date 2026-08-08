# Wave 7 & agent adoption — DRAFT (no GitHub mutation; owner ratification pending)

Proposed Wave-7 harness changes and the measured smoke matrix. Deliberately **thin**: Wave 7
proves docs/MCP/generation adoption; it does not script product choices. Sources:
`research/wave-5-6-plans.md` (brief lineage, rubric, measurement method),
`research/wave-6-runs.md` (R1–R3 + recurrence table), `research/preplan-package.md` (§Wave-7
rules, owner constraints), `research/github-board-open.md` §6.3 (the measurement chain).

## 1. What Wave 7 exists to falsify

**Hypothesis under test:** after the 0.0.7/0.0.8 remediation cuts, the generated path (resource
slice, client/query module, protected-by-default auth, durable-runtime truth) changes unfamiliar-
agent behavior — adoption becomes the path of least resistance instead of a compliance ask.

Wave 6's evidence base: capability present ≠ activated (six consecutive measured runs with zero
MCP/doctor/otel usage; `#1197`); R3's only-GO run is confounded (supervisor-enforced init gate,
different model, different canary — `research/wave-6-runs.md` #7). Wave 7 must remove those
confounds, not re-run Wave 6 harder.

## 2. What carries over unchanged (proven Wave-5/6 machinery)

- **Never name a capability** in the brief; pressure-not-feature forcing functions
  (`projects/README.md:25-28` rule; the `withForm`-derived-unprompted validation).
- Project catalog with version gate (Quickstart canary pin — the Wave-6 pilot's silent stable
  install is the cautionary case), distinctive-skin bar, "one entity is not a product".
- Taxonomised executed-command census (SETUP/LOOP/DIAG/REPO; parse tool calls, not transcript
  greps; exclude generated code; track the nested init repo).
- Capability-map rows end **proved / simulated / absent / rejected**, one evidence pointer each;
  rejected-substitutes column (the Kimi runbook's non-de-scopeable matrix).
- Causal claims need a trace/state transition that fails if the named seam is removed;
  config presence, registry presence, green wrapper exit, and screenshots are not proof.
- Runtime truth wins over article/README; mechanical article fidelity check; supervisor
  contamination rules (seven classes) + intervention ledger; leak-check/teardown hygiene.

## 3. What changes in Wave 7 (the additions, each tied to a remediation deliverable)

1. **Generated-slice usage is a first-class measured row.** The agent must use
   `ui:add page` (slice mode), the client/query generator, and `service add-handler` — or record
   a rejection with a reason. Both outcomes are valid data; silence is a harness failure.
   (Measures T2; the #1090 box "runs `ui:add` or records why not" becomes executable.)
2. **Type-escape review blockers become mechanical gates.** Arbitrary `any`, `as unknown as`,
   raw route/search parsing, raw `fetch` on a supported seam → the consumer-side no-`any` gate
   (T2/T6 deliverables) runs against the agent's product, not just framework exports.
3. **Runtime-truth gates replace wrapper-exit gates.** Saga publish receipt handling, child
   liveness states, durable-stream restart proof (T4) are probed by the evaluator from persisted
   state + one correlated trace — the R2/R3 "registration and enqueue acceptance explicitly
   insufficient" rule, now backed by framework surfaces that make it checkable.
4. **MCP-on-by-default measurement.** The scaffold's `.mcp.json` carries the docs corpus (T5-03);
   Wave 7 measures MCP call counts with the mirror absent (#1201's "workspace with no docs/
   directory" condition). Six-zeros is the baseline to beat; the #1102/#1201 capability issues —
   not Wave 7 — own retrieval quality.
5. **Every configured gate enumerated and run separately**; wrapper/last-stage exit is
   insufficient (Wave-6 rule, kept because #1328's 154-finding surface shipped green under it).
6. **Confound control.** Same brief, same canary, same budget across arms; the R3 enforced-init
   gate becomes a **measured arm variable** (enforced vs not), because it is the strongest
   untested causal lever in the corpus (`research/wave-5-6-plans.md` #17).

## 4. Measured smoke matrix (the minimum publishable design)

| Arm | Canary | Init gate | Slice commands | What it isolates |
| --- | --- | --- | --- | --- |
| A | post-0.0.8 | not enforced | available | pure product effect of generation |
| B | post-0.0.8 | enforced (R3 protocol) | available | init-gate lever on top of generation |
| C (control) | pre-remediation 0.0.6 | not enforced | absent | the baseline delta |

Two runs per arm minimum, different frontier models, blind gap-audit scoring (Wave-6 rubric).
Success criterion for the program (0.0.8 exit): Arm A shows non-zero generated-slice adoption
AND zero unexplained type-escapes; Arm A vs C shows a categorical difference on the capability
map's frontend-composition and runtime-truth rows. Anything less feeds confirmed residual gaps
back as issues — not as harness thickening.

## 5. Board footprint (kept minimal)

Wave 7 adds **one** issue to the train: `verify(0.0.8): Wave-7 measured adoption smoke — arms
A/B/C, matrix + verdict` (0.0.8 exit gate; draft lives in the 0.0.8 milestone directory). The
existing measurement chain stays untouched as owners: **#1102 + #1201 build capability, #1197
demands re-measurement, #1090 holds the observational boxes** — the Wave-7 issue *consumes*
them; planning it separately from that chain would duplicate the measurement harness
(`research/github-board-open.md` §6.3 chain finding). Harness texts themselves live in the
owner's Drive wave folders + `.llm/harness/`, not on the board.
