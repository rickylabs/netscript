# Plan: #611 CI Markdown-only classifier

## Run Metadata

| Field | Value |
| --- | --- |
| Run ID | `fix-611-ci-docs-only-md--ci-classifier` |
| Branch | `fix/611-ci-docs-only-md` |
| Phase | `plan` |
| Target | repository CI tooling and skill guidance |
| Archetype | `N/A` — no package/plugin public surface |
| Scope overlays | `docs` for skill guidance |

## Archetype and Doctrine

No package/plugin archetype or doctrine verdict applies. The classifier is repository workflow tooling; the docs overlay governs the skill edits and generated mirror.

## Goal

Classify any non-empty PR diff containing only Markdown/MDX paths as docs-only regardless of directory, while retaining rename-aware conservative behavior and explicit critical-file/workflow overrides; teach PR-opening agents to apply the CI skip labels proactively.

## Scope

- Update classifier contract and implementation.
- Add/adjust focused unit regressions for the four requested cases.
- Update `netscript-pr` and the harness draft-PR guidance.
- Regenerate Claude skill mirrors with the repository task.
- Validate tests, scoped type-check, mirror check, and lock hygiene.

## Non-Scope

- Workflow YAML behavior, label creation/taxonomy changes, package/plugin code, and full scaffold runtime execution.

## Locked Decisions

| ID | Decision | Rationale |
| --- | --- | --- |
| D1 | Markdown/MDX extension is docs-only across directories unless the path is an explicit critical config/workflow path. | This directly implements issue #611 without weakening named escape hatches. |
| D2 | Preserve both sides of renames/copies and classify the combined path set. | Prevents source-to-doc rename holes. |
| D3 | Put proactive PR-label guidance in both PR authoring and harness draft-opening sections. | Both are authoritative entry points named by the brief. |
| D4 | Generate `.claude/skills` only via `deno task agentic:sync-claude`. | Generated mirror policy. |

## Open-Decision Sweep

| Decision | Status | Notes |
| --- | --- | --- |
| Whether `apps/**/*.md` is docs-only | resolved now | Yes, under D1. |
| Whether `ci:skip-scaffold` applies to every docs-only PR | safe to defer per PR | Apply when the PR does not need scaffold-static; `ci:full` overrides. |

## Risk Register

| Risk | Mitigation |
| --- | --- |
| Extension precedence accidentally makes workflow/config Markdown safe | Keep workflow prefix and `deno.json*`/lock checks ahead of extension classification and test critical paths. |
| Rename hole reintroduced | Keep `parseNameStatus` unchanged and add Markdown rename regression under `packages/`. |
| Generated mirror drift | Run sync task, then check task; never hand-edit mirror files. |
| Lock churn | Compare `deno.lock` before/after and exclude any churn. |

## Gate Set

| Order | Gate | Command/check | Expected |
| --- | --- | --- | --- |
| 1 | classifier unit tests | `deno test --no-lock -A .github/scripts/` | PASS |
| 2 | scoped type-check | `deno run --allow-read --allow-run .llm/tools/run-deno-check.ts --root .github/scripts --ext ts,tsx` | PASS |
| 3 | generated mirror | `deno task agentic:sync-claude:check` | PASS |
| 4 | focused format | scoped formatter check on owned TS | PASS |
| 5 | lock hygiene | `git diff -- deno.lock` | empty |
| 6 | docs overlay | manual source alignment, local-link existence, and terminology review | PASS |

## Deferred Scope and Debt

- No architecture debt created. Workflow refactors and label automation remain outside #611.

## Drift Watch

- Record any mismatch between requested labels and the checked-in label taxonomy, any unexpected generated files, or test location/command changes.
