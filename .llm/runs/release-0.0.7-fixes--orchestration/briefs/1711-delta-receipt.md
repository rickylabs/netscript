# Delta receipt — #1711 main-integration refresh (bounded, exact-head)

You are an **independent delta reviewer** under the NetScript harness. This is deliberately narrow:
**not** a full IMPL-EVAL, and explicitly **not** a PLAN-EVAL. Coordinator has ruled that no third
full IMPL-EVAL is warranted; your receipt is the acceptance gate for this refresh.

- Run: `fix-prisma-mysql-honest-example--0.0.7` · issue #1112 · PR #1711
- **Prior head (fully evaluated):** `067193acff68254b4bd4c6e5d7824f80a9db2b26`
- **Refresh head (yours):** `<REFRESH_HEAD>` (immutable — do not rebase, amend, or pull)
- `main` integrated: `21d516224fe35e92957f0998ee848bbf2024eda0` (PR #1696)
- Your worktree: `<WORKTREE>` (detached, reviewer-only)

## Background

The implementation at `067193acf` already holds a full **`PASS_IMPL`** from IMPL-EVAL cycle 2
(artifact `f5fd84254e20758d5e697156e67dabed8ad824ba` on `eval/impl-eval-1711-cycle-2`, no blocking
findings), with all CI green and all five issue #1112 acceptance boxes mirrored.

`main` then advanced and the branch went `CONFLICTING` — **only** in shared generated assets
(`.llm/assets/agent-docs/prose.json.gz`, `.llm/assets/agent-docs/provenance.json`,
`packages/cli/src/kernel/assets/agent-docs.generated.ts`,
`packages/mcp/src/publish-assets.generated.ts`). The author merged `main` and resolved by
**regeneration**, not by hand-combining generated files.

## The single question you answer

**Is the delta from `067193acf` to the refresh head purely mechanical?**

Mechanical means exactly three things and nothing else:

1. Integration of `origin/main` at `21d516224`.
2. Authoritative regenerated outputs from the cascade generators.
3. Harness run-artifact/receipt updates under `.llm/runs/`.

## Required checks

1. **Authored paths byte-identical.** All seven must be unchanged versus `067193acf` except for what
   `main` itself brought in:
   `docs/site/reference/prisma-adapter-mysql/index.md`, `packages/prisma-adapter-mysql/README.md`,
   `src/adapter.ts`, `src/mod.ts`, `src/types.ts`, `examples/basic-usage.ts`,
   `tests/connection_errors_test.ts`.
   Use `git diff 067193acf <refresh head> -- <paths>` and state the result explicitly. **Any semantic
   change to an authored product path is a `FAIL` and returns the leaf to full evaluation.**
2. **Generated outputs are authoritative, not hand-merged.** Re-run each generator on the merged tree
   and confirm the committed bytes reproduce:
   `gen:agent-docs-prose`, `gen:assets-barrel`, `gen:mcp-export-corpus`, `gen:publish-assets`.
   Then confirm all four `check:` tasks exit 0. A file that passes its own check but does **not**
   reproduce from its generator is a hand-merge and is a `FAIL`.
   Also confirm no conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`) survive anywhere.
3. **Focused #1711 gates still hold** on the merged tree: structured `check`, `lint`, `fmt`, and
   tests for `packages/prisma-adapter-mysql` (expect 12 selected / 0 diagnostics, 51 tests passing),
   plus `deno.lock` unchanged by the leaf — if `main` brought a lock change, say so and confirm the
   leaf added none of its own.
4. **Envelope intact:** still exactly seven authored product paths attributable to this leaf.

## Method

- Probe in a **pristine tracked-files-only archive** (`git archive <head> | tar -x` into your job
  tmp), never in a repo checkout.
- **Do not run lock-sensitive gates sequentially in one archive** — earlier probes rewrite that
  archive's `deno.lock` and a later `quality:gate` then fails `deps:check:zod` for reasons you
  caused. Use a fresh archive and confirm any red against a base-archive control before reporting it.
- Read every grep hit rather than counting matches.

## Boundaries

- **No live MySQL, Aspire, Docker, browser, `e2e:cli`, release gate, or expensive-gate lease.**
- Do not re-litigate anything cycle 2 settled: the literal dynamic import, the inline `ColumnType`
  union, the seven-path envelope, or the pre-1.0 breaking type removals. They are accepted.
- Modify no product, test, docs, or tooling path. Touch no label, readiness, checkbox, lease, or PR
  state. Do not merge. Leave no residue.

## Deliverable

Write `.llm/runs/fix-prisma-mysql-honest-example--0.0.7/delta-receipt.md`: head-identity table, the
four checks above with exact commands and results, and a verdict of
**`MECHANICAL_PASS`** (the prior full `PASS_IMPL` remains substantively valid at the refresh head) or
**`FAIL`** (naming the authored path that changed). Keep it short — this is a receipt, not an essay.

Commit and **push to a real branch**
(`git push origin HEAD:refs/heads/eval/delta-receipt-1711`) so the artifact cannot be orphaned.
Report the artifact SHA and branch, post a brief summary as a PR comment on #1711, and stop.
