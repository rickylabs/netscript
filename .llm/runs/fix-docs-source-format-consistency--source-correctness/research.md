# Research

## Baseline and reproduction

Current `origin/main` fails both supported publication paths before any stale output can be reused:

- `cd docs/site && deno task build` fails at
  `data-persistence/how-to/database-migration.md:46` with Meriyah `Unterminated string literal`.
- `/home/codex/repos/.briefing/build-docs-bundle.sh <repo> <new-temp-dir>` invokes that site build
  and exits with `FATAL: docs site build failed — refusing to mirror a stale _site/`.

## Root causes

1. Vento component arguments used ordinary quoted strings across physical newlines. JavaScript
   string literals cannot contain those raw newlines, so Vento cannot compile the expression.
2. The same syntax-class audit found 11 public-page expressions: nine in the database migration
   guide and two in the Storefront catalog tutorial.
3. `index.vto` authored Markdown H2 headings but, uniquely among the four public `.vto` landing
   pages, omitted `templateEngine: [vento, md]`. Lume therefore emitted the `##` markers as text.
   `why.vto`, `concepts.vto`, and `quickstart.vto` already declare the correct pipeline.
4. The homepage destination separators were bare text nodes inside a flex container. They could
   wrap independently from their links on narrow layouts.

## Existing issue audit

- #1277 owns a broad docs-site layout/UI polish pass, including responsive review.
- Searches for Vento parsing, literal headings, Markdown formatting, and docs-build correctness
  found no focused existing issue.
- Recommendation: file a focused correctness issue and relate #1277; do not expand #1277 into the
  source/build regression contract.
