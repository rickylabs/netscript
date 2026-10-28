# Worklog

## Design

- Public surface: stable static HTML and accessible named anchors, a single CSS request, unchanged component APIs, precise Pages browser scheduling.
- Vocabulary: rendered inputs, push diff, stable instance namespace, heading permalink.
- Ports: existing Lume 2.5.4/Lightning CSS APIs, DOM, pinned highlighter, Git rename-aware diff, pure CI classifier, native carrier commands.
- Constants: page URL and local DOM index supply instance identity; nav lane identity and explicit push-diff opt-in replace positional/event assumptions.
- Commit slices: rendering/reader fixes, then CI precision and final evidence; each slice updates this run and pushes its gates/review on the new PR.
- Deferred scope: token source merge belongs to #2450 after S1/new Figma export; other epic cells retain their owners and dependencies.
- Contributor path: tools/docs-site/README.md.

Parent S8 evaluator override carried verbatim: “Run PLAN-EVAL before implementing and IMPL-EVAL after, both with claude -p --model claude-opus-5-5 --effort high, read-only, stdin closed, blockers only.” Routing inspected via agentic:matrix --tier feature --json; public artifacts retain model/role only, no private identifiers.

Research: #2451 has no linked PR/comments. S1 is actively owned by PR #2435. S2–S7 depend on that chain. The directly scoped S8 review follow-up is available. No implementation yet; PLAN-EVAL pending.

PLAN-EVAL initial FAIL_PLAN identified bundled-token provenance and full-output determinism gaps. Corrected plan keeps exact generated declaration provenance while retaining full maintained checks and strengthens comparison to every output file. No implementation started.

Corrected independent PLAN-EVAL PASS before source edits. Slice1 implemented deterministic per-page IDs before both consumers, bundle provenance checks and negative controls, heading labels, stable lane identity, dotenv plaintext, stack margin repair and historical drift qualification. Validation pending.

Slice1 complete: independent source review PASS after the recorded FAIL_FIX and reverted dependency experiment. Candidate browser52/0/0,24axe reports with0serious/critical;6focused tests; structured tooling8/site2/browser2 checks;23970links/251pages. Accepted reproducibility compares806files and protects HTML/twins/fragments/assets; reports only the known Pagefind metadata variation. Real raw-custom control exits1 through the normal policy command. Seven-line native Lightning CSS lock closure retained, all other dependency entries unchanged.

Reconcile1: source scope remains #2451. Token authority stays assigned to #2450. The discovered upstream Pagefind variation is a separate sibling task; no Pagefind upgrade is retained. CI slice remains pending.
