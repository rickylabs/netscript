# Worklog: Hybrid semantic documentation retrieval RFC

## Run metadata

Run `docs-rfc-mcp-hybrid-retrieval--hybrid-semantic-doc-retrieval-rfc` on branch
`docs/rfc-mcp-hybrid-retrieval`; A2-law semantic integration core folded into the accepted-debt
Archetype-6 MCP package, under the docs overlay.

## Progress

| Date       | Slice               | Evidence                                                                                                                                           |
| ---------- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-08-09 | Activation          | Skills/workflow/doctrine/RFC authority read; exact base and author identity verified; run artifacts written first.                                 |
| 2026-08-09 | Review bootstrap    | Commit `a526bbcc5` pushed explicitly; draft PR #1409 opened with docs/AI/RFC taxonomy and skip labels.                                             |
| 2026-08-09 | Companion           | RFC tracking issue #1410 opened with `Backlog / Triage`, no implementation authorization or closing keyword.                                       |
| 2026-08-09 | Repo research       | Mapped current MCP and incoming #1404 surfaces, publish assets, tests, AI/database seams, issues/debt, and read-only `ns005-w3b1`/`eis-chat`.      |
| 2026-08-09 | Primary research    | Reviewed current Turso rewrite, MCP spec/sources, models/runtimes/licenses/revisions, and JSR surface.                                             |
| 2026-08-09 | Architecture core   | Commit `058d730ab` pushed: corrected transport truth; public ports, composition, MCP shape, protected RRF.                                         |
| 2026-08-09 | Complete draft      | Added artifact/model/Turso decisions, evaluation, security, rollout, alternatives, non-goals, and owner-labelled open questions.                   |
| 2026-08-10 | PLAN-EVAL cycle 1   | Fable 5 committed immutable `plan-eval.md` at `37c6cff3e`; verdict `FAIL_PLAN`, findings F-C1–F-C8.                                                |
| 2026-08-10 | Cycle-2 rebaseline  | Fast-forwarded clean author branch to evaluator head; fetched `origin/main@da40fbfe3`; verified merged #1404/#1416, current MCP/fixture/debt.      |
| 2026-08-10 | Native API evidence | `deno info` and shipped `.d.ts` verified Turso 0.7.2, read-only option, optional native targets; unintended lock additions removed before staging. |
| 2026-08-10 | Cycle-2 amendment   | Rewrote RFC and run plan/research/context/drift to resolve every evaluator finding; response matrix lives in `plan.md`.                            |

## Design decisions

- #1404 deterministic ranker is the immutable fallback and exact/rare authority; a named
  decomposition refactor and frozen serialized golden precede hybrid ranking.
- MCP owns semantic document contracts; AI embedding is adapted; database and memory abstractions
  are not reused outside their domains.
- New Turso native local/in-memory stable surfaces only; no legacy libSQL/client, experimental FTS,
  multiprocess, vector indexes, cloud, or browser claim.
- Pinned multilingual E5 small/384/L2/prefixes and Transformers.js WASM baseline; float32 is
  normative storage, while vector8, WebGPU, and the English reranker remain experimental/off.
- Protected fixed-order round12 weighted RRF has provider-scoped determinism; semantic
  absence/failure returns untouched schema-v1 deterministic bytes.
- Tools remain model-controlled; docs gain application-controlled resource links/read surfaces; no
  prompts or subscriptions.

## Commit slices and gates

| # | Slice                      | Gate                                                                       |
| - | -------------------------- | -------------------------------------------------------------------------- |
| 0 | activation/review surface  | exact base, clean tree, explicit push, draft taxonomy                      |
| 1 | API/architecture core      | doctrine/Plan-Gate mapping, `git diff --check`                             |
| 2 | complete RFC/research/plan | source alignment, exact pins/gates, targeted Markdown format               |
| 3 | lifecycle handoff          | RFC/docs validation, exact diff/lock proof, issue/PR phase comments/status |
| 4 | Fable cycle-1 provenance   | evaluator-only commit preserved unchanged; `FAIL_PLAN` response required   |
| 5 | cycle-2 author amendment   | F-C1–F-C8 matrix, rebaseline, one immutable author commit and push         |

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

## Cycle-2 gate results

| Gate                     | Raw outcome                                                                                                           |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Targeted Markdown format | PASS — `Checked 6 files`                                                                                              |
| Internal docs links      | PASS — `docs=102 broken-links=0 broken-anchors=0 orphans=0`                                                           |
| Docs accuracy            | PASS — 4 saga pages, storefront boundary, spawn contract, 8 preferred paths, 18 CLI mutation families, 3 root imports |
| External RFC links       | PASS — all 13 unique URLs returned HTTP 200                                                                           |
| Source baseline          | PASS — `origin_main=da40fbfe377a9e728f190056771298100297a8f8`; merged #1404 ancestor confirmed                        |
| MCP/fixture claims       | PASS — `tool_total=22 read_total=18`; `guidance_cases_1404=5 guidance_cases_current=8`                                |
| Evaluator provenance     | PASS — `plan_eval_unchanged=PASS` against evaluator head `37c6cff3e`                                                  |
| Lock/product scope       | PASS — `lock_product_diff=EMPTY` for `deno.lock packages plugins`                                                     |
| Patch hygiene            | PASS — `git diff --check` exit 0                                                                                      |
| Exact author files       | PASS — RFC plus `context-pack.md`, `drift.md`, `plan.md`, `research.md`, `worklog.md` only                            |

The native `deno info npm:@tursodatabase/database@0.7.2` inspection initially added 36 lock lines as
a side effect; the author removed exactly those additions with `apply_patch` before validation. The
final lock/product gate above proves no retained change. One malformed `deno doc` command placed
`--filter` after the module and failed with `Module not found .../DatabaseOpts`; direct package docs
and shipped `.d.ts` inspection supplied the read-only/API evidence instead. Neither failure is
presented as a passing command.

## Handoff

Cycle-1 PLAN-EVAL ran separately and failed. After the one cycle-2 author commit, a fresh separate
Fable 5 cycle 2 must read the amended RFC, response matrix, research, context, worklog, drift, and
unchanged evaluator provenance. This author does not edit `plan-eval.md`, self-pass, or implement.
