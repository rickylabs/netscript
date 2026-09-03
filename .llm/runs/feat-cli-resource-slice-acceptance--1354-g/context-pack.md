# Context Pack: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Current phase | `public-query-client observer correction locally green; hosted proof pending` |
| Archetype | `6 — CLI / Tooling` |
| Scope overlays | `none` |

## Current State

The owner resumed the run after the exact-head hosted failure and authorized a narrow correction
within #1354's accepted resource scope. The final product ceiling is eighteen existing files: the
original eight plus the neutral browser/runtime probes, their exact semantic tests, and the resource command test.
The probe now covers final Slice F's neutral `/examples/users` resource and Slice G's generated
`/people` resource at both viewports; the resource gate test proves generation precedes the browser
gate; the command test proves unresolved app-root selection fails loudly with zero writes. The
served-surface probe now proves `/people` emits and serves `PeopleIsland` and its Fresh module graph.
Hydration requires a browser-reachable QueryClient; the refetch gate invalidates its active
`users.list` query and requires exactly one completed 2xx request instead of driving the retired
Rename showcase. Product head `2f0807f25` passed every local gate, but hosted run `33735122923`
then falsified its private Preact traversal in both tiers (SQLite 86/1, PostgreSQL 91/1; cleanup
passed). The current correction imports the existing public `@netscript/fresh/query` browser module,
requires the generated `users.list` entry in its singleton, and invalidates that same client. Fresh
proportional exact-head local evidence is green (focused 120/120, full CLI 1,795/1,795, check 0
diagnostics, lint/fmt clean, architecture and quality green). Isolated hosted acceptance and
IMPL-EVAL are pending, so PR #1958
stays `status:impl-eval` and #1354 acceptance remains unchanged for now.

## Completed

- Read the requested skills, harness workflow, Archetype 6 guidance, relevant doctrine, and locked upstream plan.
- Implemented IDs, resource gate definitions, composition, runtime selection, exact command/stdout tests, rendered guidance, and the authorized runner stdout fixture in exactly eight product files.
- Focused regressions pass 68/68; full CLI tests pass 1788/1788; CLI check reports 0 diagnostics across 1004 files; scoped lint/fmt report 0 findings.
- Asset/publish/docs/JSR/fitness gates all exit 0; doctrine reports `FAIL=0` throughout and quality scan reports 0 findings.
- An isolated stock-init sqlite proof passed init, service generation, codegen, first resource generation (11 writes), and identical rerun (11 skips) without invoking the hosted runtime suite.
- Merged final Slice F from main without rebasing, preserved the eight-file Slice G diff, and verified all four carrier freshness gates.
- Ran the full unsplit runtime suite: the first live-main run found and resolved the UI data-screen ordering prerequisite; two exact-head runs then proved the complete #1354 prefix before a repeated shared-host Aspire/DCP infrastructure timeout.
- Recorded `PLAN-EVAL: N/A` per owner direction.

## In Progress

- Isolated hosted acceptance and fresh separate-session IMPL-EVAL for the eighteen-file amended product head.

## Next Steps

1. Commit and push the public-singleton local evidence.
2. Run both isolated hosted runtime tiers; do not use a host runtime lease.
3. Obtain a fresh separate-session IMPL-EVAL, then update #1354/#1958 only from green evidence.

## Key Decisions

| Decision | Source | Notes |
| -------- | ------ | ----- |
| Generate `people` from client `users`, procedure `list`, with `--partial`. | IMPL-EVAL cycle 1 | Explicit selection avoids two-client ambiguity; `people` avoids init's existing `users` router alias. |
| Execute after database codegen and `generated.service-client-contract`, before UI data-screen. | IMPL-EVAL cycle 1 + live-main runtime | Codegen materializes the imported Zod contract; resource reconciliation must precede the UI gate's quoted router-key mutation. |
| Rerun must report 11 skips and zero writes/conflicts. | planner/stager/reconciler | Eight owned leaves plus three shared files. |

## Files Changed

| Path | Status | Notes |
| ---- | ------ | ----- |
| eighteen owner-authorized Slice G product paths | modified/new | Original eight plus the traced neutral-resource browser tail and generator app-root negative regression. |
| `.llm/runs/feat-cli-resource-slice-acceptance--1354-g/*` | new | Required harness context and blocker evidence. |

## Gates

| Gate family | Current status | Evidence |
| ----------- | -------------- | -------- |
| Static | PASS | Focused 119/119; full CLI 1,794/1,794; check 1,004 files/0 diagnostics; lint/fmt 18 files/0 findings. |
| Fitness | PASS | `arch:check` and `quality:gate` exit 0; `FAIL=0`; scanner findings 0. |
| Runtime | #1354 path advanced / corrected head pending | Run `33731170586`: `behavior.app-reference` passed; PostgreSQL 90/1 and SQLite 85/1 then failed only at stale `behavior.island-served-surface`; cleanup passed. Run `33732473476` was canceled before runtime after proactive inspection found the next stale hydration/refetch assertions. |
| Consumer | PASS | Guidance, first-write, identical zero-write rerun, UI ordering, and generated-project quality/type-check all executed successfully. |

## Open Questions

- Whether both isolated database tiers complete the corrected `PeopleIsland` served, hydration, and one-refetch tail.

## Drift and Debt

- Drift: captured-stdout reachability required item 8; PR #1891 authorized it. Later hosted runs and a proactive tail trace exposed stale preview-state, island-showcase, hydration, and Rename-refetch probes inherited from the pre-Slice-F scaffold. They are now aligned to the neutral generated resource inside the owner-accepted eighteen-file boundary; hosted proof remains pending.
- Debt: none.

## Commits

- Main merge: `008d3264c5352abf6d1e3798d580550ec98e7e7c`.
- Live-main ordering fix / product head: `a2366577fd8232c8e08e078b03d1e3cc84793b92`.
- Pushed served-island head: `73d3a3a96c4862ab453366abdbbb33d65b4ce82b`; the next product head will add the hydration/refetch correction and tracked evidence.
- Current-main merge: `964d3cdd344828126fd90227bd7618c2bd41845e` merged `origin/main`
  `94fe507af47171cd4f295e8f532b281d7147b334` without rebasing; exact-head evidence after the final
  doctrine cleanup is pending.
- PR: #1958, head `feat/cli-resource-slice-acceptance`, base `main`, status `status:impl-eval`.
