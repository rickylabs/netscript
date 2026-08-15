# Tier-A review — S3, PR #1652 `comparison-docs-programme`

| Field                     | Value                                                                                               |
| ------------------------- | --------------------------------------------------------------------------------------------------- |
| Reviewer                  | `topic-docs-0.0.7` (native Claude Opus 5 / high, Remote Control `session_01PLRauSHN1PnvrNF2ucefF6`) |
| Reviewed head             | `15429cf8487cfe3504ae0443fd435d2a72d4528b`                                                          |
| Resulting head            | `15429cf8487cfe3504ae0443fd435d2a72d4528b` (review is bookkeeping-only; the leaf head is unmoved)   |
| Author (separate session) | WSL Codex `019ffcc9-16c2-7573-b7f6-d627172408e8`, gpt-5.6-sol                                       |
| Slice                     | S3 — deferred Session case and migration roadmap                                                    |
| Verdict                   | **PASS**                                                                                            |
| Sign-off comment          | `issuecomment-5300735863`                                                                           |

The slice-review invariant holds: the author did not self-certify, and this sign-off is the
supervisor's. No finding required a fix, so nothing was repaired by the reviewer.

## 1. Head reconciliation

| Source                                  | Value                                      |
| --------------------------------------- | ------------------------------------------ |
| local `HEAD`                            | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| `origin/docs/comparison-docs-programme` | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| PR #1652 `head.sha`                     | `15429cf8487cfe3504ae0443fd435d2a72d4528b` |
| working tree                            | clean (`--untracked-files=all` empty)      |

All three agree.

## 2. `S3-docs-audit` — every command re-executed by the reviewer

Run after the author's turn reached `task_complete`, so no build could collide with a live turn.

| Command                                                                          | Raw exit | Observed                                                                                                                 |
| -------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------ |
| `deno task --cwd docs/site verify`                                               | `0`      | 229 HTML files; 36,084 internal links across 229 pages all resolve; 18 caveat markers across 14 pages all resolve        |
| `deno task docs:links`                                                           | `0`      | 103 docs; 0 broken links, 0 broken anchors, 0 orphans                                                                    |
| `deno task docs:accuracy`                                                        | `0`      | PASS; 201 published source pages, 178 corpus files, 91/91 root/direct public commands, 6 `@netscript/fresh` root imports |
| `deno doc --filter definePage packages/fresh/src/application/builders/mod.ts`    | `0`      | resolves                                                                                                                 |
| `deno doc --filter definePartial packages/fresh/src/application/builders/mod.ts` | `0`      | resolves                                                                                                                 |
| `deno doc packages/fresh/src/application/defer/mod.ts`                           | `0`      | resolves                                                                                                                 |
| `git diff --check`                                                               | `0`      | clean                                                                                                                    |
| `git diff --exit-code origin/main -- deno.lock docs/site/deno.lock`              | `0`      | both lockfiles unchanged                                                                                                 |

`verify` chains `build && check:links && check:caveats`, so the rendered link contract exposed by
Tier-A finding T2 at S1 is covered natively here and needed no reviewer addition. Only the approved
cheap docs and public-surface checks were run — no E2E, Aspire, Docker, or shared expensive gate.

Link coverage moved from 34,980 across 226 pages at S2 to 36,084 across 229, consistent with exactly
three new pages and nothing broken.

## 3. Both Concepts roots — the assertion inherited from S1

Read directly from rendered `_site/index.html` under the Concepts menu:

- `/netscript/comparisons/`
- `/netscript/comparisons/methodology/`
- `/netscript/comparisons/nextjs-session/`
- `/netscript/migration/`
- `/netscript/migration/nextjs/`

Both roots present. This is the exact assertion S1 could not satisfy from its own file list; it was
deferred by orchestrator ruling to the slice owning the migration pages, and is now proven from
rendered output rather than asserted.

## 4. `_data.ts` boundary divergence

`docs/site/_data.ts` sits outside the approved S3 file list but is the only source of the Concepts
root list, so the inherited two-root assertion is unsatisfiable without it. The divergence was named
in the dispatch brief **before** the slice ran, and the author recorded it in the leaf `drift.md` at
severity `significant`, status resolved-in-S3, rescope none, scope growth none, describing it as the
minimum file needed to satisfy the already-approved acceptance statement.

Verified minimal in form: `roots: ["/explanation/", "/comparisons/", "/migration/"]` — one array
entry added, nothing else in the file changed.

## 5. Xref wiring

The migration wiring S1 was required to strip is correctly restored now that the pages resolve:

- legend line `migration:  migration roadmap  (migration:nextjs)` restored;
- `"migration:index" → /migration/`, `"migration:nextjs" → /migration/nextjs/`;
- `"compare:nextjs-session" → /comparisons/nextjs-session/` added for the new case page.

No xref points at a non-existent target — `verify`'s rendered link check is the proof, and it passed
across all 36,084 links.

