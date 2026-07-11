# PLAN-EVAL — fix-609-release-cut-publish-set--release-cut

**Verdict: `PASS`** (cycle 2 of two; cycle-1 slice-attribution fix confirmed)

- Plan evaluator session: Claude (Opus 4.8), opposite-family local PLAN-EVAL — 2026-07-11
- Run: `fix-609-release-cut-publish-set--release-cut`
- Surface / archetype: Archetype 6 (CLI / Tooling) — harness release tooling under `.llm/tools/release/**`
- Scope overlays: none (markdown is inspected input, not a docs-content rewrite)

## What changed since cycle 1

Cycle 1 `FAIL_PLAN` had exactly one unchecked box — **Commit slices** lacked per-slice gate/file
attribution. The generator rewrote `plan.md:20-25` and mirrored `worklog.md:28-33` as per-slice
tables. Each slice now names (a) what it proves, (b) its exact proving gate from the Gates list, and
(c) concrete filenames. The three cycle-1 required fixes are all satisfied:

- Slice 1 (publish-set audit) → `preflight-release.ts` (new) + `preflight-release_test.ts` (new);
  proven by `deno test --no-lock -A .llm/tools/release/` + scoped check. ✔
- Slice 2 (markdown policy + cut integration) → the new preflight module/test **plus the explicit
  edit to existing `cut.ts` and `cut_test.ts`** — the single release-critical integration point is
  now called out by name. ✔
- Slice 3 (evidence/handoff) → deliverable (read-only enumerated dry-run output) separated from
  process items; proven by safe non-publishing audit/preflight dry-run + raw `git diff -- deno.lock`. ✔

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md:3-9` re-baselines to `origin/main@720fcb7e`; tree spot-checks hold — `cut.ts`/`cut_test.ts` exist (Slice 2 edit target real), `publish-workspace.ts` present (`publishWorkspace()` discovery claim), `preflight-release.ts` genuinely absent (new module). `#508`=`e6a847db`. |
| Decisions locked                        | PASS   | `plan.md:9-17` — 7 locked decisions with rationale carried from `research.md:25-29`. |
| Open-decision sweep                     | PASS   | `research.md:25-29` resolves intent authority, markdown comparison base (strictly-behind = violation), and deferred-site handling (warn-only, never silent skip) now; `plan.md:43-48` lists deferrals. Evaluator sweep found no deferral that forces rework. |
| Commit slices (< 30, gate + files each) | PASS   | `plan.md:20-25` (3 slices, ordered) + `worklog.md:28-33` — each slice names what it proves, its exact proving gate, and concrete files. Was the sole cycle-1 failure; now fixed. |
| Risk register                           | PASS   | `plan.md:36-41` — 4 risks, each with a mitigation. |
| Gate set selected                       | PASS   | `plan.md:27-34` — static (scoped check/lint/fmt), `deno test --no-lock -A .llm/tools/release/`, safe non-publishing audit/preflight dry-run, raw-git `deno.lock` verification. `scaffold.runtime`/`e2e-cli-prod` stated `n/a` (tooling-only; no scaffold or published-CLI shape change) at `plan.md:34`. |
| Deferred scope explicit                 | PASS   | `plan.md:43-48` — prose rewrite, `docs/site/**` enforcement, registry reconciliation, package/plugin source all deferred. |
| jsr-audit surface scan (pkg/plugin)     | N/A    | Non-package wave: scope is `.llm/tools/release/**`; no `packages/**` `mod.ts`, `deno.json` exports, or JSDoc authored (`plan.md:5-7`, `research.md:20-24`). |

## Open-decision sweep (evaluator-run)

No open decision would force rework if deferred. Intended-vs-effective computation basis, markdown
comparison base, `docs/site/**` handling, and exclusion-registry shape are all resolved in
`research.md:25-29` / carried as Notes from cycle 1. Nothing regressed.

## Verdict

`PASS` — every checklist box satisfied. Implementation may begin.

## Notes (advisory for IMPL-EVAL — not plan-gate blockers)

- **Possible module overlap.** `.llm/tools/release/` already ships `preflight-text-imports.ts` +
  `_test.ts`. The plan adds a *new* `preflight-release.ts` for markdown pin scanning. IMPL-EVAL
  should confirm the new module genuinely warrants a separate file rather than extending the existing
  text-import preflight — duplication of the markdown-scan surface would be an AP-1/reuse concern at
  impl time, not a plan defect.
- **Intended-set enumeration independence.** Keep the intended publish set enumerated independently
  of the publisher's `publish:false` filter, so a silent `publish:false` drop surfaces as an
  "unexplained missing" delta. Verify all three relevant dirs — `packages/ai`,
  `packages/plugin-ai-core`, `plugins/ai` — land on the correct present-and-published vs
  explicitly-excluded side.
- **Release-gate class disposition** is stated (`plan.md:34`): tooling-only, no scaffold/published-CLI
  shape change → `scaffold.runtime` / `e2e-cli-prod` = `n/a`. IMPL-EVAL should not expect the
  expensive suite.
- Re-baseline drift already captured (`drift.md:1-14`); no action needed.
