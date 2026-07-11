# PLAN-EVAL — fix-611-ci-docs-only-md--ci-classifier

- Plan evaluator session: Claude Opus 4.8 (opposite-family, local) / 2026-07-11
- Run: `fix-611-ci-docs-only-md--ci-classifier`
- Surface / archetype: repository CI classifier tooling + agent skill guidance; archetype `N/A` (no package/plugin public surface)
- Scope overlays: `docs` (skill guidance + run artifacts)

## Checklist results

| Plan-Gate item                          | Result | Evidence / location |
| --------------------------------------- | ------ | ------------------- |
| Research present and current            | PASS   | `research.md` re-baselined against `origin/main` @ `720fcb7e` (matches `supervisor.md` baseline and `git log`). Spot-checked finding #1: `.github/scripts/ci-classify-changes.ts:69-95` confirms `isDocsOnlyPath` runs `isImpacting` (packages/plugins/apps denylist) before the docs allowlist, so `packages/**/*.md` is currently full CI. Old policy is encoded in tests: `ci-classify-changes.test.ts:110-112` asserts `packages/cli/README.md`, `plugins/workers/CHANGELOG.md`, `apps/demo/README.md` are `false`. Finding #2 (`parseNameStatus` both-sides rename awareness) confirmed at `:236-256`. Issue #611 acceptance matches the plan Goal/Scope. |
| Decisions locked                        | PASS   | `plan.md` §Locked Decisions D1–D4, each with rationale (markdown precedence, rename both-sides, dual-surface PR guidance, generated-mirror-only edits). D4 verified: `agentic:sync-claude`/`:check` exist in `deno.json:51-52`. |
| Open-decision sweep                     | PASS   | `plan.md` §Open-Decision Sweep lists `apps/**/*.md` (resolved now) and `ci:skip-scaffold` per-PR applicability (safe to defer — label application carries no code dependency). Evaluator sweep below found no unflagged rework-forcing *plan* decision. |
| Commit slices (< 30, gate + files each) | PASS   | `worklog.md` §Commit Slices: 3 ordered slices. Slice 2 gate = focused tests + scoped check, files = `ci-classify-changes.ts`/`.test.ts` + artifacts; Slice 3 gate = sync + sync check, files = source skills + generated mirrors. `<30`. |
| Risk register                           | PASS   | `plan.md` §Risk Register: 4 risks w/ mitigations — extension-precedence leaking config/workflow, rename hole, mirror drift, lock churn. |
| Gate set selected                       | PASS   | `plan.md` §Gate Set: 5 gates (unit tests, scoped `run-deno-check.ts`, `agentic:sync-claude:check`, focused fmt, `git diff -- deno.lock`). Release-gate class is `n/a`: run changes the classifier that *decides* scaffold gating, not scaffold output / plugin scaffold / DB / Aspire / published CLI shape. **Docs-overlay content gates (Source alignment, Link integrity, Terminology) are carried as manual/IMPL-EVAL evidence** per `gates/plan-gate.md` §Phase A reporting; `sync-claude:check` covers only mirror parity (Scope separation via generated output), and Drift log is initialized. This is acceptable for a 3-line label-guidance edit **only because** the two concrete defects found below are named for the IMPL pass — they are not a plan defect (FAIL_FIX class per `verdict-definitions.md`), but they MUST be fixed under the docs overlay at IMPL. |
| Deferred scope explicit                 | PASS   | `plan.md` §Non-Scope + §Deferred Scope and Debt (workflow YAML, label taxonomy/automation, package code, full scaffold runtime; no arch debt created). |
| jsr-audit surface scan (pkg/plugin)     | N/A    | `research.md` §jsr-audit surface scan marks N/A with reason: repository CI tooling + agent guidance, not a package/plugin publish surface. Correct — no `packages/`/`plugins/` source is touched. |

## Open-decision sweep (evaluator-run)

No open decision forces *plan* rework if deferred. Independent checks:

