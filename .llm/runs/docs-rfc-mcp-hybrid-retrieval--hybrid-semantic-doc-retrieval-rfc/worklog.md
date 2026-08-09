# Worklog: Hybrid semantic documentation retrieval RFC

## Run metadata

Run `docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc` on branch
`docs/rfc-mcp-hybrid-retrieval`; Archetype 2 Integration described under docs overlay.

## Progress

| Date       | Slice             | Evidence                                                                                                                                      |
| ---------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | Activation        | Skills/workflow/doctrine/RFC authority read; exact base and author identity verified; run artifacts written first.                            |
| 2026-08-09 | Review bootstrap  | Commit `a526bbcc5` pushed explicitly; draft PR #1409 opened with docs/AI/RFC taxonomy and skip labels.                                        |
| 2026-08-09 | Companion         | RFC tracking issue #1410 opened with `Backlog / Triage`, no implementation authorization or closing keyword.                                  |
| 2026-08-09 | Repo research     | Mapped current MCP and incoming #1404 surfaces, publish assets, tests, AI/database seams, issues/debt, and read-only `ns005-w3b1`/`eis-chat`. |
| 2026-08-09 | Primary research  | Reviewed current Turso rewrite, MCP spec/sources, models/runtimes/licenses/revisions, and JSR surface.                                        |
| 2026-08-09 | Architecture core | Commit `058d730ab` pushed: corrected transport truth; public ports, composition, MCP shape, protected RRF.                                    |
| 2026-08-09 | Complete draft    | Added artifact/model/Turso decisions, evaluation, security, rollout, alternatives, non-goals, and owner-labelled open questions.              |

## Design decisions

- #1404 deterministic ranker is the immutable fallback and exact/rare authority.
- MCP owns semantic document contracts; AI embedding is adapted; database and memory abstractions
  are not reused outside their domains.
- New Turso native local/in-memory stable surfaces only; no legacy libSQL/client, experimental FTS,
  multiprocess, vector indexes, cloud, or browser claim.
- Pinned multilingual E5 small/384/L2/prefixes, release-built vector artifact, vector8 evidence
  gate; pinned Transformers.js WASM baseline; optional English reranker remains off.
- Protected weighted RRF with exact stable tie rules and provenance; semantic absence/failure
  returns untouched deterministic ranking.
- Tools remain model-controlled; docs gain application-controlled resource links/read surfaces; no
  prompts or subscriptions.

## Commit slices and gates

| # | Slice                      | Gate                                                                       |
| - | -------------------------- | -------------------------------------------------------------------------- |
| 0 | activation/review surface  | exact base, clean tree, explicit push, draft taxonomy                      |
| 1 | API/architecture core      | doctrine/Plan-Gate mapping, `git diff --check`                             |
| 2 | complete RFC/research/plan | source alignment, exact pins/gates, targeted Markdown format               |
| 3 | lifecycle handoff          | RFC/docs validation, exact diff/lock proof, issue/PR phase comments/status |

## Drift

See `drift.md`: owner-authorized Sol xhigh author route and remote-control launch/capability
mismatch. The liveness recovery did not create a replacement thread or writer.

## Gate results

| Gate                | Result / raw evidence                                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Targeted format     | PASS — `deno fmt --check` reported `Checked 7 files`                                                                     |
| Internal docs links | PASS — `docs=102 broken-links=0 broken-anchors=0 orphans=0`                                                              |
| Docs accuracy       | PASS — 4 saga pages, storefront boundary, spawn contract, 8 preferred paths, 18 CLI mutation families, 3 root imports    |
| External RFC links  | PASS after correcting two moved Turso paths — every unique URL returned HTTP 200                                         |
| Patch hygiene       | PASS — `git diff --check` exit 0                                                                                         |
| Product/lock scope  | PASS — diff against `origin/main` contains only RFC + six run files; `deno.lock`, `packages/`, and `plugins/` diff empty |
| Runtime/E2E         | N/A — prohibited by owner and unnecessary for docs-only RFC; PR carries both CI skip labels                              |

The current-package JSR dry-run/audit in `research.md` is proposal research evidence, not a future
implementation verdict. No raw command failure is hidden: the first external probe found two 404
Turso paths, both were updated from the current official `llms.txt` index and re-probed.

## Handoff

PLAN-EVAL is selected and has not run. A fresh native Fable 5 medium evaluator must read the RFC,
`research.md`, `plan.md`, `context-pack.md`, doctrine/Archetype 2 gates, and formal protocol. This
author does not create `plan-eval.md` or self-pass.
