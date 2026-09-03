use harness

## SKILL

netscript-harness, netscript-doctrine, netscript-pr, netscript-tools

## Assignment — docs(plugins): adopt sagas, streams and plugin-ai reference pages — refs #1857

Issue: https://github.com/rickylabs/netscript/issues/1857 (**step 3, slice A** — partial; use
`Refs #1857`, **no closing keyword**)
Branch: `docs/adopt-plugin-pages-a` (pushed, tracks `origin/main`)
Run dir: `.llm/runs/docs-adopt-plugin-pages-a--1857/`
`PLAN-EVAL: N/A` — mechanical adoption of three pages into an existing gate, with per-package
`symbolCoverage` decided from measured evidence.

## Goal

Bring three deployable-plugin reference pages under `docs:exports-drift`:

| Page | Package dir | `deno.json` name | Findings today |
| --- | --- | --- | ---: |
| `docs/site/reference/sagas/index.md` | `plugins/sagas` | `@netscript/plugin-sagas` | 14 |
| `docs/site/reference/streams/index.md` | `plugins/streams` | `@netscript/plugin-streams` | 7 |
| `docs/site/reference/plugin-ai/index.md` | `plugins/ai` | `@netscript/plugin-ai` | 7 |

The checker accepts a `plugins/` `packagePath` unchanged — **no tooling change is needed or wanted.**

## Diagnose each page before editing — they are NOT the same shape

All 28 findings are `OMITS exported entrypoint`, including the **root** `.` on all three pages. But
the cause differs per page, so determine it yourself with `parseDocContent()`
(`.llm/tools/docs/check-exports-drift.ts`, ~line 543) in hand:

- `sagas` and `plugin-ai` use a `## Entrypoints` heading — **not** one the parser recognizes (it
  scans only `## Sub-path exports` or `## Exports`).
- `streams` already uses `## Sub-path exports`, a recognized heading, **yet still omits everything** —
  so its table must not match the required row shape. Work out exactly why (missing path column?
  wrong column order? embedded code span breaking the row regex? no rows at all?) and fix that
  specific cause. Do not assume it is the same defect as the other two.

The parser needs, under a recognized heading, rows shaped:
`| `@netscript/<pkg>[/subpath]` | `./real/path.ts` | ...optional further columns... |`
where the **second cell is the real `deno.json` path**.

## What to do, per page

1. Make the export table parser-visible: rename the heading to `## Exports` where that is the cause,
   and/or correct the table's row shape. **Preserve existing prose and Purpose text** — change
   structure, not meaning.
2. Ensure **every** entrypoint in that plugin's `deno.json` `exports` map has a row with its real
   path. Read the `deno.json` directly; do not copy the finding list in this brief as gospel —
   re-derive it. (`plugins/sagas` has 14 exports, `plugins/streams` 7, `plugins/ai` 7 — confirm.)
   For any entrypoint with no existing row, write a Purpose grounded in what
   `deno doc --json <the real module>` actually exports. **A plausible-but-wrong Purpose is worse
   than a terse accurate one.**
3. Add the package to `AUTHORITATIVE_MAPPING` with an explicit, evidence-backed `symbolCoverage`:
   - Run `deno doc --json` over every entrypoint, take the union of real exported symbol names
     (excluding `default`), and compare against the backtick-quoted identifiers the page documents.
   - If the page documents **every** real export, `mode: 'complete'` is honest.
   - Otherwise use `mode: 'entrypoints-only'` and name the **real** omissions in `reason` — either
     specifically, or by accurate category if the gap is large. Do not default to `entrypoints-only`
     without measuring, and never claim completeness you have not verified.

**Critical — cumulative mapping.** Take `check-exports-drift.ts` from **current `origin/main`** and
insert only your three new blocks. Do **not** restore that file wholesale from any older commit: it
would silently drop rows merged in the meantime, and nothing would catch it (dropping a row only
*reduces* what is policed, so every gate still passes). After editing, assert every row name present
on `origin/main` is still present.

## Explicitly out of scope

- Any `plugins/*` or `packages/*` source change. The exports are correct; the pages are wrong.
- `triggers` and `workers` — in flight as PR #1860; touching them will conflict.
- `plugin-auth` and the `auth` hub exclusion — slice B.
- Changing the checker's logic.

## Required gates (run all, report REAL exit codes)

- `deno task docs:exports-drift` — must exit 0 **with your three new mappings active**
- `deno task --cwd docs/site check:source-format`, `build`, `check:links`, `check:caveats`
- `deno task docs:links`, `docs:accuracy`, `docs:snippets`
- `deno task check:agent-docs-prose`, `check:assets-barrel`, `check:publish-assets`
- `deno check --unstable-kv packages/cli/src/kernel/assets/agent-docs.generated.ts packages/mcp/src/publish-assets.generated.ts`
- `git diff --check $(git merge-base origin/main HEAD) HEAD` — **must exit 0**. The bare
  `git diff --check` is a no-op after committing; always use this base-relative form.
- `git status --porcelain` after all regenerating gates — report exact output
- `deno.lock` unchanged vs `origin/main`
- `provenance.json`'s `sourceCommit` a true ancestor: `git merge-base --is-ancestor <sha> HEAD`

`docs/site/**` is a generator input — after editing, regenerate in this exact order:
`gen:agent-docs-prose` → `gen:assets-barrel` → `gen:publish-assets`.

**Known baseline:** `check:mcp-export-corpus` is red on `main` itself (#1668). Reproduce that
independently in a clean worktree at `origin/main` and do not attribute it to this branch.

## Deliverable

Commits on `docs/adopt-plugin-pages-a`, pushed. **Keep this run's
`.llm/runs/docs-adopt-plugin-pages-a--1857/` artifacts committed** — scoped harness run directories
are intentional cross-agent context and must never be stripped.

PR against `main`, titled
`docs(plugins): adopt sagas, streams and plugin-ai reference pages into docs:exports-drift`, with:
- `Refs #1857` — **no closing keyword**
- a validation table with real exit codes at the pushed head
- for each package: the measured union size, documented count, and the exact basis for the chosen
  `symbolCoverage` mode
- labels `type:docs`, `area:docs`, `area:plugins`, `ci:skip-e2e`, `ci:skip-scaffold`; milestone `0.0.7`

Run `gh pr ready` **before** the first push — a draft push skips `check-test`/`quality`, and marking
ready afterwards does not re-trigger them.

Leave the PR at `status:impl`; the supervisor session owns evaluation and lifecycle labels.
