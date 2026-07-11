# PLAN-EVAL — fix-611-ci-docs-only-md--ci-classifier

- Plan evaluator session: Claude (opposite-family, local) / 2026-07-11
- Run: `fix-611-ci-docs-only-md--ci-classifier`
- Surface / archetype: repository CI classifier tooling + agent skill guidance; archetype `N/A` (no package/plugin public surface)
- Scope overlays: `docs` (skill guidance + run artifacts)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against `origin/main` @ `720fcb7e` (matches `supervisor.md` baseline). Spot-checked finding #1: `.github/scripts/ci-classify-changes.ts:69-95` confirms `isDocsOnlyPath` runs `isImpacting` (packages/plugins/apps denylist) before the docs allowlist, so `packages/**/*.md` is currently full CI. Confirmed the old policy is encoded in tests: `ci-classify-changes.test.ts:110-112` asserts `packages/cli/README.md`, `plugins/workers/CHANGELOG.md`, `apps/demo/README.md` are `false`. Finding #2 (`parseNameStatus` both-sides rename awareness) confirmed at `:236-256`. |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D4, each with rationale (markdown precedence, rename both-sides, dual-surface PR guidance, generated-mirror-only edits). |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep lists `apps/**/*.md` (resolved now) and `ci:skip-scaffold` per-PR applicability (safe to defer — label application carries no code dependency). Evaluator sweep below found no unflagged rework-forcing decision. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` §Commit Slices: 3 ordered slices. Slice 2 gate = focused tests + scoped check, files = `ci-classify-changes.ts`/`.test.ts` + artifacts; Slice 3 gate = sync + sync check, files = source skills + generated mirrors. `<30`. |
| Risk register                           | PASS   | `plan.md` §Risk Register: 4 risks w/ mitigations — extension-precedence leaking config/workflow, rename hole, mirror drift, lock churn. |
| Gate set selected                       | PASS   | `plan.md` §Gate Set: 5 gates (unit tests, scoped `run-deno-check.ts`, `agentic:sync-claude:check`, focused fmt, `git diff -- deno.lock`). Verified `agentic:sync-claude`/`:check` tasks exist in `deno.json:51-52`. Release-gate class is `n/a`: run changes the classifier that *decides* scaffold gating, not scaffold output / plugin scaffold / DB / Aspire / published CLI shape. Docs-overlay coverage noted as advisory below. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope + §Deferred Scope and Debt (workflow YAML, label taxonomy/automation, package code, full scaffold runtime; no arch debt created). |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md` §jsr-audit surface scan marks N/A with reason: repository CI tooling + agent guidance, not a package/plugin publish surface. Correct — no `packages/`/`plugins/` source is touched. |

## Open-decision sweep (evaluator-run)

None that force rework if deferred. Independent checks:

- **Markdown vs. critical-path precedence** — resolved: `research.md` open-questions and Risk #1 keep the `.github/workflows/` prefix and `deno.json*`/`deno.lock` exact/basename checks *ahead* of the extension classification. Those criticals are never `.md`/`.mdx`, so extension-precedence cannot make them docs-safe; the ordering is a belt-and-suspenders guard, not a live hole.
- **Rename where one side is impacting** (`packages/x.ts -> docs/x.md`) — locked by D2 + preserved `parseNameStatus`; combined-set classification keeps the impacting source path. Existing regression at `ci-classify-changes.test.ts:14-16` pins it.
- **Non-markdown files under docs prefixes / non-markdown under `packages/`** — reorder only elevates the `.md`/`.mdx` extension; `.llm/*.ts` etc. stay docs via prefix, `packages/**/*.ts` stay impacting. No unintended reclassification.
- **Test-reversal is contract work, not an open decision** — `research.md` §Re-baseline explicitly flags that `:110-112` must invert; this is planned slice-2 work, correctly surfaced rather than deferred.

## Verdict

`PASS`

## Notes

- Advisory (not blocking): the `docs` overlay's Source-alignment / Link-integrity / Terminology gates for the two skill edits are not itemized as explicit rows in the §Gate Set table. They are implicitly covered by the `agentic:sync-claude:check` mirror gate (the dominant docs risk here) plus IMPL-EVAL review, and `drift.md` is initialized. For two small proactive-label additions this is acceptable; IMPL-EVAL should still confirm any local paths added to the skills resolve and terminology matches `.claude/09-glossary.md`.
- Implementation reminder for slice 2 (for IMPL-EVAL, not a plan defect): reversing `isDocsOnlyPath` must keep `isImpacting`'s exact/basename `deno.json*`/`deno.lock` and `.github/workflows/` checks authoritative while demoting the `packages/`/`plugins/`/`apps/` *prefixes* below the `.md`/`.mdx` extension test — and the module header contract comment (`ci-classify-changes.ts:11-20`) must be rewritten, since it currently states the denylist "ALWAYS wins ... even if it is a Markdown file," which D1 reverses.
