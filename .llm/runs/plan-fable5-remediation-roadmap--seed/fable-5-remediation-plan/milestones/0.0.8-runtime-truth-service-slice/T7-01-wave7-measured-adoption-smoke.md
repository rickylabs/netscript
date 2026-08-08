# verify(0.0.8): Wave-7 measured adoption smoke — arms A/B/C prove the generated path changes agent behavior — DRAFT (no GitHub mutation; owner ratification pending)

**Draft-ID:** T7-01 · **Proposed milestone:** 0.0.8 (exit gate) · **Labels:** `type:test`
`area:agentic` `area:cli` `priority:p1` `status:triage` · **Depends on:** T2-01, T2-02, T4-01,
TA-01 (the surfaces under measurement), #1197 (measurement method), #1090 (observational boxes)

## Summary

The remediation program's thesis — generation makes the idiomatic path the easiest path — is
falsifiable exactly once the 0.0.7 generators and 0.0.8 runtime-truth surfaces exist in a
published canary. This issue owns the one measured unfamiliar-agent smoke that tests it, as the
exit gate of 0.0.8. It consumes, and must not duplicate, the existing measurement chain
(#1102/#1201 capability, #1197 re-measurement, #1090 observational boxes).

## Evidence

- Six consecutive measured runs with zero MCP/doctor/otel adoption (#1197 body; corpus
  `research/wave-5-6-plans.md` #17).
- Wave-6 R3's only-GO run is confounded by the supervisor-enforced init gate, model, and canary
  (`research/wave-6-runs.md` #7) — the strongest untested causal lever in the corpus.
- Full design: `fable-5-remediation-plan/WAVE7-AND-AGENT-ADOPTION.md` (this run).

## Current surface

Wave-6 harness (brief v3 + PLAN-WAVE6): capability-map rows, executed-command census,
contamination rules. No arm structure; no generated-slice measurement rows (the verbs do not
exist yet); wrapper-exit gates only.

## Target contract

Three arms on identical brief/budget: A = post-0.0.8 canary, no init enforcement; B = post-0.0.8,
R3-style enforced init gate; C = pre-remediation 0.0.6 canary (control). Two runs per arm,
different frontier models, blind gap-audit scoring on the Wave-6 rubric. New measured rows:
generated-slice verb usage (used / rejected-with-reason / silent = harness failure), consumer
no-`any` gate verdict, runtime-truth probes (receipt handling, child liveness, stream restart)
read from persisted state + one correlated trace.

## Acceptance

- [ ] Arm design (A/B/C, 2 runs each) executed on published canaries with pinned versions recorded
- [ ] Generated-slice usage measured per run: used or explicitly rejected; zero silent rows
- [ ] Consumer-side type-escape gate executed against every product (not framework exports)
- [ ] Runtime-truth rows proved from persisted state + correlated OTEL, not wrapper exits
- [ ] Arm A vs C delta reported on frontend-composition and runtime-truth capability rows
- [ ] Negative path: a run that skips a generated verb without recording rejection is scored as a
      harness failure, not silently excused
- [ ] Verdict + confirmed residual gaps filed as issues (not folded into harness thickening)
- [ ] [post-merge] The verdict comment on this issue names the canary versions and links raw
      measurement artifacts

## Boundaries

#1102/#1201 own MCP retrieval/corpus capability; #1197 owns the re-measurement method and
extraction script; #1090 owns the wave-five observational boxes (this issue may satisfy them and
says so per box, but does not absorb them). Harness texts live in `.llm/harness/` + the owner's
wave folders, not on the board. This issue does not script product choices.

## Docs/consumer proof

The published verdict is the program's go/no-go for advancing the train past remediation
(`MILESTONE-TRAIN.md` §5). A GO here is the evidence base for any future "0.1.0" claim.

## Provenance

Seed run `plan-fable5-remediation-roadmap--seed`, PR #1347, 2026-08-08. Supervisor-authored
(Fable 5 · high); design in `WAVE7-AND-AGENT-ADOPTION.md`.
