# IMPL-EVAL — cycle 3 — delta: corpus regeneration on the integrated tree (#1859 / PR #1862)

Delta evaluation only. Cycle 2 (`impl-eval-cycle-2.md`, retained byte-identical) validated the
colour-invariance repair at `4dec2407c` / `8fd452a46` with verdict PASS, including the generator
design, task permissions, regression structure, and retraction history. **None of that is re-audited
here.** This cycle evaluates only the regeneration delta: commit `e8eaf6d0c` regenerated the corpus
on the tree integrated with `main` `38f2ce735`, moving the blob `bc3f6a2c2…` → `dec4f48ececf…`.
This file is the only artifact written by this session; every prior run artifact is preserved.

| Field | Value |
| --- | --- |
| Run ID | `fix-mcp-export-corpus-refresh--1859` |
| Evaluated head | `e8eaf6d0cd3d88a74ee9154b377e498faedff79c` (delta commit under evaluation; remote `fix/mcp-export-corpus-refresh` tip observed at the same sha via `git ls-remote`) |
| Delta commit shape | 1 file changed, 4 insertions / 4 deletions — `packages/mcp/src/infrastructure/export-surfaces/export-surface-corpus.generated.ts` only (payload line + `sha256` + `uncompressedBytes` + `compressedBytes`) |
| Evaluator | `z-ai/glm-5.3-flash` (OpenRouter) on Claude Code — fresh session, opposite family to the Claude/Opus regeneration session; no shared context with prior cycles beyond their retained artifacts |
| Toolchain | deno 2.9.5 (stable, linux-x86_64) |
| Method | Every verdict-bearing command captured as `out=$(cmd 2>&1); rc=$?` (stream-separated where noted) — no exit code ever taken from a pipeline, and no verdict inferred from file state alone. Regeneration matrix ran in a throwaway detached worktree `/tmp/nseval-1862-c3/h` at `e8eaf6d0c`, removed at close (`git worktree remove` rc=0); the eval worktree itself was never mutated (`git status --porcelain` empty after every operation). |

## Verification matrix

| # | Brief item | Result | Evidence (real exits) |
| --- | --- | --- | --- |
| 1 | Regeneration is faithful to the integrated tree | **CONFIRMED** | Four independent `deno task gen:mcp-export-corpus` runs at `e8eaf6d0c`, one per colour environment (item 2): every run `rc=0`, every run printed provenance `sha256=2eaa4dcf…294, uncompressedBytes=2177411, compressedBytes=315317, 35/271/7782` — exactly the committed metadata. Each generated file: `cmp` vs `git cat-file blob dec4f48e…` `rc=0`, and `git hash-object` = `dec4f48ececf73ba0ea5c7d466dffeab607330cd` = the committed blob id, byte-for-byte. Post-gen `git status --porcelain` empty on all four runs (exit checked, not inferred) — the generator wrote nothing but a corpus identical to the committed one. Corroborated by `deno task check:mcp-export-corpus` at the integrated head: `rc=0`. |
| 2 | Colour invariance holds after integration | **CONFIRMED** | The four runs of item 1 used callers `NO_COLOR=1`, `FORCE_COLOR=1`, `CLICOLOR_FORCE=1`, and bare (`env -i PATH HOME`), in that order. All four `rc=0`; all four produced the identical file hash (`d5f62095…`) and identical git blob `dec4f48e…`. Under the forcing/bare callers the `deno task` banner itself arrives colourized while the payload stays clean — direct end-to-end proof the child-env guard neutralizes caller colour on the integrated tree. Regression test also green at this head: `deno test --no-lock --allow-all .llm/tools/docs/generate-export-surface-corpus_test.ts` `rc=0`, 5 passed / 0 failed. |
| 3 | Payload is escape-free | **CONFIRMED** | Committed blob extracted (regex on the `EXPORT_SURFACE_CORPUS_GZIP_BASE64` literal), `base64 -d` `rc=0` → 315,317 bytes, `gunzip -c` `rc=0` → 2,177,411 bytes. On the decoded JSON text: `jsonU001bEscapes=0` (the JSON-encoded `\u001b` form — the false-negative trap from cycle 1 is avoided by counting the textual sequence, not raw `0x1b`), `u001bSubstrings=0`, `rawEscBytes=0`; after `json.loads`, a full recursive walk found 0 strings containing ESC (0x1b) or CSI (0x9b); JSON valid. Recomputed `sha256sum` over the compressed bytes = `2eaa4dcf27dedfb3e524fe923c600bec4bca760e6d1037fd69274d471d819294` = the committed provenance `sha256` (payload self-consistent, not hand-edited). Byte counts match provenance exactly. |
| 4 | Surface delta is integration, not contamination | **CONFIRMED** | Both payloads decoded (old blob `bc3f6a2c2…` likewise: `sha256=f8cc689d…` = cycle-2 provenance, self-consistent) and structurally diffed over all 7,782 entries keyed by (package, subpath, symbol, kind): `added=0, removed=0, changed=2`, surfaces 271 → 271, symbols 7,782 → 7,782. Changed entry 1: `@netscript/plugin-workers-core ./config JobConfig interface`, signature 489 → 605 bytes — gains exactly `priority: number`, `retryDelay: number`, `maxConcurrency: number`, `persist: boolean`, in source order: precisely #1861's diff hunk in `job-config.ts` (+12 lines, verified against `1e53e731a`). Changed entry 2: `@netscript/plugin-workers ./worker WorkerExecutionState interface`, signature 248 → 332 bytes — gains exactly `progress(executionId: string, percent: number, message?: string): Promise<unknown>`: #1864's durable-progress surface (`job-execution.ts` now routes `reportProgress` through `executionState.progress(...)`, and the file's only change in the integration window is `38f2ce735`). No `jsDoc` changed on any entry. Size accounting closes exactly: 116 + 84 = **+200 bytes = the uncompressed payload delta** (2,177,211 → 2,177,411); compressed +23 bytes. Nothing re-rendered, nothing unrelated touched. |
| 5 | Delta commit scope | **CONFIRMED** | `git diff --name-status e8eaf6d0c^ e8eaf6d0c`: exactly the one corpus file. Scoped real-exit checks: delta commit vs `deno.lock` `rc=0` (byte-unchanged); branch vs `main` `38f2ce735`: `deno.lock` `rc=0`, `packages/sdk` `rc=0`, `.github` `rc=0` (all byte-identical — no SDK change, no CI/merge-gate wiring). Branch-vs-main deltas besides run artifacts are only the cycle-2 colour fix itself (generator, its test, `deno.json`) plus the corpus — i.e. the two already-evaluated fix commits; no third product path appeared. |

