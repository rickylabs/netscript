# Handoff — docs-source Vento blocker (W3-B1 / #1404 S3)

**Owner ruling 2026-08-09:** the repair is owned by the isolated lane at
`/home/codex/repos/ns005-docs-consistency` on `fix/docs-source-format-consistency`.
The orchestrator does **not** implement it. W3-B1 stays parked at `45001bb6b`.
This file is diagnostic evidence handed to that lane, not a competing change.

## Root cause

`2f64cc001` ("fix(cli): run database commands through resident AppHost", PR #1311, 2026-08-05)
reflowed Markdown lines at ~100 chars. The reflow ran **through** `{{ ... }}` Vento component
expressions, splitting double-quoted string literals across physical newlines. JS string literals
cannot span newlines, so Vento's meriyah parse fails:

```
TemplateError: /data-persistence/how-to/database-migration.md:38:1
TransformError: [meriyah] Unterminated string literal while parsing compiled template function
```

## Verified scope — 2 files, 28 newlines

Measured by a fence-aware scan (skips ``` blocks; collapses a newline only when the scanner is
inside an open string literal within a `{{ }}` expression):

| File | newlines inside string literals |
| --- | --- |
| `docs/site/data-persistence/how-to/database-migration.md` | 24 |
| `docs/site/tutorials/storefront/02-catalog-service.md` | 4 |

**Correction to an earlier orchestrator estimate:** a naive regex reported 114 candidate files.
That regex paired a closing quote with the next opening quote across newlines and was
over-matching. The true corpus-blocking scope is 2 files. Do not size the repair from 114.

Note: this measures only the *build-breaking* class. The owner also assigns raw-Markdown leakage
from `index.vto` and render-regression gates to that lane; those are **not** covered by the numbers
above and were not investigated here.

## Gate gap — why this reached main and survived 4 days

`.github/workflows/pages.yml` builds the site **only on `push` to `main`** (plus release /
dispatch). It has no `pull_request` trigger, so no PR can fail on it. Run history:

| Run | Branch | Conclusion |
| --- | --- | --- |
| 2026-08-05 01:43 `docs(quickstart): orient the reader` | main | success (last green) |
| 2026-08-05 05:02 `fix(cli): … resident AppHost (#1311)` | main | **failure** |
| 2026-08-06 14:30 `chore(agentic): split formal defaults` | main | failure |
| 2026-08-09 01:25 `fix(streams): versioned SSE and OTEL envelope (#1395)` | main | failure |
| 2026-08-09 03:29 `fix(agent): connect generated MCP configs (#1401)` | main | failure |

The docs site has been undeployable since 2026-08-05 and every subsequent merge inherited a red
Pages run that no PR surfaced. This is the run's recurring defect class: **a gate that does not run
cannot tell you that you are wrong.**

## Evidence from a throwaway verification repair (discarded, not shipped)

Applied only to confirm the diagnosis, then reverted; branch and worktree removed.

- `deno task build` — exit 0, **617 files generated**, `_site/llms.txt` (54 036 B) and
  `_site/llms-full.txt` (2 248 352 B) regenerate.
- `deno task check:links` — 32 772 internal links across 220 pages, all resolve.
- `deno task check:caveats` — 18 caveat markers across 14 pages, all resolve.
- `git diff --word-diff=porcelain` over the two files produced **no content lines** — the repair is
  whitespace-only; every character of prose is preserved.
- Fresh corpus contains the Prisma material #1404 S3 needs (413 `prisma` matches, including
  `## Step 2 — Read the Prisma-backed handlers` and `# Database & Prisma`).

Reference patch (whitespace-only docs repair + the pages.yml PR-trigger gate below):
`.llm/runs/release-0.0.5--orchestration/docs-vento-diagnosis.patch`. Take, adapt, or ignore it —
the lane owns the final shape.

## Suggested gate (lane's call)

Add a `pull_request` trigger to `pages.yml` on the same paths, guard `Configure Pages` /
`Upload artifact` and the whole `deploy` job with `if: github.event_name != 'pull_request'`, and
key `concurrency` per-ref so PR builds do not cancel the main deploy. Verified `yaml.safe_load`
clean. Without a PR-visible build this class regresses silently again.

## Consequence for #1404

S3 stays truthfully blocked. The corpus is generated from these sources by the approved builder;
regenerating it before the sources are repaired would bake the defect into the shipped bundle.
`.llm/tools/docs/build-agent-docs-bundle.ts` only *consumes* a pre-built bundle (it fails at
`build-agent-docs-bundle.ts:66` without `llms.txt`/`llms-full.txt`), so the corpus provenance chain
runs through the Lume build — repairing the source is the only route that preserves it.

**Unblock condition:** `fix/docs-source-format-consistency` lands on `main`; orchestrator then
resumes the exact W3-B1 thread `019fe4b4-7c12-72c2-b692-8d851f9c3b5c` for S3 against repaired main.