- **Markdown vs. critical-path precedence** — resolved: `research.md` open-questions and Risk #1 keep the `.github/workflows/` prefix and `deno.json*`/`deno.lock` exact/basename checks *ahead* of the extension classification. Those criticals are never `.md`/`.mdx`, so extension-precedence cannot make them docs-safe; the ordering is a belt-and-suspenders guard, not a live hole.
- **Rename where one side is impacting** (`packages/x.ts -> docs/x.md`) — locked by D2 + preserved `parseNameStatus`; combined-set classification keeps the impacting source path. Existing regression at `ci-classify-changes.test.ts:14-16` pins it.
- **Non-markdown files under docs prefixes / non-markdown under `packages/`** — reorder only elevates the `.md`/`.mdx` extension; `.llm/*.ts` etc. stay docs via prefix, `packages/**/*.ts` stay impacting. No unintended reclassification.
- **Test-reversal is contract work, not an open decision** — `research.md` §Re-baseline explicitly flags that `:110-112` must invert; this is planned slice-2 work, correctly surfaced rather than deferred.

## Verdict

`PASS`

## Notes — mandatory IMPL-EVAL confirmations (docs overlay, slice 3)

Two verified source-alignment/terminology defects sit **inside the `netscript-pr` §"Path-filter awareness" section the plan already edits** (`plan.md` scope: "Update `netscript-pr` … guidance"). Both are in-scope and require no Non-Scope change (no new labels, no workflow-YAML edit). The Gate-set PASS above is conditioned on the IMPL pass fixing them; IMPL-EVAL must confirm both:

1. **Source alignment — correct the CI mechanism claim.** `.agents/skills/netscript-pr/SKILL.md:310` states docs-only PRs are "auto-skipped by CI `paths-ignore`." For the `e2e-cli` gate this is wrong: `.github/workflows/e2e-cli.yml` (header comment ~line 39) explicitly does **not** use `paths-ignore`/job-level `if`; it runs the `classify` job (`ci-classify-changes.ts`) and reports SUCCESS (`paths-ignore` is used by `pages.yml`, a different workflow). The proactive-label edit must rewrite this sentence to the classify-job mechanism, not leave a contradictory claim in the edited section.

2. **Terminology — align the `ci:` taxonomy the new guidance depends on.** `.agents/skills/netscript-pr/SKILL.md:231` lists `ci:` — `skip-e2e`, `full` and **omits `ci:skip-scaffold`**, the exact label the new guidance instructs agents to apply. The label exists (`.github/labels.yml:156`) and is consumed by the classifier (`ci-classify-changes.ts:128,168`). Add `skip-scaffold` to that taxonomy line so the skill's own label list matches the guidance and `labels.yml`.

## Notes — other IMPL reminders (not plan defects)

- **Header contract comment must be rewritten (slice 2).** `ci-classify-changes.ts:11-20` currently states the denylist "ALWAYS wins … even if it is a Markdown file"; D1 reverses this. The module doc-comment and the "Design contract" reference must be updated in lockstep with the logic, or the source will self-contradict (Source alignment on code comments).
- **Reordering must preserve critical authority (slice 2).** Keep `isImpacting`'s exact/basename `deno.json*`/`deno.lock` and `.github/workflows/` checks authoritative while demoting the `packages/`/`plugins/`/`apps/` *prefixes* below the `.md`/`.mdx` extension test. Risk #1 covers this; add the four explicit regressions (global markdown docs-only; workflow + `deno.json*` still full; source→markdown rename still full; markdown→markdown rename docs-only) so IMPL-EVAL has named cases.
- **Link integrity:** IMPL-EVAL should confirm any local path added to either skill resolves, and terminology matches `.claude/09-glossary.md`.

_Verdict history: this file affirms an earlier local opposite-family PASS; this pass hardens the docs-overlay coverage by naming two concrete defects (paths-ignore claim; missing `ci:skip-scaffold`) the prior note did not itemize. FAIL_PLAN was considered and rejected — both are in-scope IMPL/FAIL_FIX-class doc corrections, not unchecked plan-gate boxes._