## Findings by severity

| ID | Severity | Finding | Disposition |
| --- | --- | --- | --- |
| F-1 | info | The delta commit message (and the brief) credit only #1861, but the payload delta also carries #1864's `WorkerExecutionState.progress` member (+84 bytes). Both hunks are legitimate integrated-`main` surface (`38f2ce735` is the merge parent), and the size accounting closes exactly, so the regeneration is faithful — but the commit message under-reports what the integration picked up. | Recorded, no action. The regeneration is correct; a commit message amendment is not worth rewriting the tip for. Future integration regens should name every surface-contributing PR. |
| F-2 | info, pre-existing | Cycle-2 F-4 persists unchanged: `check:mcp-export-corpus` still has no CI wiring (`.github` byte-identical to `main`, `rc=0`). | Out of scope for a regeneration delta; carried forward unchanged. |
| F-3 | info | Scratch disclosure: the generation matrix ran in detached worktree `/tmp/nseval-1862-c3/h` (clean at close, `git worktree remove` rc=0); decode/diff artifacts remain in `/tmp/nseval-1862-c3/`. Cycle-2's `/tmp/nseval-1862-c2/{h,w2}` worktrees were observed still present and were left untouched (foreign owner). `grep` resolves to `ugrep` on this host (one regex pattern failed and was retried with `-F`); `rtk` remains unavailable, consistent with cycle-2's disclosure, so git inspection ran unprefixed. | No action. |

## Verdict basis

The regeneration was reproduced four times at the evaluated head, under all four colour
environments, each exiting 0 and each byte-identical to the committed blob `dec4f48e…`; the
committed payload is escape-free (0 JSON-encoded `\u001b`, 0 raw ESC bytes, 0 ESC-bearing decoded
strings) and self-consistent with its pinned SHA-256 and byte counts; the entire surface delta is
two changed signatures whose +116/+84 bytes reconcile exactly to the +200-byte payload delta, each
traced to a specific integrated-main commit (#1861, #1864) with zero added, removed, or otherwise
altered entries; and the delta commit touches only the generated corpus with `deno.lock`,
`packages/sdk`, and `.github` byte-unchanged against `main`. Every conclusion rests on a captured
exit, never on a pipeline or an inference from file state. Nothing outside the delta's narrow scope
was re-litigated, and no new debt was created.

VERDICT: PASS
