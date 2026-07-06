# Plan: issue #305 doctrine quick-win

## Run Metadata

| Field | Value |
| ----- | ----- |
| Run ID | `beta5-impl--supervisor` |
| Branch | `chore/305-doctrine-quickwin` |
| Phase | `plan` |
| Target | Doctrine docs, harness evaluator docs, architecture-debt registry, doctrine checker |
| Archetype | Archetype 6 for `.llm/tools/fitness/check-doctrine.ts`; N/A for docs-only files |
| Scope overlays | `SCOPE-docs.md` |

## Archetype

This is primarily a docs-scope run. The only executable surface is `.llm/tools/fitness/check-doctrine.ts`,
which is repo tooling, so Archetype 6 applies only as a guardrail: keep the checker small, scoped,
and compatible with `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts`.

## Current Doctrine Verdict

N/A for package verdict closure. The run edits doctrine/harness documentation and its fitness checker
metadata; it does not claim any package has completed doctrine remediation.

## Axioms in Play

| Axiom | Why it matters |
| ----- | -------------- |
| A6 | The dead research links and helper prose must not imply helpers are justified by stale citations. |
| A7 | The Result guidance must align to inline local contract guidance and platform/std-first rules, not a removed `@netscript/shared` package. |
| A14 | Fitness-gate refs must point to trusted doctrine IDs. |

## Goal

Land the early quick-win PR for issue #305: retire the stale `@netscript/shared` Result gate, remove
dead `phase-0-research` links from doctrine chapters, and reconcile AP/F refs with an explicit
migration map plus targeted harness debt/evaluator updates.

## Scope

- Update `.llm/tools/fitness/check-doctrine.ts` comments/messages/refs for current AP/F numbering.
- Add `docs/architecture/doctrine/ref-migration-map.md`.
- Remove or replace dead `phase-0-research/*` references under `docs/architecture/doctrine/*.md`.
- Update `.llm/harness/evaluator/anti-pattern-catalog.md` and `.llm/harness/debt/arch-debt.md` where
  old refs would otherwise remain ambiguous.
- Bootstrap and maintain `.llm/runs/beta5-impl--supervisor/` artifacts.

## Non-Scope

- The full 12-chapter doctrine v2 rewrite.
- Package/plugin architecture remediation.
- New broad fitness scripts beyond the requested checker reconciliation.

## Hidden Scope

- PR process: draft PR on start, labels, milestone, exact push refspec, per-slice comments, final
  `SLICE-COMPLETE` comment.
- Link check: `phase-0-research` must be zero hits in doctrine files after edits.

## Locked Decisions

| ID | Decision | Rationale |
| -- | -------- | --------- |
| LD-1 | Replace the `@netscript/shared` Result finding with inline contract guidance under A1/A2/A7 rather than deleting all detection. | The prompt asks to retire the live misfire while matching doctrine's inline-Result guidance. |
| LD-2 | Treat doctrine file 09 as authoritative for AP/F numbering: AP-1..AP-25 and F-1..F-19. | It is the canonical doctrine chapter and matches the evaluator catalog. |
| LD-3 | Use a migration map for old checker refs instead of global debt churn. | Prevents stale refs from becoming untrusted while keeping the quick-win scoped. |
| LD-4 | Convert dead phase-0 citations to live doctrine links or plain source prose. | Local dead links should be gone without inventing new external citation burden. |

## Open-Decision Sweep

| Decision | Status | Notes |
| -------- | ------ | ----- |
| Full doctrine v2 chapter structure | safe to defer | Explicitly out of scope by owner prompt. |
| Whether to remove the Result/Option detector entirely | resolved | Keep a softer inline-contract warning, remove `@netscript/shared` requirement. |
| Whether to renumber all historical debt headings | safe to defer | Map old refs and update only actively misleading entries. |

## Risk Register

| Risk | Mitigation |
| ---- | ---------- |
| Ref reconciliation accidentally changes doctrine meaning | Keep a committed old-to-new map and cite doctrine file 09 as authority. |
| Docs link cleanup leaves dead local refs | Run `rg "phase-0-research" docs/architecture/doctrine` and require zero hits. |
| Checker type drift | Run the scoped `.llm/tools` Deno check requested by the prompt. |
| Existing `arch:check` debt masks the Result fix | Compare before/after summaries and verify the `@netscript/shared` message disappears. |

## Anti-Patterns to Resolve or Avoid

| AP | Status | Plan |
| -- | ------ | ---- |
| AP-2 | existing stale checker mapping | Map helper/platform primitive checks to AP-2/F-2, not old AP-12 shared-package wording. |
| AP-16 | existing stale checker mapping | Map forbidden folder names to AP-16/F-11. |
| AP-1 | existing stale checker mapping | Keep monolithic-file findings under AP-1/F-1. |
| AP-11 | existing stale checker mapping | Map exported mutable globals to AP-11. |
| AP-14 | existing stale checker mapping | Map default/upstream re-export guidance to current AP-14/F-15 as appropriate. |
| AP-25 | risk | Avoid adding new side-effect behavior to tooling. |

## Fitness Gates

| Gate | Required | Expected evidence |
| ---- | -------- | ----------------- |
| Static check | yes | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` |
| `arch:check` before/after | yes | `deno task arch:check` summaries, no regression, `@netscript/shared` misfire gone |
| Link integrity | yes | `rg "phase-0-research" docs/architecture/doctrine` exits non-zero / zero hits |

## Arch-Debt Implications

| Entry | Action | Notes |
| ----- | ------ | ----- |
| `.llm/harness/debt/arch-debt.md` | update targeted refs | Use reconciled refs where stale AP/F numbering would mislead. |

## Validation Plan

| Order | Gate | Command or check | Expected result |
| ----- | ---- | ---------------- | --------------- |
| 1 | Baseline arch check | `deno task arch:check` | Record current summary before changes. |
| 2 | Tooling type check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .llm/tools --ext ts` | Pass. |
| 3 | Link check | `rg "phase-0-research" docs/architecture/doctrine` | Zero hits after edits. |
| 4 | After arch check | `deno task arch:check` | No regression; stale `@netscript/shared` message absent. |

## Dependencies

- GitHub connector for PR create/update/comment.
- Existing issue #305 remains open; PR body must use `Refs #305`, not a closing keyword.

## Drift Watch

- If any prompt finding no longer reproduces, record it in the PR body instead of forcing changes.
- If the checker behavior requires broad AST parsing beyond this quick-win, record as deferred debt.