## 6. Content — mechanism matrix and six-column requirement

`docs/site/comparisons/nextjs-session.md` carries a mechanism matrix of **8 columns × 8 data rows
with zero empty cells**: responsibility, NetScript mechanism, Next.js `16.3.0` mechanism, evidence,
loser overhead, confidence, version sensitivity, follow-up. The plan requires mechanism, evidence,
loser overhead, confidence, version sensitivity, and follow-up in every row; the delivered matrix
exceeds that and no row is under-populated.

The aggregate inclusion-class table is 6 columns × 6 rows, also with no empty cells.

## 7. Pin, count, and canonical-comment consistency

| Fact          | Case page                                      | Canonical comment `5265826161`                 |
| ------------- | ---------------------------------------------- | ---------------------------------------------- |
| Session route | 94 physical / 92 nonblank, labelled `measured` | 94 physical / 92 nonblank, labelled `measured` |
| Pin           | `5191de83f3da97559f21d8891c6c8afdf1cf473a`     | same                                           |

No superseded figure (119, 117, 208, 204) appears anywhere on the case page. The consistency
obligation created by the E0 correction holds; no discrepancy was found, so none required reporting.

## 8. Migration scope

`docs/site/migration/nextjs.md` is a genuinely bounded roadmap, not a guide: it declares status
`roadmap / deferred`, states plainly that it does not claim source compatibility or prescribe a
mechanical rewrite, and maps only concepts established by the pinned Session case. Each of its seven
rows carries an explicit evidence boundary separating what is `inspected` from what is `deferred`. A
"What this roadmap does not cover" section names the exclusions — runnable counterpart, comparative
runtime, complete type continuity, forms, middleware, images/fonts, deployment, testing, auth, and
broader App Router parity — and #1650 is linked as the owner of the complete guide.

`nextPrev` carries only `prev`, with no dangling `next` target. That is the S1 finding-T1 lesson
applied by the author without being asked again.

## 9. Private source

Zero code fences in all three new pages (`nextjs-session.md`, `migration/index.md`,
`migration/nextjs.md`), and zero matches for secret, credential, connection-string, or business
identifiers. The published docs surface carries classifications, mechanisms, and aggregates only.
Illustrative excerpts exist solely in the owner-authored #1551 comments, which are outside this
slice.

## 10. Lock hygiene and scope

Both `deno.lock` and `docs/site/deno.lock` are unchanged against `origin/main` (guard exit `0`). No
`packages/**` or `plugins/**` path is touched. The read-only external input
`/home/codex/repos/eis-chat-007-input` remained clean at `5191de83f3da97559f21d8891c6c8afdf1cf473a`
through both the author's slice and this review's gate run.

PR state after the slice: draft `true`, `Part of #1551` present, no closing keyword, milestone
`0.0.7`, exactly one `status:` label (`status:impl`), labels otherwise unchanged.

## 11. Carry-forward for the formal IMPL-EVAL

1. `plan.md` was amended after the PLAN-EVAL gate to record the inserted E0 slice and refresh its
   status line, so the evaluator will assess a plan differing from the artifact gated at
   `d35cbca30`. The amendment documents the insertion and asserts no locked decision changed.
2. Five plan defects of one family were found and corrected during implementation, all recorded in
   the leaf `drift.md`: S1's unsatisfiable rendered-navigation assertion; S1's four links into a
   later slice's section; S1's gate being unable to prove its own link contract; S2's local-roots
   contract with no slice creating the root; and S2's lint row targeting repo-excluded paths. The
   common shape is a slice whose acceptance, gate, or inputs cannot be satisfied from that slice's
   own file list and the repository's actual configuration.

## 12. Required formal evaluator route

A separate opposite-family **IMPL-EVAL** is required and has **not** been launched by this lane.

| Field             | Value                                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Provider          | native Claude (no OpenRouter / OpenCode / AGY substitution)                                                                   |
| Family separation | opposite family to Codex author `019ffcc9-16c2-7573-b7f6-d627172408e8`                                                        |
| Session           | fresh session per gate, Remote Control attached, non-empty `bridgeSessionId` required                                         |
| Concurrency       | serialized within this topic orchestrator (`perOrchestratorConcurrency: 1`)                                                   |
| Effort            | right-sized to the evidence contract per the reset dispatch `ownerOverride`                                                   |
| Fable 5           | not pre-dispatched; requires a coordinator amendment recording genuine architectural or exceptional review necessity          |
| Evaluated head    | `15429cf8487cfe3504ae0443fd435d2a72d4528b`                                                                                    |
| Output            | `evaluate.md` in `.llm/runs/docs-comparison-docs-programme--1551`, verdict `PASS` / `FAIL_FIX` / `FAIL_RESCOPE` / `FAIL_DEBT` |

Awaiting an explicit coordinator grant before dispatch.
