# Plan: Fresh export-table adoption

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `docs-fresh-exports-table--1817` |
| Branch | `docs/fresh-exports-table` |
| Phase | `plan` |
| Target | `docs/site/reference/fresh/index.md` and the docs export-drift mapping |
| Archetype | `4 — Public DSL/Builder` (described package; no package source mutation) |
| Scope overlays | `docs` |

## Archetype and Doctrine Verdict

`@netscript/fresh` is Archetype 4 with a current `Keep` verdict. This slice documents its existing
subpath contracts without changing the public surface or package structure. A1/A2/A14 apply because
the published export map must remain truthful, skimmable, and mechanically checked.

## Goal

Make all sixteen Fresh entrypoints visible in the recognized summary table, adopt the page into
`docs:exports-drift`, and refresh the derived docs corpus.

## Scope

- Add one `## Exports` heading and four missing rows to the existing summary-table content.
- Add the `fresh` mapping with an evidence-backed `entrypoints-only` symbol policy.
- Regenerate the three derived docs-corpus layers in the prescribed order.
- Run every gate named in the staged brief and preserve real exit codes.

## Non-Scope

- No `packages/fresh` source or export-map changes.
- No new per-symbol sections and no rewrites of the twelve existing entrypoint sections.
- No attempt to close the independently tracked per-symbol documentation gaps.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Reuse the existing twelve summary purposes and add four `deno doc`-derived one-liners. | Avoids changing existing section content and keeps the table concise. |
| D2 | Use `symbolCoverage.mode: 'entrypoints-only'`. | Four entrypoints lack symbol tables and seven existing sections omit real symbols. |
| D3 | Keep `excludedExports: []`. | Every published Fresh export is in scope and must appear in the summary table. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Purpose wording for the four new rows | Resolved now | Derived directly from each module's `deno doc --json` output. |
| Overall symbol-coverage mode | Resolved now | The sixteen-module comparison proves that complete mode would be false. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| A purpose claims capability the module does not export. | Anchor each new one-liner to the module doc and named exports. |
| Generated corpus drifts or lock state changes. | Run generators in the exact requested order; compare `deno.lock` to `origin/main`. |
| PR acceptance mapping changes punctuation/backticks. | Extract the four issue lines and compare them programmatically with the PR-body YAML strings. |

## Validation Plan

Run all commands listed in issue #1817's staged brief, then record exact exit codes and final
`git status --porcelain` output in `worklog.md` and the PR body.

## Debt and Drift

- No architecture debt is created or deepened by this docs-only slice.
- Material differences from the staged brief will be appended to `drift.md`.

## PLAN-EVAL

`PLAN-EVAL: N/A` — issue #1817 supplies the exact scope, export map, acceptance criteria, generator
order, and gates. The only two judgments are bounded and directly resolved by `deno doc --json`.

