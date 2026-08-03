# Plan — the three #1120 artifacts

Source of record: `.llm/harness/design/milestone-orchestrator-and-canary-cadence.md` (merged,
owner-ratified). Empirical base: `.llm/runs/release-0.0.4--orchestration/cut-trace.md`. This plan
is the outline reported before body-writing, per the brief.

## The line between the artifacts

- **Skill** (`.agents/skills/agent-milestone-orchestrator/SKILL.md`) — the **role**: decisions.
  How to read a milestone into PR clusters, sequence waves, delegate, hold merge authority, and
  decide when a canary goes out. Never contains: run artifacts, gate lists, the label mechanism.
- **Profile** (`.llm/harness/workflow/milestone-run.md`) — the **run**: proof. What a milestone
  run must produce and prove — run layout, stage contracts, the pre-merge gate list with per-gate
  firing evidence, cut-time checklist, evaluator protocol, definition of done. Never contains:
  role judgement, routing tables, the label mechanism.
- **Cadence** (`.llm/harness/workflow/canary-cadence.md`) — the **schedule**: identity. When a
  canary happens (trigger), what it contains (membership), what it is called (D3 label identity),
  the note, and the drift gate — wired to the shipped `release:canary-label` surface (#1121/#1122),
  never reimplementing it. Never contains: publish mechanics (`netscript-release` owns those).

Shared stories appear once: the #1086 mid-wave falsification lives in the cadence doc; skill and
profile reference it. The pre-merge gate list lives in the profile; the skill references it. Every
rule carries **[observed]** (earned from the 0.0.4 trace) or **[asserted]** (plausible, unproven).

## Section headings

### 1. Skill — `agent-milestone-orchestrator` (the role)

1. When to Use / When Not to Use
2. Evidence discipline — observed vs asserted rules
3. Reading a milestone into PR clusters
4. Wave sequencing and dispatch
5. Re-planning is normal
6. Delegation and effort tiering (defers to `lane-policy.md`)
7. Merge authority
8. When a canary goes out (defers to `canary-cadence.md`)
9. Honesty rules
10. Supervision pitfalls
11. Reference files

### 2. Profile — `workflow/milestone-run.md` (the run)

1. When to use a milestone run
2. Run layout (artifacts, incl. the instrumented `cut-trace.md`)
3. Stage contracts (A bootstrap → B wave plan → C dispatch → D wave landing → E canary point →
   loop C–E → F cut → G close)
4. The pre-merge gate [observed] — 7 items, each with firing evidence + did-not-run statement
5. Gate integrity rules (proof-of-firing; pass ≠ did-not-run; the #1142 false-red trap;
   serialised expensive gates)
6. Cut-time checklist [observed]
7. Evaluator protocol for a milestone run
8. Definition of done
9. What varies per run
10. Checklist

### 3. Cadence — `workflow/canary-cadence.md` (the schedule)

1. What this document owns (and the #1119 disambiguation: release canary ≠ model-rollout canary)
2. Evidence base
3. Trigger: the wave boundary [observed]
4. Membership: content-derived, not plan-derived [observed]
5. Identity: the label is the published version (D3)
6. The canary note
7. The drift gate (negative case; did-not-run; known limitation #1160)
8. Flexibility: the re-planning events the cadence absorbs [observed]
9. Open questions — owner-undecided [asserted]
10. Reference

## Slices

- **S0** — run-dir bootstrap + this plan; draft PR opened with outline as the opening phase comment
- **S1** — `canary-cadence.md` (written first: skill and profile reference it)
- **S2** — `milestone-run.md`
- **S3** — the skill + `deno task agentic:sync-claude` mirror + `agentic:check-claude` +
  fmt check on the new files
- **S4** — verification issue in 0.0.6 for the observational criterion (#1090 pattern),
  acceptance-evidence comment, `status:impl-eval`

## Validation

`deno task agentic:sync-claude` (generate mirror), `deno task agentic:check-claude`
(validate-claude-surface), `deno fmt --check` on the authored files only. Docs-only diff →
`ci:skip-e2e` + `ci:skip-scaffold` on the draft PR, recorded in the opening comment.
