# Worklog — README minimum dependency age

## Design

### Public surface

The public surface is the exact printed global install command in the root README, package README,
and docs Quickstart. No TypeScript export or runtime behavior changes.

### Domain vocabulary and constants

- `README_QUICKSTART_EXPECTED_COMMANDS[0]` is the root README execution contract.
- `QUICKSTART_DOCUMENTED_COMMANDS[0]` is the docs Quickstart display contract.
- `EXPECTED_INSTALL_ARGV` proves the subprocess receives the parsed public command verbatim.

### Ports, permissions, and generated outputs

No new port, permission, adapter, extension axis, generated project output, or composition change.
The existing README parser and recording spawn seam prove source-to-argv provenance. Docs carrier
generators may refresh derived assets after the source prose changes.

### Archetype 6 checkpoint

The package's five spine abstracts, layer-2 abstracts, feature catalog, registries, command names,
exit codes, composition root, and permission contract are unchanged. F-CLI structural checks are
therefore manual N/A for the delta; the semantic command/drift tests and doctrine gate remain the
applicable evidence.

### Commit slices and contributor path

The ordered slices are in `plan.md`. Future install-command edits begin with the two centralized
expected-command constants, use RED drift tests against unchanged docs, then update all printed
surfaces and regenerate carriers.

### Deferred scope

No workflow, release publication, runtime suite, install shim, harness injection, or policy redesign.

## Plan gate

`PLAN-EVAL: N/A` — this is a small mechanical contract synchronization with exact owner-decided
text, scope, assertions, gates, and prohibited alternatives.

## Progress

| Date | Slice | State | Evidence |
| --- | --- | --- | --- |
| 2026-09-03 | 0 | complete | Clean exact baseline verified; required skills, doctrine, archetype, docs overlay, and gate references read. |
| 2026-09-03 | 1 | RED | Commit `a3f929c23` changes only expected-command/test contracts. Focused wrapper exited 1: 7 passed, 3 failed. Both drift tests showed actual old command versus expected flagged command; application test threw `README Quickstart command 1 diverged` with the same expected/received text. |
| 2026-09-03 | 2 | GREEN | Commit `86c71bc97` changes only the root README, docs Quickstart/callout, and package README. The same focused wrapper exited 0: 10 passed, 0 failed. |
| 2026-09-03 | 3 | carriers | `check:agent-docs-prose` first named two stale outputs; `gen:agent-docs-prose`, `gen:assets-barrel`, and `gen:publish-assets` produced four derived files committed in `e6dbee80d`. All four carrier checks then exited 0. |
| 2026-09-03 | 3 | manifest | Initial parity reported manifest freshness only; generator completed with `rows=943 unmatched=0`; parity then exited 0 with `manifestFresh:true` and no failures. |
| 2026-09-03 | 4 | IMPL-EVAL `FAIL_FIX` | Independent Claude Fable 5.1 session `b67d4969-52f8-4250-a60d-12f95d855ad9` confirmed the owner contract and all implementation evidence, but found the committed manifest omitted this worklog after its final Aspire-mentioning evidence update. Repair is evidence-only: track evaluator artifacts, regenerate the manifest last, rerun parity, and request a focused re-verdict. |
| 2026-09-03 | 4 | evaluator repair | Staged the evaluator prompt/verdict and updated run artifacts before regenerating the surface manifest (`rows=946 unmatched=0`). The authoritative parity rerun exited 0 with `ok:true`, `manifestFresh:true`, and `counts: { checked:945, fail:0, deferred:16, info:5, skipped:1, missing:0 }`. |
| 2026-09-03 | 4 | IMPL-EVAL `PASS` | The same independent evaluator rechecked repair head `a074ba2a9`, confirmed the commit changed only run evidence, matched all tracked slice paths selected by the manifest generator, independently reran parity at exit 0, and superseded the historical `FAIL_FIX` with final `PASS`. |
| 2026-09-03 | convergence | complete | Fetched exact `origin/main` `3903feea63f0f4c421dd90f221132c08dbb3650e` and rebased seven commits without conflicts. RED, GREEN, and carrier slices remain separate as `8d7af1ed2`, `a73da6b35`, and `80bb337d3`. The diff remains confined to approved docs/README/E2E contracts, generated carriers, manifest, and this run directory. |
| 2026-09-03 | convergence carriers | fresh | `check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`, and `check:mcp-export-corpus` all exited 0; convergence changed no carrier input, so no generator ran. |
| 2026-09-03 | convergence gates | green | Scoped check selected 242 files and exited 0; scoped fmt selected 242 files and exited 0; handwritten changed-file lint selected 3 files and exited 0; focused README/domain/drift/application tests passed 10/10; gate listing exited 0 with the exact flagged command; docs accuracy/links and quality gate exited 0. Full nested E2E tests passed 366/366 after selecting the executable repository-local temp root required by the two new baseline browser-script fixtures. |

## Gate results

| Gate | Exit | Evidence |
| --- | ---: | --- |
| Focused RED | 1 expected | 7 passed, 3 failed; actual unflagged commands differed from expected flagged contracts. |
| Focused GREEN | 0 | 10 passed, 0 failed; exact source-command and argv provenance covered. |
| `check:agent-docs-prose` | 0 | final check fresh after matching generator; initial stale check exited 1 and named only its two outputs. |
| `check:assets-barrel` | 0 | final clean generated diff after carrier commit. |
| `check:publish-assets` | 0 | generated publish asset matches source carrier. |
| `check:mcp-export-corpus` | 0 | 35 packages, 273 subpaths, 7,841 symbols. |
| Scoped E2E check | 0 | 236 files, 2 batches, 0 findings. |
| Full nested E2E tests | 0 | 334 passed, 0 failed. |
| Scoped E2E format | 0 | 236 processed, 0 findings/refusals. |
| Changed handwritten TS lint | 0 | 3 processed, 0 findings/refusals. Generated files were generator-checked; an exploratory all-changed run exited 2 on the wrapper's expected generated-file exclusion with zero lint findings. |
| README Quickstart gate listing | 0 | 11 ordered commands; command 1 displays the exact minimum-age flag. |
| Docs accuracy | 0 | 200 published source pages and 91/91 root/direct public commands checked. |
| Docs links | 0 | 105 docs; 0 broken links/anchors/orphans. |
| README standard | 1 baseline | Only `packages/bench/README.md` lacks an Install section at baseline `3149d18e1`; untouched. |
| Quality/doctrine gate | 0 | quality scan clean; doctrine reports no failures, only pre-existing warnings. |
| Aspire version parity | final convergence pending | The surface manifest is regenerated **LAST**, after every Aspire-mentioning run artifact and all other intended changes exist; the immediately following parity check is the authoritative converged-head evidence and must report `ok:true`, `manifestFresh:true`, and `counts.fail:0`. No run artifact may be added afterward without repeating regeneration in the same commit. |

No runtime suite, Aspire process, Docker command, install, publish, or workflow command ran.
