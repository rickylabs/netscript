# Context Pack: Slice G consumer guidance and hosted acceptance hook

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `feat-cli-resource-slice-acceptance--1354-g` |
| Branch | `feat/cli-resource-slice-acceptance` |
| Current phase | `merge-readiness evidence complete; acceptance synchronized; final evidence push pending` |
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
diagnostics, lint/fmt clean, architecture and quality green). Changed-head hosted run `33736497671`
is also green: PostgreSQL 103/103 and SQLite 98/98, with resource first-run/rerun stdout, generated
check/lint/fmt, complete browser tail, and cleanup all passing. Fresh separate-session IMPL-EVAL
cycle 4 returned `PASS_IMPL_WITH_FINDINGS`; both findings are informational and non-blocking. Final
GitHub acceptance/lifecycle synchronization is now authorized; the PR remains open and must not be
merged by this lane.

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

- Commit and push the final tracked receipt, prevent an unchanged-product runtime rerun, verify the
  close-gate and review-thread state, and deliver the merge packet without merging.

## Next Steps

1. Commit/push tracked receipts, cancel any evidence-only synchronize runtime before it executes,
   and deliver the verified merge packet without merging.

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
| Static | PASS | Focused 120/120; full CLI 1,795/1,795; check 1,004 files/0 diagnostics; lint/fmt 18 files/0 findings. |
| Fitness | PASS | `arch:check` and `quality:gate` exit 0; `FAIL=0`; scanner findings 0. |
| Runtime | PASS | Run `33736497671`: PostgreSQL 103/103 and SQLite 98/98; resource first run/rerun, generated check/lint/fmt, app reference, served surface, hydration, refetch, and cleanup all exited 0. |
| Consumer | PASS | Guidance, first-write, identical zero-write rerun, UI ordering, and generated-project quality/type-check all executed successfully. |
| Fresh IMPL-EVAL | PASS_WITH_FINDINGS | Cycle 4: `PASS_IMPL_WITH_FINDINGS`; two informational, non-blocking findings; exact-head independent focused 68/68 + 35/35, full CLI 1,795/1,795, check 0 diagnostics, lint/fmt clean, fitness green, hosted artifacts independently hash-matched. |

## Open Questions

- None in product/runtime scope; only final lifecycle synchronization remains.

## Drift and Debt

- Drift: captured-stdout reachability required item 8; PR #1891 authorized it. Later hosted runs and a proactive tail trace exposed stale preview-state, island-showcase, hydration, and Rename-refetch probes inherited from the pre-Slice-F scaffold. They are aligned to the neutral generated resource inside the owner-accepted eighteen-file boundary and proven by both hosted tiers.
- Debt: none.

## Commits

- Main merge: `008d3264c5352abf6d1e3798d580550ec98e7e7c`.
- Live-main ordering fix / product head: `a2366577fd8232c8e08e078b03d1e3cc84793b92`.
- Pushed served-island head: `73d3a3a96c4862ab453366abdbbb33d65b4ce82b`; the next product head will add the hydration/refetch correction and tracked evidence.
- Current-main merge: `964d3cdd344828126fd90227bd7618c2bd41845e` merged `origin/main`
  `94fe507af47171cd4f295e8f532b281d7147b334` without rebasing; exact-head evidence after the final
  doctrine cleanup is pending.
- Public-client product head: `9cba13fec997ed4839e95940a4ddc5f0d01ab3ae`; pushed evidence head:
  `0e1717dab754a84229b02eee8143138cd4f60fa9`; hosted run `33736497671` is green in both tiers.
- Fresh IMPL-EVAL cycle 4: `PASS_IMPL_WITH_FINDINGS` via the lane-policy fallback evaluator
  `z-ai/glm-5.3-flash`; both findings are informational and non-blocking.
- PR: #1958, head `feat/cli-resource-slice-acceptance`, base `main`; lifecycle synchronization to
  `status:ready-merge` is authorized, but this lane does not merge.
