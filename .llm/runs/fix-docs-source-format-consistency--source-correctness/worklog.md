# Worklog

## Design

- **Public surface:** documentation source, `docs/site` build tasks, and generated HTML/Markdown
  corpus. No framework exports change.
- **Domain vocabulary:** source diagnostic, executable Vento expression, rendered homepage,
  semantic destination item.
- **Ports:** filesystem reads only; Lume's existing DOM parser validates built HTML.
- **Constants:** the source extensions and excluded generated/planning directories are finite local
  sets in the checker.
- **Commit slices:** (1) source repairs + regression gates; (2) harness/PR evidence and evaluator
  corrections if required.
- **Deferred scope:** #1277's broad visual redesign and non-public `_plan` samples.
- **Contributor path:** author pages under `docs/site`, run `deno task build`; the task now reports
  invalid Vento strings before rendering and verifies homepage semantics afterward.

## Plan gate

`PLAN-EVAL: N/A` — exact failures, source contract, acceptance criteria, and gates were supplied and
reproduced; no material architecture choice remains.

## Implementation

- Rewrote all 11 confirmed malformed component invocations using multiline object structure while
  keeping every quoted value on a valid physical line.
- Enabled Markdown rendering for `index.vto`.
- Replaced bare destination separators with a semantic list and CSS pseudo-separators.
- Added source-format unit coverage and a DOM-based rendered homepage gate wired into site build.

## Gate evidence

| Gate | Result | Evidence |
| --- | --- | --- |
| Source-format unit tests | PASS | `deno task --config docs/site/deno.json test:source-format` — 3 passed, 0 failed |
| Owned TypeScript check/lint/fmt | PASS | scoped repo wrappers over the three `check-*` files — 0 findings |
| Site verification | PASS | `cd docs/site && deno task verify` — build, DOM assertion, internal links, caveat references |
| Diagrams | PASS | `cd docs/site && deno task diagrams:check` |
| Approved agent-doc corpus | PASS | full `/home/codex/repos/.briefing/build-docs-bundle.sh` run — 170 pages, 36 `deno-doc` files, 9.0M bundle |
| Mobile rendered spot-check | PASS | Playwright at 360px: real H2s; flex-wrap destination list; `scrollWidth === innerWidth`; 0 console errors |
| Lock hygiene | PASS | both `deno.lock` and `docs/site/deno.lock` byte-equal to `origin/main` |

## Reconcile

- #1277 remains related broad layout ownership; no existing focused source/build correctness issue
  was found. Parent recommendation remains to file one before merge and add its closing keyword.
- No source claims, package APIs, doctrine, runtime behavior, or corpus provenance rules changed.
