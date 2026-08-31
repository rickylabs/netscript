# D-224 — bounded actionable stderr

Date: 2026-09-01

## Decision

The emitted `run-tool.mts` now retains at most 32 actionable stderr lines and at most 16 KiB of
serialized UTF-8 detail, including newline separators. Retention is deterministic and generic:

- the first 8 actionable lines are retained so the first line remains `message`;
- the final 24 actionable lines are retained so late structured identifiers survive long prefixes;
- each retained line receives a derived 511-byte allowance, which guarantees the total 16-KiB
  ceiling (`32 * 511 + 31` newline bytes is 16,383 bytes);
- an oversized line retains a smaller UTF-8-safe head and a larger UTF-8-safe tail separated by an
  ellipsis, preserving trailing fields in compact JSON-ish output;
- VT controls are stripped before classification, and empty lines plus normalized `Task` banners
  remain filtered.

The 32-line limit is large enough for a structured error, source context, `code`, and `meta`, while
remaining a state/detail field rather than a log dump. The 8/24 split deliberately favors the tail
because both motivating failures lost decisive information after a prefix. There are no
Prisma-specific keys, parsers, casts, `any`, lint suppressions, public exports, or contract changes.

## RED proof

`run-tool retains structured identifiers beyond the actionable stderr head` emits 40 actionable
lines, with `"code": "P2022"` and `"meta"` after line 3. Against the unchanged three-line
implementation, the structured test wrapper exited 1: the expected retained line count was 32 but
the actual count was 3. The accompanying enormous UTF-8-line fixture also failed because the old
implementation exceeded the 16-KiB ceiling. The unchanged D-07 ANSI `Task` test passed in that same
RED run.

## Barrel delta

`deno task gen:assets-barrel` changed only `packages/cli/src/kernel/assets/embedded.generated.ts`,
with one generated string line replaced (1 insertion, 1 deletion) for `template_057` /
`aspire/helpers/run-tool.ts.template`. No other generated barrel changed.

## Verification ledger

| Verification                                              | Exit | Result                                                                                            |
| --------------------------------------------------------- | ---: | ------------------------------------------------------------------------------------------------- |
| RED focused `run-tool-template_test.ts`                   |    1 | expected: 1 pass, 2 failures; old 3-line and unbounded-byte behavior proved                       |
| First focused GREEN (`run-tool` + `generate-db-cli-mode`) |    0 | 11 passed, 0 failed                                                                               |
| Final focused typed-command set                           |    0 | 55 passed, 0 failed across run-tool, db-cli generator, tool generator, and operation runner tests |
| Scoped `deno check --unstable-kv`                         |    0 | 3/3 inputs, 0 failed batches, 0 diagnostics; template validated by byte-identical `.ts` copy      |
| Scoped lint                                               |    0 | 3/3 inputs, 0 findings/refusals                                                                   |
| Scoped fmt                                                |    0 | 3/3 inputs, 0 findings/refusals                                                                   |
| `git diff --check`                                        |    0 | clean                                                                                             |
| Added-line `any` / cast / lint-ignore scan                |    0 | no matches                                                                                        |
| `deno task quality:gate`                                  |    0 | quality scanner findings 0; doctrine `FAIL=0`                                                     |
| Repo-wide `deno task check`                               |    0 | 2,985 files, 25 batches, `failedBatches: 0`, 0 diagnostics                                        |
| `deno task check:assets-barrel`                           |    0 | generator reran; generated paths were diff-clean against the staged delta                         |

Intermediate formatting iterations were explicit: the first changed-code fmt check exited 1 on one
template line wrap; the scoped write repair exited 0. The next code fmt pass exited 0. A broad
whole-file Markdown fmt probe exited 1 on inherited formatting in the long-running plan, research,
and worklog artifacts; it was not used to rewrite unrelated historical evidence. The product/code
files have a final scoped fmt verdict of 0. The new standalone D-224 report initially needed one
Markdown wrap (exit 1), was scoped-formatted (exit 0), and then passed its exact-file fmt check
(exit 0).

No Aspire, Docker, AppHost, runtime process, or `e2e:cli` command ran. The supervisor owns the
separate bounded delta IMPL-EVAL after this product-byte move; this implementation session does not
self-certify or dispatch it.
