# Post-eval base refresh evidence

## History-preserving integration

- Delta IMPL-EVAL cycle 3 at `0d4c82d6e4bd327abd88eb8b80e7a7acd20ea4aa` remains append-only. The
  integration commit is `8c03d862931b64573df9a4bac76ebf266e0ec175`, with first parent
  `0d4c82d6e4bd327abd88eb8b80e7a7acd20ea4aa` and second parent current main
  `0ef48c2ec661a7e6d55ec2faf5def6ae7dd2e6eb`.
- Direct ancestor checks returned raw exit 0 for `46528ae4c`, `b67414f4f`, `0d4c82d6e`, and
  `0ef48c2ec`. No evaluated history was rebased, squashed, or rewritten.
- Corrected `git merge-tree --write-tree --name-only origin/main HEAD` classification returned raw
  exit 0 around the expected merge-tree raw exit 1 and found exactly four bare conflict paths: the
  agent-docs gzip/provenance, CLI agent-docs barrel, and MCP publish mirror. A preliminary wrapper
  incorrectly classified merge-tree diagnostic lines as paths and returned raw exit 1; that rejected
  wrapper made no conflict-set claim.
- The real merge returned raw exit 1 with exactly those four unresolved paths. Both
  `git show --cc
  --name-only` and `git show --remerge-diff --name-only` on the integration commit
  return only the same four paths, raw exit 0. There is no fifth conflict or generated resolution
  output.

## Canonical resolution and union

The resolution used the locked canonical order: `gen:agent-docs-prose`, then `gen:publish-assets`,
then `gen:assets-barrel`. No generated payload was hand-edited, and `gen:mcp-export-corpus` was not
run.

The first corpus invocation returned raw exit 1 after the site build because the generator reads the
pre-existing provenance before overwriting it and merge conflict markers are invalid JSON. The old
first-parent provenance was selected only as a temporary valid metadata seed; it was not staged or
accepted as final content. The canonical corpus generator immediately overwrote both owned outputs
from the merged site inputs and then returned raw exit 0. The publish-assets and assets-barrel
generators each returned raw exit 0. This failed attempt is retained as an honest merge-state
diagnostic, not reported as a generator pass.

Direct gzip decompression returned raw exit 0 and positively found both contributions in the same
canonical corpus:

- Main/#1665: `pages/web-layer/query-bridge/index.md` plus the new guidance containing “one
  possibility is that two” and “module instances are loaded”.
- This leaf/#1666: `pages/reference/fresh-ui/index.md` plus the maintenance rule “exact,
  reason-bearing omission group”.

The union corpus has 181 files, 4,770,349 uncompressed bytes, 1,368,351 compressed bytes, and
canonical SHA-256 `c1d095a62e72555356d346d78848bff144ce9773c38eb9cd95f2d406b28174b3`. The checked-in
gzip SHA-256 is `46703a024d102c278043e2b48ebab906154c728a9c615d939651842068c52f7c`.

After the integration commit, the full three-generator cascade ran twice. Every generator returned
raw exit 0 in both cycles; `git diff --quiet` returned raw exit 0 after each cycle and porcelain
status was empty. The three freshness receipts later reran the same owners/check paths without
changing tracked content.

## Exact-head receipts

All twelve selected structured receipts under `receipts/base-refresh/` attest immutable head
`8c03d862931b64573df9a4bac76ebf266e0ec175`. The evidence-set audit returned raw exit 0, selected a
nonempty set, found every receipt `PASS`/exit 0, and found no mixed head.

| Gate                      | Outcome | Raw exit | Notable result                                                           |
| ------------------------- | ------- | -------: | ------------------------------------------------------------------------ |
| `check`                   | PASS    |        0 | 2,925 files, 25 batches, zero findings                                   |
| `test`                    | PASS    |        0 | 4,211 passed, 0 failed, 19 ignored; 4,230 total                          |
| `quality-job`             | PASS    |        0 | CI quality composite green; existing warnings remain visible             |
| `arch-check`              | PASS    |        0 | Zero doctrine failures; existing WARN/INFO findings remain visible       |
| `docs-source-format`      | PASS    |        0 | `Docs source format: OK` from `docs/site`                                |
| `docs-source-format-test` | PASS    |        0 | 6 passed, 0 failed from `docs/site`                                      |
| `docs-tagline`            | PASS    |        0 | 36 checked, zero over the cap                                            |
| `docs-accuracy`           | PASS    |        0 | 199 source pages, 181 corpus files, named drift child passed fail-closed |
| `agent-docs-prose`        | PASS    |        0 | Site rebuilt and corpus/provenance verified fresh                        |
| `assets-barrel`           | PASS    |        0 | CLI asset barrel fresh, no diff                                          |
| `publish-assets`          | PASS    |        0 | MCP publish mirror fresh, no diff                                        |
| `publish-dry-run`         | PASS    |        0 | Static workspace packaging simulation; not real-publish evidence         |

Focused `deno task docs:exports-drift` returned raw exit 0 with all eight package reports and a
terminal PASS. A first focused checker-test command omitted its required write permission and
returned raw exit 1 before four fixtures could run; it is an invocation error and is not presented
as a product red or pass. The correctly permissioned command returned raw exit 0 with 6 passed and 0
failed. The head-bound root `test` receipt independently includes the checker tests and passed.

## Scope, lock, and preserved evidence

- The seventeen-path contract classifier returned raw exit 0: 14 changed implementation paths, all
  authorized; zero unexpected paths. All other branch-diff paths are this leaf's run artifacts.
- Direct forbidden-surface Git checks keep `docs/exports`, Contracts root/barrel files, package
  export maps, MySQL paths, the excluded MCP export corpus, and `deno.lock` untouched by this leaf.
- `deno.lock` is byte-identical across the pre-merge evaluator head, current main, integration head,
  and working tree. All four Git/hash-object probes produced blob
  `a1522e6ecc98dd4232312385b0cea4e52f5fa4b2`.
- Direct diff of `receipts/sa4/`, `audit/sa4/`, all three `impl-eval*.md`, and both `plan-eval*.md`
  against `0d4c82d6e` returned raw exit 0. Prior receipts, reds, audits, and evaluator verdicts
  remain append-only.
- `check:mcp-export-corpus` was not rerun and its recorded baseline red was not generated, waived,
  deleted, or reclassified.

`fresh-browser` remains N/A / waived and `NOT_RUN`; no runtime lease exists. Close-gate is
`NOT_RUN`. Aspire, Docker, browsers, `e2e:cli`, scaffold/runtime/service smokes, real publish,
readiness, label/issue-box/draft-state changes, and merge-to-main remain `NOT FIRED`. Fresh
internals Tier-A and delta evaluation are coordinator-owned.
